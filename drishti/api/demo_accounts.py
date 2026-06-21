"""Curated demo identities for the DRISHTI showcase.

OFFICERS  -> seeded into the officers table; usable on the officer login page.
CITIZENS  -> used as the VAHAN owner records for the first len(CITIZENS) seeded
             challans, so each citizen's {challan_id, plate, email} is a working
             login + a real email-delivery target.

Change DEMO_EMAIL_DOMAIN / override individual emails to route demo mail to an
inbox you control for the live demo.
"""

# Officers (password is shared-simple on purpose for the demo)
OFFICERS = [
    {"name": "SI Ramesh Kumar",   "badge": "KA-1024", "email": "ramesh.kumar@drishti.gov.in",  "station": "Indiranagar Traffic PS", "password": "drishti123", "rank": "Sub-Inspector"},
    {"name": "SI Priya Sharma",    "badge": "KA-1098", "email": "priya.sharma@drishti.gov.in",  "station": "MG Road Traffic PS",     "password": "drishti123", "rank": "Sub-Inspector"},
    {"name": "ASI Anil Reddy",     "badge": "KA-2210", "email": "anil.reddy@drishti.gov.in",    "station": "Silk Board Traffic PS",  "password": "drishti123", "rank": "Asst. Sub-Inspector"},
    {"name": "PI Meera Nair",      "badge": "KA-0471", "email": "meera.nair@drishti.gov.in",    "station": "Koramangala Traffic PS", "password": "drishti123", "rank": "Police Inspector"},
    {"name": "HC Suresh Gowda",    "badge": "KA-3355", "email": "suresh.gowda@drishti.gov.in",  "station": "Hebbal Traffic PS",      "password": "drishti123", "rank": "Head Constable"},
    {"name": "Insp. Vikram Singh", "badge": "KA-0012", "email": "admin@drishti.gov.in",         "station": "Traffic HQ, Bengaluru",  "password": "drishti123", "rank": "Inspector (Admin)"},
]

# Citizens — each becomes the registered owner of a demo challan.
CITIZENS = [
    {"name": "Arjun Mehta",     "email": "arjun.mehta@example.com",   "plate": "KA01AB1234", "phone": "+91-9845012345", "address": "42, 12th Main, Indiranagar, Bengaluru",  "make_model": "Honda Activa 6G"},
    {"name": "Sneha Iyer",      "email": "sneha.iyer@example.com",    "plate": "KA05CJ7788", "phone": "+91-9886045321", "address": "8, 5th Cross, Koramangala, Bengaluru",   "make_model": "Maruti Swift VXi"},
    {"name": "Rahul Verma",     "email": "rahul.verma@example.com",   "plate": "KA03MH4521", "phone": "+91-9742098765", "address": "120, MG Road, Bengaluru",               "make_model": "Bajaj Pulsar 150"},
    {"name": "Fatima Khan",     "email": "fatima.khan@example.com",   "plate": "KA02XY5630", "phone": "+91-9900112233", "address": "17, Brigade Road, Bengaluru",           "make_model": "Hyundai i20 Asta"},
    {"name": "Karthik Rao",     "email": "karthik.rao@example.com",   "plate": "KA04PL9087", "phone": "+91-9663044556", "address": "5, Silk Board Layout, Bengaluru",       "make_model": "Royal Enfield Classic"},
    {"name": "Divya Nair",      "email": "divya.nair@example.com",    "plate": "KA51GH2345", "phone": "+91-9844778899", "address": "33, Hebbal, Bengaluru",                 "make_model": "TVS Jupiter"},
    {"name": "Mohammed Aslam",  "email": "m.aslam@example.com",       "plate": "KA09JK6712", "phone": "+91-9008123456", "address": "76, Jayanagar 4th Block, Bengaluru",    "make_model": "Tata Nexon EV"},
    {"name": "Pooja Shetty",    "email": "pooja.shetty@example.com",  "plate": "KA20DF3398", "phone": "+91-9035667788", "address": "9, Whitefield Main Rd, Bengaluru",      "make_model": "Hero Splendor Plus"},
    {"name": "Vivek Anand",     "email": "vivek.anand@example.com",   "plate": "KA53RT1100", "phone": "+91-9740011223", "address": "201, Electronic City, Bengaluru",       "make_model": "Honda City ZX"},
    {"name": "Ananya Das",      "email": "ananya.das@example.com",    "plate": "KA41BC8855", "phone": "+91-9886554433", "address": "14, Malleshwaram, Bengaluru",           "make_model": "Suzuki Access 125"},
]


def citizen_owner(i: int) -> dict:
    """VAHAN-style owner record for the i-th demo citizen (with email)."""
    c = CITIZENS[i % len(CITIZENS)]
    h = (i * 7) % 100
    return {
        "plate": c["plate"],
        "owner": c["name"],
        "name": c["name"],
        "email": c["email"],
        "phone": c["phone"],
        "address": c["address"],
        "make_model": c["make_model"],
        "puc_valid": h % 5 != 0,
        "insurance_valid": h % 4 != 0,
        "prior_violations": i % 3,
    }
