"""Conversational analytics — Claude with a query_challans tool over SQLite.

Needs ANTHROPIC_API_KEY in the environment. Falls back to a plain SQL summary
answer if the key is missing so the endpoint never hard-fails in a demo.
"""
import json
import os

from . import db

MODEL = "claude-haiku-4-5-20251001"

_SYSTEM = (
    "You are the analytics assistant for DRISHTI, a traffic-violation system. "
    "Users are police officers. Answer concisely with concrete numbers. "
    "Use the query_challans tool to pull data before answering. "
    "When useful, end with a one-line 'Chart: <type> of <field>' hint the UI can render."
)

_TOOLS = [{
    "name": "query_challans",
    "description": "Aggregate or list traffic challans from the database.",
    "input_schema": {
        "type": "object",
        "properties": {
            "group_by": {"type": "string", "enum": ["violation", "camera", "status", "hour", "none"],
                          "description": "Field to group counts by."},
            "violation": {"type": "string", "description": "Filter to one violation type, optional."},
            "status": {"type": "string", "description": "Filter to one status, optional."},
            "limit": {"type": "integer", "description": "Max rows for a listing query."},
        },
    },
}]


def _run_query(args: dict) -> dict:
    gb = args.get("group_by", "none")
    where, params = [], []
    if args.get("violation"):
        where.append("violation=?"); params.append(args["violation"])
    if args.get("status"):
        where.append("status=?"); params.append(args["status"])
    wsql = (" WHERE " + " AND ".join(where)) if where else ""
    conn = db.connect()
    if gb == "hour":
        col = "CAST(strftime('%H', datetime(created_at,'unixepoch')) AS INTEGER)"
        rows = conn.execute(f"SELECT {col} as k, COUNT(*) c FROM challans{wsql} GROUP BY k ORDER BY k", params).fetchall()
    elif gb in ("violation", "camera", "status"):
        rows = conn.execute(f"SELECT {gb} as k, COUNT(*) c FROM challans{wsql} GROUP BY {gb} ORDER BY c DESC", params).fetchall()
    else:
        lim = args.get("limit", 10)
        rows = conn.execute(f"SELECT challan_id k, fine_inr c FROM challans{wsql} ORDER BY created_at DESC LIMIT ?", params + [lim]).fetchall()
    total = conn.execute(f"SELECT COUNT(*) FROM challans{wsql}", params).fetchone()[0]
    conn.close()
    return {"total": total, "rows": [{"key": r["k"], "value": r["c"]} for r in rows]}


VLABEL = {
    "no_helmet": "no-helmet", "phone_use": "phone use", "red_light": "red-light",
    "seatbelt": "seatbelt", "triple_riding": "triple-riding", "overspeed": "over-speeding",
    "wrong_side": "wrong-side", "illegal_parking": "illegal parking",
}


def _inr(n):
    try:
        return "Rs. " + format(int(n), ",d")
    except Exception:
        return f"Rs. {n}"


