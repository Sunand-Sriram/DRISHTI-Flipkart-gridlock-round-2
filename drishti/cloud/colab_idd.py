# ============================================================
# COLAB NOTEBOOK — IDD 117k Detection (yolo11m)
# ============================================================
# Downloads the 5 IDD tar.gz parts straight from IIIT (no home upload),
# concatenates, extracts, converts COCO->YOLO, trains. Checkpoints to your
# Google Drive so a Colab disconnect resumes instead of restarting.
#
# YOU PROVIDE: the 5 download URLs IIIT/your download-manager uses for
#   IDD117K_Detection parts 1..5 (paste into IDD_URLS below). They look like
#   https://idd.insaan.iiit.ac.in/dataset/download/<token>/...
# Runtime -> Change runtime type -> GPU (T4). Then run cells top to bottom.

# %% [cell 1] mount Drive (for resume-safe checkpoints) + install
from google.colab import drive
drive.mount('/content/drive')
!pip -q install ultralytics
import os
CKPT_DIR = "/content/drive/MyDrive/drishti_idd"   # checkpoints persist here
os.makedirs(CKPT_DIR, exist_ok=True)

# %% [cell 2] download the 5 parts (resumable with -c)
IDD_URLS = [
    "PASTE_PART1_URL",
    "PASTE_PART2_URL",
    "PASTE_PART3_URL",
    "PASTE_PART4_URL",
    "PASTE_PART5_URL",
]
import os
os.makedirs("/content/idd_parts", exist_ok=True)
for i, u in enumerate(IDD_URLS, 1):
    if u.startswith("PASTE"): raise SystemExit("Fill in IDD_URLS first")
    !wget -c "{u}" -O /content/idd_parts/part{i}.tar.gz

# %% [cell 3] concatenate + extract
!cat /content/idd_parts/part*.tar.gz > /content/idd_full.tar.gz
!mkdir -p /content/idd && tar -xzf /content/idd_full.tar.gz -C /content/idd
!find /content/idd -maxdepth 3 -type d | head -20
!find /content/idd -name "*.json" | head

# %% [cell 4] convert COCO -> YOLO  (adjust ANN/IMG globs to the printed layout)
import json, glob, random, shutil
from pathlib import Path
ANNS = glob.glob("/content/idd/**/*train*.json", recursive=True) or glob.glob("/content/idd/**/*.json", recursive=True)
OUT = Path("/content/idd_yolo")
print("annotation files:", ANNS)
# Build class list from the first JSON's categories
coco0 = json.load(open(ANNS[0]))
CLASSES = [c["name"] for c in sorted(coco0["categories"], key=lambda c: c["id"])]
id2idx = {c["id"]: i for i, c in enumerate(sorted(coco0["categories"], key=lambda c: c["id"]))}
print("classes:", CLASSES)

def conv(ann_path, split):
    coco = json.load(open(ann_path))
    anns = {}
    for a in coco["annotations"]: anns.setdefault(a["image_id"], []).append(a)
    (OUT/split/"images").mkdir(parents=True, exist_ok=True)
    (OUT/split/"labels").mkdir(parents=True, exist_ok=True)
    n=0
    for im in coco["images"]:
        hits = glob.glob(f"/content/idd/**/{Path(im['file_name']).name}", recursive=True)
        if not hits: continue
        W,H = im.get("width",0), im.get("height",0)
        if W<=0 or H<=0: continue
        lines=[]
        for a in anns.get(im["id"], []):
            x,y,w,h = a["bbox"]
            cx=(x+w/2)/W; cy=(y+h/2)/H; nw=w/W; nh=h/H
            if 0<nw<=1 and 0<nh<=1: lines.append(f"{id2idx[a['category_id']]} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
        stem=f"{split}_{n:06d}"; shutil.copy(hits[0], OUT/split/"images"/(stem+Path(hits[0]).suffix))
        (OUT/split/"labels"/(stem+".txt")).write_text("\n".join(lines)); n+=1
    print(split, n); return n

train_ann = [a for a in ANNS if "train" in a.lower()] or ANNS[:1]
val_ann   = [a for a in ANNS if "val"  in a.lower()]
for a in train_ann: conv(a, "train")
for a in val_ann:   conv(a, "val")
yaml_txt=f"train: {OUT}/train/images\nval: {OUT}/val/images\nnames: {CLASSES}\n"
open("/content/idd.yaml","w").write(yaml_txt); print(yaml_txt)

# %% [cell 5] train (checkpoints to Drive -> resume after disconnect)
from ultralytics import YOLO
import shutil, os
last = f"{CKPT_DIR}/weights/last.pt"
model = YOLO(last) if os.path.exists(last) else YOLO("yolo11m.pt")
model.train(
    data="/content/idd.yaml",
    epochs=80, imgsz=640, batch=16, device=0,
    project=CKPT_DIR, name="", exist_ok=True, resume=os.path.exists(last),
    patience=20, save_period=5, plots=True, workers=2,
)
print("best:", f"{CKPT_DIR}/weights/best.pt")
