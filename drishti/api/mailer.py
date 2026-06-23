"""DRISHTI email delivery.

How the offender's address is found: the plate is looked up in the (simulated)
VAHAN/HSRP registry, whose owner record carries an `email`. That address is the
delivery target — exactly how a production VAHAN integration would work.

Two modes, auto-selected:
  • SMTP mode  — if DRISHTI_SMTP_HOST/USER/PASS are set, sends a real email
                 (HTML + plaintext + the challan PDF attached).
  • Outbox mode — otherwise renders the same email to drishti/api/outbox/*.html
                 so it is fully demonstrable without credentials.

Env:
  DRISHTI_SMTP_HOST, DRISHTI_SMTP_PORT (587), DRISHTI_SMTP_USER, DRISHTI_SMTP_PASS,
  DRISHTI_MAIL_FROM ("DRISHTI Traffic <no-reply@drishti.gov.in>"),
  DRISHTI_PORTAL_URL ("http://localhost:5173")
"""
import json
import os
import smtplib
import ssl
import time
from email.message import EmailMessage
from pathlib import Path

OUTBOX = Path(__file__).resolve().parent / "outbox"
OUTBOX.mkdir(exist_ok=True)
OUTBOX_INDEX = OUTBOX / "index.json"

PORTAL_URL = os.environ.get("DRISHTI_PORTAL_URL", "http://localhost:5174")
MAIL_FROM = os.environ.get("DRISHTI_MAIL_FROM", "DRISHTI Traffic Police <no-reply@drishti.gov.in>")

VIOLATION_LABEL = {
    "no_helmet": "No Helmet", "phone_use": "Mobile Phone Use", "red_light": "Red-Light Jump",
    "seatbelt": "No Seatbelt", "triple_riding": "Triple Riding", "overspeed": "Over-speeding",
    "wrong_side": "Wrong-Side Driving", "illegal_parking": "Illegal Parking", "stop_line": "Stop-Line Violation",
}


def _inr(n) -> str:
    try:
        return "Rs. " + format(int(n), ",d")
    except Exception:
        return f"Rs. {n}"


def smtp_configured() -> bool:
    return bool(os.environ.get("DRISHTI_SMTP_HOST") and os.environ.get("DRISHTI_SMTP_USER")
               and os.environ.get("DRISHTI_SMTP_PASS"))


