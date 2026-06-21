"""DRISHTI end-to-end inference pipeline.

  video/image/webcam -> (enhance) -> multi-model detect + ByteTrack -> violation
  logic -> plate crop+OCR -> privacy evidence image + JSON challan log.

Usage:
  python -m pipeline.run --source path/to/video.mp4 [--enhance] [--show]
  python -m pipeline.run --source 0            # webcam
  python -m pipeline.run --source img.jpg
"""
import argparse
import json
import time
from pathlib import Path

import cv2

from . import config as C
from . import violations as V
from .enhance import enhance, is_lowlight
from .evidence import build_evidence
from .ocr import read_plate, is_valid_indian
from .challan import build_challan

OUT = C.ROOT / "runs" / "drishti"


class Detectors:
    """Lazy ensemble of the trained YOLO models that actually exist on disk."""
    def __init__(self):
        from ultralytics import YOLO
        self.models, self.kinds = {}, {}
        for kind, w in C.WEIGHTS.items():
            if w:
                self.models[kind] = YOLO(w)
                self.kinds[kind] = w
        print("[detectors] loaded:", ", ".join(sorted(self.models)) or "NONE")

    def detect(self, frame, primary="vehicle"):
        """Run every model; return a merged detection list. The `primary` model
        is run with ByteTrack (persistent IDs) for temporal violations."""
        dets = []
        for kind, model in self.models.items():
            try:
                if kind == primary:
                    r = model.track(frame, persist=True, conf=C.CONF.get(kind, 0.35),
                                    tracker=C.TRACKER, verbose=False, device=C.DEVICE)[0]
                else:
                    r = model.predict(frame, conf=C.CONF.get(kind, 0.35),
                                      verbose=False, device=C.DEVICE)[0]
            except Exception as e:
                print(f"[warn] {kind} detect failed: {e!r}")
                continue
            if r.boxes is None:
                continue
            ids = r.boxes.id.tolist() if getattr(r.boxes, "id", None) is not None else None
            for i, b in enumerate(r.boxes):
                cls = r.names[int(b.cls)]
                dets.append({
                    "kind": kind, "cls": cls, "conf": float(b.conf),
                    "xyxy": tuple(float(v) for v in b.xyxy[0].tolist()),
                    "id": int(ids[i]) if ids else None,
                })
        return dets


def _plate_boxes(dets):
    return [d["xyxy"] for d in dets if "plate" in C.norm(d["cls"])]


def _nearest_plate(box, dets):
    """Plate crop box nearest/under a violator (for OCR + challan)."""
    best, bestd = None, 1e9
    bx = (box[0] + box[2]) / 2
    for d in dets:
        if "plate" in C.norm(d["cls"]):
            px = (d["xyxy"][0] + d["xyxy"][2]) / 2
            dist = abs(px - bx)
            if dist < bestd:
                best, bestd = d["xyxy"], dist
    return best


def analyze_frame(frame, dets, fno, fps=25.0):
    """Collect all violation events for one frame.

    If an emergency vehicle is present, instant violations near it are skipped
    (right-of-way exemption); the emergency sighting is returned separately so
    the caller can raise a checkpost alert.
    """
    h = frame.shape[0]
    emergency = V.detect_emergency(dets)
    events = []
    events += V.helmet_violations(dets)
    events += V.triple_riding(dets)
    events += V.phone_violations(dets)
    state = V.light_state_from(dets)
    events += V.redlight_violations(dets, state, None, h)
    # temporal checkers (order matters: speed updates history first)
    events += V.speed_violations(dets, fno, fps=fps)
    events += V.wrong_side_violations(dets, fno)
    events += V.parking_violations(dets, fno)
    if emergency:   # exempt violations overlapping the emergency vehicle
        events = [e for e in events if V.iou(e["box"], emergency["box"]) < 0.3]
    for e in events:
        e["frame"] = fno
        e["light_state"] = state
    return events, emergency


def process(source, do_enhance=False, show=False, save_video=True, stride=1):
    OUT.mkdir(parents=True, exist_ok=True)
    det = Detectors()
    if not det.models:
        print("No trained models found yet — nothing to run."); return

    is_img = str(source).lower().rsplit(".", 1)[-1] in ("jpg", "jpeg", "png", "bmp")
    challans, ev_count = [], 0
    emergencies = []
    V.reset_track_state()       # clear temporal state for this source
    fps_hint = [25.0]           # mutable so the video branch can set the real fps

    def handle(frame, fno):
        nonlocal ev_count
        if do_enhance or is_lowlight(frame):
            frame = enhance(frame, strength=1.0 if do_enhance else 0.7)
        dets = det.detect(frame)
        events, emergency = analyze_frame(frame, dets, fno, fps=fps_hint[0])
        if emergency:
            emergencies.append({"frame": fno, "cls": emergency["cls"],
                                "conf": round(emergency["conf"], 3)})
        for e in events:
            plate_box = _nearest_plate(e["box"], dets)
            plate_txt = ""
            if plate_box and "plate" in det.models:
                x1, y1, x2, y2 = [int(v) for v in plate_box]
                crop = frame[max(0, y1):y2, max(0, x1):x2]
                plate_txt, _ = read_plate(crop)
            others = [b for b in _plate_boxes(dets) if b != plate_box]
            meta = {"camera": "CAM-01", "plate": plate_txt or None}
            img = build_evidence(frame, e["box"], e["type"], e["conf"], others, meta)
            ev_count += 1
            name = f"evidence_{ev_count:04d}_{e['type']}.jpg"
            cv2.imwrite(str(OUT / name), img)
            event = {"id": ev_count, "type": e["type"], "frame": fno,
                     "conf": round(e["conf"], 3), "plate": plate_txt,
                     "valid_plate": is_valid_indian(plate_txt) if plate_txt else False,
                     "evidence": name}
            challans.append(build_challan(event))
        return frame, dets

    if is_img:
        frame = cv2.imread(str(source))
        handle(frame, 0)
    else:
        cap = cv2.VideoCapture(0 if str(source) == "0" else str(source))
        if not cap.isOpened():
            print("Could not open source:", source); return
        w = int(cap.get(3)); h = int(cap.get(4)); fps = cap.get(5) or 25
        fps_hint[0] = float(fps)        # feed real fps to speed estimation
        writer = (cv2.VideoWriter(str(OUT / "annotated.mp4"),
                  cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h)) if save_video else None)
        fno = 0; t0 = time.time()
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if fno % stride == 0:
                frame, _ = handle(frame, fno)
                if writer:
                    writer.write(frame)
                if show:
                    cv2.imshow("DRISHTI", frame)
                    if cv2.waitKey(1) & 0xFF == 27:
                        break
            fno += 1
        cap.release()
        if writer:
            writer.release()
        cv2.destroyAllWindows()
        dt = time.time() - t0
        print(f"[done] {fno} frames in {dt:.1f}s ({fno/max(dt,1e-6):.1f} FPS)")

    (OUT / "challans.json").write_text(json.dumps(challans, indent=2))
    if emergencies:
        (OUT / "emergencies.json").write_text(json.dumps(emergencies, indent=2))
    print(f"[done] {len(challans)} violation(s), {len(emergencies)} emergency sighting(s) -> {OUT}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--enhance", action="store_true")
    ap.add_argument("--show", action="store_true")
    ap.add_argument("--stride", type=int, default=1)
    a = ap.parse_args()
    process(a.source, do_enhance=a.enhance, show=a.show, stride=a.stride)
