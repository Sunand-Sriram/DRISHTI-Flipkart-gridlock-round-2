"""Remap UVH-26's 14 fine-grained classes -> 5 coarse classes useful for
violation detection. Big mAP win (fine trim-level distinctions were the only
thing dragging the score down). Reuses existing uvh26_yolo images.

Coarse classes: car, two_wheeler, auto, bus, truck   (Others dropped)
"""
import shutil
from pathlib import Path
import yaml

SRC = Path(r"C:\drishti_data\uvh26_yolo")
DST = Path(r"C:\drishti_data\uvh26_coarse_yolo")

# old 14-class index -> new 5-class index (13=Others dropped)
# 0 Hatchback 1 Sedan 2 SUV 3 MUV 4 Bus 5 Truck 6 Three-wheeler
# 7 Two-wheeler 8 LCV 9 Mini-bus 10 Tempo-traveller 11 Bicycle 12 Van 13 Others
REMAP = {0:0, 1:0, 2:0, 3:0, 12:0,   # car
         7:1, 11:1,                   # two_wheeler
         6:2,                         # auto (three-wheeler)
         4:3, 9:3,                    # bus
         5:4, 8:4, 10:4}              # truck
NAMES = ["car", "two_wheeler", "auto", "bus", "truck"]

if DST.exists():
    shutil.rmtree(DST)

for split in ("train", "val"):
    (DST/split/"images").mkdir(parents=True, exist_ok=True)
    (DST/split/"labels").mkdir(parents=True, exist_ok=True)
    n = 0
    for img in (SRC/split/"images").glob("*"):
        lbl = SRC/split/"labels"/(img.stem + ".txt")
        out_lines = []
        if lbl.exists():
            for line in lbl.read_text().splitlines():
                p = line.split()
                if not p:
                    continue
                old = int(p[0])
                if old in REMAP:
                    out_lines.append(f"{REMAP[old]} {' '.join(p[1:])}")
        shutil.copy(img, DST/split/"images"/img.name)
        (DST/split/"labels"/(img.stem + ".txt")).write_text("\n".join(out_lines))
        n += 1
    print(f"{split}: {n} images")

cfg = {
    "train": str((DST/"train"/"images").resolve()).replace("\\", "/"),
    "val":   str((DST/"val"/"images").resolve()).replace("\\", "/"),
    "names": NAMES,
}
out = Path(r"C:\Users\sunan\OneDrive\Documents\CODING\HACKATHON\FLIPKART\drishti\configs\uvh26_coarse_data.yaml")
out.write_text(yaml.safe_dump(cfg, sort_keys=False), encoding="utf-8")
print("config:", out, "\nDONE")
