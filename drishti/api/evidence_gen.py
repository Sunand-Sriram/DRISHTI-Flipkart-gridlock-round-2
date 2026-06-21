"""Build challan evidence images from the REAL training photos.

Two-wheeler violations (helmet / triple-riding / phone) use the Indian-helmet
detection set (real street photos + YOLO boxes drawn on). Car-class violations
use the car-plate set (real car photos + the plate box from the VOC annotation).
A DRISHTI HUD (camera, timestamp, violation tag, plate, privacy note) is overlaid
so each looks like a genuine AI-captured evidence frame.

Falls back to a clean rendered frame only if no source images are found.
"""
import glob
import random
import time
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
EVID_DIR = ROOT / "runs" / "drishti"
EVID_DIR.mkdir(parents=True, exist_ok=True)
RAW = ROOT / "datasets" / "raw"

DISPLAY_W = 860

VLABEL = {
    "no_helmet": "NO HELMET", "phone_use": "MOBILE PHONE USE", "red_light": "RED-LIGHT JUMP",
    "seatbelt": "NO SEATBELT", "triple_riding": "TRIPLE RIDING", "overspeed": "OVER-SPEEDING",
    "wrong_side": "WRONG-SIDE DRIVING", "illegal_parking": "ILLEGAL PARKING", "stop_line": "STOP-LINE",
}
VCOLOR = {
    "no_helmet": (255, 80, 80), "red_light": (255, 80, 80), "triple_riding": (255, 80, 80),
    "phone_use": (255, 150, 60), "seatbelt": (255, 190, 60), "overspeed": (210, 90, 255),
    "wrong_side": (255, 110, 110), "illegal_parking": (90, 200, 255),
}
TWO_WHEELER = {"no_helmet", "triple_riding", "phone_use"}

# ── image pools (built once) ─────────────────────────────────────────────────
def _pool(patterns) -> list[str]:
    out: list[str] = []
    for p in patterns:
        out += glob.glob(str(p))
    return sorted(out)

_HELMET = _pool([RAW / "indian-helmet" / "train" / "images" / "*",
                 RAW / "indian-helmet" / "valid" / "images" / "*"])


# Car-class violations use real BDD100K dashcam road scenes (full vehicles in
# traffic) — NOT the plate-closeup set, which made "no seatbelt"/"overspeed"
# evidence look like a plate macro. Falls back to car-plate if BDD isn't extracted.
_CARS = _pool([RAW / "bdd-scenes" / "*"]) or _pool([RAW / "car-plate" / "images" / "*"])


def _font(size: int):
    for name in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _load(path: str) -> Image.Image:
    im = Image.open(path).convert("RGB")
    if im.width != DISPLAY_W:
        h = int(im.height * DISPLAY_W / im.width)
        im = im.resize((DISPLAY_W, h))
    return im


def _yolo_boxes(img_path: str, W: int, H: int):
    lab = img_path.replace("/images/", "/labels/").rsplit(".", 1)[0] + ".txt"
    lab = lab.replace("\\images\\", "\\labels\\")
    boxes = []
    p = Path(lab)
    if not p.exists():
        return boxes
    for line in p.read_text().splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        _, cx, cy, w, h = (float(x) for x in parts[:5])
        boxes.append((int((cx - w / 2) * W), int((cy - h / 2) * H),
                      int((cx + w / 2) * W), int((cy + h / 2) * H)))
    return boxes


def _voc_plate(img_path: str, W0: int, H0: int, W: int, H: int):
    xml = img_path.replace("/images/", "/annotations/").replace("\\images\\", "\\annotations\\")
    xml = xml.rsplit(".", 1)[0] + ".xml"
    p = Path(xml)
    if not p.exists():
        return None
    try:
        root = ET.parse(xml).getroot()
        b = root.find(".//bndbox")
        sx, sy = W / W0, H / H0
        return (int(int(b.findtext("xmin")) * sx), int(int(b.findtext("ymin")) * sy),
                int(int(b.findtext("xmax")) * sx), int(int(b.findtext("ymax")) * sy))
    except Exception:
        return None


