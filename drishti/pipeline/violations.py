"""Violation logic. Operates on simple detection dicts:
  det = {"cls": str, "conf": float, "xyxy": (x1,y1,x2,y2), "id": int|None}
Each checker returns a list of violation events:
  {"type": str, "box": (x1,y1,x2,y2), "conf": float, "extra": {...}}
Emergency-vehicle exemption is applied by the caller before challaning.
"""
import math
from collections import defaultdict, deque
from .config import norm

# ── shared track state (reset between video runs via reset_track_state()) ─────
_track_history: dict = defaultdict(lambda: deque(maxlen=30))
_ws_counter: dict    = defaultdict(int)
_park_since: dict    = {}   # id -> (first_fno, cx, cy) while stationary

def reset_track_state():
    _track_history.clear()
    _ws_counter.clear()
    _park_since.clear()

# ── camera calibration defaults ───────────────────────────────────────────────
SPEED_LIMIT_KMH  = 60    # km/h; override per camera
PX_PER_METER     = 30    # pixels per metre at 720p highway cam; calibrate per scene
ALLOWED_DIR      = (1, 0) # (dx,dy) unit vec of allowed traffic direction; (1,0)=L→R
WRONG_SIDE_THRESH = -0.5  # dot product < this → opposing direction (>120°)
MIN_TRAVEL_PX    = 20     # ignore near-stationary vehicles for wrong-side
WS_STREAK_NEEDED = 3      # consecutive opposing windows before flagging (debounce)
PARK_DWELL_FRAMES = 0     # set via set_calibration(fps, park_dwell_s); 0 disables
PARK_MOVE_PX     = 6      # centroid drift under this counts as "stationary"

_VEHICLE = ("car", "bus", "truck", "twowheeler", "motorcycle", "motorbike", "auto")


def set_calibration(px_per_meter=None, speed_limit=None, allowed_dir=None,
                    fps=None, park_dwell_s=None):
    """Per-camera calibration. fps + park_dwell_s set the parking dwell window."""
    global PX_PER_METER, SPEED_LIMIT_KMH, ALLOWED_DIR, PARK_DWELL_FRAMES
    if px_per_meter:
        PX_PER_METER = float(px_per_meter)
    if speed_limit:
        SPEED_LIMIT_KMH = float(speed_limit)
    if allowed_dir:
        mag = math.hypot(*allowed_dir) or 1.0
        ALLOWED_DIR = (allowed_dir[0] / mag, allowed_dir[1] / mag)
    if fps and park_dwell_s:
        PARK_DWELL_FRAMES = int(fps * park_dwell_s)


def _centroid(b):
    return ((b[0] + b[2]) / 2.0, (b[1] + b[3]) / 2.0)


def _tracked_vehicles(dets):
    return [d for d in dets if d.get("id") is not None and norm(d["cls"]) in _VEHICLE]


def _area(b):
    return max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])


def iou(a, b):
    ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
    ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    u = _area(a) + _area(b) - inter
    return inter / u if u > 0 else 0.0


def contains_center(outer, inner):
    cx, cy = (inner[0] + inner[2]) / 2, (inner[1] + inner[3]) / 2
    return outer[0] <= cx <= outer[2] and outer[1] <= cy <= outer[3]


def helmet_violations(dets):
    """Every no_helmet detection is a rider-helmet violation (instant)."""
    out = []
    for d in dets:
        if norm(d["cls"]) == "nohelmet":
            out.append({"type": "no_helmet", "box": d["xyxy"], "conf": d["conf"], "extra": {}})
    return out


def triple_riding(dets):
    """>=3 riders/persons associated to one two-wheeler box."""
    tw = [d for d in dets if norm(d["cls"]) in ("twowheeler", "motorcycle", "motorbike")]
    riders = [d for d in dets if norm(d["cls"]) in ("rider", "person", "motorcyclist")]
    out = []
    for bike in tw:
        n = sum(1 for r in riders if iou(bike["xyxy"], r["xyxy"]) > 0.05 or contains_center(bike["xyxy"], r["xyxy"]))
        if n >= 3:
            out.append({"type": "triple_riding", "box": bike["xyxy"], "conf": bike["conf"], "extra": {"riders": n}})
    return out


def phone_violations(dets):
    """A phone box overlapping/near a rider or driver region."""
    phones = [d for d in dets if "phone" in norm(d["cls"])]
    people = [d for d in dets if norm(d["cls"]) in ("rider", "person", "motorcyclist", "car")]
    out = []
    for p in phones:
        if any(iou(p["xyxy"], q["xyxy"]) > 0.01 or contains_center(q["xyxy"], p["xyxy"]) for q in people):
            out.append({"type": "phone_use", "box": p["xyxy"], "conf": p["conf"], "extra": {}})
    return out