# ──────────────────────────────────────────────────────────────────────────────
# Templates
# ──────────────────────────────────────────────────────────────────────────────
def render_challan_html(ch: dict) -> str:
    cid = ch.get("challan_id", "")
    owner = ch.get("owner", {}) or {}
    name = owner.get("owner") or owner.get("name") or "Vehicle Owner"
    vtype = VIOLATION_LABEL.get(ch.get("violation", ""), ch.get("violation", "Violation"))
    plate = ch.get("plate") or "—"
    fine = ch.get("fine_inr") or 0
    base = ch.get("base_fine_inr") or fine
    mult = ch.get("repeat_multiplier") or 1
    conf = ch.get("confidence")
    conf_txt = f"{round(conf * 100)}% AI confidence" if conf else ""
    cam = ch.get("camera", "")
    loc = ch.get("location") or ""
    deadline = ch.get("payment_deadline", "")
    speed = ch.get("speed_kmh")
    pay_url = f"{PORTAL_URL}/citizen/pay/{cid}"
    view_url = f"{PORTAL_URL}/citizen/challan/{cid}"
    contest_url = f"{PORTAL_URL}/citizen/contest/{cid}"

    repeat_row = ""
    if mult > 1:
        repeat_row = f"""
          <tr><td style="padding:4px 0;color:#717a88;font-size:14px;">Repeat-offender surcharge (x{mult})</td>
              <td align="right" style="padding:4px 0;color:#15181e;font-size:14px;font-family:'Courier New',monospace;">{_inr(fine - base)}</td></tr>"""
    speed_row = ""
    if speed:
        speed_row = f"""
          <tr><td style="padding:4px 0;color:#717a88;font-size:14px;">Recorded speed</td>
              <td align="right" style="padding:4px 0;color:#d92d20;font-size:14px;font-weight:600;">{speed} km/h (limit 60)</td></tr>"""

    return f"""<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f8;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f8;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(13,20,44,.10);">

        <!-- header -->
        <tr><td style="background:#060a14;padding:24px 32px;">
          <table role="presentation" width="100%"><tr>
            <td style="color:#f4f6fa;font-size:22px;font-weight:700;letter-spacing:3px;">DRISHTI</td>
            <td align="right" style="color:#ffa733;font-size:11px;letter-spacing:2px;font-family:'Courier New',monospace;">TRAFFIC VIOLATION e-CHALLAN</td>
          </tr></table>
        </td></tr>

        <!-- accent bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#ffa733,#2d5bff);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 4px;color:#15181e;font-size:16px;">Dear {name},</p>
          <p style="margin:0 0 22px;color:#717a88;font-size:14px;line-height:1.6;">
            A traffic violation has been recorded for your vehicle <b style="color:#15181e;">{plate}</b> by the
            DRISHTI automated enforcement system. Details of the e-challan are below.
          </p>

          <!-- challan card -->
          <table role="presentation" width="100%" style="border:1px solid #e6ecf7;border-radius:12px;">
            <tr><td style="padding:18px 20px;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="color:#717a88;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Challan No.</td>
                  <td align="right" style="color:#2d5bff;font-size:15px;font-weight:700;font-family:'Courier New',monospace;">{cid}</td>
                </tr>
              </table>
              <div style="height:1px;background:#e6ecf7;margin:14px 0;"></div>
              <table role="presentation" width="100%" style="font-size:14px;">
                <tr><td style="padding:4px 0;color:#717a88;">Violation</td>
                    <td align="right" style="padding:4px 0;color:#15181e;font-weight:600;">{vtype}</td></tr>
                <tr><td style="padding:4px 0;color:#717a88;">Location</td>
                    <td align="right" style="padding:4px 0;color:#15181e;">{loc} ({cam})</td></tr>
                {speed_row}
                <tr><td style="padding:4px 0;color:#717a88;">Evidence</td>
                    <td align="right" style="padding:4px 0;color:#15181e;">{conf_txt}</td></tr>
              </table>
              <div style="height:1px;background:#e6ecf7;margin:14px 0;"></div>
              <table role="presentation" width="100%" style="font-size:14px;">
                <tr><td style="padding:4px 0;color:#717a88;">Base fine</td>
                    <td align="right" style="padding:4px 0;color:#15181e;font-family:'Courier New',monospace;">{_inr(base)}</td></tr>
                {repeat_row}
                <tr><td style="padding:10px 0 0;color:#15181e;font-size:16px;font-weight:700;border-top:2px solid #15181e;">Total payable</td>
                    <td align="right" style="padding:10px 0 0;color:#2d5bff;font-size:18px;font-weight:700;border-top:2px solid #15181e;font-family:'Courier New',monospace;">{_inr(fine)}</td></tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:18px 0 6px;color:#d92d20;font-size:13px;font-weight:600;">⏳ Please pay before {deadline} to avoid additional penalty.</p>

          <!-- CTAs -->
          <table role="presentation" width="100%" style="margin:22px 0 6px;"><tr>
            <td align="center" style="padding-right:6px;">
              <a href="{pay_url}" style="display:block;background:#2d5bff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 0;border-radius:10px;">Pay Fine Online</a>
            </td>
            <td align="center" style="padding-left:6px;">
              <a href="{view_url}" style="display:block;background:#ffffff;color:#2d5bff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 0;border-radius:10px;border:1.5px solid #2d5bff;">View Challan &amp; Evidence</a>
            </td>
          </tr></table>
          <p style="margin:8px 0 0;text-align:center;font-size:13px;">
            Believe this is a mistake? <a href="{contest_url}" style="color:#2d5bff;">Contest this challan</a>
          </p>

          <p style="margin:24px 0 0;color:#9aa3b2;font-size:12px;line-height:1.6;">
            The official e-challan PDF (with annotated AI evidence) is attached to this email.
            Lookup details: Challan No. <b>{cid}</b> · Vehicle <b>{plate}</b>.
          </p>
        </td></tr>

        <!-- footer -->
        <tr><td style="background:#f5f8ff;padding:20px 32px;border-top:1px solid #e6ecf7;">
          <p style="margin:0;color:#9aa3b2;font-size:11px;line-height:1.6;">
            DRISHTI Traffic Violation Detection System · Bengaluru Traffic Police (demo)<br>
            This is a prototype build. No real payment is processed and data is simulated.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>"""


