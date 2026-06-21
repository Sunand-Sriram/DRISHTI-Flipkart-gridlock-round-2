"""SQLite data layer for the DRISHTI backend. Single-file DB, no ORM — keeps the
demo dependency-light and reproducible. Tables: challans, transactions,
cameras, checkposts, emergencies, audit_log.
"""
import json
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "drishti.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS challans (
    challan_id      TEXT PRIMARY KEY,
    violation       TEXT NOT NULL,
    confidence      REAL,
    frame           INTEGER,
    evidence_image  TEXT,
    plate           TEXT,
    plate_valid     INTEGER DEFAULT 0,
    owner_json      TEXT,          -- VAHAN lookup blob
    fine_inr        INTEGER,
    repeat_offender INTEGER DEFAULT 0,
    speed_kmh       REAL,
    camera          TEXT DEFAULT 'CAM-01',
    location        TEXT,
    lat             REAL,
    lng             REAL,
    status          TEXT DEFAULT 'ISSUED',   -- ISSUED|PENDING_REVIEW|PAID|CONTESTED|CONTESTED_UPHELD|CONTESTED_DISMISSED|ESCALATED|REJECTED
    citizen_reason  TEXT,
    citizen_evidence TEXT,
    officer_decision TEXT,
    created_at      REAL,
    paid_at         REAL,
    extra_json      TEXT
);
CREATE TABLE IF NOT EXISTS transactions (
    txn_id      TEXT PRIMARY KEY,
    challan_id  TEXT,
    amount      INTEGER,
    method      TEXT,
    card_last4  TEXT,
    created_at  REAL
);
CREATE TABLE IF NOT EXISTS cameras (
    id        TEXT PRIMARY KEY,
    name      TEXT,
    location  TEXT,
    lat       REAL,
    lng       REAL,
    status    TEXT DEFAULT 'live',
    count     INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS checkposts (
    id        TEXT PRIMARY KEY,
    name      TEXT,
    location  TEXT,
    lat       REAL,
    lng       REAL,
    officer   TEXT
);
CREATE TABLE IF NOT EXISTS emergencies (
    id          TEXT PRIMARY KEY,
    vehicle     TEXT,
    camera      TEXT,
    location    TEXT,
    lat         REAL,
    lng         REAL,
    checkpost   TEXT,
    officer     TEXT,
    status      TEXT DEFAULT 'active',
    created_at  REAL
);
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    action      TEXT,
    actor       TEXT,
    status      TEXT,
    created_at  REAL
);
CREATE TABLE IF NOT EXISTS officers (
    email       TEXT PRIMARY KEY,
    name        TEXT,
    badge       TEXT,
    station     TEXT,
    rank        TEXT,
    password    TEXT,
    created_at  REAL
);
CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    audience    TEXT,          -- 'officer' | citizen plate (e.g. 'KA01AB1234')
    kind        TEXT,          -- 'emergency'|'contest'|'payment'|'challan'|'system'
    title       TEXT,
    body        TEXT,
    link        TEXT,
    read        INTEGER DEFAULT 0,
    created_at  REAL
);
"""


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = connect()
    conn.executescript(_SCHEMA)
    conn.commit()
    conn.close()


def row_to_challan(r: sqlite3.Row) -> dict:
    d = dict(r)
    owner = json.loads(d.pop("owner_json") or "{}")
    d["extra"] = json.loads(d.pop("extra_json") or "{}")
    d["plate_valid"] = bool(d["plate_valid"])
    d["repeat_offender"] = bool(d["repeat_offender"])
    # ── derived display fields the UI expects ────────────────────────────────
    mult = 2 if d["repeat_offender"] else 1
    fine = d.get("fine_inr") or 0
    d["repeat_multiplier"] = mult
    d["base_fine_inr"] = fine // mult
    d["speed_limit"] = 60 if d.get("speed_kmh") else None
    created = d.get("created_at") or time.time()
    d["payment_deadline"] = time.strftime("%Y-%m-%d", time.localtime(created + 14 * 86400))
    d["officer_name"] = "SI Ramesh Kumar"
    # deterministic VAHAN expiry dates so the citizen card looks complete
    h = abs(hash(d.get("plate") or d["challan_id"]))
    owner.setdefault("puc_expires", f"2026-{(h % 12) + 1:02d}-28")
    owner.setdefault("insurance_expires", f"2026-{(h % 8) + 4:02d}-15")
    # ensure an email exists (VAHAN delivery target) even for legacy records
    if not owner.get("email"):
        owner["email"] = f"owner{h % 9000 + 1000}@example.com"
    d["owner"] = owner
    return d


def insert_challan(c: dict):
    """Insert one challan dict (from pipeline.challan.build_challan + meta)."""
    conn = connect()
    conn.execute(
        """INSERT OR REPLACE INTO challans
           (challan_id, violation, confidence, frame, evidence_image, plate,
            plate_valid, owner_json, fine_inr, repeat_offender, speed_kmh,
            camera, location, lat, lng, status, citizen_reason, citizen_evidence,
            created_at, paid_at, extra_json)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (c["challan_id"], c["violation"], c.get("confidence"), c.get("frame"),
         c.get("evidence_image"), c.get("plate"), int(c.get("plate_valid", False)),
         json.dumps(c.get("owner", {})), c.get("fine_inr"),
         int(c.get("repeat_offender", False)), c.get("speed_kmh"),
         c.get("camera", "CAM-01"), c.get("location"), c.get("lat"), c.get("lng"),
         c.get("status", "ISSUED"), c.get("citizen_reason"), c.get("citizen_evidence"),
         c.get("created_at", time.time()), c.get("paid_at"),
         json.dumps(c.get("extra", {}))),
    )
    conn.commit()
    conn.close()


