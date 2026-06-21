"""Local training for the small, ready datasets — tuned to finish by tomorrow
without crashing. Launch ONLY via Start-Process (detached), never the Bash tool.

Settings rationale (RTX 4070 Laptop 8GB):
  - yolo11m: best accuracy/speed balance (yolo11l was GPU-starved at 12s/it)
  - imgsz 640, batch 12 -> ~6.5 GB VRAM (safe headroom)
  - workers 8 -> keeps GPU fed (the 2-worker config caused 15% GPU util)
  - cache=False -> avoids the disk-cache OOM that killed BDD100K
  - epochs 60, patience 15 -> moderate; early-stops ~30-45 typically
Order = priority: the most important models train first.
"""
import shutil, signal, sys
from pathlib import Path

ROOT    = Path(__file__).resolve().parent
CONFIGS = ROOT / "configs"
MODELS  = ROOT / "models"
RUNS    = ROOT / "runs"
MODELS.mkdir(exist_ok=True)

# (config, base_model, imgsz, batch, epochs, run_name)
JOBS = [
    (CONFIGS / "uvh26_data.yaml",     "yolo11m.pt", 640, 12, 60, "vehicle_uvh26_yolo11m"),
    (CONFIGS / "s2tld_data.yaml",     "yolo11m.pt", 640, 12, 60, "trafficlight_s2tld_yolo11m"),
    (CONFIGS / "poribohon_data.yaml", "yolo11m.pt", 640, 12, 60, "vehicle_poribohon_yolo11m"),
    (CONFIGS / "uvh26_coarse_data.yaml", "yolo11m.pt", 640, 12, 80, "vehicle_uvh26_coarse_yolo11m"),
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
        project=str(RUNS), name=name, exist_ok=True, patience=15,
        save_period=10, plots=True, workers=8, cache=False,
    )
    best = RUNS / name / "weights" / "best.pt"
    if best.exists():
        shutil.copy(best, out)
        print(f"[saved] {out}", flush=True)
    else:
        print(f"[warn] best.pt not found for {name}", flush=True)


def main():
    signal.signal(signal.SIGTERM, lambda s, f: (print("[SIGTERM] exit", flush=True), sys.exit(0)))
    print("=== DRISHTI Local Training (3 small models) ===", flush=True)
    for job in JOBS:
        try:
            run_job(*job)
        except Exception as e:
            print(f"[FAILED] {job[5]}: {e!r}", flush=True)
            continue
    print("\n==== LOCAL TRAINING COMPLETE ====", flush=True)


if __name__ == "__main__":
    main()
