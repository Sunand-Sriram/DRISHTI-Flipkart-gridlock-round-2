"""DRISHTI pipeline configuration: model paths (merged weights preferred, with
fallback to the first-batch weights), detection thresholds, and class helpers.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "models"


def _pick(*names):
    """Return the first existing weight file from the given candidates."""
    for n in names:
        p = MODELS / n
        if p.exists():
            return str(p)
    return None  # not trained yet


# Each detector: prefer the merged/coarse weights, fall back to earlier ones.
WEIGHTS = {
    "vehicle":  _pick("vehicle_uvh26_coarse_yolo11m_best.pt",
                      "vehicle_poribohon_yolo11m_best.pt"),
    "helmet":   _pick("helmet_merged_yolo11m_best.pt", "helmet_yolo11m_best.pt"),
    "plate":    _pick("plate_merged_yolo11m_best.pt"),
    "light":    _pick("trafficlight_s2tld_yolo11m_best.pt"),
    "seatbelt": _pick("seatbelt_merged_yolo11m_best.pt"),
    "phone":    _pick("phone_v2_yolo11m_best.pt", "phone_merged_yolo11m_best.pt"),
}

# Per-detector confidence thresholds.
CONF = {
    "vehicle": 0.35, "helmet": 0.35, "plate": 0.30,
    "light": 0.40, "seatbelt": 0.35, "phone": 0.30,
}

DEVICE = os.environ.get("DRISHTI_DEVICE", "0")  # set DRISHTI_DEVICE=cpu to avoid GPU contention
TRACKER = "bytetrack.yaml"   # ships with ultralytics
IMG_BLUR_KERNEL = 31  # gaussian kernel for privacy blur


def norm(label: str) -> str:
    """Normalize a class label to lowercase alnum for robust matching."""
    return "".join(ch for ch in str(label).lower() if ch.isalnum())
