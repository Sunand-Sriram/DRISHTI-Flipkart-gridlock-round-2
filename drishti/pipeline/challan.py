"""Challan engine: mock HSRP/VAHAN registry lookup + MV-Act fine computation +
challan record assembly. SIMULATED registry (real access needs govt authorization),
REAL fine logic — matching the design-doc honesty boundary.
"""
import hashlib

# Indicative MV (Amendment) Act 2019 fines, INR. (type -> base amount)
FINE_SCHEDULE = {
    "no_helmet": 1000,
    "triple_riding": 1000,
    "seatbelt": 1000,
    "phone_use": 1000,
    "red_light": 5000,
    "stop_line": 500,
    "wrong_side": 1100,
    "illegal_parking": 500,
    "overspeed": 2000,
}

_STATES = ["KA", "MH", "DL", "TN", "TS", "AP", "GJ", "UP", "RJ", "WB"]
_MAKES = ["Hero Splendor", "Honda Activa", "Bajaj Pulsar", "Maruti Swift",
          "Hyundai i20", "TVS Jupiter", "Royal Enfield", "Tata Nexon"]


def lookup_vahan(plate: str) -> dict:
    """SIMULATED registry: deterministic realistic owner profile from the plate."""
    if not plate:
        return {}
    h = int(hashlib.sha1(plate.encode()).hexdigest(), 16)
    owner_name = f"Owner-{h % 9000 + 1000}"
    return {
        "plate": plate,
        "owner": owner_name,
        # VAHAN-style contact: this is the email the e-challan is delivered to.
        "email": f"owner{h % 9000 + 1000}@example.com",
        "address": f"{h % 900 + 100}, {_STATES[h % len(_STATES)]} Nagar",
        "phone": f"+91-9{h % 1000000000:09d}",
        "make_model": _MAKES[h % len(_MAKES)],
        "puc_valid": (h % 5) != 0,
        "insurance_valid": (h % 4) != 0,
        "prior_violations": h % 4,
    }


def compute_fine(vtype: str, prior_violations: int = 0) -> int:
    base = FINE_SCHEDULE.get(vtype, 500)
    # repeat-offender escalation: x2 if any priors
    return base * (2 if prior_violations > 0 else 1)


def build_challan(event: dict) -> dict:
    """event: {id,type,frame,conf,plate,evidence,...} -> full challan record."""
    plate = event.get("plate") or ""
    owner = lookup_vahan(plate)
    priors = owner.get("prior_violations", 0)
    fine = compute_fine(event["type"], priors)
    return {
        "challan_id": f"DRI-{event['id']:05d}",
        "violation": event["type"],
        "confidence": event.get("conf"),
        "frame": event.get("frame"),
        "evidence_image": event.get("evidence"),
        "plate": plate,
        "plate_valid": event.get("valid_plate", False),
        "owner": owner,
        "fine_inr": fine,
        "repeat_offender": priors > 0,
        "status": "ISSUED" if (event.get("conf", 0) >= 0.5) else "PENDING_REVIEW",
    }
