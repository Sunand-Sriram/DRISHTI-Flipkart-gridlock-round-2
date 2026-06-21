"""Challan + receipt PDF generation (reportlab). Returns bytes for streaming."""
import io
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfgen import canvas

INDIGO = colors.HexColor("#6366f1")
DARK = colors.HexColor("#0f172a")
RED = colors.HexColor("#dc2626")
GREY = colors.HexColor("#64748b")
W, H = A4
EVID_DIR = Path(__file__).resolve().parents[1] / "runs" / "drishti"


def _header(c, title):
    c.setFillColor(INDIGO)
    c.rect(0, H - 2.4 * cm, W, 2.4 * cm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(1.5 * cm, H - 1.5 * cm, "DRISHTI")
    c.setFont("Helvetica", 11)
    c.drawString(1.5 * cm, H - 2.05 * cm, title)


def _watermark(c, text):
    c.saveState()
    c.setFont("Helvetica-Bold", 60)
    c.setFillColor(colors.HexColor("#f1f5f9"))
    c.translate(W / 2, H / 2)
    c.rotate(40)
    c.drawCentredString(0, 0, text)
    c.restoreState()


def _row(c, y, label, value, value_color=DARK, bold=False):
    c.setFillColor(GREY)
    c.setFont("Helvetica", 10)
    c.drawString(1.5 * cm, y, label)
    c.setFillColor(value_color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", 11 if not bold else 13)
    c.drawString(8 * cm, y, str(value))
    return y - 0.7 * cm


def challan_pdf(ch: dict) -> bytes:
    """ch = challan dict from db.row_to_challan."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    _watermark(c, "e-CHALLAN")
    _header(c, "Electronic Traffic Violation Notice")

    owner = ch.get("owner", {})
    y = H - 3.4 * cm
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1.5 * cm, y, f"Challan No: {ch['challan_id']}")
    c.setFillColor(RED if ch["status"] != "PAID" else colors.HexColor("#16a34a"))
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(W - 1.5 * cm, y, ch["status"])
    y -= 1.0 * cm

    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.line(1.5 * cm, y, W - 1.5 * cm, y); y -= 0.8 * cm

    c.setFillColor(INDIGO); c.setFont("Helvetica-Bold", 12)
    c.drawString(1.5 * cm, y, "VIOLATION DETAILS"); y -= 0.8 * cm
    y = _row(c, y, "Violation Type", ch["violation"].replace("_", " ").title())
    y = _row(c, y, "Confidence", f"{(ch.get('confidence') or 0)*100:.0f}%")
    if ch.get("speed_kmh"):
        y = _row(c, y, "Recorded Speed", f"{ch['speed_kmh']} km/h")
    y = _row(c, y, "Camera / Location", f"{ch.get('camera','-')} · {ch.get('location') or '-'}")

    # evidence image (if present)
    ev = ch.get("evidence_image")
    if ev and (EVID_DIR / ev).exists():
        try:
            from reportlab.lib.utils import ImageReader
            img = ImageReader(str(EVID_DIR / ev))
            iw, ih = img.getSize()
            dw = 8 * cm; dh = dw * ih / iw
            c.drawImage(img, W - 1.5 * cm - dw, y - dh + 0.3 * cm, dw, dh,
                        preserveAspectRatio=True, mask="auto")
            y -= dh
        except Exception:
            pass
    y -= 0.4 * cm

    c.setFillColor(INDIGO); c.setFont("Helvetica-Bold", 12)
    c.drawString(1.5 * cm, y, "VEHICLE & OWNER (VAHAN)"); y -= 0.8 * cm
    y = _row(c, y, "Plate", ch.get("plate") or "-")
    y = _row(c, y, "Owner", owner.get("owner", "-"))
    y = _row(c, y, "Make / Model", owner.get("make_model", "-"))
    y = _row(c, y, "Address", owner.get("address", "-"))
    y = _row(c, y, "PUC Valid", "Yes" if owner.get("puc_valid") else "No")
    y = _row(c, y, "Insurance Valid", "Yes" if owner.get("insurance_valid") else "No")
    y -= 0.3 * cm

    c.setFillColor(INDIGO); c.setFont("Helvetica-Bold", 12)
    c.drawString(1.5 * cm, y, "FINE"); y -= 0.8 * cm
    if ch.get("repeat_offender"):
        y = _row(c, y, "Repeat Offender", "Yes — fine doubled (MV Act s.177)", RED)
    y = _row(c, y, "Total Payable", f"Rs. {ch.get('fine_inr', 0):,}", RED, bold=True)

    c.setFillColor(GREY); c.setFont("Helvetica", 9)
    c.drawString(1.5 * cm, 1.5 * cm,
                 "Pay at drishti.vercel.app within 14 days. Computer-generated; no signature required.")
    c.showPage(); c.save()
    return buf.getvalue()


def receipt_pdf(ch: dict, txn: dict) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    _watermark(c, "PAID")
    _header(c, "Payment Receipt")
    y = H - 3.4 * cm
    c.setFillColor(colors.HexColor("#16a34a")); c.setFont("Helvetica-Bold", 16)
    c.drawString(1.5 * cm, y, "Payment Successful"); y -= 1.2 * cm
    y = _row(c, y, "Receipt / Txn", txn.get("txn_id", "-"))
    y = _row(c, y, "Challan No", ch["challan_id"])
    y = _row(c, y, "Vehicle", ch.get("plate") or "-")
    y = _row(c, y, "Violation", ch["violation"].replace("_", " ").title())
    y = _row(c, y, "Amount Paid", f"Rs. {txn.get('amount', 0):,}", colors.HexColor("#16a34a"), bold=True)
    y = _row(c, y, "Method", f"{txn.get('method','Card')} ****{txn.get('card_last4','')}")
    c.setFillColor(GREY); c.setFont("Helvetica", 9)
    c.drawString(1.5 * cm, 1.5 * cm, "Thank you. Keep this receipt for your records.")
    c.showPage(); c.save()
    return buf.getvalue()
