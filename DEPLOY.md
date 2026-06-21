# DRISHTI — Deployment Guide

Frontend (`web/`, Vite/React) → **Vercel**.  Backend (`drishti/`, FastAPI) → **Render**.
Free tiers are enough for the demo. Live video inference (the YOLO models) needs the local
GPU machine; everything else — challans, analytics, email, maps, notifications, outbox —
runs fine on the cloud backend.

---

## 0. Push to GitHub
```bash
cd gridlock-round-2
git init && git add . && git commit -m "DRISHTI — Gridlock Round 2"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
(`.gitignore` already excludes node_modules, model weights, datasets, the DB, and runtime files.)

## 1. Backend → Render (free)
1. Render.com → **New → Blueprint** → pick the repo (reads `drishti/render.yaml`).
2. Service env vars:
   - `DRISHTI_PORTAL_URL` = your Vercel URL (e.g. `https://drishti.vercel.app`)
   - **Real email** (optional, recommended): `DRISHTI_SMTP_HOST=smtp.gmail.com`,
     `DRISHTI_SMTP_USER=<you@gmail.com>`, `DRISHTI_SMTP_PASS=<Gmail App Password>`
   - `ANTHROPIC_API_KEY` (optional) for live DrishtiBot answers
3. Deploy → note the URL (e.g. `https://drishti-api.onrender.com`).
4. In the Render **Shell**, seed demo data once: `python -m api.seed_challans`

> Without SMTP set, emails render to the **Outbox** screen (preview mode) — still fully demoable.

## 2. Frontend → Vercel (free)
1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory:** `web`  (auto-detects Vite, reads `web/vercel.json`).
3. **Environment Variable:** `VITE_API_URL` = your Render backend URL.
4. Deploy. SPA rewrites are preconfigured.

## 3. Local run (full, with live inference)
```bash
# backend (from drishti/) — needs models/ + datasets/ present for live inference + evidence
pip install -r requirements.txt
python -m api.seed_challans
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000

# frontend (from web/)
npm install && cp .env.example .env.local && npm run dev
```

## Live phone camera (demo)
Officer → Live Monitor → CCTV Mode → paste your phone's **IP Webcam** URL
(`http://<phone-ip>:8080/video`, same Wi-Fi). "Live View" shows the feed; "Run AI Detection"
runs the pipeline on it. Keep the backend **local** for this (cloud can't reach your phone's LAN IP).

## Notes
- Email target = owner's email from the simulated VAHAN registry record.
- Models (`drishti/models/*.pt`) + datasets are gitignored. Copy them onto the machine that runs
  live inference; the cloud backend works without them (seeded data + pre-rendered evidence).
- CORS is open so the Vercel frontend can call the Render backend directly.
