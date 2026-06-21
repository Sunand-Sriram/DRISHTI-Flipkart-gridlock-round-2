"""Fine-tune YOLOv11 on the prepared dataset (helmet / rider / plate)."""
import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(ROOT / "configs" / "helmet_data.yaml"))
    ap.add_argument("--model", default="yolo11s.pt")
    ap.add_argument("--epochs", type=int, default=100)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--name", default="helmet_yolo11s")
    ap.add_argument("--device", default=None, help="0 for GPU, cpu for CPU, default auto")
    args = ap.parse_args()

    import torch
    from ultralytics import YOLO

    cuda = torch.cuda.is_available()
    device = args.device if args.device is not None else ("0" if cuda else "cpu")
    print(f"torch {torch.__version__} | cuda available: {cuda} | training on device={device}")
    if not cuda:
        print("WARNING: training on CPU will be very slow. Install the CUDA build of torch.")

    model = YOLO(args.model)
    model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        project=str(ROOT / "runs"),
        name=args.name,
        patience=25,
        plots=True,
    )

    best = ROOT / "runs" / args.name / "weights" / "best.pt"
    if best.exists():
        dest = ROOT / "models" / f"{args.name}_best.pt"
        shutil.copy(best, dest)
        print("Saved best weights to", dest)


if __name__ == "__main__":
    main()
