# DRISHTI — Training Workspace

Self-contained ML training for the DRISHTI traffic-violation system. All code, data
and model outputs live inside this `drishti/` folder.

## Folder layout
```
drishti/
  datasets/raw/         # downloaded / unzipped datasets
  datasets/processed/   # any reformatted data
  configs/              # generated YOLO data configs (e.g. helmet_data.yaml)
  scripts/
    download_data.py    # pull datasets (Kaggle API or manual zips)
    prepare_data.py     # build the YOLO data config
    train.py            # fine-tune YOLOv11
    infer.py            # run the model + flag helmet violations
  models/               # best trained weights are copied here
  runs/                 # training runs, plots, predictions
  run_pipeline.py       # download -> prepare -> train, in one command
```

## The ONE thing the user must provide: Kaggle access
The datasets are login-gated, so training cannot start until one of these is done:

**Option A (recommended — fully automatic):**
1. Go to https://www.kaggle.com/settings -> **API** -> **Create New Token**.
2. It downloads `kaggle.json`. Move it to `C:\Users\sunan\.kaggle\kaggle.json`.

**Option B (manual):** download these two dataset ZIPs and drop them in `datasets/raw/`:
- Indian Helmet Detection — https://www.kaggle.com/datasets/aryanvaid13/indian-helmet-detection-dataset
- Car Plate Detection — https://www.kaggle.com/datasets/andrewmvd/car-plate-detection

## GPU note
This machine has an RTX 4070 (8 GB). The CUDA build of PyTorch is required (the default
PyPI build is CPU-only). See `requirements.txt` for the install command.

## Run it
```
python drishti/run_pipeline.py            # download -> prepare -> train
python drishti/scripts/infer.py --source <image_or_video>
```

## First model (MVP)
Trains a YOLOv11s detector on the Indian Helmet dataset, which yields the flagship
**helmet / no-helmet** violation plus **rider** and **number-plate** detection — a real,
demoable model. More violations (triple riding, plates OCR, vehicle types) extend from
the same pipeline as additional datasets are added.
