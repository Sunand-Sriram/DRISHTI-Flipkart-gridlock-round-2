"""Persistent training queue for DRISHTI. Runs forever — checks for new
jobs every 60 seconds so newly converted datasets get picked up automatically.

Launch ONLY via:
  PowerShell: Start-Process python -ArgumentList 'drishti\train_all.py' ...
  OR: drishti\launch_training.bat
Never run through Claude Bash tool — harness output limit will SIGTERM it.
"""
import shutil, signal, sys, time
from pathlib import Path

ROOT    = Path(__file__).resolve().parent
CONFIGS = ROOT / "configs"
MODELS  = ROOT / "models"
RUNS    = ROOT / "runs"
MODELS.mkdir(exist_ok=True)

# Full job queue — [wait] if config missing, [skip] if weights exist
# Order: big datasets first, then task-specific, then supplementary
# (config_yaml, base_model, imgsz, batch, epochs, run_name)
JOBS = [
    # PRIMARY — large diverse datasets
    (CONFIGS / "bdd100k_data.yaml",  "yolo11l.pt", 640,  8, 300, "detect_bdd100k_yolo11l"),
    (CONFIGS / "uvh26_data.yaml",    "yolo11l.pt", 640,  8, 300, "vehicle_uvh26_yolo11l"),
    (CONFIGS / "idd117k_data.yaml",  "yolo11l.pt", 640,  8, 300, "vehicle_idd117k_yolo11l"),

    # TASK-SPECIFIC
    (CONFIGS / "s2tld_data.yaml",    "yolo11m.pt", 768,  8, 200, "trafficlight_s2tld_yolo11m"),
    (CONFIGS / "helmet_data.yaml",   "yolo11m.pt", 768,  8, 200, "helmet_yolo11m_v3"),
    (CONFIGS / "plate_data.yaml",    "yolo11m.pt", 768,  8, 200, "plate_yolo11m"),

    # SUPPLEMENTARY — unique Indian classes
    (CONFIGS / "poribohon_data.yaml","yolo11m.pt", 640, 12, 200, "vehicle_poribohon_yolo11m"),

    # VIOLATION-SPECIFIC (configs created after download + conversion)
    (CONFIGS / "seatbelt_data.yaml", "yolo11m.pt", 640, 12, 200, "seatbelt_yolo11m"),
    (CONFIGS / "phone_data.yaml",    "yolo11m.pt", 640, 12, 200, "phone_driving_yolo11m"),
]


def run_job(cfg, base_model, imgsz, batch, epochs, name):
    weights_out = MODELS / f"{name}_best.pt"
    if weights_out.exists():
        print(f"[skip] {name}", flush=True)
        return True  # done

    if not Path(cfg).exists():
        print(f"[wait] {name} — {Path(cfg).name} not ready", flush=True)
        return False  # not ready

    import torch
    from ultralytics import YOLO

    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"\n{'='*60}", flush=True)
    print(f"[train] {name}", flush=True)
    print(f"  {base_model}  imgsz={imgsz}  batch={batch}  epochs={epochs}  device={device}", flush=True)
    print(f"{'='*60}", flush=True)

    model = YOLO(base_model)
    model.train(
        data=str(cfg),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        project=str(RUNS),
        name=name,
        exist_ok=True,
        patience=50,
        save_period=10,
        plots=True,
        workers=2,
        cache=False,
    )

    best = RUNS / name / "weights" / "best.pt"
    if best.exists():
        shutil.copy(best, weights_out)
        print(f"[saved] {weights_out}", flush=True)
    else:
        print(f"[warn] best.pt not found for {name}", flush=True)

    return True  # attempted


def main():
    def handle_term(sig, frame):
        print("\n[SIGTERM] exiting cleanly...", flush=True)
        sys.exit(0)
    signal.signal(signal.SIGTERM, handle_term)

    print("=== DRISHTI Persistent Training Queue ===", flush=True)
    print(f"Jobs: {len(JOBS)}", flush=True)

    while True:
        pending = 0
        for job in JOBS:
            cfg, base_model, imgsz, batch, epochs, name = job
            try:
                ready = run_job(cfg, base_model, imgsz, batch, epochs, name)
                if not ready:
                    pending += 1
            except KeyboardInterrupt:
                print("[interrupted]", flush=True)
                return
            except Exception as e:
                print(f"[FAILED] {name}: {e!r}", flush=True)
                continue

        if pending == 0:
            print("\n==== ALL JOBS COMPLETE ====", flush=True)
            break

        print(f"\n[queue] {pending} job(s) waiting for datasets. Checking again in 60s...", flush=True)
        time.sleep(60)


if __name__ == "__main__":
    main()
