"""Prepare the two on-disk datasets that need no download:
  1. plate_yolo   <- datasets/raw/car-plate (VOC: images/ + annotations/) -> single class
  2. helmet_v2    <- merge datasets/raw/indian-helmet + helmet.zip (both 5-class YOLO)

Large output goes to C:\\drishti_data (outside OneDrive). Writes the two YOLO
data.yaml configs into drishti/configs/.
"""
import os
import random
import shutil
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "datasets" / "raw"
CONFIGS = ROOT / "configs"
DATA = Path(os.environ.get("DRISHTI_DATA", r"C:\drishti_data"))
CONFIGS.mkdir(exist_ok=True)

HELMET_CLASSES = ["number_plate", "no_helmet", "helmet", "bad_helmet", "rider"]


# ---------- 1. PLATE (VOC images/ + annotations/ -> single-class YOLO) ----------
def prepare_plate():
    src = RAW / "car-plate"
    imgs_dir, anns_dir = src / "images", src / "annotations"
    out = DATA / "plate_yolo"
    cfg = CONFIGS / "plate_data.yaml"
    if not anns_dir.is_dir():
        print("[plate] no annotations dir, skipping")
        return
    pairs = []
    for xml in anns_dir.glob("*.xml"):
        for ext in (".png", ".jpg", ".jpeg", ".PNG", ".JPG"):
            img = imgs_dir / (xml.stem + ext)
            if img.exists():
                pairs.append((img, xml))
                break
    print(f"[plate] {len(pairs)} image/xml pairs")
    if out.exists():
        shutil.rmtree(out)
    random.seed(0)
    random.shuffle(pairs)
    nval = int(len(pairs) * 0.15)
    for split, subset in [("val", pairs[:nval]), ("train", pairs[nval:])]:
        (out / split / "images").mkdir(parents=True, exist_ok=True)
        (out / split / "labels").mkdir(parents=True, exist_ok=True)
        for i, (img, xml) in enumerate(subset):
            r = ET.parse(xml).getroot()
            W = float(r.findtext("size/width")); H = float(r.findtext("size/height"))
            lines = []
            for o in r.findall("object"):
                b = o.find("bndbox")
                x1, y1 = float(b.findtext("xmin")), float(b.findtext("ymin"))
                x2, y2 = float(b.findtext("xmax")), float(b.findtext("ymax"))
                if W > 0 and H > 0 and x2 > x1 and y2 > y1:
                    cx, cy = ((x1 + x2) / 2) / W, ((y1 + y2) / 2) / H
                    w, h = (x2 - x1) / W, (y2 - y1) / H
                    lines.append(f"0 {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")  # force single class
            stem = f"{split}_{i:06d}"
            shutil.copy(img, out / split / "images" / (stem + img.suffix.lower()))
            (out / split / "labels" / (stem + ".txt")).write_text("\n".join(lines))
        print(f"[plate] {split}: {len(subset)}")
    cfg.write_text(yaml.safe_dump({
        "train": str((out / "train" / "images").resolve()).replace("\\", "/"),
        "val": str((out / "val" / "images").resolve()).replace("\\", "/"),
        "names": ["number_plate"],
    }, sort_keys=False), encoding="utf-8")
    print("[plate] config ->", cfg)


# ---------- 2. HELMET v2 (merge indian-helmet + helmet.zip) ----------
def _copy_split(src_root, splits, dst_split, out, counter):
    n = 0
    for s in splits:
        img_dir = src_root / s / "images"
        lbl_dir = src_root / s / "labels"
        if not img_dir.is_dir():
            continue
        for img in img_dir.glob("*"):
            lbl = lbl_dir / (img.stem + ".txt")
            stem = f"{dst_split}_{counter[0]:06d}"; counter[0] += 1
            shutil.copy(img, out / dst_split / "images" / (stem + img.suffix.lower()))
            (out / dst_split / "labels" / (stem + ".txt")).write_text(
                lbl.read_text() if lbl.exists() else "")
            n += 1
    return n


def prepare_helmet_v2():
    out = DATA / "helmet_v2_yolo"
    cfg = CONFIGS / "helmet_v2_data.yaml"
    # extract helmet.zip -> staging dir
    stage = DATA / "_helmet_zip"
    if not stage.exists():
        z = RAW / "helmet.zip"
        if z.exists():
            stage.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(z) as zf:
                zf.extractall(stage)
            print("[helmet] extracted helmet.zip ->", stage)
    if out.exists():
        shutil.rmtree(out)
    for s in ("train", "val"):
        (out / s / "images").mkdir(parents=True, exist_ok=True)
        (out / s / "labels").mkdir(parents=True, exist_ok=True)
    counter = [0]
    t = _copy_split(RAW / "indian-helmet", ["train"], "train", out, counter)
    t += _copy_split(stage, ["train"], "train", out, counter)
    counter = [0]
    v = _copy_split(RAW / "indian-helmet", ["valid", "val"], "val", out, counter)
    v += _copy_split(stage, ["valid", "val", "test"], "val", out, counter)
    print(f"[helmet] train={t} val={v}")
    cfg.write_text(yaml.safe_dump({
        "train": str((out / "train" / "images").resolve()).replace("\\", "/"),
        "val": str((out / "val" / "images").resolve()).replace("\\", "/"),
        "names": HELMET_CLASSES,
    }, sort_keys=False), encoding="utf-8")
    print("[helmet] config ->", cfg)


if __name__ == "__main__":
    prepare_plate()
    prepare_helmet_v2()
    print("prepare_track_a done")
