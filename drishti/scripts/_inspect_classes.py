"""Recover class-id -> meaning mapping by montaging sample crops per class."""
import random
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "datasets" / "raw" / "indian-helmet" / "train"
IMG, LAB = DS / "images", DS / "labels"
OUT = ROOT / "runs" / "_classmap"
OUT.mkdir(parents=True, exist_ok=True)

NCLS, PER, CELL = 5, 4, 240
crops = {i: [] for i in range(NCLS)}
labels = list(LAB.glob("*.txt"))
random.seed(0)
random.shuffle(labels)

for lf in labels:
    img = None
    for ext in (".jpg", ".jpeg", ".png"):
        p = IMG / (lf.stem + ext)
        if p.exists():
            img = p
            break
    if img is None:
        continue
    try:
        im = Image.open(img).convert("RGB")
    except Exception:
        continue
    W, H = im.size
    for line in lf.read_text().splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        c = int(float(parts[0]))
        cx, cy, w, h = map(float, parts[1:5])
        if c not in crops or len(crops[c]) >= PER:
            continue
        x1, y1 = int((cx - w / 2) * W), int((cy - h / 2) * H)
        x2, y2 = int((cx + w / 2) * W), int((cy + h / 2) * H)
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(W, x2), min(H, y2)
        if x2 - x1 < 10 or y2 - y1 < 10:
            continue
        crops[c].append(im.crop((x1, y1, x2, y2)).resize((CELL - 8, CELL - 8)))
    if all(len(crops[i]) >= PER for i in range(NCLS)):
        break

montage = Image.new("RGB", (60 + PER * CELL, NCLS * CELL), (30, 30, 30))
d = ImageDraw.Draw(montage)
for i in range(NCLS):
    d.text((22, i * CELL + CELL // 2 - 6), str(i), fill=(255, 255, 0))
    for j, crop in enumerate(crops[i]):
        montage.paste(crop, (60 + j * CELL + 4, i * CELL + 4))
montage.save(OUT / "classmap.png")
print("saved", OUT / "classmap.png", {i: len(crops[i]) for i in range(NCLS)})
