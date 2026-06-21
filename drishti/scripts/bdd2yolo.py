"""Convert BDD100K to YOLO format.
BDD100K has 69,863 train images with box2d annotations.
We keep detection classes only (skip 'drivable area', 'lane' which are segmentation).
"""
import json, shutil, random
from pathlib import Path
import yaml

DETECTION_CLASSES = ["bike", "bus", "car", "motor", "person",
                     "rider", "traffic light", "traffic sign", "train", "truck"]


def convert(data, imgs_dir, out_dir, split):
    img_out = out_dir / split / "images"
    lbl_out = out_dir / split / "labels"
    img_out.mkdir(parents=True, exist_ok=True)
    lbl_out.mkdir(parents=True, exist_ok=True)

    written = 0
    for i, entry in enumerate(data):
        if i % 2000 == 0:
            print(f"  {split}: {i}/{len(data)}", flush=True)

        img_path = imgs_dir / entry["name"]
        if not img_path.exists():
            continue

        labels = []
        for lbl in (entry.get("labels") or []):
            cat = lbl.get("category", "")
            if cat not in DETECTION_CLASSES:
                continue
            box = lbl.get("box2d")
            if not box:
                continue
            x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
            # BDD100K images are 1280x720
            W, H = 1280.0, 720.0
            cx = (x1 + x2) / 2 / W
            cy = (y1 + y2) / 2 / H
            w  = (x2 - x1) / W
            h  = (y2 - y1) / H
            if 0 < w <= 1 and 0 < h <= 1:
                cls_idx = DETECTION_CLASSES.index(cat)
                labels.append(f"{cls_idx} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")

        stem = f"{split}_{i:06d}"
        shutil.copy(img_path, img_out / (stem + img_path.suffix))
        (lbl_out / (stem + ".txt")).write_text("\n".join(labels))
        written += 1

    print(f"  {split}: wrote {written} images", flush=True)
    return written


def main():
    ann_file = Path(r"C:\drishti_data\bdd100k_extracted\train\annotations\bdd100k_labels_images_train.json")
    imgs_dir = Path(r"C:\drishti_data\bdd100k_extracted\train\images")
    out_dir  = Path(r"C:\drishti_data\bdd100k_yolo")

    if out_dir.exists():
        shutil.rmtree(out_dir)

    print("Loading BDD100K annotations...", flush=True)
    with open(ann_file) as f:
        data = json.load(f)
    print(f"Total images: {len(data)}", flush=True)

    random.seed(42)
    random.shuffle(data)
    nval = int(len(data) * 0.1)   # 10% val (~7000 images)
    val_data   = data[:nval]
    train_data = data[nval:]

    print(f"Train: {len(train_data)}, Val: {len(val_data)}", flush=True)

    convert(train_data, imgs_dir, out_dir, "train")
    convert(val_data,   imgs_dir, out_dir, "val")

    cfg = {
        "train": str((out_dir / "train" / "images").resolve()).replace("\\", "/"),
        "val":   str((out_dir / "val"   / "images").resolve()).replace("\\", "/"),
        "names": DETECTION_CLASSES,
    }
    config_path = Path(r"C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti\configs\bdd100k_data.yaml")
    config_path.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
    print(f"Config: {config_path}", flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