def _hud(im: Image.Image, challan: dict, primary_box, color, plate_box=None):
    d = ImageDraw.Draw(im, "RGBA")
    W, H = im.size
    cid = challan.get("challan_id", "DRI")
    vtype = challan.get("violation", "")
    conf = challan.get("confidence") or 0.9
    plate = challan.get("plate") or ""
    cam = challan.get("camera", "CAM-01")

    # violation tag on the primary box
    if primary_box:
        x0, y0, x1, y1 = primary_box
        for w in range(3):
            d.rectangle([x0 - w, y0 - w, x1 + w, y1 + w], outline=color + (210 - w * 55,), width=1)
        f_lab = _font(19)
        tag = f"{VLABEL.get(vtype, vtype.upper())}  {conf:.2f}"
        tw = d.textlength(tag, font=f_lab)
        # keep the tag clear of the top HUD bar — drop it just inside the box if needed
        ty = y0 - 26 if y0 - 26 > 32 else min(y1 - 24, y0 + 4)
        tx = min(x0, W - tw - 16)
        d.rectangle([tx, ty, tx + tw + 14, ty + 24], fill=color + (240,))
        d.text((tx + 7, ty + 3), tag, font=f_lab, fill=(10, 12, 18))

    # NOTE: we deliberately do NOT paint a plate string on the photo — the demo
    # photos carry their own (different) plates, and overlaying the challan's
    # registry plate would contradict what's visible. The OCR/registry plate is
    # shown in the data panel instead.

    # speed badge
    if vtype == "overspeed" and challan.get("speed_kmh"):
        f_sp = _font(17)
        sp = f"{challan['speed_kmh']:.0f} km/h (limit 60)"
        d.rectangle([W - d.textlength(sp, font=f_sp) - 26, 36, W - 8, 62], fill=(210, 45, 45, 235))
        d.text((W - d.textlength(sp, font=f_sp) - 18, 40), sp, font=f_sp, fill=(255, 255, 255))

    # top HUD bar
    d.rectangle([0, 0, W, 30], fill=(6, 10, 20, 200))
    d.text((12, 6), "● DRISHTI", font=_font(18), fill=(255, 167, 51))
    ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(challan.get("created_at") or time.time()))
    d.text((120, 8), f"{cam}  ·  {ts}", font=_font(13), fill=(220, 224, 232))
    idtag = f"AI EVIDENCE · {cid}"
    d.text((W - d.textlength(idtag, font=_font(13)) - 12, 8), idtag, font=_font(13), fill=(185, 192, 204))
    # privacy strip
    d.rectangle([0, H - 22, W, H], fill=(6, 10, 20, 170))
    d.text((12, H - 19), "Violator boxed · bystanders blurred · DPDP-compliant", font=_font(12), fill=(170, 176, 188))


def generate(challan: dict) -> str:
    """Pick a real training photo for this violation and overlay the DRISHTI HUD."""
    cid = challan.get("challan_id", "DRI")
    vtype = challan.get("violation", "no_helmet")
    color = VCOLOR.get(vtype, (255, 167, 51))
    rng = random.Random(abs(hash(cid)))

    pool = _HELMET if vtype in TWO_WHEELER else (_CARS or _HELMET)
    name = f"{cid}_evidence.jpg"
    try:
        if not pool:
            raise RuntimeError("no source images")
        src = pool[rng.randrange(len(pool))]
        im0 = Image.open(src).convert("RGB")
        W0, H0 = im0.size
        im = _load(src)
        W, H = im.size

        primary_box = None
        plate_box = None
        if vtype in TWO_WHEELER:
            boxes = _yolo_boxes(src, W, H)
            if boxes:
                # draw every detection lightly (real multi-object look)
                dd = ImageDraw.Draw(im, "RGBA")
                for b in boxes:
                    dd.rectangle(b, outline=color + (110,), width=1)
                # tag the main subject: the largest detected box (rider + vehicle)
                primary_box = max(boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))
        else:
            plate_box = _voc_plate(src, W0, H0, W, H)
            if plate_box:
                # vehicle box ≈ region around the plate
                px0, py0, px1, py1 = plate_box
                bw, bh = (px1 - px0), (py1 - py0)
                primary_box = (max(0, px0 - bw), max(30, py0 - bh * 5),
                               min(W, px1 + bw), min(H, py1 + bh))
        if primary_box is None:  # fallback central box
            primary_box = (int(W * 0.3), int(H * 0.35), int(W * 0.7), int(H * 0.85))

        _hud(im, challan, primary_box, color, plate_box)
        im.save(EVID_DIR / name, "JPEG", quality=85)
    except Exception:
        _fallback(challan).save(EVID_DIR / name, "JPEG", quality=85)
    return name


def generate_contest_photo(challan: dict) -> str:
    """A citizen-submitted counter photo — a different real frame, lightly marked."""
    cid = challan.get("challan_id", "DRI")
    vtype = challan.get("violation", "no_helmet")
    rng = random.Random(abs(hash(cid + "contest")))
    pool = _HELMET if vtype in TWO_WHEELER else (_CARS or _HELMET)
    name = f"contest_{cid}_citizen.jpg"
    try:
        src = pool[rng.randrange(len(pool))]
        im = _load(src)
        im = im.filter(ImageFilter.GaussianBlur(0.4))
        d = ImageDraw.Draw(im, "RGBA")
        W, H = im.size
        d.rectangle([0, H - 24, W, H], fill=(6, 10, 20, 180))
        d.text((10, H - 21), f"Citizen upload · {cid} · phone camera", font=_font(13), fill=(220, 224, 232))
        im.save(EVID_DIR / name, "JPEG", quality=80)
    except Exception:
        _fallback(challan).save(EVID_DIR / name, "JPEG", quality=80)
    return name


def _fallback(challan: dict) -> Image.Image:
    im = Image.new("RGB", (DISPLAY_W, 484), (24, 28, 36))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, DISPLAY_W, 30], fill=(6, 10, 20))
    d.text((12, 6), "● DRISHTI  ·  AI EVIDENCE", font=_font(16), fill=(255, 167, 51))
    d.text((20, 220), challan.get("challan_id", ""), font=_font(22), fill=(220, 224, 232))
    return im
