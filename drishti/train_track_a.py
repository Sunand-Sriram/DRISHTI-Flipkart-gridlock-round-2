"""Track A — train the remaining 4 DRISHTI models on the local GPU, overnight.
Launch ONLY via Start-Process (detached); the Bash tool SIGTERMs long jobs.

Order = demo-criticality:
  1. plate      -> feeds OCR -> challan spine (small, fast)
  2. helmet_v2  -> improves the weak 0.675 helmet model (merged 1600+284 imgs)
  3. seatbelt   -> best-effort seatbelt violation (1818 imgs, single class)
  4. phone      -> phone-use violation (1327 imgs, single class)

Same RTX-4070 config that worked for the first batch: yolo11m, imgsz 640,
batch 12, workers 8, cache=False. On finish, writes models/TRACK_A_COMPLETE.flag
so the monitor can auto-kick Track B.
"""
import shutil, signal, sys
from pathlib import Path

ROOT    = Path(__file__).resolve().parent
CONFIGS = ROOT / "configs"
MODELS  = ROOT / "models"
RUNS    = ROOT / "runs"
MODELS.mkdir(exist_ok=True)

# (config, base_model, imgsz, batch, epochs, run_name)
# Merged datasets (3-4k imgs each). 120 epochs + patience 30 -> converge then early-stop.
JOBS = [
    (CONFIGS / "plate_merged_data.yaml",    "yolo11m.pt", 640, 12, 120, "plate_merged_yolo11m"),
    (CONFIGS / "helmet_merged_data.yaml",   "yolo11m.pt", 640, 12, 120, "helmet_merged_yolo11m"),
    (CONFIGS / "seatbelt_merged_data.yaml", "yolo11m.pt", 640, 12, 120, "seatbelt_merged_yolo11m"),
    (CONFIGS / "phone_merged_data.yaml",    "yolo11m.pt", 640, 12, 120, "phone_merged_yolo11m"),
]


def run_job(cfg, base_model, imgsz, batch, epochs, name):
    out = MODELS / f"{name}_best.pt"
    if out.exists():
        print(f"[skip] {name} — weights exist", flush=True)
        return
    if not Path(cfg).exists():
        print(f"[wait] {name} — config missing {Path(cfg).name}", flush=True)
        return

    import torch
    from ultralytics import YOLO
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"\n{'='*60}\n[train] {name}\n  {base_model} imgsz={imgsz} batch={batch} "
          f"epochs={epochs} device={device}\n{'='*60}", flush=True)

    model = YOLO(base_model)
    model.train(
        data=str(cfg), epochs=epochs, imgsz=imgsz, batch=batch, device=device,
        project=str(RUNS), name=name, exist_ok=True, patience=30,
        save_period=25, plots=True, workers=8, cache=False,
    )
    best = RUNS / name / "weights" / "best.pt"
    if best.exists():
        shutil.copy(best, out)
        print(f"[saved] {out}", flush=True)
    else:
        print(f"[warn] best.pt not found for {name}", flush=True)


def main():
    signal.signal(signal.SIGTERM, lambda s, f: (print("[SIGTERM] exit", flush=True), sys.exit(0)))
    print("=== DRISHTI Track A (plate, helmet_v2, seatbelt, phone) ===", flush=True)
    for job in JOBS:
        try:
            run_job(*job)
        except Exception as e:
            print(f"[FAILED] {job[5]}: {e!r}", flush=True)
            continue
    (MODELS / "TRACK_A_COMPLETE.flag").write_text("done", encoding="utf-8")
    print("\n==== TRACK A COMPLETE ====", flush=True)


if __name__ == "__main__":
    main()
