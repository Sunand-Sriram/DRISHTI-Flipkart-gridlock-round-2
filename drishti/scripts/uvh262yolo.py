"""Convert UVH-26 COCO dataset to YOLO. Images are in nested subdirs (000, 001...).
14 Indian vehicle categories: Hatchback, Sedan, SUV, MUV, Bus, Truck,
Three-wheeler, Two-wheeler, LCV, Mini-bus, Tempo-traveller, Bicycle, Van, Others
"""
import json
import random
import shutil
from pathlib import Path
import yaml


def find_image(data_dir, filename):
    """Search nested subdirs for the image file."""
    # First try direct
    p = data_dir / filename
    if p.exists():
        return p
    # Search subdirs
    for sub in data_dir.iterdir():
        if sub.is_dir():
            p = sub / filename
            if p.exists():
                return p
    return None


def main():
    coco_file = Path(r"C:\drishti_data\uvh26\UVH-26-Train\UVH-26-ST-Train.json")
    imgs_dir = Path(r"C:\drishti_data\uvh26\UVH-26-Train\data")
    out_dir = Path(r"C:\drishti_data\uvh26_yolo")

    # Clear old (broken) output
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    print("Loading COCO JSON...")
    with open(coco_file, encoding="utf-8") as f:
        coco = json.load(f)

    categories = {cat["id"]: cat["name"] for cat in coco["categories"]}
    class_names = [categories[i] for i in sorted(categories.keys())]
    id_to_idx = {cat_id: i for i, cat_id in enumerate(sorted(categories.keys()))}
    print(f"Classes ({len(class_names)}): {class_names}")

    # Build image_id -> annotations map
    img_anns = {}
    for ann in coco["annotations"]:
        img_anns.setdefault(ann["image_id"], []).append(ann)

    # Resolve all image paths
    print("Resolving image paths...")
    pairs = []
    missing = 0
    for img_info in coco["images"]:
        img_path = find_image(imgs_dir, img_info["file_name"])
        if img_path is None:
            missing += 1
            continue
        pairs.append((img_info["id"], img_path, img_info["width"], img_info["height"]))

    print(f"Found: {len(pairs)}, Missing: {missing}")

    # Split train/val
    random.seed(42)
    random.shuffle(pairs)
    nval = max(100, int(len(pairs) * 0.15))

    for split, subset in [("val", pairs[:nval]), ("train", pairs[nval:])]:
        img_out = out_dir / split / "images"
        lbl_out = out_dir / split / "labels"
        img_out.mkdir(parents=True)
        lbl_out.mkdir(parents=True)

        for i, (img_id, img_path, W, H) in enumerate(subset):
            if i % 500 == 0:
                print(f"  {split}: {i}/{len(subset)}")
            stem = f"{split}_{i:06d}"
            shutil.copy(img_path, img_out / (stem + img_path.suffix))

            lines = []
            for ann in img_anns.get(img_id, []):
                if W <= 0 or H <= 0:
                    continue
                x, y, w, h = ann["bbox"]
                cx, cy = (x + w / 2) / W, (y + h / 2) / H
                nw, nh = w / W, h / H
                if 0 < nw <= 1 and 0 < nh <= 1:
                    lines.append(f"{id_to_idx[ann['category_id']]} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
            (lbl_out / (stem + ".txt")).write_text("\n".join(lines))

        print(f"{split}: {len(subset)} images done")

    cfg = {
        "train": str((out_dir / "train" / "images").resolve()).replace("\\", "/"),
        "val":   str((out_dir / "val"   / "images").resolve()).replace("\\", "/"),
        "names": class_names,
    }
    config_path = Path(r"C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti\configs\uvh26_data.yaml")
    config_path.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
    print(f"Config written: {config_path}")
    print("DONE")


if __name__ == "__main__":
    main()