def _offline_answer(query: str) -> dict:
    """Rule-based analytics over the real DB — answers each intent distinctly."""
    q = (query or "").lower()
    conn = db.connect()

    def rows(sql, params=()):
        return [dict(r) for r in conn.execute(sql, params).fetchall()]

    # ── junction / camera / location ──
    if any(w in q for w in ("junction", "camera", "location", "where", "hotspot", "zone", "area", "prediction", "predict", "flow")):
        r = rows("SELECT camera as k, location, COUNT(*) c FROM challans GROUP BY camera ORDER BY c DESC")
        conn.close()
        top = r[0]
        reply = (f"{top['location']} ({top['k']}) is the busiest spot with {top['c']} violations. "
                 f"Full ranking across {len(r)} cameras is below — deploy officers to the top zones during peak hours.")
        return {"reply": reply, "data": {"rows": [{"key": x["k"], "value": x["c"]} for x in r]}, "chart": "bar"}

    # ── repeat offenders ──
    if "repeat" in q or "offender" in q:
        tot = conn.execute("SELECT COUNT(*) FROM challans WHERE repeat_offender=1").fetchone()[0]
        top = rows("SELECT plate as k, COUNT(*) c FROM challans WHERE repeat_offender=1 GROUP BY plate ORDER BY c DESC LIMIT 8")
        conn.close()
        reply = (f"There are {tot} repeat-offender challans (fines auto-doubled). "
                 f"Top repeat plates: " + ", ".join(f"{x['k']} ({x['c']})" for x in top[:5]) + ".")
        return {"reply": reply, "data": {"rows": [{"key": x["k"], "value": x["c"]} for x in top]}, "chart": "bar"}

    # ── compare helmet vs phone ──
    if ("helmet" in q and "phone" in q) or "compare" in q or " vs" in q:
        h = conn.execute("SELECT COUNT(*) FROM challans WHERE violation='no_helmet'").fetchone()[0]
        p = conn.execute("SELECT COUNT(*) FROM challans WHERE violation='phone_use'").fetchone()[0]
        conn.close()
        more = "no-helmet" if h >= p else "phone-use"
        reply = (f"No-helmet: {h} challans · Phone-use: {p} challans. "
                 f"{more} violations are more frequent ({abs(h - p)} more).")
        return {"reply": reply, "data": {"rows": [{"key": "no_helmet", "value": h}, {"key": "phone_use", "value": p}]}, "chart": "bar"}

    # ── officer / leaderboard (proxy: enforcement by camera zone) ──
    if "officer" in q or "leaderboard" in q or "performance" in q:
        r = rows("SELECT camera as k, COUNT(*) c FROM challans GROUP BY camera ORDER BY c DESC")
        conn.close()
        reply = ("Enforcement leaderboard by camera zone (challans captured). "
                 f"Top zone: {r[0]['k']} with {r[0]['c']}. Officers are assigned per checkpost.")
        return {"reply": reply, "data": {"rows": [{"key": x["k"], "value": x["c"]} for x in r]}, "chart": "bar"}

    # ── collection / revenue / fines / paid ──
    if any(w in q for w in ("collect", "revenue", "fine", "paid", "payment", "money", "amount")):
        paid = conn.execute("SELECT COUNT(*), COALESCE(SUM(fine_inr),0) FROM challans WHERE status='PAID'").fetchone()
        pend = conn.execute("SELECT COALESCE(SUM(fine_inr),0) FROM challans WHERE status!='PAID'").fetchone()[0]
        conn.close()
        reply = (f"Collected {_inr(paid[1])} from {paid[0]} paid challans. "
                 f"Outstanding (unpaid) fines total {_inr(pend)}.")
        return {"reply": reply, "data": None, "chart": None}

    # ── status breakdown ──
    if "status" in q or "pending" in q or "review" in q or "contest" in q:
        r = rows("SELECT status as k, COUNT(*) c FROM challans GROUP BY status ORDER BY c DESC")
        conn.close()
        reply = "Challan status breakdown: " + ", ".join(f"{x['k']}: {x['c']}" for x in r) + "."
        return {"reply": reply, "data": {"rows": [{"key": x["k"], "value": x["c"]} for x in r]}, "chart": "bar"}

    # ── greeting / unclear ──
    if len(q.strip()) < 3 or not any(c.isalpha() for c in q):
        conn.close()
        return {"reply": "Hi! I'm DrishtiBot. Ask me things like: “Which junction had the most violations?”, "
                "“Show repeat offenders”, “Compare helmet vs phone violations”, or “How much have we collected?”",
                "data": None, "chart": None}

    # ── default: top violations + totals ──
    total = conn.execute("SELECT COUNT(*) FROM challans").fetchone()[0]
    r = rows("SELECT violation as k, COUNT(*) c FROM challans GROUP BY violation ORDER BY c DESC")
    conn.close()
    reply = (f"Across {total} challans, the top violation is {VLABEL.get(r[0]['k'], r[0]['k'])} ({r[0]['c']}). "
             "Full breakdown by type is below.")
    return {"reply": reply, "data": {"rows": [{"key": x["k"], "value": x["c"]} for x in r]}, "chart": "bar"}


async def chat_handler(messages: list) -> dict:
    key = os.environ.get("ANTHROPIC_API_KEY")
    last_user = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
    if not key:
        return _offline_answer(last_user)
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=key)
        convo = [{"role": m["role"], "content": m["content"]} for m in messages]
        last_data = None
        for _ in range(4):  # allow a couple of tool round-trips
            resp = client.messages.create(model=MODEL, max_tokens=1024, system=_SYSTEM,
                                           tools=_TOOLS, messages=convo)
            if resp.stop_reason == "tool_use":
                convo.append({"role": "assistant", "content": resp.content})
                results = []
                for block in resp.content:
                    if block.type == "tool_use":
                        last_data = _run_query(block.input)
                        results.append({"type": "tool_result", "tool_use_id": block.id,
                                        "content": json.dumps(last_data)})
                convo.append({"role": "user", "content": results})
                continue
            text = "".join(b.text for b in resp.content if b.type == "text")
            chart = "bar" if last_data and len(last_data["rows"]) > 1 else None
            return {"reply": text, "data": last_data, "chart": chart}
    except Exception:
        pass
    # any failure (network / quota / bad key) → reliable offline answer
    return _offline_answer(last_user)
