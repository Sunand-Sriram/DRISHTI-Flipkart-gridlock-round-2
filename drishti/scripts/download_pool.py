"""Download a POOL of Roboflow datasets (each into its own folder) so we can
inspect class schemas and merge carefully per model. Needs ROBOFLOW_API_KEY.

Downloads to C:\\drishti_data\\pool\\<key>. Robust: logs + continues on failure,
skips anything already present.
"""
import os
import sys
from pathlib import Path

KEY = os.environ.get("ROBOFLOW_API_KEY")
if not KEY:
    print("ERROR: set ROBOFLOW_API_KEY"); sys.exit(2)

POOL = Path(os.environ.get("DRISHTI_DATA", r"C:\drishti_data")) / "pool"
POOL.mkdir(parents=True, exist_ok=True)

# key -> (workspace, project)   [key groups by model: plate_/helmet_/seatbelt_/phone_]
PROJECTS = {
    # ---- PLATE (Indian-focused + one large generic for volume) ----
    "plate_indianlicenceplate": ("indianlicenceplate", "indianlicenceplate"),
    "plate_yolox_indian":       ("yolox-qcftu", "indian-number-plate-keeo5"),
    "plate_indian_khhkb":       ("license-plate-detection-khhkb", "indian-license-plate-detection-6tmbr"),
    # dropped plate_indian_pm6w4 (404) and plate_generic_ml (version-generation hang at 0%)
    # ---- HELMET (extra rider/helmet sets; schemas vary, remapped after inspect) ----
    "helmet_khadatkar":         ("gw-khadatkar-and-sv-wasule", "helmet-and-no-helmet-rider-detection"),
    "helmet_odu_yolov8":        ("object-detection-using-yolov8", "helmet-detection-project-ifpu6"),
    "helmet_mapua":             ("mapua-university", "motorcycle-helmet-detection-dataset"),
    # ---- SEATBELT (extra; check positive vs negative semantics after inspect) ----
    "seatbelt_akaike":          ("akaike", "seatbelt-detection-vvyjz"),
    "seatbelt_utm":             ("utm-w8iqj", "seatbelt-754x9"),
    "seatbelt_dms":             ("dms-vewel", "seatbelt-smjqq"),
    # ---- PHONE (extra single-class phone sets) ----
    "phone_hope":               ("hope-qiflt", "cellphone-yolov8-training"),
    "phone_yvd":                ("yolovehicledetection", "phone-detection-nkzix"),
}

from roboflow import Roboflow
rf = Roboflow(api_key=KEY)


def nonempty(p):
    return p.exists() and any(p.iterdir())


for key, (ws, proj) in PROJECTS.items():
    out = POOL / key
    if nonempty(out):
        print(f"skip (exists): {key}", flush=True)
        continue
    try:
        p = rf.workspace(ws).project(proj)
        vers = p.versions()
        print(f"[{key}] {ws}/{proj}: {len(vers)} version(s) -> downloading", flush=True)
        vers[0].download("yolov8", location=str(out))
        print(f"[{key}] OK -> {out}", flush=True)
    except Exception as e:
        print(f"[{key}] FAILED {ws}/{proj}: {e!r}", flush=True)

print("download_pool done", flush=True)
