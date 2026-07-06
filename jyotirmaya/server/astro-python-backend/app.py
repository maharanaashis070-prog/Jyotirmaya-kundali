"""
Surya Swiss Ephemeris Backend — Python (Moshier, no .se1 files needed)
Endpoint: POST /calculate  GET /health
Contract: V13 — planets{degree,rashi,sign,nakshatra,nakshatra_data,house,...}
"""

import sys, os, json, math
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Ephemeris setup ───────────────────────────────────────────────────────────
try:
    import swisseph as swe
except ImportError:
    print("ERROR: pyswisseph not installed. Run: pip install pyswisseph")
    sys.exit(1)

EPHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ephe")
swe.set_ephe_path(EPHE_PATH)
swe.set_sid_mode(swe.SIDM_LAHIRI)

# Moshier = no .se1 files needed, still accurate to ~1 arcminute
FLAGS_TROP  = swe.FLG_MOSEPH | swe.FLG_SPEED
FLAGS_SID   = swe.FLG_MOSEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED

# ── Constants ─────────────────────────────────────────────────────────────────
SIGNS = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
    'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
]
NAKSHATRAS = [
    'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
    'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
    'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
    'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
    'Purva Bhadrapada','Uttara Bhadrapada','Revati'
]
NAK_LORDS = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury']
TITHIS = [
    'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi',
    'Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi',
    'Trayodashi','Chaturdashi','Purnima/Amavasya'
]
YOGAS = [
    'Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda',
    'Sukarma','Dhriti','Shoola','Ganda','Vriddhi','Dhruva','Vyaghata',
    'Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha',
    'Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'
]
_K7 = ['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti']
KARANA = ['Kimstughna'] + _K7 * 8 + ['Shakuni','Chatushpada','Naga']  # 60 total
VARA = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

PLANET_IDS = {
    'Sun':     swe.SUN,
    'Moon':    swe.MOON,
    'Mars':    swe.MARS,
    'Mercury': swe.MERCURY,
    'Jupiter': swe.JUPITER,
    'Venus':   swe.VENUS,
    'Saturn':  swe.SATURN,
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def norm360(x):
    v = x % 360
    return v + 360 if v < 0 else v

def parts_to_jd(year, month, day, hour, minute, tz_offset):
    """Local time → UTC → Julian Day (same logic as timeUtils.js V19)"""
    local_min = hour * 60 + minute
    utc_min   = local_min - round(tz_offset * 60)
    utc_h = utc_min // 60
    utc_m = ((utc_min % 60) + 60) % 60
    # Handle day rollover
    import datetime
    base = datetime.datetime(year, month, day, 0, 0, 0)
    delta = datetime.timedelta(hours=int(utc_h), minutes=int(utc_m))
    utc_dt = base + delta
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                      utc_dt.hour + utc_dt.minute/60.0)

def get_navamsa(sid_lon):
    lon      = norm360(sid_lon)
    sign_idx = int(lon / 30)
    rem      = lon % 30
    nav_idx  = int(rem / (30/9))
    elem     = sign_idx % 4
    starts   = [0, 4, 8, 0]
    nav_sign = (starts[elem] + nav_idx) % 12
    return {
        "sign":    SIGNS[nav_sign],
        "signIdx": nav_sign,
        "degree":  round((rem % (30/9)) * 9, 4)
    }

def enrich_lon(sid_lon, speed, ayan):
    sid      = norm360(sid_lon)
    sign_idx = int(sid / 30)
    nak_idx  = int(sid / (360/27))
    pada     = int((sid % (360/27)) / (360/108)) + 1
    sign_nm  = SIGNS[sign_idx]
    nak_nm   = NAKSHATRAS[nak_idx]
    nak_lord = NAK_LORDS[nak_idx % 9]
    deg_in_nak = sid % (360/27)
    return {
        "degree":       round(sid, 6),
        "rashi":        sign_nm,
        "sign":         sign_nm,
        "nakshatra":    nak_nm,
        "nakshatra_data": {
            "name":     nak_nm,
            "lord":     nak_lord,
            "pada":     pada,
            "index":    nak_idx,
            "degInNak": round(deg_in_nak, 6),
        },
        "signIdx":      sign_idx,
        "degreeInSign": round(sid % 30, 6),
        "navamsa":      get_navamsa(sid),
        "ayanamsha":    round(ayan, 6),
        "speed":        round(speed, 6),
        "retrograde":   speed < 0,
        "source":       "pyswisseph-moshier-v1",
        "confidence":   "high",
    }

def get_ayanamsa(jd):
    return swe.get_ayanamsa_ut(jd)

def get_planet_tropical(jd, planet_id):
    res = swe.calc_ut(jd, planet_id, FLAGS_TROP)
    lon   = res[0][0]
    speed = res[0][3]
    return norm360(lon), speed

