"""Download driver-distraction / driver-with-phone datasets into the pool so we
can merge phone-OBJECT boxes (driving domain) into a better phone detector.
Needs ROBOFLOW_API_KEY. Downloads each to C:\\drishti_data\\pool\\<key>.
"""
import os, sys
from pathlib import Path

KEY = os.environ.get("ROBOFLOW_API_KEY")
if not KEY:
    print("ERROR: set ROBOFLOW_API_KEY"); sys.exit(2)
POOL = Path(os.environ.get("DRISHTI_DATA", r"C:\drishti_data")) / "pool"
POOL.mkdir(parents=True, exist_ok=True)

PROJECTS = {
    "phone_driver_ddd":        ("yolov8-z7kip", "distracted-driver-detection-bvtnl"),
    "phone_driver_distracted": ("distracted-driving-yu8re", "distracted-driving-wuu1n-aumzo"),
    "phone_driver_pikitti":    ("pikitti", "driver-monitoring-2-xzpjp"),
}

from roboflow import Roboflow
rf = Roboflow(api_key=KEY)


def nonempty(p):
    return p.exists() and any(p.iterdir())


for key, (ws, proj) in PROJECTS.items():
    out = POOL / key
    if nonempty(out):
        print(f"skip (exists): {key}", flush=True); continue
    try:
        p = rf.workspace(ws).project(proj)
        vers = p.versions()
        print(f"[{key}] {ws}/{proj}: {len(vers)} version(s) -> downloading", flush=True)
        vers[0].download("yolov8", location=str(out))
        print(f"[{key}] OK -> {out}", flush=True)
    except Exception as e:
        print(f"[{key}] FAILED {ws}/{proj}: {e!r}", flush=True)
print("download_phone_driver done", flush=True)
