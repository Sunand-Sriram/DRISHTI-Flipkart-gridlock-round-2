"""Run the DRISHTI pipeline for an uploaded source and stream results over a
WebSocket while persisting challans + emergencies to the DB.

Detection is heavy/blocking; we run each frame's detect in a thread executor so
the event loop can still ship WebSocket messages. Models load lazily on first
use and are cached for the process lifetime.
"""
import asyncio
import base64
import time
import uuid
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[1]
EVID_DIR = ROOT / "runs" / "drishti"
EVID_DIR.mkdir(parents=True, exist_ok=True)

TASKS: dict = {}          # task_id -> {status, progress, source, enhance, stride}
_DET = None               # cached Detectors


def _detectors():
    global _DET
    if _DET is None:
        from pipeline.run import Detectors
        _DET = Detectors()
    return _DET


def _jpeg_b64(frame, max_w=720):
    h, w = frame.shape[:2]
    if w > max_w:
        frame = cv2.resize(frame, (max_w, int(h * max_w / w)))
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    return base64.b64encode(buf).decode() if ok else ""


def _persist_challan(ch: dict):
    from . import db
    db.insert_challan(ch)


def auto_email(cid: str) -> dict:
    """Email the e-challan (PDF + branded HTML) to the registered owner and record
    it in the outbox + a citizen notification. Used on every challan generation."""
    from . import db, mailer
    from . import pdf as pdfgen
    row = db.connect().execute("SELECT * FROM challans WHERE challan_id=?", (cid,)).fetchone()
    if not row:
        return {"sent": False}
    ch = db.row_to_challan(row)
    try:
        pdf_bytes = pdfgen.challan_pdf(ch)
    except Exception:
        pdf_bytes = None
    res = mailer.send_challan_email(ch, pdf_bytes)
    plate = (ch.get("plate") or "").replace(" ", "").upper()
    if res.get("sent") and plate:
        db.add_notification(plate, "challan", f"e-Challan {cid} issued",
                            f"Sent to {res.get('to')}. Pay within 14 days.", f"/citizen/challan/{cid}")
    return res


# alias used inside the async task (kept short)
_auto_email = auto_email


