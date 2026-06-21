"""Download Roboflow Universe datasets for the remaining DRISHTI models
(seatbelt + phone). Needs ROBOFLOW_API_KEY in the environment (never hard-coded).
Exports YOLOv8 format to C:\\drishti_data\\<sub>.

Robust: for each target we try a list of candidate projects and keep the FIRST
that downloads successfully, so a dead/renamed project doesn't block the run.
"""
import os
import sys
from pathlib import Path

KEY = os.environ.get("ROBOFLOW_API_KEY")
if not KEY:
    print("ERROR: set ROBOFLOW_API_KEY env var")
    sys.exit(2)

DATA = Path(os.environ.get("DRISHTI_DATA", r"C:\drishti_data"))

# target sub-folder -> ordered list of (workspace, project) candidates
TARGETS = {
    "seatbelt": [
        ("2tech", "seat-belt-detection-udcfg"),
        ("ineuron-8bdse", "no-seatbelt"),
        ("akaike", "seatbelt-detection-vvyjz"),
        ("utm-w8iqj", "seatbelt-754x9"),
        ("dms-vewel", "seatbelt-smjqq"),
    ],
    "phone": [
        ("workspace-f5gtr", "cellphone-dataset"),
        ("hope-qiflt", "cellphone-yolov8-training"),
        ("yolovehicledetection", "phone-detection-nkzix"),
    ],
}

from roboflow import Roboflow

rf = Roboflow(api_key=KEY)


def nonempty(p):
    return p.exists() and any(p.iterdir())


for sub, candidates in TARGETS.items():
    out = DATA / sub
    if nonempty(out):
        print(f"skip (exists): {sub}", flush=True)
        continue
    ok = False
    for ws, proj in candidates:
        try:
            p = rf.workspace(ws).project(proj)
            vers = p.versions()
            print(f"[{sub}] {ws}/{proj}: {len(vers)} version(s) -> downloading", flush=True)
            vers[0].download("yolov8", location=str(out))
            print(f"[{sub}] downloaded -> {out}", flush=True)
            ok = True
            break
        except Exception as e:
            print(f"[{sub}] candidate {ws}/{proj} FAILED: {e!r}", flush=True)
            continue
    if not ok:
        print(f"[{sub}] ALL candidates failed — will train without it", flush=True)

print("roboflow done", flush=True)
