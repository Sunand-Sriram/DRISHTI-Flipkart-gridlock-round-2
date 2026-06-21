"""Convert LISA traffic-light dataset (CSV format) to YOLO.

LISA annotations: Filename;Tag;X1;Y1;X2;Y2;...
Classes: red, yellow, green, off (ignoring stop signs)
"""
import csv
import random
import shutil
from pathlib import Path
import yaml

def main():
    root = Path(r"C:\drishti_data\lisa")
    out = Path(r"C:\drishti_data\lisa_yolo")
    out.mkdir(parents=True, exist_ok=True)

    # Find all annotation CSVs
    csvs = list(root.glob("Annotations/Annotations/*.csv"))
    print(f"Found {len(csvs)} annotation files")

    # Collect (img_path, bboxes)
    pairs = []
    classes = {"red": 0, "yellow": 1, "green": 2, "off": 3}

    for csv_file in csvs:
        with open(csv_file) as f:
            reader = csv.DictReader(f, delimiter=";")
            for row in reader:
                fname = row.get("Filename", "").strip()
                tag = row.get("Annotation tag", "").strip().lower()
                if not fname or tag not in classes:
                    continue
                x1 = int(row.get("Upper left corner X", 0))
                y1 = int(row.get("Upper left corner Y", 0))
                x2 = int(row.get("Lower right corner X", 0))
                y2 = int(row.get("Lower right corner Y", 0))

                # Find image
                img = root / fname
                if not img.exists():
                    continue

                # Store image with its annotations
                key = str(img.resolve())
                if key not in [p[0] for p in pairs]:
                    pairs.append((key, img, []))
                # Add bbox to this image's list
                pairs[-1][2].append((classes[tag], x1, y1, x2, y2))

    print(f"Collected {len(pairs)} images with annotations")

    # Split train/val
    random.seed(0)
    random.shuffle(pairs)
    nval = int(len(pairs) * 0.15)

    for split, subset in [("val", pairs[:nval]), ("train", pairs[nval:])]:
        (out / split / "images").mkdir(parents=True, exist_ok=True)
        (out / split / "labels").mkdir(parents=True, exist_ok=True)

        for i, (_, img_path, bboxes) in enumerate(subset):
            stem = f"{split}_{i:06d}"
            dst = out / split / "images" / (stem + img_path.suffix)
            shutil.copy(img_path, dst)

            # Get image size
            from PIL import Image
            try:
                im = Image.open(img_path)
                W, H = im.size
            except:
                continue

            # Write YOLO labels
            labels = []
            for cls_idx, x1, y1, x2, y2 in bboxes:
                if W <= 0 or H <= 0:
                    continue
                cx = ((x1 + x2) / 2) / W
                cy = ((y1 + y2) / 2) / H
                w = (x2 - x1) / W
                h = (y2 - y1) / H
                if 0 < w < 1 and 0 < h < 1:
                    labels.append(f"{cls_idx} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")

            (out / split / "labels" / (stem + ".txt")).write_text("\n".join(labels))

        print(f"{split}: {len(subset)} images")

    # Write config
    cfg = {
        "train": str((out / "train" / "images").resolve()).replace("\\", "/"),
        "val": str((out / "val" / "images").resolve()).replace("\\", "/"),
        "names": ["red", "yellow", "green", "off"],
    }
    config = Path(r"C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti\configs\lisa_data.yaml")
    config.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
    print(f"Config: {config}")

if __name__ == "__main__":
    main()