def get_rahu_ketu(jd, ayan):
    try:
        res = swe.calc_ut(jd, swe.TRUE_NODE, FLAGS_TROP)
    except Exception:
        res = swe.calc_ut(jd, swe.MEAN_NODE, FLAGS_TROP)
    trop  = norm360(res[0][0])
    speed = res[0][3]
    sid   = norm360(trop - ayan)
    return sid, norm360(sid + 180), speed

def get_ascendant(jd, lat, lon, ayan):
    try:
        houses = swe.houses(jd, lat, lon, b'E')  # Equal houses
        # houses returns (cusps_tuple[12], ascmc_tuple[8])
        cusps = houses[0]   # 12 values: tropical house cusps [0..11]
        ascmc = houses[1]   # [0]=ascendant, [1]=MC
        trop_asc = norm360(ascmc[0])
        trop_mc  = norm360(ascmc[1])
        asc_sid  = norm360(trop_asc - ayan)
        mc_sid   = norm360(trop_mc  - ayan)

        house_cusps = []
        for i in range(12):
            c_trop = norm360(cusps[i])
            c_sid  = norm360(c_trop - ayan)
            si     = int(c_sid / 30)
            ni     = int(c_sid / (360/27))
            house_cusps.append({
                "house":     i + 1,
                "cusp":      round(c_sid, 6),
                "sign":      SIGNS[si],
                "degree":    round(c_sid % 30, 6),
                "nakshatra": NAKSHATRAS[ni],
                "pada":      int((c_sid % (360/27)) / (360/108)) + 1,
            })

        asc_si  = int(asc_sid / 30)
        asc_ni  = int(asc_sid / (360/27))
        asc_nak = NAKSHATRAS[asc_ni]
        return {
            "ascendant": {
                "degree":       round(asc_sid, 6),
                "rashi":        SIGNS[asc_si],
                "sign":         SIGNS[asc_si],
                "signIdx":      asc_si,
                "degreeInSign": round(asc_sid % 30, 6),
                "nakshatra":    asc_nak,
                "nakshatra_data": {
                    "name":  asc_nak,
                    "lord":  NAK_LORDS[asc_ni % 9],
                    "pada":  int((asc_sid % (360/27)) / (360/108)) + 1,
                    "index": asc_ni,
                },
                "navamsa": get_navamsa(asc_sid),
            },
            "mc": {
                "degree":       round(mc_sid, 6),
                "rashi":        SIGNS[int(mc_sid / 30)],
                "sign":         SIGNS[int(mc_sid / 30)],
                "degreeInSign": round(mc_sid % 30, 6),
            },
            "houseCusps": house_cusps,
            "ayanamsha":  round(ayan, 6),
        }
    except Exception as e:
        print(f"[ASC] Failed: {e}")
        return None

def assign_houses(planets, lagna_data):
    if not lagna_data or "ascendant" not in lagna_data:
        for p in planets:
            planets[p]["house"] = 1
        return planets
    asc_lon = lagna_data["ascendant"]["degree"]
    for name, data in planets.items():
        diff  = (data["degree"] - asc_lon + 360) % 360
        house = int(diff / 30) + 1
        planets[name]["house"] = house
    return planets

# ── Panchang calculations ─────────────────────────────────────────────────────
def calc_tithi(sun_sid, moon_sid):
    diff = norm360(moon_sid - sun_sid)
    idx  = int(diff / 12) % 15
    return TITHIS[idx]

def calc_nakshatra(moon_sid):
    return NAKSHATRAS[int(moon_sid / (360/27))]

def calc_yoga(sun_sid, moon_sid):
    total = norm360(sun_sid + moon_sid)
    return YOGAS[int(total / (360/27))]

def calc_karana(sun_sid, moon_sid):
    diff = norm360(moon_sid - sun_sid)
    idx  = int(diff / 6)
    return KARANA[idx % 60]

def calc_vara(jd):
    day_num = int(jd + 1.5) % 7
    return VARA[day_num]

