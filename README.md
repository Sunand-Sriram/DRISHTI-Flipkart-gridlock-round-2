<div align="center">

# 👁️ DRISHTI
### AI Traffic Violation Detection & e-Challan Platform
**Flipkart GRiD — Gridlock · Round 2**

*Intelligent eyes on every road — from CCTV frame to e-challan in seconds.*

![YOLO11m](https://img.shields.io/badge/Vision-YOLO11m-14B8A6)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-059669)
![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-38BDF8)
![PaddleOCR](https://img.shields.io/badge/ANPR-PaddleOCR-F59E0B)
![License](https://img.shields.io/badge/Use-Hackathon%20Prototype-8B5CF6)

</div>

---

## 1. What is DRISHTI?

DRISHTI is an end-to-end automated traffic-enforcement platform. It watches CCTV / uploaded
video / a live phone camera, detects **8 traffic violations** with a six-model YOLO11m
ensemble, reads the number plate (ANPR), looks the owner up in a (simulated) VAHAN registry,
and **auto-generates a privacy-preserving e-challan** that is emailed to the owner with photo
evidence and an online payment link.

It ships as **two polished portals**:

| Portal | For | Highlights |
|--------|-----|-----------|
| 🛡️ **Officer Console** (dark, tactical) | Traffic police | Live monitor, confidence-routed review queue, contested-challan adjudication, emergency green-corridor dispatch, live map, predictive hotspots, range-aware analytics, natural-language analytics bot, email outbox |
| 🪪 **Citizen Portal** (light, friendly) | Vehicle owners | Challan lookup, evidence view, UPI/Card payment, contest with counter-evidence, contest-status tracking, payment history, notifications |

> **Design principle — precision over recall for auto-fines.** High-confidence detections are
> auto-issued; borderline ones are routed to a human **Review Queue**, keeping the false-fine
> rate low. This honesty boundary runs through the whole product.

---

## 2. Live demo & quick links

- **Live demo:** _added after deployment_ (Render free tier — backend may take ~50 s to wake on first hit).
- **Demo video:** _added after recording._
- **Model training results:** [`model-results/`](model-results/) — curves, confusion matrices & sample predictions for all 6 detectors.

### Demo credentials

**Officer** (any of these — password `drishti123`):
`ramesh.kumar@drishti.gov.in` · `admin@drishti.gov.in`

**Citizen** — *Challan ID + Vehicle Number* on the lookup page:

| Challan ID | Vehicle No. | Violation | Status — good for testing |
|-----------|-------------|-----------|---------------------------|
| `DRI-00001` | `KA01AB1234` | No Helmet | ISSUED — pay / contest |
| `DRI-00002` | `KA05CJ7788` | Phone Use | ISSUED — pay / contest |
| `DRI-00003` | `KA03MH4521` | Red Light | PAID — receipt & history |
| `DRI-00005` | `KA04PL9087` | Triple Riding | CONTESTED — see status flow |
| `DRI-00006` | `KA51GH2345` | Overspeed | ISSUED — pay / contest |
| `DRI-00008` | `KA20DF3398` | Illegal Parking | ISSUED — pay / contest |

*Full contest loop:* contest an ISSUED challan as a citizen → log in as officer → **Contested**
queue → uphold/dismiss → log back in as the citizen → the decision (and a Pay button if upheld)
appears on the challan.

---

## 3. The AI models

Six specialized **Ultralytics YOLO11m** detectors, trained on an RTX 4070 (mixed precision,
early-stopping on validation mAP). Detections feed **ByteTrack** (temporal violations: speed,
wrong-side, parking) and **PaddleOCR** (plate text → registry lookup).

| # | Detector | Dataset | mAP@0.5 | Precision | Recall |
|---|----------|---------|--------:|----------:|-------:|
| 1 | Vehicle & Road-User | UVH-26 (26k Indian CCTV) | 0.868 | 0.856 | 0.806 |
| 2 | Helmet / No-Helmet | Indian-Helmet + RideSafe-400 | 0.911 | 0.876 | 0.902 |
| 3 | Number-Plate (ANPR) | Indian_LPR + CCPD | **0.985** | 0.984 | 0.940 |
| 4 | Traffic-Light State | S2TLD (5.8k imgs) | 0.970 | 0.973 | 0.948 |
| 5 | Seatbelt | Merged seatbelt set | 0.953 | 0.946 | 0.913 |
| 6 | Mobile-Phone Use | Phone-use v2 | 0.588 | 0.783 | 0.528 |

**Average mAP@0.5 ≈ 0.88.** Phone-use is the hardest class (small, occluded object) — by design
its low-confidence detections are sent to the officer Review Queue instead of being auto-issued.

Violations detected: **no-helmet, triple-riding, mobile-phone use, no-seatbelt, red-light jump,
over-speeding, wrong-side driving, illegal parking** (+ ambulance/fire/police **emergency-vehicle
exemption** that suppresses fines near an emergency vehicle and raises a checkpost green-corridor alert).

---

## 4. Architecture

```
 CCTV / Upload / Phone cam
            │
            ▼
   ┌──────────────────────────────────────────────┐
   │  CV PIPELINE  (drishti/pipeline)              │
   │  6× YOLO11m  →  ByteTrack  →  rules engine     │
   │       │                          │            │
   │   plate crop → PaddleOCR     violation events  │
   │       │                          │            │
   │   VAHAN lookup ───────► challan + fine engine  │
   │                          (privacy evidence img)│
   └──────────────────────────────────────────────┘
            │ WebSocket (live frames + violations)
            ▼
   ┌──────────────────────────────────────────────┐
   │  FastAPI  (drishti/api)  + SQLite             │
   │  challans · payments · contests · emergencies │
   │  analytics · hotspots · mailer/outbox · chat  │
   └──────────────────────────────────────────────┘
            │ REST + WS  (CORS)
            ▼
   ┌──────────────────────────────────────────────┐
   │  React 19 + Vite SPA  (web/)                  │
   │  Officer console  ·  Citizen portal           │
   └──────────────────────────────────────────────┘
```

---

## 5. Run locally

> **Prereqs:** Python 3.11+, Node 18+. Live video inference also needs the 6 model weights
> (bundled in `drishti/models/`) and benefits from a GPU — but the whole app runs in **demo
> mode** (seeded data + real evidence images) with no GPU.

```bash
# 1) Backend  (from drishti/)
cd drishti
pip install -r requirements-api.txt        # slim API deps (demo mode)
#   for live video/image inference instead:  pip install -r requirements.txt
python -m api.seed_challans                 # (optional) reset demo data — already seeded in repo
python -m uvicorn api.main:app --host 0.0.0.0 --port 8001

# 2) Frontend  (from web/, new terminal)
cd web
npm install
copy .env.example .env.local                # Windows  (Linux/Mac: cp)
#   .env.local →  VITE_API_URL=http://localhost:8001
npm run dev                                  # http://localhost:5174
```

Open **http://localhost:5174** → choose Officer or Citizen.
For **live inference**, use the requirements.txt install, then Officer → **Live Monitor** →
upload a clip/image or paste a phone *IP Webcam* `/video` URL → **Analyse**.

---

## 6. Repository layout

```
gridlock-round-2/
├── drishti/                 # FastAPI backend + CV pipeline
│   ├── api/                 # REST + WebSocket, mailer/outbox, evidence gen, seed, chat
│   ├── pipeline/            # YOLO11 detect + ByteTrack + OCR + violation logic + fines
│   ├── models/              # the 6 trained YOLO11m weights (committed)
│   ├── data/hotspots.json   # predictive hotspot model output
│   ├── runs/drishti/        # pre-generated demo evidence images (committed)
│   ├── requirements-api.txt # slim deps (demo/cloud, no GPU)
│   ├── requirements.txt     # full training/inference deps
│   └── render.yaml          # Render.com backend blueprint
├── web/                     # Vite + React 19 SPA (officer + citizen portals)
│   ├── src/  ├── vercel.json └── .env.example
├── model-results/           # training graphs + metrics for all 6 detectors
└── README.md
```

---

## 7. ⚠️ Prototype boundary (read this)

This is a **hackathon prototype**, deliberately honest about what is real vs. simulated:

- **Real:** the 6 trained detectors, the CV pipeline, violation logic, ANPR/OCR, fine
  computation (indicative MV-Act 2019 amounts), e-challan PDF + email, analytics, all UI flows.
- **Simulated:** the VAHAN/HSRP owner registry (real access needs government authorization) and
  the payment gateway (no real money moves).
- **Live AI inference runs locally** on the demo machine (the 6 models need ~2–4 GB RAM + a GPU
  for real-time speed, which free cloud tiers don't provide). The **cloud deployment runs in
  demo mode** — seeded challans, real evidence images, analytics, maps, email/outbox and
  DrishtiBot all work; to see live detection, clone the repo and run locally (Section 5).
  In a production deployment, inference would be hosted on a GPU server.

---

<div align="center">

Built for **Flipkart GRiD — Gridlock Round 2** · DRISHTI Team
*Prototype build — data is simulated and no real payments are processed.*

</div>
