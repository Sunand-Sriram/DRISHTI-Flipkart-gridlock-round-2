"""Locate or build the YOLO data config for the downloaded helmet dataset.

The Indian Helmet dataset ships in YOLOv8 format and usually contains its own
data.yaml. We find it, rewrite its paths to absolute, and emit configs/helmet_data.yaml.
If no yaml is present we fall back to an images/ + labels/ layout.
"""
import sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "datasets" / "raw"
CONFIGS = ROOT / "configs"
CONFIGS.mkdir(exist_ok=True)
OUT_YAML = CONFIGS / "helmet_data.yaml"

# Semantic names for the Indian Helmet dataset (Roboflow export anonymizes to 0-4).
# Index order verified visually: 0=plate, 1=no_helmet, 2=helmet, 3=bad_helmet, 4=rider.
HELMET_CLASSES = ["number_plate", "no_helmet", "helmet", "bad_helmet", "rider"]


def find_existing_yaml():
    cands = []
    for y in RAW.rglob("*.yaml"):
        try:
            d = yaml.safe_load(y.read_text(encoding="utf-8", errors="ignore"))
        except Exception:
            continue
        if isinstance(d, dict) and ("names" in d or "train" in d):
            cands.append((y, d))
    return cands


def resolve(base, p):
    pp = Path(p)
    return str(pp if pp.is_absolute() else (base / pp).resolve())


def split_path(base, rel, candidates):
    # Prefer an actual <base>/<split>/images dir -- Roboflow '../' paths are unreliable.
    for s in candidates:
        cand = base / s / "images"
        if cand.is_dir():
            return str(cand)
    return resolve(base, rel) if rel else str(base)


def looks_generic(names):
    if not names:
        return True
    vals = list(names.values()) if isinstance(names, dict) else list(names)
    return all(str(v).strip().isdigit() for v in vals)


def main():
    cands = find_existing_yaml()
    if cands:
        y, d = cands[0]
        base = y.parent
        cfg = {
            "train": split_path(base, d.get("train"), ["train"]),
            "val": split_path(base, d.get("val") or d.get("valid"), ["valid", "val"]),
            "names": HELMET_CLASSES if looks_generic(d.get("names")) else d.get("names"),
        }
        OUT_YAML.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
        print("Wrote", OUT_YAML, "(derived from", str(y) + ")")
        print("Classes:", cfg["names"])
        return

    img_dirs = [p for p in RAW.rglob("images") if p.is_dir()]
    if not img_dirs:
        print("Could not find a data.yaml or an images/ folder under", RAW)
        sys.exit(2)
    base = img_dirs[0].parent
    cfg = {"path": str(base), "train": "images", "val": "images", "names": HELMET_CLASSES}
    OUT_YAML.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
    print("Wrote fallback", OUT_YAML, "- verify class names and train/val split.")


if __name__ == "__main__":
    main()
