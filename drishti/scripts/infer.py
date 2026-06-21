"""Run the trained model on an image / video / folder and flag helmet violations."""
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", default=str(ROOT / "models" / "helmet_yolo11s_best.pt"))
    ap.add_argument("--source", required=True, help="image / video / folder path")
    ap.add_argument("--conf", type=float, default=0.35)
    args = ap.parse_args()

    from ultralytics import YOLO
    model = YOLO(args.weights)
    results = model.predict(
        source=args.source, conf=args.conf, save=True,
        project=str(ROOT / "runs"), name="infer", exist_ok=True,
    )

    names = model.names
    violations = 0
    for r in results:
        if r.boxes is None:
            continue
        for c in r.boxes.cls.tolist():
            label = "".join(ch for ch in str(names[int(c)]).lower() if ch.isalnum())
            if "nohelmet" in label or "badhelmet" in label:
                violations += 1
    print(f"Helmet violations detected: {violations}")
    print("Annotated output saved under", ROOT / "runs" / "infer")


if __name__ == "__main__":
    main()