def log(action: str, actor: str = "System", status: str = "ok"):
    conn = connect()
    conn.execute("INSERT INTO audit_log (action, actor, status, created_at) VALUES (?,?,?,?)",
                 (action, actor, status, time.time()))
    conn.commit()
    conn.close()


# ── officers (auth) ──────────────────────────────────────────────────────────
def create_officer(o: dict) -> bool:
    conn = connect()
    try:
        conn.execute(
            "INSERT INTO officers (email,name,badge,station,rank,password,created_at) VALUES (?,?,?,?,?,?,?)",
            (o["email"].lower(), o["name"], o.get("badge", ""), o.get("station", ""),
             o.get("rank", "Officer"), o["password"], time.time()))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_officer(email: str):
    conn = connect()
    r = conn.execute("SELECT * FROM officers WHERE email=?", (email.lower(),)).fetchone()
    conn.close()
    return dict(r) if r else None


# ── notifications ────────────────────────────────────────────────────────────
def add_notification(audience: str, kind: str, title: str, body: str = "", link: str = ""):
    conn = connect()
    conn.execute(
        "INSERT INTO notifications (audience,kind,title,body,link,read,created_at) VALUES (?,?,?,?,?,0,?)",
        (audience, kind, title, body, link, time.time()))
    conn.commit()
    conn.close()


def list_notifications(audience: str, limit: int = 30) -> list:
    conn = connect()
    rows = conn.execute(
        "SELECT * FROM notifications WHERE audience=? ORDER BY created_at DESC LIMIT ?",
        (audience, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_notifications_read(audience: str):
    conn = connect()
    conn.execute("UPDATE notifications SET read=1 WHERE audience=?", (audience,))
    conn.commit()
    conn.close()


# ── seed demo cameras / checkposts (Bengaluru junctions) ─────────────────────
_SEED_CAMERAS = [
    ("CAM-01", "Indiranagar", "100 Ft Road, Indiranagar", 12.9716, 77.6412),
    ("CAM-02", "Brigade Road", "Brigade Road Junction", 12.9719, 77.6068),
    ("CAM-03", "MG Road", "MG Road Junction", 12.9756, 77.6068),
    ("CAM-04", "Koramangala", "80 Ft Road, Koramangala", 12.9352, 77.6245),
    ("CAM-05", "Silk Board", "Silk Board Junction", 12.9172, 77.6228),
    ("CAM-06", "Hebbal", "Hebbal Flyover", 13.0358, 77.5970),
]
_SEED_CHECKPOSTS = [
    ("CP-1", "Checkpost 1", "Indiranagar", 12.9716, 77.6412, "SI Ramesh Kumar"),
    ("CP-3", "Checkpost 3", "MG Road", 12.9756, 77.6068, "SI Priya Sharma"),
    ("CP-7", "Checkpost 7", "Silk Board", 12.9172, 77.6228, "SI Anil Reddy"),
]


def seed_demo():
    conn = connect()
    for cam in _SEED_CAMERAS:
        conn.execute("INSERT OR IGNORE INTO cameras (id,name,location,lat,lng) VALUES (?,?,?,?,?)", cam)
    for cp in _SEED_CHECKPOSTS:
        conn.execute("INSERT OR IGNORE INTO checkposts (id,name,location,lat,lng,officer) VALUES (?,?,?,?,?,?)", cp)
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    seed_demo()
    print(f"[db] initialised + seeded -> {DB_PATH}")