def render_challan_text(ch: dict) -> str:
    cid = ch.get("challan_id", "")
    vtype = VIOLATION_LABEL.get(ch.get("violation", ""), ch.get("violation", ""))
    return (
        f"DRISHTI e-Challan {cid}\n\n"
        f"Vehicle: {ch.get('plate')}\nViolation: {vtype}\n"
        f"Location: {ch.get('location')} ({ch.get('camera')})\n"
        f"Total payable: {_inr(ch.get('fine_inr'))}\n"
        f"Pay before: {ch.get('payment_deadline')}\n\n"
        f"Pay:     {PORTAL_URL}/citizen/pay/{cid}\n"
        f"View:    {PORTAL_URL}/citizen/challan/{cid}\n"
        f"Contest: {PORTAL_URL}/citizen/contest/{cid}\n"
    )


# ──────────────────────────────────────────────────────────────────────────────
# Sending
# ──────────────────────────────────────────────────────────────────────────────
def send_email(to_addr: str, subject: str, html: str, text: str = "",
               attachment: tuple[str, bytes] | None = None) -> dict:
    """Send via SMTP if configured, else write to outbox. Returns a status dict."""
    msg = EmailMessage()
    msg["From"] = MAIL_FROM
    msg["To"] = to_addr
    msg["Subject"] = subject
    msg.set_content(text or "Please view this email in an HTML-capable client.")
    msg.add_alternative(html, subtype="html")
    if attachment:
        fname, data = attachment
        msg.add_attachment(data, maintype="application", subtype="pdf", filename=fname)

    attach_name = attachment[0] if attachment else None
    # Always record to the outbox so the demo can show "what was sent".
    if smtp_configured():
        host = os.environ["DRISHTI_SMTP_HOST"]
        port = int(os.environ.get("DRISHTI_SMTP_PORT", "587"))
        user = os.environ["DRISHTI_SMTP_USER"]
        pwd = os.environ["DRISHTI_SMTP_PASS"]
        ctx = ssl.create_default_context()
        try:
            with smtplib.SMTP(host, port, timeout=20) as s:
                s.starttls(context=ctx)
                s.login(user, pwd)
                s.send_message(msg)
            _write_outbox(to_addr, subject, html, "smtp", attach_name)
            return {"sent": True, "mode": "smtp", "to": to_addr}
        except Exception as e:  # fall back to outbox so the demo never breaks
            p = _write_outbox(to_addr, subject, html, "smtp_error", attach_name)
            return {"sent": False, "mode": "smtp_error", "to": to_addr, "error": str(e), "preview": p.name}

    path = _write_outbox(to_addr, subject, html, "outbox", attach_name)
    return {"sent": True, "mode": "outbox", "to": to_addr, "preview": path.name}


def _write_outbox(to_addr: str, subject: str, html: str, mode: str = "outbox",
                  attachment: str | None = None) -> Path:
    stamp = time.strftime("%Y%m%d-%H%M%S")
    safe = to_addr.replace("@", "_at_").replace("/", "_")
    name = f"{stamp}_{safe}.html"
    path = OUTBOX / name
    path.write_text(html, encoding="utf-8")
    # maintain a lightweight index for the officer Outbox screen
    idx = []
    if OUTBOX_INDEX.exists():
        try:
            idx = json.loads(OUTBOX_INDEX.read_text())
        except Exception:
            idx = []
    idx.insert(0, {"name": name, "to": to_addr, "subject": subject, "mode": mode,
                   "attachment": attachment, "created_at": time.time()})
    OUTBOX_INDEX.write_text(json.dumps(idx[:200], indent=2))
    return path


def list_outbox() -> list:
    if not OUTBOX_INDEX.exists():
        return []
    try:
        return json.loads(OUTBOX_INDEX.read_text())
    except Exception:
        return []


def read_outbox(name: str) -> str | None:
    # guard against path traversal
    if "/" in name or "\\" in name or ".." in name:
        return None
    p = OUTBOX / name
    return p.read_text(encoding="utf-8") if p.exists() else None


def send_challan_email(ch: dict, pdf_bytes: bytes | None = None) -> dict:
    owner = ch.get("owner", {}) or {}
    to_addr = owner.get("email")
    if not to_addr:
        return {"sent": False, "mode": "no_email", "error": "No email on registry record"}
    subject = f"Traffic e-Challan {ch.get('challan_id')} — {VIOLATION_LABEL.get(ch.get('violation',''), 'Violation')} (Action required)"
    html = render_challan_html(ch)
    text = render_challan_text(ch)
    att = (f"{ch.get('challan_id')}.pdf", pdf_bytes) if pdf_bytes else None
    return send_email(to_addr, subject, html, text, att)
