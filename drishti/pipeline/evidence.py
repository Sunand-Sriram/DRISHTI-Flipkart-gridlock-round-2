"""Privacy-preserving evidence image: box the violator sharp, Gaussian-blur every
other face/plate region, and stamp the violation metadata. Court-ready per the brief.
"""
import datetime as _dt
import cv2

from .config import IMG_BLUR_KERNEL

_COLOR = {"no_helmet": (0, 0, 255), "triple_riding": (0, 0, 255),
          "phone_use": (0, 140, 255), "red_light": (0, 0, 255),
          "seatbelt": (0, 140, 255), "default": (0, 215, 255)}


def _blur_region(img, box):
    x1, y1, x2, y2 = [int(v) for v in box]
    x1, y1 = max(0, x1), max(0, y1)
    roi = img[y1:y2, x1:x2]
    if roi.size:
        k = IMG_BLUR_KERNEL | 1
        img[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (k, k), 0)


def build_evidence(frame, violator_box, vtype, conf, blur_boxes=(), meta=None):
    """Return an annotated evidence image. `blur_boxes` = other plates/faces."""
    img = frame.copy()
    for b in blur_boxes:
        _blur_region(img, b)
    x1, y1, x2, y2 = [int(v) for v in violator_box]
    color = _COLOR.get(vtype, _COLOR["default"])
    cv2.rectangle(img, (x1, y1), (x2, y2), color, 3)
    ts = (meta or {}).get("timestamp") or _dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cam = (meta or {}).get("camera", "CAM-01")
    lines = [f"VIOLATION: {vtype.replace('_', ' ').upper()}",
             f"Confidence: {conf:.2f}",
             f"{ts}  {cam}"]
    plate = (meta or {}).get("plate")
    if plate:
        lines.append(f"Plate: {plate}")
    y = max(24, y1 - 8)
    for i, t in enumerate(lines):
        yy = (y - (len(lines) - 1 - i) * 22)
        cv2.putText(img, t, (x1, yy), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 4, cv2.LINE_AA)
        cv2.putText(img, t, (x1, yy), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    return img
