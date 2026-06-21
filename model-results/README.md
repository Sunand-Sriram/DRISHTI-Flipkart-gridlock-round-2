# DRISHTI — Model Results

Training results for the six YOLO11m detectors that power the DRISHTI pipeline.
Each subfolder holds that model's training graphs (F1 / PR / P / R curves, confusion
matrices, loss/metric curves) and sample validation predictions. The weights live in
`drishti/models/`.

| Folder | Purpose | mAP@0.5 | Precision | Recall | Epochs |
|--------|---------|--------:|----------:|-------:|-------:|
| [01-vehicle-detection](01-vehicle-detection/) | Vehicle & Road-User Detection | 0.868 | 0.856 | 0.806 | 67 |
| [02-helmet-detection](02-helmet-detection/) | Helmet / No-Helmet Detection | 0.911 | 0.876 | 0.902 | 120 |
| [03-number-plate-ocr](03-number-plate-ocr/) | Number-Plate Detection | 0.985 | 0.984 | 0.940 | 120 |
| [04-traffic-light-state](04-traffic-light-state/) | Traffic-Light State | 0.970 | 0.973 | 0.948 | 60 |
| [05-seatbelt-detection](05-seatbelt-detection/) | Seatbelt Detection | 0.953 | 0.946 | 0.913 | 120 |
| [06-phone-use-detection](06-phone-use-detection/) | Mobile-Phone-Use Detection | 0.588 | 0.783 | 0.528 | 150 |

**Stack:** Ultralytics YOLO11m, trained on an RTX 4070 (mixed precision, early stopping on
val mAP). Detections feed ByteTrack (temporal violations) + PaddleOCR (plate text). Phone-use
is the hardest class — by design, low-confidence detections are routed to the officer Review
Queue rather than auto-issued, keeping false-fine rate low.

> Each model evaluates with the standard object-detection metrics required by the brief
> (Accuracy/Precision/Recall/F1/mAP). Precision is prioritised over recall for auto-issued
> challans — borderline cases go to human review.
