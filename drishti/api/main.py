"""DRISHTI FastAPI backend — officer + citizen portals.

Run:  uvicorn api.main:app --host 0.0.0.0 --port 8000   (from drishti/)
Docs: http://localhost:8000/docs
"""
import json
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import db
from . import pdf as pdfgen
from . import mailer
from . import demo_accounts

ROOT = Path(__file__).resolve().parents[1]
EVID_DIR = ROOT / "runs" / "drishti"
DATA_DIR = ROOT / "data"
UPLOAD_DIR = ROOT / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
EVID_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    db.seed_demo()
    # ensure demo officer accounts always exist (idempotent)
    for o in demo_accounts.OFFICERS:
        db.create_officer(o)
    yield


app = FastAPI(title="DRISHTI API", version="1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)
# serve evidence images + uploaded files
app.mount("/static/evidence", StaticFiles(directory=str(EVID_DIR)), name="evidence")


# ════════════════════════════ CHALLANS (officer) ════════════════════════════
@app.get("/api/challans")
def list_challans(page: int = 1, limit: int = 25, types: str = "", status: str = "",
                  camera: str = "", confidence_lt: float = None, q: str = ""):
    conn = db.connect()
    where, params = [], []
    if types:
        ts = types.split(",")
        where.append("(" + " OR ".join("violation=?" for _ in ts) + ")"); params += ts
    if status:
        where.append("status=?"); params.append(status)
    if camera:
        where.append("camera=?"); params.append(camera)
    if confidence_lt is not None:
        where.append("confidence < ?"); params.append(confidence_lt)
    if q:
        where.append("(plate LIKE ? OR challan_id LIKE ?)"); params += [f"%{q}%", f"%{q}%"]
    wsql = (" WHERE " + " AND ".join(where)) if where else ""
    total = conn.execute(f"SELECT COUNT(*) FROM challans{wsql}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT * FROM challans{wsql} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [limit, (page - 1) * limit]).fetchall()
    conn.close()
    return {"items": [db.row_to_challan(r) for r in rows], "total": total, "page": page}


@app.get("/api/challans/{cid}")
def get_challan(cid: str):
    conn = db.connect()
    r = conn.execute("SELECT * FROM challans WHERE challan_id=?", (cid,)).fetchone()
    conn.close()
    if not r:
        raise HTTPException(404, "Challan not found")
    return db.row_to_challan(r)


@app.get("/api/challans/{cid}/pdf")
def challan_pdf(cid: str):
    ch = get_challan(cid)
    return Response(pdfgen.challan_pdf(ch), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{cid}.pdf"'})


@app.patch("/api/challans/{cid}")
async def patch_challan(cid: str, body: dict):
    fields = {}
    for k in ("status", "officer_decision", "citizen_reason"):
        if k in body:
            fields[k] = body[k]
    if not fields:
        raise HTTPException(400, "no updatable fields")
    # capture the previous status to detect an approval transition
    prev = get_challan(cid)
    prev_status = prev.get("status")
    conn = db.connect()
    sets = ", ".join(f"{k}=?" for k in fields)
    conn.execute(f"UPDATE challans SET {sets} WHERE challan_id=?",
                 list(fields.values()) + [cid])
    conn.commit(); conn.close()
    db.log(f"Challan {cid} -> {fields.get('status','updated')}", "Officer")
    st = fields.get("status", "")
    ch = get_challan(cid)
    plate = (ch.get("plate") or "").replace(" ", "").upper()
    # approval in the Review Queue (PENDING_REVIEW -> ISSUED) dispatches the e-challan email
    if st == "ISSUED" and prev_status != "ISSUED":
        from .ingest import auto_email
        auto_email(cid)
    # notify the citizen when an officer rules on a contest
    if st in ("CONTESTED_UPHELD", "CONTESTED_DISMISSED", "ESCALATED") and plate:
        msg = {"CONTESTED_UPHELD": "Your contest was reviewed and the challan stands.",
               "CONTESTED_DISMISSED": "Good news — your contest was accepted and the challan was dismissed.",
               "ESCALATED": "Your contest has been escalated for magistrate review."}[st]
        db.add_notification(plate, "contest", f"Contest decision on {cid}", msg, f"/citizen/challan/{cid}")
    return ch


# ════════════════════════════ ANALYTICS ═════════════════════════════════════
def _range_clause(days: int):
    """Return (sql_fragment, params) filtering challans to the last `days` days."""
    if days and days > 0:
        return " WHERE created_at >= ?", [time.time() - days * 86400]
    return "", []


@app.get("/api/analytics/summary")
def analytics_summary(days: int = 0):
    w, p = _range_clause(days)
    conn = db.connect()
    total = conn.execute(f"SELECT COUNT(*) FROM challans{w}", p).fetchone()[0]
    paid_w = (w + " AND status='PAID'") if w else " WHERE status='PAID'"
    fines = conn.execute(f"SELECT COALESCE(SUM(fine_inr),0) FROM challans{paid_w}", p).fetchone()[0]
    rep_w = (w + " AND repeat_offender=1") if w else " WHERE repeat_offender=1"
    repeat = conn.execute(f"SELECT COUNT(*) FROM challans{rep_w}", p).fetchone()[0]
    avg = conn.execute(f"SELECT COALESCE(AVG(fine_inr),0) FROM challans{w}", p).fetchone()[0]
    by_type = [dict(r) for r in conn.execute(
        f"SELECT violation as type, COUNT(*) as count FROM challans{w} GROUP BY violation ORDER BY count DESC", p)]
    by_cam = [dict(r) for r in conn.execute(
        f"SELECT camera, COUNT(*) as count FROM challans{w} GROUP BY camera ORDER BY count DESC", p)]
    conn.close()
    return {"total": total, "fines_collected": fines, "repeat_offenders": repeat,
            "avg_fine": round(avg), "by_type": by_type, "by_camera": by_cam}


@app.get("/api/analytics/hourly")
def analytics_hourly(days: int = 0):
    w, p = _range_clause(days)
    conn = db.connect()
    rows = conn.execute(
        "SELECT CAST(strftime('%H', datetime(created_at,'unixepoch')) AS INTEGER) as hour, "
        f"COUNT(*) as count FROM challans{w} GROUP BY hour", p).fetchall()
    conn.close()
    buckets = {int(r["hour"]): r["count"] for r in rows}
    return [{"hour": h, "count": buckets.get(h, 0)} for h in range(24)]


@app.get("/api/analytics/trend")
def analytics_trend(days: int = 7):
    """Per-day challans issued and fines collected over the last `days` days."""
    conn = db.connect()
    out = []
    now = time.time()
    for i in range(days - 1, -1, -1):
        start = now - (i + 1) * 86400
        end = now - i * 86400
        cnt = conn.execute("SELECT COUNT(*) FROM challans WHERE created_at>=? AND created_at<?",
                           (start, end)).fetchone()[0]
        amt = conn.execute("SELECT COALESCE(SUM(fine_inr),0) FROM challans WHERE status='PAID' AND created_at>=? AND created_at<?",
                           (start, end)).fetchone()[0]
        out.append({"date": time.strftime("%d %b", time.localtime(start)), "count": cnt, "amount": amt})
    conn.close()
    return out


# ════════════════════════════ CAMERAS / CHECKPOSTS ══════════════════════════
@app.get("/api/cameras")
def list_cameras():
    conn = db.connect()
    rows = [dict(r) for r in conn.execute("SELECT * FROM cameras")]
    conn.close()
    return rows


@app.get("/api/checkposts")
def list_checkposts():
    conn = db.connect()
    rows = [dict(r) for r in conn.execute("SELECT * FROM checkposts")]
    conn.close()
    return rows


@app.get("/api/audit-log")
def audit_log(limit: int = 10):
    conn = db.connect()
    rows = [dict(r) for r in conn.execute(
        "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?", (limit,))]
    conn.close()
    return rows


# ════════════════════════════ EMERGENCIES ═══════════════════════════════════
@app.get("/api/emergencies")
def list_emergencies(status: str = "active"):
    conn = db.connect()
    rows = [dict(r) for r in conn.execute(
        "SELECT * FROM emergencies WHERE status=? ORDER BY created_at DESC", (status,))]
    conn.close()
    return rows


@app.patch("/api/emergencies/{eid}")
def dismiss_emergency(eid: str, body: dict):
    conn = db.connect()
    conn.execute("UPDATE emergencies SET status=? WHERE id=?",
                 (body.get("status", "dismissed"), eid))
    conn.commit(); conn.close()
    return {"ok": True}


@app.post("/api/emergencies/{eid}/followup")
def followup_emergency(eid: str):
    """Dispatch a green-corridor alert to the emergency's checkpost."""
    conn = db.connect()
    r = conn.execute("SELECT * FROM emergencies WHERE id=?", (eid,)).fetchone()
    conn.close()
    if not r:
        raise HTTPException(404, "Emergency not found")
    e = dict(r)
    cp = e["checkpost"]
    db.add_notification(f"cp:{cp}", "dispatch", f"🚨 {e['vehicle'].title()} inbound — clear the lane",
                        f"Green corridor from {e['camera']} ({e['location']}). ETA ~2 min. Officer {e['officer']}.",
                        "/officer/cameras")
    db.add_notification("officer", "dispatch", f"Follow-up dispatched to {cp}",
                        f"{e['vehicle'].title()} green corridor relayed.", "/officer/emergencies")
    db.log(f"Follow-up dispatched for {eid} -> {cp}", "Officer")
    return {"ok": True, "checkpost": cp, "vehicle": e["vehicle"], "camera": e["camera"]}


@app.get("/api/checkpost-alerts")
def checkpost_alerts(name: str):
    """Alerts dispatched to a given checkpost (for the Cameras screen)."""
    items = db.list_notifications(f"cp:{name}", 20)
    return {"items": items, "unread": sum(1 for n in items if not n["read"])}


# ════════════════════════════ HOTSPOTS (predictive) ═════════════════════════
@app.get("/api/hotspots/predict")
def hotspots_predict(time_offset: int = 0):
    """time_offset = minutes from now; returns predicted hotspots for that slot."""
    f = DATA_DIR / "hotspots.json"
    if not f.exists():
        return {"hotspots": [], "note": "model not built"}
    model = json.loads(f.read_text())
    t = time.localtime(time.time() + time_offset * 60)
    dow, hour = t.tm_wday, t.tm_hour
    items = model["predictions"].get(str(dow), {}).get(str(hour), [])
    return {"hotspots": items, "dow": dow, "hour": hour,
            "based_on": model.get("total_events"), "weeks": model.get("weeks_observed")}


# ════════════════════════════ CITIZEN PORTAL ════════════════════════════════
@app.post("/api/citizen/login")
def citizen_login(body: dict):
    cid = (body.get("challan_id") or "").strip().upper()
    plate = (body.get("plate_no") or "").replace(" ", "").upper()
    email = (body.get("email") or "").strip().lower()
    conn = db.connect()
    # Login path 1: challan id + plate. Path 2: plate (or email) alone -> latest challan.
    if cid:
        r = conn.execute("SELECT challan_id, plate FROM challans WHERE UPPER(challan_id)=?", (cid,)).fetchone()
    elif plate:
        r = conn.execute("SELECT challan_id, plate FROM challans WHERE REPLACE(UPPER(plate),' ','')=? "
                         "ORDER BY created_at DESC", (plate,)).fetchone()
    elif email:
        r = conn.execute("SELECT challan_id, plate FROM challans WHERE owner_json LIKE ? "
                         "ORDER BY created_at DESC", (f'%"{email}"%',)).fetchone()
    else:
        r = None
    conn.close()
    if not r:
        raise HTTPException(404, "No challan found for those details")
    if cid and r["plate"] and plate and r["plate"].replace(" ", "").upper() != plate:
        raise HTTPException(403, "Plate does not match challan")
    return {"token": f"demo-{r['challan_id']}", "challan_id": r["challan_id"],
            "plate": (r["plate"] or "")}


@app.post("/api/citizen/pay/{cid}")
def citizen_pay(cid: str, body: dict):
    ch = get_challan(cid)
    if ch["status"] == "PAID":
        raise HTTPException(400, "Already paid")
    txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
    last4 = (body.get("card_number") or "0000")[-4:]
    conn = db.connect()
    conn.execute("INSERT INTO transactions (txn_id,challan_id,amount,method,card_last4,created_at) VALUES (?,?,?,?,?,?)",
                 (txn_id, cid, ch["fine_inr"], "Card", last4, time.time()))
    conn.execute("UPDATE challans SET status='PAID', paid_at=? WHERE challan_id=?",
                 (time.time(), cid))
    conn.commit(); conn.close()
    db.log(f"Challan {cid} PAID", "Citizen")
    method = body.get("method") or "Card"
    plate = (ch.get("plate") or "").replace(" ", "").upper()
    db.add_notification("officer", "payment", f"Payment received for {cid}",
                        f"{mailer._inr(ch['fine_inr'])} paid via {method}.", f"/officer/challans/{cid}")
    if plate:
        db.add_notification(plate, "payment", f"Payment successful for {cid}",
                            f"You paid {mailer._inr(ch['fine_inr'])}. Receipt available to download.",
                            f"/citizen/receipt/{cid}")
    return {"success": True, "transaction_id": txn_id, "amount": ch["fine_inr"]}


@app.post("/api/citizen/challans/{cid}/contest")
async def citizen_contest(cid: str, reason: str = Form(...), details: str = Form(""),
                          photo: UploadFile = File(None)):
    ch = get_challan(cid)
    photo_name = None
    if photo:
        photo_name = f"contest_{cid}_{photo.filename}"
        (EVID_DIR / photo_name).write_bytes(await photo.read())
    conn = db.connect()
    conn.execute("UPDATE challans SET status='CONTESTED', citizen_reason=?, citizen_evidence=? WHERE challan_id=?",
                 (f"{reason}: {details}", photo_name, cid))
    conn.commit(); conn.close()
    db.log(f"Challan {cid} CONTESTED", "Citizen")
    plate = (ch.get("plate") or "").replace(" ", "").upper()
    db.add_notification("officer", "contest", f"New contest on {cid}",
                        f"Reason: {reason}", f"/officer/contested")
    if plate:
        db.add_notification(plate, "contest", f"Contest submitted for {cid}",
                            "We received your contest. An officer will review it within 5 business days.",
                            f"/citizen/challan/{cid}")
    return {"success": True, "reference_number": f"REF-{cid}"}


@app.get("/api/citizen/receipt/{cid}/pdf")
def citizen_receipt_pdf(cid: str):
    ch = get_challan(cid)
    conn = db.connect()
    t = conn.execute("SELECT * FROM transactions WHERE challan_id=? ORDER BY created_at DESC", (cid,)).fetchone()
    conn.close()
    txn = dict(t) if t else {"txn_id": "-", "amount": ch["fine_inr"], "method": "Card", "card_last4": ""}
    return Response(pdfgen.receipt_pdf(ch, txn), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="receipt-{cid}.pdf"'})


@app.get("/api/citizen/history")
def citizen_history(plate: str):
    p = plate.replace(" ", "").upper()
    conn = db.connect()
    rows = conn.execute("SELECT * FROM challans WHERE REPLACE(UPPER(plate),' ','')=?", (p,)).fetchall()
    conn.close()
    items = [db.row_to_challan(r) for r in rows]
    paid = sum(c["fine_inr"] for c in items if c["status"] == "PAID")
    return {"items": items, "total_paid": paid, "count": len(items)}


# ════════════════════════════ OFFICER AUTH ══════════════════════════════════
def _officer_public(o: dict) -> dict:
    return {k: o[k] for k in ("name", "email", "badge", "station", "rank") if k in o}


@app.post("/api/officer/signup")
def officer_signup(body: dict):
    email = (body.get("email") or "").strip().lower()
    if not email or not body.get("password") or not body.get("name"):
        raise HTTPException(400, "name, email and password are required")
    ok = db.create_officer({
        "email": email, "name": body["name"], "badge": body.get("badge", ""),
        "station": body.get("station", "Bengaluru Traffic PS"),
        "rank": body.get("rank", "Officer"), "password": body["password"],
    })
    if not ok:
        raise HTTPException(409, "An account with this email already exists")
    db.log(f"Officer registered: {email}", "System")
    return {"ok": True, "officer": _officer_public(db.get_officer(email))}


@app.post("/api/officer/login")
def officer_login(body: dict):
    email = (body.get("email") or "").strip().lower()
    o = db.get_officer(email)
    if not o or o["password"] != body.get("password"):
        raise HTTPException(401, "Invalid email or password")
    return {"ok": True, "token": f"officer-{email}", "officer": _officer_public(o)}


@app.get("/api/officers")
def officers_list():
    conn = db.connect()
    rows = [dict(r) for r in conn.execute("SELECT name,email,badge,station,rank FROM officers")]
    conn.close()
    return rows


# ════════════════════════════ NOTIFICATIONS ═════════════════════════════════
@app.get("/api/notifications")
def notifications(audience: str = "officer", limit: int = 30):
    aud = audience.replace(" ", "").upper() if audience != "officer" else "officer"
    items = db.list_notifications(aud, limit)
    unread = sum(1 for n in items if not n["read"])
    return {"items": items, "unread": unread}


@app.post("/api/notifications/read")
def notifications_read(body: dict):
    audience = body.get("audience", "officer")
    aud = audience.replace(" ", "").upper() if audience != "officer" else "officer"
    db.mark_notifications_read(aud)
    return {"ok": True}


# ════════════════════════════ EMAIL DELIVERY ════════════════════════════════
@app.post("/api/challans/{cid}/send-email")
def send_challan_email(cid: str):
    """Deliver the e-challan (PDF + branded HTML) to the registered owner's email."""
    ch = get_challan(cid)
    pdf_bytes = pdfgen.challan_pdf(ch)
    res = mailer.send_challan_email(ch, pdf_bytes)
    plate = (ch.get("plate") or "").replace(" ", "").upper()
    if res.get("sent") and plate:
        db.add_notification(plate, "challan", f"e-Challan {cid} emailed",
                            f"Sent to {res.get('to')}.", f"/citizen/challan/{cid}")
    db.log(f"Challan {cid} emailed ({res.get('mode')})", "System")
    return res


# ════════════════════════════ OUTBOX (sent emails) ══════════════════════════
@app.get("/api/outbox")
def outbox_list():
    return {"items": mailer.list_outbox()}


@app.get("/api/outbox/{name}")
def outbox_view(name: str):
    html = mailer.read_outbox(name)
    if html is None:
        raise HTTPException(404, "Email not found")
    return Response(html, media_type="text/html")


# ════════════════════════════ CLAUDE CHAT ═══════════════════════════════════
from .chat import chat_handler  # noqa: E402


@app.post("/api/chat")
async def chat(body: dict):
    return await chat_handler(body.get("messages", []))


# ════════════════════════════ UPLOAD + WEBSOCKET ════════════════════════════
from .ingest import run_inference_task, TASKS  # noqa: E402


@app.post("/api/upload")
async def upload(file: UploadFile = File(...), enhance: bool = Form(False),
                 stride: int = Form(1)):
    task_id = uuid.uuid4().hex[:12]
    dest = UPLOAD_DIR / f"{task_id}_{file.filename}"
    dest.write_bytes(await file.read())
    TASKS[task_id] = {"status": "queued", "progress": 0, "source": str(dest),
                      "enhance": enhance, "stride": stride}
    return {"task_id": task_id, "status": "queued"}


@app.post("/api/stream-url")
async def stream_url(body: dict):
    """Run live inference on a network camera (e.g. phone IP Webcam MJPEG URL)."""
    url = (body.get("url") or "").strip()
    if not url:
        raise HTTPException(400, "url required")
    task_id = uuid.uuid4().hex[:12]
    TASKS[task_id] = {"status": "queued", "progress": 0, "source": url,
                      "enhance": bool(body.get("enhance", False)), "stride": 1, "live": True}
    return {"task_id": task_id, "status": "queued"}


@app.get("/api/tasks/{task_id}")
def task_status(task_id: str):
    return TASKS.get(task_id, {"status": "unknown"})


@app.websocket("/ws/stream/{task_id}")
async def ws_stream(ws: WebSocket, task_id: str):
    await ws.accept()
    try:
        await run_inference_task(task_id, ws)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await ws.send_json({"type": "error", "data": str(e)})


@app.get("/")
def root():
    return {"service": "DRISHTI API", "docs": "/docs", "status": "ok"}