def jd_to_ist_time(jd):
    """Convert JD to IST (UTC+5:30) time string"""
    frac  = (jd - int(jd) + 0.5) % 1
    mins  = frac * 1440 + 330  # +330 min = IST
    mins %= 1440
    h = int(mins // 60)
    m = int(mins % 60)
    return f"{h:02d}:{m:02d}"

def get_sunrise_sunset(jd, lat, lon):
    try:
        geopos = (lon, lat, 0)
        flags  = swe.FLG_MOSEPH
        rise_res = swe.rise_trans(jd - 0.5, swe.SUN,
                                  swe.CALC_RISE | swe.BIT_DISC_CENTER,
                                  geopos, atpress=1013.25, attemp=15, flags=flags)
        set_res  = swe.rise_trans(jd - 0.5, swe.SUN,
                                  swe.CALC_SET  | swe.BIT_DISC_CENTER,
                                  geopos, atpress=1013.25, attemp=15, flags=flags)
        rise_jd = rise_res[1][0] if rise_res[0] == 0 else None
        set_jd  = set_res[1][0]  if set_res[0]  == 0 else None
        return rise_jd, set_jd
    except Exception as e:
        print(f"[RISE] {e}")
        return None, None

def calc_rahukaal(sunrise_jd, sunset_jd, vara):
    """Compute Rahukaal for the day"""
    RAHU_ORDER = [8, 2, 7, 5, 6, 4, 3]  # Sun..Sat
    VARA_MAP   = {'Sunday':0,'Monday':1,'Tuesday':2,'Wednesday':3,
                  'Thursday':4,'Friday':5,'Saturday':6}
    if sunrise_jd is None or sunset_jd is None:
        return None
    day_len = (sunset_jd - sunrise_jd) / 8  # 8 segments
    seg = RAHU_ORDER[VARA_MAP.get(vara, 0)]
    rahu_start = sunrise_jd + (seg - 1) * day_len
    rahu_end   = rahu_start + day_len
    return {
        "start":    jd_to_ist_time(rahu_start),
        "end":      jd_to_ist_time(rahu_end),
        "startJD":  rahu_start,
        "endJD":    rahu_end,
    }

# ── Main chart builder ────────────────────────────────────────────────────────
def generate_chart(data):
    year     = int(data["year"])
    month    = int(data["month"])
    day      = int(data["day"])
    hour     = int(data.get("hour", 12))
    minute   = int(data.get("minute", 0))
    lat      = float(data.get("lat", 0))
    lon      = float(data.get("lon", data.get("longitude", 0)))
    tz       = float(data.get("tzOffset", 5.5))

    jd   = parts_to_jd(year, month, day, hour, minute, tz)
    ayan = get_ayanamsa(jd)

    # Planets
    planets = {}
    for name, pid in PLANET_IDS.items():
        trop, speed = get_planet_tropical(jd, pid)
        sid         = norm360(trop - ayan)
        planets[name] = enrich_lon(sid, speed, ayan)

    # Rahu / Ketu
    rahu_sid, ketu_sid, node_speed = get_rahu_ketu(jd, ayan)
    planets["Rahu"] = enrich_lon(rahu_sid, node_speed, ayan)
    planets["Ketu"] = enrich_lon(ketu_sid, node_speed, ayan)
    planets["Rahu"]["source"] = "pyswisseph-true-node"
    planets["Ketu"]["source"] = "pyswisseph-true-node"

    # Ascendant & houses
    lagna_data = get_ascendant(jd, lat, lon, ayan) if (lat != 0 or lon != 0) else None

    # House assignment
    assign_houses(planets, lagna_data)

    # Panchang
    sun_sid  = planets["Sun"]["degree"]
    moon_sid = planets["Moon"]["degree"]
    tithi    = calc_tithi(sun_sid, moon_sid)
    nakshatra = calc_nakshatra(moon_sid)
    yoga      = calc_yoga(sun_sid, moon_sid)
    karana    = calc_karana(sun_sid, moon_sid)
    vara      = calc_vara(jd)

    # Sunrise / Sunset
    rise_jd, set_jd = get_sunrise_sunset(jd, lat, lon)
    rahukaal = calc_rahukaal(rise_jd, set_jd, vara) if rise_jd else None

    result = {
        "success":  True,
        "planets":  planets,
        "meta": {
            "engine":     "pyswisseph-moshier-v1",
            "ayanamsha":  round(ayan, 6),
            "jd":         round(jd, 6),
            "ayanamshaType": "Lahiri",
        },
        "panchang": {
            "tithi":     tithi,
            "nakshatra": nakshatra,
            "yoga":      yoga,
            "karana":    karana,
            "vara":      vara,
        },
        "sunrise": jd_to_ist_time(rise_jd) if rise_jd else None,
        "sunset":  jd_to_ist_time(set_jd)  if set_jd  else None,
        "sunriseJD": rise_jd,
        "sunsetJD":  set_jd,
        "rahukaal":  rahukaal,
        # Legacy fields for HTML patch script
        "sunLonSidereal":  sun_sid,
        "moonLonSidereal": moon_sid,
    }

    if lagna_data:
        result["lagna"]      = lagna_data.get("ascendant")
        result["ascendant"]  = lagna_data.get("ascendant")
        result["mc"]         = lagna_data.get("mc")
        result["houseCusps"] = lagna_data.get("houseCusps")
        result["ayanamsha"]  = lagna_data.get("ayanamsha")

    return result

# ── HTTP Server ───────────────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{self.command}] {self.path} — {args[1] if len(args)>1 else ''}")

    def send_json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {
                "status": "ok",
                "engine": "pyswisseph-moshier",
                "version": "v1"
            })
        else:
            self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path not in ("/calculate", "/api/chart", "/chart"):
            self.send_json(404, {"error": "Unknown endpoint"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw    = self.rfile.read(length)
            data   = json.loads(raw)
            result = generate_chart(data)
            self.send_json(200, result)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_json(500, {"error": str(e)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    print(f"✦ Surya Ephemeris Engine — http://localhost:{port}")
    print(f"  Ayanamsha: Lahiri | Engine: Moshier (no .se1 files needed)")
    print(f"  Ephe path: {EPHE_PATH}")
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
