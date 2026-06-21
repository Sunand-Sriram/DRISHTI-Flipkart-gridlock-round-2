"""Download UVH-26 (Indian vehicle-type CCTV dataset, 26K images, COCO JSON) from HuggingFace.

Stored OUTSIDE OneDrive (default C:\\drishti_data) to avoid sync storms / file locks
during training. Override with the DRISHTI_DATA env var.
"""
import os
from pathlib import Path
from huggingface_hub import snapshot_download

DATA = Path(os.environ.get("DRISHTI_DATA", r"C:\drishti_data")) / "uvh26"
DATA.mkdir(parents=True, exist_ok=True)

if __name__ == "__main__":
    print("Downloading iisc-aim/UVH-26 (public) ->", DATA)
    path = snapshot_download(
        repo_id="iisc-aim/UVH-26",
        repo_type="dataset",
        local_dir=str(DATA),
        max_workers=8,
    )
    print("Done. Dataset at:", path)
