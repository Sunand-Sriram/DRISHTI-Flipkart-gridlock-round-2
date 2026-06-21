"""Convert COCO-format datasets to YOLO. Used for UVH-26, LISA, IDD, BDD100K.

Usage:
  python coco2yolo.py --coco <annotations.json> --imgs <img_dir> --out <yolo_dir> [--val 0.15]
"""
import argparse
import json
import random
import shutil
from pathlib import Path
import yaml


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--coco", required=True, help="Path to COCO annotations.json")
    ap.add_argument("--imgs", required=True, help="Path to images directory")
    ap.add_argument("--out", required=True, help="Output YOLO directory")
    ap.add_argument("--val", type=float, default=0.15, help="Val split fraction")
    args = ap.parse_args()

    coco_path = Path(args.coco)
    imgs_dir = Path(args.imgs)
    out_dir = Path(args.out)

    # Load COCO JSON
    with open(coco_path) as f:
        coco = json.load(f)

    # Build class map
    classes = {}
    for cat in coco.get("categories", []):
        classes[cat["id"]] = cat["name"]

    # Collect image -> annotations
    img_anns = {}
    for ann in coco.get("annotations", []):
        img_id = ann["image_id"]
        if img_id not in img_anns:
            img_anns[img_id] = []
        img_anns[img_id].append(ann)

    # Process images
    pairs = []
    for img_info in coco.get("images", []):
        img_id = img_info["id"]
        file_name = img_info["file_name"]
        img_path = imgs_dir / file_name
        if not img_path.exists():
            continue
        pairs.append((img_id, img_path, img_info.get("width", 0), img_info.get("height", 0)))

    print(f"Found {len(pairs)} images")
    print(f"Classes: {classes}")

    # Split train/val
    random.seed(0)
    random.shuffle(pairs)
    nval = int(len(pairs) * args.val)

    for split, subset in [("val", pairs[:nval]), ("train", pairs[nval:])]:
        (out_dir / split / "images").mkdir(parents=True, exist_ok=True)
        (out_dir / split / "labels").mkdir(parents=True, exist_ok=True)
        for i, (img_id, img_path, W, H) in enumerate(subset):
            stem = f"{split}_{i:06d}"
            dst = out_dir / split / "images" / (stem + img_path.suffix)
            shutil.copy(img_path, dst)

            # Write YOLO labels
            labels = []
            for ann in img_anns.get(img_id, []):
                cat_id = ann["category_id"]
                bbox = ann["bbox"]  # [x, y, w, h] in COCO format
                if W <= 0 or H <= 0:
                    continue
                x, y, w, h = bbox
                cx = (x + w / 2) / W
                cy = (y + h / 2) / H
                cw = w / W
                ch = h / H
                if 0 < cw < 1 and 0 < ch < 1:
                    cls_idx = cat_id - 1 if cat_id in classes else 0  # COCO is 1-indexed
                    labels.append(f"{cls_idx} {cx:.6f} {cy:.6f} {cw:.6f} {ch:.6f}")
            (out_dir / split / "labels" / (stem + ".txt")).write_text("\n".join(labels))
        print(f"{split}: {len(subset)} images")

    # Write data.yaml
    cfg = {
        "train": str((out_dir / "train" / "images").resolve()).replace("\\", "/"),
        "val": str((out_dir / "val" / "images").resolve()).replace("\\", "/"),
        "names": [classes.get(i + 1, f"class_{i}") for i in range(len(classes))],
    }
    Path(args.out).parent.mkdir(exist_ok=True)
    config_path = Path(args.out).parent / f"{Path(args.out).name}_data.yaml"
    config_path.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
    print(f"Config: {config_path}")


if __name__ == "__main__":
    main()
