"""Plate OCR via PaddleOCR + Indian/HSRP-format normalization. Lazy-loads the
PaddleOCR model on first use so the pipeline imports even if OCR isn't needed.
Degrades gracefully (returns "") if PaddleOCR isn't installed.
"""
import re

_ocr = None
_AVAILABLE = None


def _get():
    global _ocr, _AVAILABLE
    if _AVAILABLE is None:
        try:
            import os
            os.environ.setdefault("FLAGS_use_mkldnn", "0")
            from paddleocr import PaddleOCR
            # PaddleOCR 3.x API: no use_angle_cls/show_log; mkldnn off avoids the
            # oneDNN PIR NotImplementedError on this CPU build.
            _ocr = PaddleOCR(lang="en", enable_mkldnn=False)
            _AVAILABLE = True
        except Exception:
            _AVAILABLE = False
    return _ocr


# Indian plate: 2 letters (state) + 1-2 digits (RTO) + 1-3 letters (series) + 4 digits.
_PLATE_RE = re.compile(r"^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$")
_FIX = {"O": "0", "I": "1", "Q": "0", "Z": "2", "S": "5", "B": "8"}


def normalize_plate(text: str) -> str:
    t = re.sub(r"[^A-Z0-9]", "", text.upper())
    return t


def is_valid_indian(text: str) -> bool:
    return bool(_PLATE_RE.match(normalize_plate(text)))


def read_plate(crop):
    """Return (text, confidence). Empty text if OCR unavailable or nothing read."""
    ocr = _get()
    if ocr is None or crop is None or crop.size == 0:
        return "", 0.0
    try:
        res = ocr.ocr(crop)
    except Exception:
        return "", 0.0
    best_t, best_c = "", 0.0
    for page in (res or []):
        # PaddleOCR 3.x: dict with parallel rec_texts / rec_scores
        if isinstance(page, dict):
            texts = page.get("rec_texts", []) or []
            scores = page.get("rec_scores", []) or []
            for txt, conf in zip(texts, scores):
                if conf > best_c:
                    best_t, best_c = txt, float(conf)
        else:  # 2.x fallback: [ [box,(text,conf)], ... ]
            for item in (page or []):
                try:
                    txt, conf = item[1]
                except Exception:
                    continue
                if conf > best_c:
                    best_t, best_c = txt, float(conf)
    return normalize_plate(best_t), float(best_c)