async def run_inference_task(task_id: str, ws):
    from pipeline import config as C, violations as V
    from pipeline.run import analyze_frame, _nearest_plate, _plate_boxes
    from pipeline.enhance import enhance, is_lowlight
    from pipeline.evidence import build_evidence
    from pipeline.ocr import read_plate, is_valid_indian
    from pipeline.challan import build_challan
    from . import db

    task = TASKS.get(task_id)
    if not task:
        await ws.send_json({"type": "error", "data": "unknown task"}); return
    task["status"] = "running"
    det = await asyncio.to_thread(_detectors)
    if not det.models:
        await ws.send_json({"type": "error", "data": "no trained models on disk"}); return

    V.reset_track_state()
    src = task["source"]
    is_img = str(src).lower().rsplit(".", 1)[-1] in ("jpg", "jpeg", "png", "bmp")
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    V.set_calibration(fps=fps, park_dwell_s=4)
    # ── speed: sample ~6 analysed frames/sec regardless of source fps ──
    TARGET_FPS = 6
    stride = max(int(task.get("stride", 1)), max(1, round(fps / TARGET_FPS)))
    DET_MAX_W = 960   # downscale big frames before the 6-model detect pass
    cams = await asyncio.to_thread(lambda: db.list_cameras() if hasattr(db, "list_cameras") else [])
    cam = {"id": "CAM-03", "name": "MG Road", "location": "MG Road Junction",
           "lat": 12.9756, "lng": 77.6068}
    # continue challan numbering AFTER the highest existing id (don't overwrite seed)
    def _max_id():
        mx = 0
        for r in db.connect().execute("SELECT challan_id FROM challans").fetchall():
            try:
                mx = max(mx, int(str(r[0]).split("-")[-1]))
            except Exception:
                pass
        return mx
    id_base = await asyncio.to_thread(_max_id)
    ev_count = 0
    fno = 0
    is_live = bool(task.get("live"))
    fails = 0
    while True:
        if task.get("stop"):
            break
        ok, frame = cap.read()
        if not ok:
            # live streams can drop the odd frame — tolerate a few before giving up
            if is_live and fails < 30:
                fails += 1
                await asyncio.sleep(0.1)
                continue
            break
        fails = 0
        if fno % stride == 0:
            # downscale large frames so all detection models run faster
            fh, fw = frame.shape[:2]
            if fw > DET_MAX_W:
                frame = cv2.resize(frame, (DET_MAX_W, int(fh * DET_MAX_W / fw)))
            if task.get("enhance") or is_lowlight(frame):
                frame = await asyncio.to_thread(enhance, frame, 0.8)
            dets = await asyncio.to_thread(det.detect, frame)
            events, emergency = analyze_frame(frame, dets, fno, fps=fps)

            if emergency:
                eid = f"EM-{uuid.uuid4().hex[:6]}"
                await asyncio.to_thread(lambda: db.connect().execute(
                    "INSERT INTO emergencies (id,vehicle,camera,location,lat,lng,checkpost,officer,status,created_at) "
                    "VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (eid, emergency["cls"], cam["id"], cam["location"], cam["lat"], cam["lng"],
                     "Checkpost 3", "SI Priya Sharma", "active", time.time())).connection.commit())
                # auto-dispatch a green-corridor alert to the checkpost + notify officer
                db.add_notification("cp:Checkpost 3", "dispatch",
                                    f"🚨 {emergency['cls'].title()} inbound — clear the lane",
                                    f"Auto green corridor from {cam['id']} ({cam['location']}). ETA ~2 min.",
                                    "/officer/cameras")
                db.add_notification("officer", "emergency", f"{emergency['cls'].title()} detected at {cam['location']}",
                                    "Auto-dispatched to Checkpost 3.", "/officer/emergencies")
                await ws.send_json({"type": "emergency", "data": {
                    "id": eid, "vehicle": emergency["cls"], "camera": cam["id"],
                    "location": cam["location"], "checkpost": "Checkpost 3"}})

            for e in events:
                plate_box = _nearest_plate(e["box"], dets)
                plate_txt = ""
                if plate_box and "plate" in det.models:
                    x1, y1, x2, y2 = [int(v) for v in plate_box]
                    crop = frame[max(0, y1):y2, max(0, x1):x2]
                    if crop.size:
                        plate_txt, _ = await asyncio.to_thread(read_plate, crop)
                others = [b for b in _plate_boxes(dets) if b != plate_box]
                meta = {"camera": cam["id"], "plate": plate_txt or None}
                img = build_evidence(frame, e["box"], e["type"], e["conf"], others, meta)
                ev_count += 1
                name = f"evidence_{task_id}_{ev_count:04d}_{e['type']}.jpg"
                await asyncio.to_thread(cv2.imwrite, str(EVID_DIR / name), img)
                base = build_challan({"id": id_base + ev_count, "type": e["type"], "frame": fno,
                                      "conf": e["conf"], "plate": plate_txt,
                                      "valid_plate": is_valid_indian(plate_txt) if plate_txt else False,
                                      "evidence": name})
                # auto-route by confidence: low conf -> review queue
                base["status"] = "ISSUED" if e["conf"] >= 0.75 else "PENDING_REVIEW"
                base["camera"] = cam["id"]; base["location"] = cam["location"]
                base["lat"] = cam["lat"]; base["lng"] = cam["lng"]
                base["created_at"] = time.time()
                base["speed_kmh"] = e.get("extra", {}).get("speed_kmh")
                await asyncio.to_thread(db.insert_challan, base)
                # auto-deliver email only for high-confidence ISSUED challans;
                # low-confidence ones wait for officer approval in the Review Queue.
                if base["status"] == "ISSUED":
                    await asyncio.to_thread(_auto_email, base["challan_id"])
                await ws.send_json({"type": "violation", "data": {
                    "challan_id": base["challan_id"], "violation": e["type"],
                    "plate": plate_txt, "fine": base["fine_inr"],
                    "confidence": round(e["conf"], 2), "evidence": name,
                    "status": base["status"]}})

            if fno % (stride * 2) == 0 or is_img:
                await ws.send_json({"type": "frame", "data": _jpeg_b64(frame), "fno": fno})
            task["progress"] = min(100, int(fno / total * 100)) if total > 1 else 100
        fno += 1
        if is_img:
            break
    cap.release()
    task["status"] = "done"
    await ws.send_json({"type": "done", "data": {"violations": ev_count, "frames": fno}})
