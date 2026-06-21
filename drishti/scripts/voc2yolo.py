"""Convert one or more VOC-format dataset roots to a unified YOLO dataset
(train/val split) and write a data.yaml. Reusable for S2TLD, car-plate, etc.

Usage:
  python voc2yolo.py --roots <dir> [<dir> ...] --out <yolo_dir> --config <data.yaml> [--val 0.15]
"""
import argparse
import random
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path
import yaml


def find_pairs(roots):
    pairs = []
    for root in roots:
        for xml in Path(root).rglob("*.xml"):
            stem = xml.stem
            img = None
            for d in (xml.parent.parent / "JPEGImages", xml.parent, xml.parent.parent):
                for ext in (".jpg", ".jpeg", ".png", ".JPG"):
                    p = d / (stem + ext)
                    if p.exists():
                        img = p
                        break
                if img:
                    break
            if img:
                pairs.append((img, xml))
    return pairs


def collect_classes(pairs):
    names = set()
    for _, xml in pairs:
        try:
            root = ET.parse(xml).getroot()
        except Exception:
            continue
        for o in root.findall("object"):
            n = o.findtext("name")
            if n:
                names.add(n.strip())
    return sorted(names)


def convert(xml, cls2idx):
    root = ET.parse(xml).getroot()
    W = float(root.findtext("size/width"))
    H = float(root.findtext("size/height"))
    lines = []
    for o in root.findall("object"):
        n = (o.findtext("name") or "").strip()
        if n not in cls2idx or W <= 0 or H <= 0:
            continue
        b = o.find("bndbox")
        x1, y1 = float(b.findtext("xmin")), float(b.findtext("ymin"))
        x2, y2 = float(b.findtext("xmax")), float(b.findtext("ymax"))
        cx, cy = ((x1 + x2) / 2) / W, ((y1 + y2) / 2) / H
        w, h = (x2 - x1) / W, (y2 - y1) / H
        if w > 0 and h > 0:
            lines.append(f"{cls2idx[n]} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
    return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--roots", nargs="+", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--val", type=float, default=0.15)
    args = ap.parse_args()

    pairs = find_pairs(args.roots)
    print("image/annotation pairs:", len(pairs))
    classes = collect_classes(pairs)
    print("classes:", classes)
    cls2idx = {c: i for i, c in enumerate(classes)}

    out = Path(args.out)
    random.seed(0)
    random.shuffle(pairs)
    nval = int(len(pairs) * args.val)
    for split, subset in [("val", pairs[:nval]), ("train", pairs[nval:])]:
        (out / split / "images").mkdir(parents=True, exist_ok=True)
        (out / split / "labels").mkdir(parents=True, exist_ok=True)
        for i, (img, xml) in enumerate(subset):
            stem = f"{split}_{i:06d}"
            shutil.copy(img, out / split / "images" / (stem + img.suffix.lower()))
            (out / split / "labels" / (stem + ".txt")).write_text("\n".join(convert(xml, cls2idx)))
        print(f"{split}: {len(subset)} images")

    cfg = {
        "train": str((out / "train" / "images").resolve()).replace("\\", "/"),
        "val": str((out / "val" / "images").resolve()).replace("\\", "/"),
        "names": classes,
    }
    Path(args.config).write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
    print("wrote config:", args.config)


if __name__ == "__main__":
    main()
