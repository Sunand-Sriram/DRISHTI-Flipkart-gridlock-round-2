"""Predictive hotspots model (frequency-based, no GPU).

Reads the historical police-violation CSV, buckets every violation by
(location grid, day-of-week, hour, violation_type), and learns the mean rate
per bucket. At query time we predict the top hotspots for a given future
timestamp by looking up (dow, hour) and ranking grid cells by expected count.

Outputs:
  drishti/data/hotspots.json   — the learned model + a precomputed 24x7 ranking
The FastAPI /api/hotspots/predict endpoint loads this and slices by time.

Run:  python drishti/scripts/build_hotspots.py
"""
import ast
import json
import math
from collections import defaultdict
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]          # repo root
OUT_DIR = ROOT / "drishti" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)
CSV = ROOT / "jan to may police violation_anonymized791b166.csv"

GRID = 0.004   # ~400m cells (0.004 deg lat ~ 444m)


def _parse_types(raw):
    """violation_type is a JSON-ish list string like '[\"NO PARKING\"]'."""
    if not isinstance(raw, str) or not raw.strip():
        return ["UNKNOWN"]
    try:
        v = ast.literal_eval(raw)
        return [str(x).strip().upper() for x in v] if isinstance(v, list) else [str(v).upper()]
    except Exception:
        return [raw.strip().upper()]


def _cell(lat, lng):
    return (round(math.floor(lat / GRID) * GRID, 4),
            round(math.floor(lng / GRID) * GRID, 4))


def main():
    if not CSV.exists():
        raise SystemExit(f"CSV not found: {CSV}")
    df = pd.read_csv(CSV, usecols=[
        "latitude", "longitude", "location", "violation_type",
        "created_datetime", "junction_name", "police_station",
    ])
    df = df.dropna(subset=["latitude", "longitude", "created_datetime"])
    df = df[(df.latitude.between(12.7, 13.3)) & (df.longitude.between(77.3, 77.9))]
    df["dt"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)
    df = df.dropna(subset=["dt"])
    df["dow"] = df["dt"].dt.dayofweek       # 0=Mon
    df["hour"] = df["dt"].dt.hour

    # bucket[(dow,hour)][cell] -> {count, types{}, label}
    buckets = defaultdict(lambda: defaultdict(lambda: {"count": 0, "types": defaultdict(int),
                                                       "lat": 0.0, "lng": 0.0, "label": ""}))
    n_weeks = max(1, (df["dt"].max() - df["dt"].min()).days / 7.0)

    for _, r in df.iterrows():
        cell = _cell(r.latitude, r.longitude)
        b = buckets[(int(r.dow), int(r.hour))][cell]
        b["count"] += 1
        b["lat"] = float(r.latitude); b["lng"] = float(r.longitude)
        if not b["label"]:
            loc = r.junction_name if isinstance(r.junction_name, str) and r.junction_name not in ("No Junction", "") else None
            b["label"] = loc or (str(r.location)[:48] if isinstance(r.location, str) else "Unknown")
        for t in _parse_types(r.violation_type):
            b["types"][t] += 1

    # build a compact ranked structure: predictions[dow][hour] = top cells
    predictions = {}
    for (dow, hour), cells in buckets.items():
        ranked = sorted(cells.items(), key=lambda kv: kv[1]["count"], reverse=True)[:8]
        items = []
        for cell, b in ranked:
            exp = b["count"] / n_weeks          # expected occurrences per week-hour
            top_type = max(b["types"].items(), key=lambda kv: kv[1])[0] if b["types"] else "UNKNOWN"
            risk = min(10, max(1, round(exp)))   # 1..10 risk score
            items.append({
                "lat": round(b["lat"], 5), "lng": round(b["lng"], 5),
                "label": b["label"], "risk": risk,
                "expected": round(exp, 1), "top_violation": top_type,
            })
        predictions.setdefault(str(dow), {})[str(hour)] = items

    model = {
        "grid_deg": GRID,
        "weeks_observed": round(n_weeks, 1),
        "total_events": int(len(df)),
        "date_range": [str(df["dt"].min().date()), str(df["dt"].max().date())],
        "predictions": predictions,     # predictions[dow][hour] = [hotspot,...]
    }
    out = OUT_DIR / "hotspots.json"
    out.write_text(json.dumps(model, indent=2))
    print(f"[hotspots] {len(df)} events, {n_weeks:.1f} weeks -> {out}")
    # quick sanity print
    sample = predictions.get("0", {}).get("9", [])[:3]
    print("[hotspots] Mon 09:00 top:", [(h["label"][:24], h["risk"]) for h in sample])


if __name__ == "__main__":
    main()
