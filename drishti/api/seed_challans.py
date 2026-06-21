"""Seed synthetic-but-realistic challans so the portals have data without needing
a live inference run. Idempotent-ish: clears and repopulates the challans table.
Run:  python -m api.seed_challans   (from drishti/)
"""
import random
import time

from . import db
from . import demo_accounts
from . import evidence_gen
from pipeline.challan import build_challan, compute_fine

CONTEST_REASONS = [
    "I was wearing a helmet — the photo angle is misleading.",
    "This is not my vehicle; the plate has been misread.",
    "I had already crossed the stop line when the light changed.",
    "The vehicle was sold before this date (transfer papers attached).",
    "I was avoiding an accident — emergency manoeuvre.",
]


def _attach_evidence(ch: dict):
    """Generate the annotated evidence image and (for contests) citizen reason+photo."""
    ch["evidence_image"] = evidence_gen.generate(ch)
    if ch.get("status") == "CONTESTED":
        if not ch.get("citizen_reason"):
            ch["citizen_reason"] = random.choice(CONTEST_REASONS)
        ch["citizen_evidence"] = evidence_gen.generate_contest_photo(ch)

VIOLATIONS = ["no_helmet", "phone_use", "red_light", "seatbelt", "triple_riding",
              "overspeed", "wrong_side", "illegal_parking"]
STATES = ["KA", "MH", "DL", "TN", "TS"]
CAMS = [("CAM-01", "Indiranagar", 12.9716, 77.6412),
        ("CAM-02", "Brigade Road", 12.9719, 77.6068),
        ("CAM-03", "MG Road", 12.9756, 77.6068),
        ("CAM-04", "Koramangala", 12.9352, 77.6245),
        ("CAM-05", "Silk Board", 12.9172, 77.6228),
        ("CAM-06", "Hebbal", 13.0358, 77.5970)]
STATUSES = ["ISSUED", "ISSUED", "ISSUED", "PAID", "PAID", "PENDING_REVIEW", "CONTESTED"]


def _plate():
    return f"{random.choice(STATES)}{random.randint(1,40):02d}{chr(65+random.randint(0,25))}{chr(65+random.randint(0,25))}{random.randint(1000,9999)}"


