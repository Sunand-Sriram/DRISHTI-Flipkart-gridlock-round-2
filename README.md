# DRISHTI — AI Traffic Violation Detection & e-Challan Platform
### Gridlock Round 2 · Flipkart Hackathon

DRISHTI detects traffic violations from CCTV / uploaded video / a live phone camera,
auto-generates privacy-preserving e-challans, emails them to the registered owner, and
provides two portals — a tactical **Officer** console and a clean **Citizen** portal —
plus predictive hotspots, a live map, and a natural-language analytics bot (DrishtiBot).

## Repo layout
```
gridlock-round-2/
├── drishti/            # FastAPI backend + CV pipeline
│   ├── api/            # REST + WebSocket API, mailer, evidence generator, seed
│   ├── pipeline/       # YOLO11 detect + ByteTrack + OCR + violation logic + challan engine
│   ├── data/           # hotspots.json (predictive model output)
│   ├── requirements-api.txt   # slim deps to run the API (no GPU)
│   ├── requirements.txt       # full training/inference deps
│   └── render.yaml            # Render.com backend blueprint
└── web/                # Vite + React 19 frontend (officer + citizen portals)
    ├── src/
    ├── vercel.json     # Vercel SPA config
    └── .env.example
```

> **Not in the repo (gitignored, too large):** trained model weights (`drishti/models/*.pt`),
> datasets (`drishti/datasets/`), generated evidence (`drishti/runs/`), the SQLite DB, and
> `node_modules`. The app runs in demo mode without the models (seeded data + real-photo
> evidence); live video inference needs the weights — see DEPLOY.md.

## Run locally
```bash
# 1) Backend  (from drishti/)
pip install -r requirements-api.txt          # or requirements.txt for live inference
python -m api.seed_challans                  # seed demo data (challans, emergencies, outbox)
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000

# 2) Frontend (from web/)
npm install
cp .env.example .env.local                   # VITE_API_URL=http://localhost:8000
npm run dev                                   # http://localhost:5173
```

## Demo credentials
- **Officer:** `ramesh.kumar@drishti.gov.in` / `drishti123` (or `admin@drishti.gov.in` / `drishti123`)
- **Citizen:** Challan ID + Vehicle No., e.g. `DRI-00001` / `KA01AB1234` (or use the “Try demo challan” button)

## Key features
Officer: live monitor (upload / phone IP-webcam / CCTV), review queue (per-row approve/reject),
contested queue, 12 simulated emergencies + green-corridor dispatch, Leaflet live map,
predictive hotspots, range-aware analytics + CSV export, DrishtiBot, email outbox.
Citizen: lookup, pay (UPI/Card/NetBanking prototype), contest with photo evidence,
challan & payment history, notifications, help.

Email: every issued challan is auto-emailed to the owner (VAHAN-registered address) and
recorded in the Officer → Email Outbox. Set SMTP env vars to send for real (see DEPLOY.md).

## ⚠️ Live inference — prototype note
This is a **prototype**: **live AI inference (video / image / phone-camera upload) runs LOCALLY**
on the demo machine's GPU — it is **not cloud-hosted** in this build. The six YOLO11m models
need ~2–4 GB RAM and a GPU for real-time speed, which free cloud tiers don't provide.
**In the final deployment, real-time inference will be hosted on a GPU server.** Everything else
(challans, evidence, analytics, maps, email/outbox, DrishtiBot) runs fully on the cloud now.
See **model-results/** for each detector's training graphs and metrics, and **DEPLOY.md** for
cloud deployment (Vercel + Render) and the local-inference tunnel recipe.
