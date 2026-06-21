"""One-shot pipeline: download -> prepare -> train.

Run this AFTER the Kaggle token is in place (or the dataset zips are in datasets/raw/):
    python drishti/run_pipeline.py
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PY = sys.executable


def step(name, script):
    print("\n=== " + name + " ===", flush=True)
    r = subprocess.run([PY, str(ROOT / "scripts" / script)])
    if r.returncode != 0:
        print(f"Step '{name}' failed (exit {r.returncode}). Stopping.")
        sys.exit(r.returncode)


if __name__ == "__main__":
    step("Download data", "download_data.py")
    step("Prepare data", "prepare_data.py")
    step("Train model", "train.py")
    print("\nPipeline complete. Trained weights are in", ROOT / "models")
