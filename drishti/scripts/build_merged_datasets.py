"""Merge the pooled Roboflow datasets into clean per-model YOLO datasets, with
careful class remapping (keyword-based so exact names don't matter) and explicit
handling of semantics (negatives dropped, synonyms unified).

Outputs to C:\\drishti_data\\<model>_merged and writes configs/<model>_data.yaml.
Run AFTER download_pool.py. Re-runs safely (rebuilds from scratch).

Models:
  plate    -> single class number_plate (all plate sets + existing car-plate)
  phone    -> single class cell_phone   (all phone sets + existing phone dl)
  seatbelt -> single class seat_belt    (POSITIVE seatbelt only; negatives skipped)
  helmet   -> [number_plate,no_helmet,helmet,rider]  (unified; bad_helmet->helmet,
              motorcyclist->rider). Existing 5-class indian sets are the base.
"""
import os, random, shutil
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "datasets" / "raw"
CONFIGS = ROOT / "configs"
DATA = Path(os.environ.get("DRISHTI_DATA", r"C:\drishti_data"))
POOL = DATA / "pool"
random.seed(0)


def read_names(ds):
    y = ds / "data.yaml"
    if not y.exists():
        return None
    d = yaml.safe_load(y.read_text(encoding="utf-8", errors="ignore"))
    names = d.get("names")
    if isinstance(names, dict):
        names = [names[k] for k in sorted(names)]
    return names or []


def iter_split_dirs(ds):
    """Yield (images_dir, labels_dir) for every split present in a YOLO dataset."""
    for split in ("train", "valid", "val", "test"):
        img = ds / split / "images"
        lbl = ds / split / "labels"
        if img.is_dir() and lbl.is_dir():
            yield img, lbl


def remap_label_file(src_lbl, names, mapper):
    """Return remapped label lines using mapper(class_name, old_idx)->new_idx|None."""
    out = []
    for line in src_lbl.read_text().splitlines():
        p = line.split()
        if len(p) < 5:
            continue
        old = int(float(p[0]))
        name = names[old] if 0 <= old < len(names) else str(old)
        new = mapper(name.lower().strip(), old)
        if new is not None:
            out.append(f"{new} {' '.join(p[1:])}")
    return out


def build(model, sources, mapper, class_names, val_frac=0.12):
    """sources: list of dataset roots (each a YOLO export). mapper: name->idx|None."""
    out = DATA / f"{model}_merged"
    if out.exists():
        shutil.rmtree(out)
    for s in ("train", "val"):
        (out / s / "images").mkdir(parents=True, exist_ok=True)
        (out / s / "labels").mkdir(parents=True, exist_ok=True)
    # collect every (img,lbl) pair across all sources, remapped
    pairs = []
    for ds in sources:
        if not ds.exists():
            print(f"  [skip missing] {ds}")
            continue
        names = read_names(ds)
        if names is None:
            # plain images/labels layout (e.g. our car-plate-as-yolo) -> assume idx==name
            names = [str(i) for i in range(100)]
        kept = 0
        for img_dir, lbl_dir in iter_split_dirs(ds):
            for img in img_dir.glob("*"):
                if img.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                    continue
                lbl = lbl_dir / (img.stem + ".txt")
                lines = remap_label_file(lbl, names, mapper) if lbl.exists() else []
                pairs.append((img, lines))
                kept += 1
        print(f"  {ds.name}: classes={names[:8]}{'...' if len(names)>8 else ''} kept={kept}")
    random.shuffle(pairs)
    nval = int(len(pairs) * val_frac)
    for split, subset in [("val", pairs[:nval]), ("train", pairs[nval:])]:
        for i, (img, lines) in enumerate(subset):
            stem = f"{split}_{i:06d}"
            shutil.copy(img, out / split / "images" / (stem + img.suffix.lower()))
            (out / split / "labels" / (stem + ".txt")).write_text("\n".join(lines))
    cfg = CONFIGS / f"{model}_merged_data.yaml"
    cfg.write_text(yaml.safe_dump({
        "train": str((out / "train" / "images").resolve()).replace("\\", "/"),
        "val": str((out / "val" / "images").resolve()).replace("\\", "/"),
        "names": class_names,
    }, sort_keys=False), encoding="utf-8")
    print(f"[{model}] total={len(pairs)} train={len(pairs)-nval} val={nval} -> {cfg}\n")


# ---------------- mappers: mapper(name_lowercased, old_idx) -> new_idx | None ----------------
def plate_mapper(n, idx):
    return 0  # verified: every plate source is plate-only


def phone_mapper(n, idx):
    # phone_hope is actually a COCO export -> keep ONLY phone boxes
    return 0 if ("phone" in n or "cell" in n or "mobile" in n) else None


def seatbelt_mapper(n, idx):
    # keep only POSITIVE "seatbelt worn" boxes; drop negatives ("un seat-belt") / unrelated
    neg = any(w in n for w in ("no ", "no-", "without", "un ", "un-", "unbel", "absent"))
    pos = ("belt" in n) or ("seatbelt" in n)
    return 0 if (pos and not neg) else None


def helmet_mapper(n, idx):
    # unified -> 0 number_plate, 1 no_helmet, 2 helmet, 3 rider
    # numeric-named base sets (indian-helmet, helmet.zip): 0=plate 1=no_helmet 2=helmet 3=bad 4=rider
    if n.isdigit():
        return {0: 0, 1: 1, 2: 2, 3: 2, 4: 3}.get(int(n))  # bad_helmet -> helmet
    if "plate" in n or "licen" in n or "number" in n:
        return 0
    if ("no" in n and "helmet" in n) or "without" in n or "nohelmet" in n:
        return 1
    if "helmet" in n:                  # with-helmet -> helmet
        return 2
    if "rider" in n or "motorc" in n or "biker" in n:
        return 3
    return None


if __name__ == "__main__":
    g = lambda *ks: [POOL / k for k in ks]

    print("=== PLATE ===")
    build("plate", g("plate_indianlicenceplate", "plate_yolox_indian",
                      "plate_indian_pm6w4", "plate_indian_khhkb", "plate_generic_ml")
                   + [DATA / "plate_yolo"],
          plate_mapper, ["number_plate"])

    print("=== PHONE ===")
    build("phone", g("phone_hope", "phone_yvd") + [DATA / "phone"],
          phone_mapper, ["cell_phone"])

    print("=== SEATBELT ===")
    build("seatbelt", g("seatbelt_akaike", "seatbelt_utm", "seatbelt_dms")
                      + [DATA / "seatbelt"],
          seatbelt_mapper, ["seat_belt"])

    print("=== HELMET ===")
    # helmet_mapua EXCLUDED: it boxes whole riders (rider_full_face, rider_no_helmet)
    # — incompatible with our head-region helmet boxes; would corrupt the model.
    build("helmet", g("helmet_khadatkar", "helmet_odu_yolov8")
                    + [RAW / "indian-helmet", DATA / "_helmet_zip"],
          helmet_mapper, ["number_plate", "no_helmet", "helmet", "rider"])

    print("build_merged_datasets done")