def main(n=220):
    db.init_db(); db.seed_demo()
    for o in demo_accounts.OFFICERS:
        db.create_officer(o)
    conn = db.connect()
    conn.execute("DELETE FROM challans")
    conn.execute("DELETE FROM notifications")
    conn.commit(); conn.close()
    now = time.time()

    # ── curated demo challans: one (or more) per demo citizen, clean plates + emails ──
    ncit = len(demo_accounts.CITIZENS)
    demo_status = ["ISSUED", "ISSUED", "PAID", "PENDING_REVIEW", "CONTESTED",
                   "ISSUED", "PAID", "ISSUED", "CONTESTED", "PENDING_REVIEW"]
    for i in range(ncit):
        c = demo_accounts.CITIZENS[i]
        owner = demo_accounts.citizen_owner(i)
        vt = VIOLATIONS[i % len(VIOLATIONS)]
        cam = CAMS[i % len(CAMS)]
        conf = round(random.uniform(0.78, 0.97), 2)
        fine = compute_fine(vt, owner["prior_violations"])
        ch = {
            "challan_id": f"DRI-{i + 1:05d}", "violation": vt, "confidence": conf,
            "frame": random.randint(10, 3000), "evidence_image": None,
            "plate": c["plate"], "plate_valid": True, "owner": owner, "fine_inr": fine,
            "repeat_offender": owner["prior_violations"] > 0,
            "status": demo_status[i % len(demo_status)],
            "camera": cam[0], "location": cam[1], "lat": cam[2], "lng": cam[3],
            "created_at": now - random.randint(0, 6 * 24 * 3600),
            "speed_kmh": round(random.uniform(64, 96), 1) if vt == "overspeed" else None,
        }
        if ch["status"] == "PAID":
            ch["paid_at"] = ch["created_at"] + 3600
        _attach_evidence(ch)
        db.insert_challan(ch)

    # ── bulk synthetic challans for analytics volume ──
    for i in range(ncit + 1, n + 1):
        vt = random.choice(VIOLATIONS)
        cam = random.choice(CAMS)
        conf = round(random.uniform(0.55, 0.98), 2)
        ch = build_challan({"id": i, "type": vt, "frame": random.randint(10, 3000),
                            "conf": conf, "plate": _plate(),
                            "valid_plate": True, "evidence": None})
        ch["status"] = random.choice(STATUSES) if conf >= 0.75 else "PENDING_REVIEW"
        ch["camera"] = cam[0]; ch["location"] = cam[1]; ch["lat"] = cam[2]; ch["lng"] = cam[3]
        # spread across ~90 days so the Analytics range dropdown (7/30/90) differs
        ch["created_at"] = now - random.randint(0, 90 * 24 * 3600)
        ch["speed_kmh"] = round(random.uniform(62, 95), 1) if vt == "overspeed" else None
        if ch["status"] == "PAID":
            ch["paid_at"] = ch["created_at"] + 3600
        _attach_evidence(ch)
        db.insert_challan(ch)

    # ── seed notifications (officer + a couple of citizens) ──
    db.add_notification("officer", "emergency", "Ambulance detected at MG Road", "Alert relayed to Checkpost 3.", "/officer/emergencies")
    db.add_notification("officer", "contest", "New contest on DRI-00005", "Reason: I was wearing a helmet", "/officer/contested")
    db.add_notification("officer", "payment", "Payment received for DRI-00003", "Rs. 1,000 paid via UPI.", "/officer/challans/DRI-00003")
    db.add_notification("officer", "system", "12 cameras online", "All feeds healthy.", "/officer/cameras")
    p0 = demo_accounts.CITIZENS[0]["plate"].replace(" ", "").upper()
    db.add_notification(p0, "challan", "New e-Challan DRI-00001", "A traffic violation was recorded for your vehicle.", "/citizen/challan/DRI-00001")
    # ── active emergency sightings for the Emergencies screen + map ──
    conn = db.connect()
    conn.execute("DELETE FROM emergencies")
    ems = [
        ("EM-001", "ambulance", "CAM-03", "MG Road Junction",      12.9756, 77.6068, "Checkpost 3", "SI Priya Sharma"),
        ("EM-002", "firetruck", "CAM-05", "Silk Board Junction",   12.9172, 77.6228, "Checkpost 7", "ASI Anil Reddy"),
        ("EM-003", "ambulance", "CAM-01", "Indiranagar 100ft Rd",  12.9716, 77.6412, "Checkpost 1", "SI Ramesh Kumar"),
        ("EM-004", "police",    "CAM-02", "Brigade Road Junction",  12.9719, 77.6068, "Checkpost 1", "SI Ramesh Kumar"),
        ("EM-005", "ambulance", "CAM-06", "Hebbal Flyover",        13.0358, 77.5970, "Checkpost 7", "HC Suresh Gowda"),
        ("EM-006", "firetruck", "CAM-04", "Koramangala 80ft Rd",   12.9352, 77.6245, "Checkpost 3", "PI Meera Nair"),
        ("EM-007", "ambulance", "CAM-05", "Silk Board Junction",   12.9172, 77.6228, "Checkpost 7", "ASI Anil Reddy"),
        ("EM-008", "ambulance", "CAM-02", "Brigade Road Junction",  12.9719, 77.6068, "Checkpost 1", "SI Ramesh Kumar"),
        ("EM-009", "police",    "CAM-06", "Hebbal Flyover",        13.0358, 77.5970, "Checkpost 7", "HC Suresh Gowda"),
        ("EM-010", "firetruck", "CAM-01", "Indiranagar 100ft Rd",  12.9716, 77.6412, "Checkpost 1", "SI Ramesh Kumar"),
        ("EM-011", "ambulance", "CAM-04", "Koramangala 80ft Rd",   12.9352, 77.6245, "Checkpost 3", "PI Meera Nair"),
        ("EM-012", "ambulance", "CAM-03", "MG Road Junction",      12.9756, 77.6068, "Checkpost 3", "SI Priya Sharma"),
    ]
    for e in ems:
        conn.execute(
            "INSERT INTO emergencies (id,vehicle,camera,location,lat,lng,checkpost,officer,status,created_at) "
            "VALUES (?,?,?,?,?,?,?,?,'active',?)", (*e, now - random.randint(20, 900)))
    # a few resolved ones for the alert-history view
    res = [
        ("EM-090", "ambulance", "CAM-02", "Brigade Road Junction", 12.9719, 77.6068, "Checkpost 1", "SI Ramesh Kumar"),
        ("EM-091", "firetruck", "CAM-03", "MG Road Junction",      12.9756, 77.6068, "Checkpost 3", "SI Priya Sharma"),
        ("EM-092", "ambulance", "CAM-06", "Hebbal Flyover",        13.0358, 77.5970, "Checkpost 7", "HC Suresh Gowda"),
    ]
    for e in res:
        conn.execute(
            "INSERT INTO emergencies (id,vehicle,camera,location,lat,lng,checkpost,officer,status,created_at) "
            "VALUES (?,?,?,?,?,?,?,?,'resolved',?)", (*e, now - random.randint(3600, 7200)))
    conn.commit(); conn.close()
    # notifications AFTER the emergency transaction is committed (avoid WAL lock)
    for e in ems:
        db.add_notification("officer", "emergency", f"{e[1].title()} detected at {e[3]}",
                            f"Green corridor relayed to {e[6]} ({e[7]}).", "/officer/emergencies")
    db.log(f"Seeded {n} demo challans + {len(ems)} active emergencies", "System")
    # auto-email the demo challans so the officer Outbox is pre-populated
    from . import mailer
    from . import pdf as pdfgen
    sent = 0
    for i in range(ncit):
        cid = f"DRI-{i + 1:05d}"
        row = db.connect().execute("SELECT * FROM challans WHERE challan_id=?", (cid,)).fetchone()
        if not row:
            continue
        ch = db.row_to_challan(row)
        try:
            mailer.send_challan_email(ch, pdfgen.challan_pdf(ch))
            sent += 1
        except Exception as ex:
            print(f"[seed] email {cid} failed: {ex}")
    print(f"[seed] {n} challans + {len(ems)} active + {len(res)} resolved emergencies + {sent} emails written")


if __name__ == "__main__":
    main()
