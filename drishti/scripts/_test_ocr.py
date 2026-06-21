import cv2, glob, os, sys, warnings
warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pipeline.ocr import read_plate

imgs = sorted(glob.glob(r"C:\drishti_data\plate_merged\val\images\*.jpg"))[:6]
for p in imgs:
    img = cv2.imread(p)
    t, c = read_plate(img)
    print(f"{os.path.basename(p)}: text='{t}' conf={c:.2f}")
