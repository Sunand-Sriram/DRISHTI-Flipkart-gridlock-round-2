"""Convert IDD 117k Detection dataset (5 parts) to unified YOLO format.
Put all downloaded zip files in drishti/datasets/raw/ named idd117k_*.zip
then run this script. It auto-extracts, finds annotations, and converts.

IDD 117k Detection: 96,897 train + 20,202 val images, bounding box annotations.
"""
import json, zipfile, shutil, random
from pathlib import Path
import yaml

RAW   = Path(r"C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti\datasets\raw")
EXTR  = Path(r"C:\drishti_data\idd117k_extracted")
OUT   = Path(r"C:\drishti_data\idd117k_yolo")
CFG   = Path(r"C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti\configs\idd117k_data.yaml")

CLASSES = ["car", "truck", "bus", "motorcycle", "bicycle",
           "person", "autorickshaw", "animal", "traffic light",
           "traffic sign", "vehicle fallback"]


def extract_all_zips():
    zips = sorted(RAW.glob("idd117k*.zip")) + sorted(RAW.glob("IDD*117k*.zip")) + sorted(RAW.glob("IDD*Detection*.zip"))
    if not zips:
        print("No IDD 117k zips found in", RAW)
        print("Expected names like: idd117k_1.zip or IDD 117k - Detection (1-5).zip")
        return False
    EXTR.mkdir(parents=True, exist_ok=True)
    for z in zips:
        print(f"Extracting {z.name}...")
        with zipfile.ZipFile(z) as zf:
            zf.extractall(EXTR)
    return True


def find_annotation_json():
    """Find COCO-format annotation JSON files in extracted dirs."""
    jsons = list(EXTR.rglob("*.json"))
    # Prefer train/val annotation JSONs
    ann_files = [j for j in jsons if any(x in j.name.lower() for x in ["train", "val", "annotation"])]
    if not ann_files:
        ann_files = jsons
    print(f"Found {len(ann_files)} annotation files")
    return ann_files


def convert_coco(ann_file, imgs_base, out_dir, split, cls_map):
    img_out = out_dir / split / "images"
    lbl_out = out_dir / split / "labels"
    img_out.mkdir(parents=True, exist_ok=True)
    lbl_out.mkdir(parents=True, exist_ok=True)

    with open(ann_file) as f:
        coco = json.load(f)

    # Build id -> class index map
    id2idx = {}
    for cat in coco.get("categories", []):
        name = cat["name"].lower()
        for ci, cn in enumerate(CLASSES):
            if cn in name or name in cn:
                id2idx[cat["id"]] = ci
                break
        else:
            id2idx[cat["id"]] = len(CLASSES) - 1  # fallback

    # image_id -> annotations
    img_anns = {}
    for ann in coco.get("annotations", []):
        img_anns.setdefault(ann["image_id"], []).append(ann)

    written = 0
    for i, img_info in enumerate(coco.get("images", [])):
        if i % 5000 == 0:
            print(f"  {split}: {i}/{len(coco['images'])}", flush=True)

        fname = img_info["file_name"]
        # search for image
        img_path = None
        for candidate in [imgs_base / fname, EXTR / fname]:
            if candidate.exists():
                img_path = candidate; break
        if img_path is None:
            # search recursively (slow but thorough)
            hits = list(EXTR.rglob(Path(fname).name))
            if hits:
                img_path = hits[0]
        if img_path is None:
            continue

        W, H = img_info.get("width", 0), img_info.get("height", 0)
        if W <= 0 or H <= 0:
            continue

        lines = []
        for ann in img_anns.get(img_info["id"], []):
            x, y, w, h = ann["bbox"]
            cx, cy = (x + w/2)/W, (y + h/2)/H
            nw, nh = w/W, h/H
            if 0 < nw <= 1 and 0 < nh <= 1:
                lines.append(f"{id2idx.get(ann['category_id'], 0)} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")

        stem = f"{split}_{written:06d}"
        shutil.copy(img_path, img_out / (stem + img_path.suffix))
        (lbl_out / (stem + ".txt")).write_text("\n".join(lines))
        written += 1

    print(f"  {split}: wrote {written} images", flush=True)
    return written


def main():
    if not extract_all_zips():
        return

    ann_files = find_annotation_json()
    if not ann_files:
        print("No annotation JSON found after extraction — check zip contents")
        return

    # Detect which are train vs val
    train_anns = [f for f in ann_files if "train" in f.name.lower()]
    val_anns   = [f for f in ann_files if "val"   in f.name.lower()]
    if not train_anns:
        train_anns = ann_files  # fallback: treat all as train, split manually

    if OUT.exists():
        shutil.rmtree(OUT)

    imgs_base = EXTR  # images will be searched recursively
    cls_map = {c: i for i, c in enumerate(CLASSES)}

    for af in train_anns:
        convert_coco(af, imgs_base, OUT, "train", cls_map)
    for af in val_anns:
        convert_coco(af, imgs_base, OUT, "val", cls_map)

    # If no val split, create one from train
    train_imgs = list((OUT / "train" / "images").glob("*"))
    if not (OUT / "val" / "images").exists() or len(list((OUT / "val" / "images").glob("*"))) == 0:
        print("Creating val split from train (15%)...")
        (OUT / "val" / "images").mkdir(parents=True, exist_ok=True)
        (OUT / "val" / "labels").mkdir(parents=True, exist_ok=True)
        random.seed(42); random.shuffle(train_imgs)
        for img in train_imgs[:int(len(train_imgs)*0.15)]:
            lbl = (OUT / "train" / "labels" / (img.stem + ".txt"))
            shutil.move(str(img), OUT / "val" / "images" / img.name)
            if lbl.exists():
                shutil.move(str(lbl), OUT / "val" / "labels" / lbl.name)

    cfg = {
        "train": str((OUT / "train" / "images").resolve()).replace("\\", "/"),
        "val":   str((OUT / "val"   / "images").resolve()).replace("\\", "/"),
        "names": CLASSES,
    }
    CFG.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
    print(f"Config: {CFG}")
    print("DONE")


if __name__ == "__main__":
    main()