def redlight_violations(dets, light_state, stop_line_y, frame_h):
    """If the signal is red and a vehicle's nose crosses the stop line."""
    if light_state != "red":
        return []
    y = stop_line_y if stop_line_y else int(frame_h * 0.55)
    out = []
    for d in dets:
        if norm(d["cls"]) in ("car", "bus", "truck", "twowheeler", "auto"):
            if d["xyxy"][3] > y > d["xyxy"][1]:   # box straddles the line
                out.append({"type": "red_light", "box": d["xyxy"], "conf": d["conf"],
                            "extra": {"line_y": y}})
    return out


def light_state_from(dets):
    """Reduce traffic-light detections to a single dominant state string."""
    best, bestc = None, 0.0
    for d in dets:
        n = norm(d["cls"])
        state = ("red" if "red" in n else "green" if "green" in n
                 else "yellow" if ("yellow" in n or "amber" in n) else None)
        if state and d["conf"] > bestc:
            best, bestc = state, d["conf"]
    return best


# ── temporal checkers (need ByteTrack ids; call once per frame in order) ──────

def speed_violations(dets, fno, fps=25.0):
    """Estimate km/h from pixel displacement of a tracked vehicle's centroid over
    its history window, flag if over SPEED_LIMIT_KMH. Updates _track_history."""
    out = []
    for d in _tracked_vehicles(dets):
        cx, cy = _centroid(d["xyxy"])
        h = _track_history[d["id"]]
        h.append((fno, cx, cy))
        if len(h) >= 10:
            dframes = h[-1][0] - h[0][0]
            if dframes > 0:
                px = math.hypot(h[-1][1] - h[0][1], h[-1][2] - h[0][2])
                kmh = (px / PX_PER_METER) * (fps / dframes) * 3.6
                if kmh > SPEED_LIMIT_KMH:
                    out.append({"type": "overspeed", "box": d["xyxy"], "conf": d["conf"],
                                "extra": {"speed_kmh": round(kmh, 1),
                                          "limit_kmh": SPEED_LIMIT_KMH}})
    return out


def wrong_side_violations(dets, fno):
    """Flag a vehicle whose motion vector opposes the lane's allowed direction for
    WS_STREAK_NEEDED consecutive windows. Assumes _track_history already updated
    this frame by speed_violations(); falls back to updating it itself if not."""
    out = []
    for d in _tracked_vehicles(dets):
        h = _track_history[d["id"]]
        if not h or h[-1][0] != fno:           # ensure history has this frame
            cx, cy = _centroid(d["xyxy"])
            h.append((fno, cx, cy))
        if len(h) >= 15:
            dx, dy = h[-1][1] - h[0][1], h[-1][2] - h[0][2]
            mag = math.hypot(dx, dy)
            if mag < MIN_TRAVEL_PX:
                continue
            cos = (dx * ALLOWED_DIR[0] + dy * ALLOWED_DIR[1]) / mag
            if cos < WRONG_SIDE_THRESH:
                _ws_counter[d["id"]] += 1
                if _ws_counter[d["id"]] >= WS_STREAK_NEEDED:
                    out.append({"type": "wrong_side", "box": d["xyxy"], "conf": d["conf"],
                                "extra": {"cos": round(cos, 2)}})
            else:
                _ws_counter[d["id"]] = 0
    return out


def parking_violations(dets, fno):
    """Flag a vehicle whose centroid stays within PARK_MOVE_PX for PARK_DWELL_FRAMES.
    Disabled when PARK_DWELL_FRAMES == 0 (set via set_calibration)."""
    if PARK_DWELL_FRAMES <= 0:
        return []
    out = []
    seen = set()
    for d in _tracked_vehicles(dets):
        vid = d["id"]; seen.add(vid)
        cx, cy = _centroid(d["xyxy"])
        anchor = _park_since.get(vid)
        if anchor is None or math.hypot(cx - anchor[1], cy - anchor[2]) > PARK_MOVE_PX:
            _park_since[vid] = (fno, cx, cy)      # (re)start dwell timer
        elif fno - anchor[0] >= PARK_DWELL_FRAMES:
            out.append({"type": "illegal_parking", "box": d["xyxy"], "conf": d["conf"],
                        "extra": {"dwell_frames": fno - anchor[0]}})
    for vid in [k for k in _park_since if k not in seen]:
        _park_since.pop(vid, None)                # vehicle left frame
    return out


# ── emergency vehicle detection (BDD/aux model classes) ──────────────────────
_EMERGENCY = ("ambulance", "firetruck", "fireengine", "policecar", "policevan")

def detect_emergency(dets):
    """Return the highest-confidence emergency-vehicle detection, or None.
    Drives the checkpost-alert overlay; also used to exempt that region from
    challaning in the caller."""
    best = None
    for d in dets:
        n = norm(d["cls"])
        if any(e in n for e in _EMERGENCY) and (best is None or d["conf"] > best["conf"]):
            best = {"cls": d["cls"], "box": d["xyxy"], "conf": d["conf"]}
    return best
