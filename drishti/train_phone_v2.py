"""Phone detector v2 — retrain the merged phone-OBJECT dataset at HIGH RESOLUTION
(imgsz=960) to lift small-object mAP. Launch detached via Start-Process.

Rationale: phone_merged_yolo11m capped at 0.525 @ imgsz640 — phones are tiny, so
resolution is the dominant lever. 960 (+ longer patience) targets ~0.60. Driver-
distraction datasets were rejected (whole-driver boxes, wrong semantics).
batch=6 fits an 8GB 4070 at 960; ultralytics auto-OOM-recovery drops it if needed.
"""
import shutil, signal, sys
from pathlib import Path

ROOT    = Path(__file__).resolve().parent
CONFIGS = ROOT / "configs"
MODELS  = ROOT / "models"
RUNS    = ROOT / "runs"
MODELS.mkdir(exist_ok=True)

CFG  = CONFIGS / "phone_merged_data.yaml"
NAME = "phone_v2_yolo11m"


def main():
    signal.signal(signal.SIGTERM, lambda s, f: (print("[SIGTERM] exit", flush=True), sys.exit(0)))
    out = MODELS / f"{NAME}_best.pt"
    if out.exists():
        print(f"[skip] {NAME} exists", flush=True); return
    import torch
    from ultralytics import YOLO
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"=== Phone v2 @ imgsz960 (device={device}) ===", flush=True)
    model = YOLO("yolo11m.pt")
    # Root cause of the NaN-collapse was AdamW (auto-picked at tiny batch), NOT amp.
    # Stable+fast config: SGD + amp ON, imgsz768/batch10 fits 8GB without the
    # shared-memory spill that made amp=False crawl at 18 s/it.
    model.train(
        data=str(CFG), epochs=150, imgsz=768, batch=10, device=device,
        project=str(RUNS), name=NAME, exist_ok=True, patience=40,
        save_period=30, plots=True, workers=8, cache=False,
        optimizer="SGD", lr0=0.01,
    )
    best = RUNS / NAME / "weights" / "best.pt"
    if best.exists():
        shutil.copy(best, out)
        print(f"[saved] {out}", flush=True)
    (MODELS / "PHONE_V2_COMPLETE.flag").write_text("done", encoding="utf-8")
    print("==== PHONE V2 COMPLETE ====", flush=True)


if __name__ == "__main__":
    main()
