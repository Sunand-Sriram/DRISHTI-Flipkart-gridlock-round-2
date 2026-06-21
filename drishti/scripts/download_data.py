"""Download datasets for DRISHTI training.

Primary dataset: Indian Helmet Detection (aryanvaid13/indian-helmet-detection-dataset)
    -> classes include: no-helmet, good-helmet, bad-helmet, number plate, rider.
    This single Indian dataset gives us the flagship violation (helmet) + rider + plate.
Optional: Car Plate Detection (andrewmvd/car-plate-detection).

Two modes (auto-detected):
  1. Kaggle API  -- if ~/.kaggle/kaggle.json exists (or KAGGLE_USERNAME/KAGGLE_KEY env),
                    datasets download automatically.
  2. Manual      -- if you place the dataset .zip files in datasets/raw/, this unzips them.
"""
import os
import sys
import glob
import zipfile
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "datasets" / "raw"
RAW.mkdir(parents=True, exist_ok=True)

DATASETS = {
    "indian-helmet": "aryanvaid13/indian-helmet-detection-dataset",
    "car-plate": "andrewmvd/car-plate-detection",
}


def kaggle_creds():
    home = Path.home() / ".kaggle" / "kaggle.json"
    return home.exists() or ("KAGGLE_USERNAME" in os.environ and "KAGGLE_KEY" in os.environ)


def ensure_kaggle():
    try:
        import kaggle  # noqa: F401
    except Exception:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "kaggle"], check=True)


def download_api():
    ensure_kaggle()
    import kaggle
    kaggle.api.authenticate()
    for name, slug in DATASETS.items():
        out = RAW / name
        out.mkdir(parents=True, exist_ok=True)
        print(f"[kaggle] {slug} -> {out}")
        kaggle.api.dataset_download_files(slug, path=str(out), unzip=True)


def unzip_local():
    zips = glob.glob(str(RAW / "*.zip"))
    if not zips:
        print("No Kaggle credentials and no .zip files found in", RAW)
        print("Fix: add ~/.kaggle/kaggle.json, or drop the dataset zips into that folder.")
        return False
    for z in zips:
        out = RAW / Path(z).stem
        out.mkdir(exist_ok=True)
        print(f"[unzip] {z} -> {out}")
        with zipfile.ZipFile(z) as zf:
            zf.extractall(out)
    return True


if __name__ == "__main__":
    if kaggle_creds():
        print("Kaggle credentials found -- downloading via API.")
        download_api()
    else:
        print("No Kaggle credentials -- looking for manually downloaded zips.")
        if not unzip_local():
            sys.exit(2)
    print("Done. Raw data is in", RAW)
