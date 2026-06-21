# Vehicle & Road-User Detection
**Model file:** `drishti/models/vehicle_uvh26_coarse_yolo11m_best.pt` · **Architecture:** YOLO11m · **Epochs:** 67

**Why this model:** The foundation layer (Task 2). Localises every road user so the rules engine knows which violation can apply (helmet→2-wheeler, seatbelt→car), selects the correct fine tier, and powers the emergency-vehicle exemption.

**Dataset:** UVH-26 — 26k Indian Safe-City CCTV images (coarse classes)
**Classes:** two-wheeler, auto-rickshaw, car, LCV, bus, truck, person, emergency-vehicle …

## Final validation metrics
| mAP@0.5 | mAP@0.5:0.95 | Precision | Recall |
|--------:|-------------:|----------:|-------:|
| **0.868** | 0.729 | 0.856 | 0.806 |


### Training graphs
| | |
|---|---|
| ![results](results.png) Training curves (loss, P, R, mAP over epochs) | ![F1](BoxF1_curve.png) F1–confidence curve |
| ![PR](BoxPR_curve.png) Precision–Recall curve | ![P](BoxP_curve.png) Precision–confidence |
| ![R](BoxR_curve.png) Recall–confidence | ![CM](confusion_matrix_normalized.png) Normalised confusion matrix |

### Sample predictions on the validation set
![val predictions](val_batch0_pred.jpg)

