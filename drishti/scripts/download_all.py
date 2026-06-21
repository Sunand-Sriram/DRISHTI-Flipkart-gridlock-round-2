"""Master downloader -- pulls every autonomously-available dataset for DRISHTI.

All large data goes to C:\\drishti_data (outside OneDrive). Robust: skips what is
already present, logs and continues on any failure. UVH-26 is downloaded separately
by download_uvh26.py.

Maps datasets -> models:
  RideSafe-400  -> triple riding + helmet (video)
  LISA + S2TLD  -> traffic-light state (red-light)
  Poribohon-BD  -> vehicle types (supplements UVH-26)
  helmet-classic-> augments the helmet model
  IDD           -> general Indian road detection
  BDD100K       -> night / weather robustness
  CCPD          -> plate OCR pretraining
"""
import os
import sys
import subprocess
import zipfile
import urllib.request
from pathlib import Path

DATA = Path(os.environ.get("DRISHTI_DATA", r"C:\drishti_data"))
DATA.mkdir(parents=True, exist_ok=True)


def log(*a):
    print("[download_all]", *a, flush=True)


def _nonempty(p):
    return p.exists() and any(p.iterdir())


def kaggle_get(slug, sub):
    out = DATA / sub
    if _nonempty(out):
        log("skip (exists):", sub)
        return
    out.mkdir(parents=True, exist_ok=True)
    import kaggle
    kaggle.api.authenticate()
    log("kaggle:", slug, "->", out)
    kaggle.api.dataset_download_files(slug, path=str(out), unzip=True)


def hf_get(repo, sub):
    out = DATA / sub
    if _nonempty(out):
        log("skip (exists):", sub)
        return
    from huggingface_hub import snapshot_download
    log("hf:", repo, "->", out)
    snapshot_download(repo_id=repo, repo_type="dataset", local_dir=str(out), max_workers=8)


def git_get(url, sub):
    out = DATA / sub
    if out.exists():
        log("skip (exists):", sub)
        return
    log("git:", url, "->", out)
    subprocess.run(["git", "clone", "--depth", "1", url, str(out)], check=True)


def http_zip(url, sub):
    out = DATA / sub
    out.mkdir(parents=True, exist_ok=True)
    z = out / Path(url).name
    if not z.exists():
        log("http:", url)
        urllib.request.urlretrieve(url, z)
    log("unzip:", z.name)
    with zipfile.ZipFile(z) as zf:
        zf.extractall(out)


# (kind, source, subfolder) -- ordered small/high-confidence first, big sets last.
TASKS = [
    ("kaggle", "andrewmvd/helmet-detection",                "helmet-classic"),
    ("kaggle", "hridoyyahmed/poribohon-bd",                 "poribohon"),
    ("git",    "https://github.com/Thinklab-SJTU/S2TLD",    "s2tld"),
    ("kaggle", "mbornoe/lisa-traffic-light-dataset",        "lisa"),
    ("hf",     "aiexplorer32/RideSafe-400",                 "ridesafe400"),
    ("kaggle", "mitanshuchakrawarty/new-idd-dataset",       "idd"),
    ("hf",     "dgural/bdd100k",                            "bdd100k"),
    ("git",    "https://github.com/detectRecog/CCPD",       "ccpd"),
]

DISPATCH = {"kaggle": kaggle_get, "hf": hf_get, "git": git_get, "http": http_zip}

if __name__ == "__main__":
    results = {}
    for kind, src, sub in TASKS:
        try:
            DISPATCH[kind](src, sub)
            results[sub] = "ok"
        except Exception as e:
            log("FAILED:", sub, "->", repr(e))
            results[sub] = "FAILED: " + str(e)[:120]
    log("==== SUMMARY ====")
    for k, v in results.items():
        log(f"  {k}: {v}")
    log("ALL DONE")
