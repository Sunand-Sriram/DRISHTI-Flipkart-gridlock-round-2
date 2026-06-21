# ============================================================
# KAGGLE NOTEBOOK — BDD100K vehicle/traffic detection (yolo11m)
# ============================================================
# SETUP (one-time, on your machine — uploads only the 5.4 GB raw zip):
#   pip install kaggle
#   mkdir bdd_upload && copy BDD100K.zip bdd_upload\
#   kaggle datasets init -p bdd_upload
#   # edit bdd_upload/dataset-metadata.json -> set "title"/"id": "<your-user>/bdd100k-raw"
#   kaggle datasets create -p bdd_upload --dir-mode zip
# THEN in a Kaggle Notebook: Add Data -> your "bdd100k-raw" dataset,
#   enable GPU (T4 x2 or P100), Internet ON, and run the cells below.
# Session limit ~12h -> save_period + resume handles disconnects: just
#   re-run the notebook, it resumes from /kaggle/working checkpoints.

# %% [cell 1] install
!pip -q install ultralytics

# %% [cell 2] locate extracted data (Kaggle AUTO-EXTRACTS uploaded zips —
#            there is no BDD100K.zip in /kaggle/input, the folders are already there)
import os, json, random, shutil
from pathlib import Path

INPUT = Path("/kaggle/input")
anns = list(INPUT.rglob("bdd100k_labels_images_train.json"))
if not anns:
    print("train json NOT found — input tree:")
    for p in sorted(INPUT.rglob("*")):
        if p.is_dir(): print("  DIR", p)
    raise SystemExit("adjust paths to the tree above")
ANN = anns[0]
IMGS = ANN.parent.parent / "images"
if not IMGS.exists():
    IMGS = next(p for p in INPUT.rglob("images") if p.is_dir())
print("ANN:", ANN, "\nIMGS:", IMGS, "->", len(list(IMGS.glob('*.jpg'))), "jpgs")

# %% [cell 3] convert BDD100K -> YOLO (10 detection classes)
OUT = Path("/kaggle/working/bdd_yolo")
CLASSES = ["bike","bus","car","motor","person","rider","traffic light","traffic sign","train","truck"]

if not OUT.exists():
    data = json.load(open(ANN)); random.seed(42); random.shuffle(data)
    nval = int(len(data)*0.1)
    for split, subset in [("val", data[:nval]), ("train", data[nval:])]:
        (OUT/split/"images").mkdir(parents=True, exist_ok=True)
        (OUT/split/"labels").mkdir(parents=True, exist_ok=True)
        for i, e in enumerate(subset):
            ip = IMGS/e["name"]
            if not ip.exists(): continue
            lines=[]
            for lb in (e.get("labels") or []):
                c=lb.get("category"); b=lb.get("box2d")
                if c in CLASSES and b:
                    W,H=1280.0,720.0
                    cx=(b["x1"]+b["x2"])/2/W; cy=(b["y1"]+b["y2"])/2/H
                    w=(b["x2"]-b["x1"])/W; h=(b["y2"]-b["y1"])/H
                    if 0<w<=1 and 0<h<=1: lines.append(f"{CLASSES.index(c)} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
            stem=f"{split}_{i:06d}"
            shutil.copy(ip, OUT/split/"images"/(stem+ip.suffix))
            (OUT/split/"labels"/(stem+".txt")).write_text("\n".join(lines))
        print(split, "done")
yaml_txt = f"train: {OUT}/train/images\nval: {OUT}/val/images\nnames: {CLASSES}\n"
open("/kaggle/working/bdd.yaml","w").write(yaml_txt); print(yaml_txt)

# %% [cell 4] train (resume-safe). Re-run notebook after a disconnect to continue.
from ultralytics import YOLO
RUN = "/kaggle/working/runs/bdd100k_yolo11m"
ckpt = f"{RUN}/weights/last.pt"
model = YOLO(ckpt) if os.path.exists(ckpt) else YOLO("yolo11m.pt")
model.train(
    data="/kaggle/working/bdd.yaml",
    epochs=80, imgsz=640, batch=16, device=0,
    project="/kaggle/working/runs", name="bdd100k_yolo11m",
    exist_ok=True, resume=os.path.exists(ckpt),
    patience=20, save_period=5, plots=True, workers=2,
)
# best weights -> /kaggle/working/runs/bdd100k_yolo11m/weights/best.pt  (download from Output tab)
