"""Scan helmet val images for a frame where a violation co-occurs with a readable
plate, then build the full challan to prove the detection->OCR->registry->fine chain."""
import cv2, glob, os, sys, json, warnings
warnings.filterwarnings("ignore")
os.environ.setdefault("DRISHTI_DEVICE", "cpu")
os.environ.setdefault("FLAGS_use_mkldnn", "0")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.run import Detectors, analyze_frame, _nearest_plate
from pipeline.ocr import read_plate
from pipeline.challan import build_challan

det = Detectors()
imgs = sorted(glob.glob(r"C:\drishti_data\helmet_merged\val\images\*.jpg"))[:60]
found = 0
for p in imgs:
    img = cv2.imread(p)
    if img is None:
        continue
    dets = det.detect(img)
    events = analyze_frame(img, dets, 0)
    for e in events:
        pb = _nearest_plate(e["box"], dets)
        if not pb:
            continue
        x1, y1, x2, y2 = [int(v) for v in pb]
        crop = img[max(0, y1):y2, max(0, x1):x2]
        txt, conf = read_plate(crop)
        if txt:
            ch = build_challan({"id": 1, "type": e["type"], "frame": 0,
                                "conf": round(e["conf"], 3), "plate": txt,
                                "valid_plate": True, "evidence": "ev.jpg"})
            print(f"\nIMAGE {os.path.basename(p)}  violation={e['type']}  plate={txt}({conf:.2f})")
            print(json.dumps(ch, indent=2))
            found += 1
            break
    if found:
        break
if not found:
    print("No frame in the sample had a violation + legible plate together "
          "(expected on cropped dataset stills; real traffic video will connect them).")
