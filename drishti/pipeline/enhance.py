"""Frame enhancement front-end (robustness X-factor). Default is a fast,
dependency-free low-light/contrast pipeline (CLAHE + adaptive gamma) that visibly
recovers detail in night/rain frames. Zero-DCE can be dropped in later via
enhance_zero_dce() without changing callers.
"""
import cv2
import numpy as np


def _adaptive_gamma(img, mean_target=110.0):
    g = img.mean()
    if g <= 1:
        return img
    gamma = float(np.clip(np.log(mean_target / 255.0) / np.log(g / 255.0), 0.4, 2.2))
    lut = np.array([((i / 255.0) ** (1.0 / gamma)) * 255 for i in range(256)], dtype=np.uint8)
    return cv2.LUT(img, lut)


def enhance(frame, strength=1.0):
    """CLAHE on luminance + adaptive gamma. Returns an enhanced BGR frame.
    `strength` in [0,1] blends toward the enhanced result (0 = original)."""
    if frame is None:
        return frame
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l = clahe.apply(l)
    out = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)
    out = _adaptive_gamma(out)
    if strength >= 1.0:
        return out
    return cv2.addWeighted(out, strength, frame, 1.0 - strength, 0)


def is_lowlight(frame, thresh=80.0):
    """Heuristic: mean luminance below threshold -> enhancement worthwhile."""
    return frame is not None and frame.mean() < thresh
