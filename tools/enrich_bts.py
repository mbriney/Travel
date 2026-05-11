#!/usr/bin/env python3
"""
enrich_bts.py — Backfill tail numbers and aircraft models for the flight log
using free, government-published data:

  1. Bureau of Transportation Statistics (BTS) "Reporting Carrier On-Time
     Performance" — per-flight records with TAIL_NUM going back to ~2003,
     covering every flight by U.S. reporting carriers (AA, DL, UA, WN, AS,
     B6, NK, F9, HA, …) including their international segments.

     https://www.transtats.bts.gov/Tables.asp?gnoyr_VQ=FGJ

  2. FAA Aircraft Registry — maps tail number ("N-number") to aircraft
     model + manufacturer. Refreshed weekly.

     https://registry.faa.gov/database/ReleasableAircraft.zip

How it works:
  - For each month spanning your flight history (default: from first flight
    to two months ago), download the BTS monthly zip if not already cached.
  - Filter that month's millions of rows down to JUST the (carrier, flight#,
    scheduled-date, origin) tuples that match a flight in data/flights.json.
  - Stash every matched row to data/bts_matches.json (incremental — the
    cache survives across runs; we just append new months).
  - Cross-reference matched tail numbers against the FAA registry to get
    aircraft type + model.
  - Merge tail numbers + model strings back into data/flights.json,
    marking each enriched flight with `enriched_source: "bts"`.

Foreign-carrier international segments (e.g. flights on SQ, BA, AF, LH,
JL, etc.) are NOT in BTS — only U.S. reporting carriers report. Those
flights stay un-enriched here; run enrich_aerodatabox.py afterwards to
top them up via AeroDataBox's 365-day API window.

Usage:
    python tools/enrich_bts.py                 # process all flights
    python tools/enrich_bts.py --start 2018-01 # only months from Jan 2018
    python tools/enrich_bts.py --dry-run       # show what would be fetched
    python tools/enrich_bts.py --force-faa     # re-download FAA registry
"""
from __future__ import annotations
import argparse
import csv
import gzip
import io
import json
import os
import re
import shutil
import sys
import time
import zipfile
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

try:
    import requests
except ImportError:
    sys.exit("missing dependency: pip install requests")


REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
RAW_CACHE = DATA_DIR / "_bts_cache" / "raw"     # gitignored — huge zips
MATCHES_PATH = DATA_DIR / "bts_matches.json"    # committed — tiny
FAA_PATH = DATA_DIR / "faa_registry.csv.gz"     # committed — ~15MB gzipped
META_PATH = DATA_DIR / "meta.json"

BTS_URL_TMPL = (
    "https://www.transtats.bts.gov/PREZIP/"
    "On_Time_Reporting_Carrier_On_Time_Performance_1987_present_{year}_{month}.zip"
)
FAA_URL = "https://registry.faa.gov/database/ReleasableAircraft.zip"
# registry.faa.gov 403's anything that doesn't look like a real browser.
# Use a current Chrome UA + Accept headers; this matches what e.g.
# simonw/scrape-faa-releasable-aircraft does to download the file from CI.
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
BROWSER_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/zip,application/octet-stream;q=0.9,*/*;q=0.5",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.faa.gov/licenses_certificates/aircraft_certification/aircraft_registry/releasable_aircraft_download",
}

FAA_FRESHNESS_DAYS = 30


# ─── Utilities ──────────────────────────────────────────────────────────────
def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def load_json(path: Path, default):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as fp:
        return json.load(fp)


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, separators=(",", ":"), ensure_ascii=False)
    tmp.replace(path)


def month_iter(start: date, end: date):
    """Yield (year, month) tuples from start through end inclusive."""
    cur = date(start.year, start.month, 1)
    stop = date(end.year, end.month, 1)
    while cur <= stop:
        yield cur.year, cur.month
        if cur.month == 12:
            cur = date(cur.year + 1, 1, 1)
        else:
            cur = date(cur.year, cur.month + 1, 1)


def stamp_meta(key: str) -> None:
    meta = load_json(META_PATH, {})
    meta[key] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    save_json(META_PATH, meta)


# ─── FAA Aircraft Registry ──────────────────────────────────────────────────
def faa_age_days() -> float | None:
    if not FAA_PATH.exists():
        return None
    mtime = datetime.fromtimestamp(FAA_PATH.stat().st_mtime, tz=timezone.utc)
    return (datetime.now(timezone.utc) - mtime).total_seconds() / 86400


def refresh_faa_registry(force: bool = False) -> None:
    age = faa_age_days()
    if age is not None and age < FAA_FRESHNESS_DAYS and not force:
        log(f"FAA registry is {age:.1f} days old (fresh enough; skip refresh)")
        return

    # Manual-override path: if the user couldn't get past the FAA's bot
    # protection automatically, they can drop the file at
    # data/_bts_cache/ReleasableAircraft.zip and we use it directly.
    manual_zip = RAW_CACHE / "ReleasableAircraft.zip"
    if manual_zip.exists() and manual_zip.stat().st_size > 1_000_000:
        log(f"Using manually-downloaded FAA zip at {manual_zip.relative_to(REPO_ROOT)}")
        buf = io.BytesIO(manual_zip.read_bytes())
        _process_faa_zip(buf)
        return

    log(f"Downloading FAA Aircraft Registry from {FAA_URL} …")
    try:
        r = requests.get(FAA_URL, stream=True, headers=BROWSER_HEADERS, timeout=120)
        r.raise_for_status()
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 403:
            RAW_CACHE.mkdir(parents=True, exist_ok=True)
            sys.exit(
                "\nFAA Aircraft Registry returned 403 Forbidden.\n\n"
                "registry.faa.gov occasionally blocks automated downloads.\n"
                "Workaround — fetch it manually:\n\n"
                f"  1. Open in your browser:  {FAA_URL}\n"
                f"  2. Save the file to:  {(RAW_CACHE / 'ReleasableAircraft.zip').relative_to(REPO_ROOT)}\n"
                "  3. Re-run:  python tools/enrich_bts.py\n\n"
                "The script will detect the local zip and skip the download.\n"
            )
        raise
    buf = io.BytesIO(r.content)
    _process_faa_zip(buf)


def _process_faa_zip(buf: io.BytesIO) -> None:
    """Read a FAA ReleasableAircraft.zip (in-memory) and write the gzipped
    tail→model lookup to FAA_PATH."""
    with zipfile.ZipFile(buf) as zf:
        names = zf.namelist()
        master_name = next((n for n in names if n.upper().startswith("MASTER")), None)
        ac_name = next((n for n in names if n.upper().startswith("ACFTREF")), None)
        if not master_name or not ac_name:
            sys.exit(f"FAA zip is missing MASTER or ACFTREF: {names}")

        # ACFTREF: aircraft type reference (CODE -> manufacturer/model + engine info)
        # FAA files are UTF-8 with a leading BOM. `utf-8-sig` auto-strips the
        # BOM; `errors="replace"` keeps us safe if any row has stray non-UTF-8
        # bytes (rare; mostly affects accented city names, never a join key).
        with zf.open(ac_name) as fp:
            text = io.TextIOWrapper(fp, encoding="utf-8-sig", errors="replace", newline="")
            ac_rdr = csv.DictReader(text)
            # FAA CSV headers ship with trailing whitespace ("MFR MDL CODE ",
            # "CODE ", etc.). Strip them on the DictReader.fieldnames so
            # `row.get("CODE")` actually finds the column instead of None.
            if ac_rdr.fieldnames:
                ac_rdr.fieldnames = [(f or "").strip() for f in ac_rdr.fieldnames]
            type_codes = {}
            for row in ac_rdr:
                code = (row.get("CODE") or "").strip()
                if not code:
                    continue
                # TYPE-ENG: 0=None, 1=Reciprocating, 2=Turbo-prop, 3=Turbo-shaft,
                #           4=Turbo-jet, 5=Turbo-fan, 6=Ramjet, 7=2 cycle,
                #           8=4 cycle, 9=Unknown, 10=Electric, 11=Rotary
                ENG_TYPE_NAMES = {
                    "1": "Piston", "2": "Turboprop", "3": "Turboshaft",
                    "4": "Turbojet", "5": "Turbofan", "10": "Electric",
                    "11": "Rotary",
                }
                eng_type_raw = (row.get("TYPE-ENG") or row.get("TYPE_ENG") or "").strip()
                no_eng_raw = (row.get("NO-ENG") or row.get("NO_ENG") or "").strip()
                type_codes[code] = {
                    "mfr":   (row.get("MFR") or "").strip(),
                    "model": (row.get("MODEL") or "").strip(),
                    "category": (row.get("AC-CAT") or row.get("AC_CAT") or "").strip(),
                    "no_eng": no_eng_raw if no_eng_raw.isdigit() else "",
                    "eng_type": ENG_TYPE_NAMES.get(eng_type_raw, ""),
                }

        # MASTER: N-number registrations. We grab YEAR_MFR (powers New Plane
        # Smell), MODE_S_CODE (plane-spotter detail in the flight modal),
        # SERIAL_NUMBER (MSN — manufacturer's serial — uniquely identifies
        # the airframe across re-registrations), and NAME (current
        # registered owner, useful for showing "now operated by …").
        with zf.open(master_name) as fp:
            text = io.TextIOWrapper(fp, encoding="utf-8-sig", errors="replace", newline="")
            m_rdr = csv.DictReader(text)
            # Same FAA-CSV header-whitespace fix as ACFTREF above.
            if m_rdr.fieldnames:
                m_rdr.fieldnames = [(f or "").strip() for f in m_rdr.fieldnames]
            n_number_info = {}   # n -> dict of fields
            for row in m_rdr:
                n = (row.get("N-NUMBER") or "").strip()
                code = (row.get("MFR MDL CODE") or "").strip()
                if not n or not code:
                    continue
                year_raw = (row.get("YEAR MFR") or "").strip()
                year_mfr = year_raw if year_raw.isdigit() and len(year_raw) == 4 else ""
                n_number_info[n] = {
                    "mfr_mdl_code": code,
                    "year_mfr":     year_mfr,
                    "mode_s":       (row.get("MODE S CODE HEX") or row.get("MODE_S_CODE_HEX") or "").strip().upper(),
                    "serial":       (row.get("SERIAL NUMBER") or row.get("SERIAL_NUMBER") or "").strip(),
                    "owner":        (row.get("NAME") or "").strip(),
                    "status":       (row.get("STATUS CODE") or row.get("STATUS_CODE") or "").strip(),
                }

    # Flatten everything we have on each tail
    out_rows = []
    for n, m in n_number_info.items():
        info = type_codes.get(m["mfr_mdl_code"])
        if not info:
            continue
        out_rows.append((
            f"N{n}",
            info["mfr"],
            info["model"],
            m["year_mfr"],
            info["no_eng"],
            info["eng_type"],
            m["mode_s"],
            m["serial"],
            m["owner"],
            m["status"],
        ))

    log(f"FAA: parsed {len(type_codes):,} aircraft type codes (ACFTREF) and {len(n_number_info):,} N-number registrations (MASTER)")
    FAA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(FAA_PATH, "wt", encoding="utf-8", newline="") as fp:
        w = csv.writer(fp)
        w.writerow(["tail", "mfr", "model", "year_mfr", "no_eng", "eng_type", "mode_s", "serial", "owner", "status"])
        w.writerows(sorted(out_rows))
    log(f"FAA registry: wrote {len(out_rows):,} tail→model rows to {FAA_PATH.relative_to(REPO_ROOT)}")
    stamp_meta("faa_registry_built_at")


def load_faa_lookup() -> dict[str, dict]:
    if not FAA_PATH.exists():
        return {}
    out = {}
    with gzip.open(FAA_PATH, "rt", encoding="utf-8", newline="") as fp:
        rdr = csv.DictReader(fp)
        for row in rdr:
            tail = row["tail"].strip().upper()
            if not tail:
                continue
            out[tail] = {
                "mfr":      row.get("mfr", ""),
                "model":    row.get("model", ""),
                "year_mfr": (row.get("year_mfr") or "").strip(),
                "no_eng":   (row.get("no_eng") or "").strip(),
                "eng_type": (row.get("eng_type") or "").strip(),
                "mode_s":   (row.get("mode_s") or "").strip().upper(),
                "serial":   (row.get("serial") or "").strip(),
                "owner":    (row.get("owner") or "").strip(),
                "status":   (row.get("status") or "").strip(),
            }
    return out


# ─── BTS download + per-month processing ────────────────────────────────────
def bts_monthly_path(year: int, month: int) -> Path:
    return RAW_CACHE / f"{year}_{month:02d}.zip"


def download_bts_month(year: int, month: int) -> tuple[Path | None, str]:
    """Fetch a BTS monthly zip. Returns (path, status) where status is:
       - "ok"        : zip is on disk, ready to parse
       - "not_found" : BTS returned 404 — definitively no data (cache as empty)
       - "not_ready" : 200 but the body isn't a zip (e.g. an HTML error page for
                       a not-yet-published month). DO NOT cache — retry later.
       - "error"     : transient network/HTTP error. DO NOT cache — retry later.
    """
    target = bts_monthly_path(year, month)
    if target.exists() and target.stat().st_size > 100_000:
        # Sanity-check existing cached file — magic bytes should be PK*
        with target.open("rb") as fp:
            magic = fp.read(4)
        if magic[:2] == b"PK":
            return target, "ok"
        # Stale junk from a previous failed run — nuke and refetch
        target.unlink(missing_ok=True)

    url = BTS_URL_TMPL.format(year=year, month=month)
    target.parent.mkdir(parents=True, exist_ok=True)
    log(f"  fetching BTS {year}-{month:02d}  ← {url}")
    try:
        with requests.get(url, stream=True, headers={"User-Agent": USER_AGENT}, timeout=180) as r:
            if r.status_code == 404:
                log(f"  ! BTS has no data for {year}-{month:02d} (404)")
                return None, "not_found"
            r.raise_for_status()
            tmp = target.with_suffix(".zip.part")
            with tmp.open("wb") as fp:
                for chunk in r.iter_content(chunk_size=1 << 16):
                    fp.write(chunk)
            tmp.replace(target)
    except requests.exceptions.RequestException as e:
        log(f"  ! download failed for {year}-{month:02d}: {e}")
        # Don't leave a corrupt partial behind
        if target.exists() and target.stat().st_size < 100_000:
            target.unlink(missing_ok=True)
        return None, "error"

    # Validate magic bytes — zip files start with "PK\x03\x04" (or "PK\x05\x06"
    # for empty zips). BTS sometimes serves a 200 HTML error page for months
    # they haven't published yet, which would later crash zipfile.ZipFile with
    # BadZipFile: "File is not a zip file". Catch it here so the caller knows
    # to retry the month next week instead of caching it as "definitively gone."
    with target.open("rb") as fp:
        magic = fp.read(4)
    if magic[:2] != b"PK":
        # Peek at the first chunk to make the log message useful (e.g. shows
        # the start of the HTML so you can tell it was an error page).
        with target.open("rb") as fp:
            head = fp.read(80).decode("latin-1", errors="replace").strip()
        log(f"  ! {year}-{month:02d}: response isn't a zip (likely not published yet).")
        log(f"    body starts with: {head[:60]!r}")
        target.unlink(missing_ok=True)
        return None, "not_ready"

    return target, "ok"


def parse_bts_csv(zpath: Path, wanted_keys: set[tuple]) -> list[dict] | None:
    """Stream the monthly CSV inside the zip and yield only rows whose
    (carrier, flight#, FlightDate, Origin) is in `wanted_keys`. The match
    set is tiny (~hundreds across years), so we keep matches in memory.

    Returns None on a corrupt/non-zip file — the caller should treat that
    like "not_ready" (retry later) rather than caching the month as empty.
    """
    matched = []
    try:
        zf_ctx = zipfile.ZipFile(zpath)
    except zipfile.BadZipFile:
        log(f"  ! {zpath.name} isn't a valid zip; deleting and skipping this month.")
        zpath.unlink(missing_ok=True)
        return None
    with zf_ctx as zf:
        csv_name = next((n for n in zf.namelist() if n.lower().endswith(".csv")), None)
        if not csv_name:
            return matched
        with zf.open(csv_name) as fp:
            text = io.TextIOWrapper(fp, encoding="latin-1", newline="")
            rdr = csv.DictReader(text)
            for row in rdr:
                carrier = (row.get("Reporting_Airline")
                           or row.get("UniqueCarrier")
                           or row.get("OP_UNIQUE_CARRIER")
                           or "").strip()
                fnum = (row.get("Flight_Number_Reporting_Airline")
                        or row.get("FlightNum")
                        or "").strip().lstrip("0") or "0"
                fdate = (row.get("FlightDate") or row.get("FL_DATE") or "").strip()
                origin = (row.get("Origin") or row.get("ORIGIN") or "").strip()
                key = (carrier, fnum, fdate, origin)
                if key in wanted_keys:
                    # Pull every field that powers a downstream stat or
                    # achievement. BTS field names changed casing over the
                    # years; we accept either snake or BARE_CAPS form.
                    def g(*names):
                        for n in names:
                            v = row.get(n)
                            if v is not None and v != "":
                                return v
                        return ""
                    def gfloat(*names):
                        v = g(*names)
                        try:    return float(v) if v != "" else None
                        except: return None

                    matched.append({
                        "carrier": carrier,
                        "flight":  fnum,
                        "date":    fdate,
                        "from":    origin,
                        "to":      g("Dest", "DEST"),
                        "tail":    g("Tail_Number", "TailNum"),
                        "cancelled": g("Cancelled", "CANCELLED") in ("1", "1.00"),
                        # New fields:
                        "dep_delay":   gfloat("DepDelay", "DEP_DELAY"),
                        "dep_delay_pos": gfloat("DepDelayMinutes", "DEP_DELAY_MINUTES"),  # 0 if early
                        "arr_delay":   gfloat("ArrDelay", "ARR_DELAY"),
                        "arr_delay_pos": gfloat("ArrDelayMinutes", "ARR_DELAY_MINUTES"),
                        "taxi_out":    gfloat("TaxiOut", "TAXI_OUT"),
                        "taxi_in":     gfloat("TaxiIn", "TAXI_IN"),
                        "air_time":    gfloat("AirTime", "AIR_TIME"),
                        "diverted":    g("Diverted", "DIVERTED") in ("1", "1.00"),
                        "cancel_code": g("CancellationCode", "CANCELLATION_CODE"),
                        # Delay causes (only populated when total delay >=15 min)
                        "delay_carrier":       gfloat("CarrierDelay",        "CARRIER_DELAY"),
                        "delay_weather":       gfloat("WeatherDelay",        "WEATHER_DELAY"),
                        "delay_nas":           gfloat("NASDelay",            "NAS_DELAY"),
                        "delay_security":      gfloat("SecurityDelay",       "SECURITY_DELAY"),
                        "delay_late_aircraft": gfloat("LateAircraftDelay",   "LATE_AIRCRAFT_DELAY"),
                    })
    return matched


# ─── Driving the enrichment ─────────────────────────────────────────────────
def build_wanted_keys(flights: list[dict]) -> dict[tuple, list[int]]:
    """Returns mapping from BTS key → list of flight indices. Some flights
    might not have what we need; those are skipped."""
    keys = defaultdict(list)
    for i, f in enumerate(flights):
        carrier = (f.get("airline_code") or "").strip().upper()
        # flights.json uses `flight_number` (string); leave bare `flight` as
        # a fallback for any future records that might use it.
        fnum = str(f.get("flight_number") or f.get("flight") or "").strip()
        # Strip a carrier prefix like "AA1234" → "1234", and any leading
        # zeros so "0411" matches BTS's unpadded "411".
        fnum = re.sub(r"^[A-Z]+", "", fnum).lstrip("0") or "0"
        origin = (f.get("from") or "").strip().upper()
        depart = f.get("depart") or ""
        # Normalize to YYYY-MM-DD
        if depart:
            try:
                d = depart[:10]
                # validate
                datetime.strptime(d, "%Y-%m-%d")
            except (ValueError, TypeError):
                continue
        else:
            continue
        if not (carrier and fnum and origin and d):
            continue
        keys[(carrier, fnum, d, origin)].append(i)
    return keys


def merge_match_into_flight(flight: dict, match: dict, faa: dict) -> bool:
    """Returns True if the flight record was actually updated. Captures
    delay / taxi / status fields from the BTS row and tail-keyed details
    (year, MSN, Mode-S, engine count/type, registered owner) from FAA."""
    changed = False

    # Cancellation / divert flags first — these are status fields, not just
    # additional metadata, and they're useful even when there's no tail.
    if match.get("cancelled") and not flight.get("flight_cancelled"):
        flight["flight_cancelled"] = True
        if match.get("cancel_code"):
            flight["flight_cancel_reason"] = match["cancel_code"]
        changed = True
    if match.get("diverted") and not flight.get("flight_diverted"):
        flight["flight_diverted"] = True
        changed = True

    # Delay / taxi / airtime — all numeric, signed where appropriate.
    # Skip cancelled rows; their timing fields are zero/garbage.
    if not match.get("cancelled"):
        for src, dst in (
            ("dep_delay",          "dep_delay_min"),
            ("arr_delay",          "arr_delay_min"),
            ("taxi_out",           "taxi_out_min"),
            ("taxi_in",            "taxi_in_min"),
            ("air_time",           "air_time_min"),
            ("delay_carrier",      "delay_carrier_min"),
            ("delay_weather",      "delay_weather_min"),
            ("delay_nas",          "delay_nas_min"),
            ("delay_security",     "delay_security_min"),
            ("delay_late_aircraft","delay_late_aircraft_min"),
        ):
            v = match.get(src)
            if v is not None and flight.get(dst) != v:
                flight[dst] = v
                changed = True

    # Tail-keyed enrichment from FAA
    tail = (match.get("tail") or "").strip().upper()
    if tail and tail != "UNKNOWN":
        if not flight.get("tail_number") or flight.get("enriched_source") != "aerodatabox":
            # BTS wins over un-enriched and over earlier BTS data. Don't
            # clobber AeroDataBox-enriched flights because ADB has richer
            # model strings + photos.
            flight["tail_number"] = tail
            flight["enriched_source"] = "bts"
            changed = True
        info = faa.get(tail)
        if info:
            if not flight.get("aircraft") or flight.get("enriched_source") == "bts":
                model_str = (f"{info['mfr']} {info['model']}").strip()
                if model_str and model_str != flight.get("aircraft"):
                    flight["aircraft"] = model_str
                    changed = True
            for src, dst in (
                ("year_mfr", "aircraft_year"),
                ("no_eng",   "aircraft_engines"),
                ("eng_type", "aircraft_engine_type"),
                ("mode_s",   "aircraft_mode_s"),
                ("serial",   "aircraft_msn"),
                ("owner",    "aircraft_owner"),
            ):
                v = info.get(src)
                if v and flight.get(dst) != v:
                    flight[dst] = v
                    changed = True
    return changed


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--start", help="YYYY-MM — only fetch months ≥ this date.", default=None)
    ap.add_argument("--end", help="YYYY-MM — only fetch months ≤ this date (default: 2 months ago).", default=None)
    ap.add_argument("--dry-run", action="store_true", help="Show what would happen; don't write files.")
    ap.add_argument("--force-faa", action="store_true", help="Re-download FAA registry even if fresh.")
    ap.add_argument("--keep-raw", action="store_true", help="Don't auto-prune downloaded zips on success.")
    args = ap.parse_args()

    flights_path = DATA_DIR / "flights.json"
    if not flights_path.exists():
        sys.exit("data/flights.json not found. Run fetch_tripit.py first.")
    flights = load_json(flights_path, [])
    log(f"Loaded {len(flights):,} flights from {flights_path.relative_to(REPO_ROOT)}")

    wanted = build_wanted_keys(flights)
    log(f"Built {len(wanted):,} BTS lookup keys (carrier+flight#+date+origin)")

    # Figure out month span
    flight_dates = sorted(
        datetime.strptime(f["depart"][:10], "%Y-%m-%d").date()
        for f in flights if f.get("depart")
    )
    if not flight_dates:
        sys.exit("No flights have valid depart dates; nothing to do.")
    span_start = flight_dates[0]
    # BTS publishes ~2 months in arrears; don't ask for the impossible
    today = date.today()
    span_end = (today.replace(day=1) - timedelta(days=1))   # last day of previous month
    span_end = (span_end.replace(day=1) - timedelta(days=1))  # ...and the one before

    if args.start:
        span_start = max(span_start, datetime.strptime(args.start, "%Y-%m").date())
    if args.end:
        span_end = min(span_end, datetime.strptime(args.end, "%Y-%m").date())

    months = list(month_iter(span_start, span_end))
    log(f"Span: {span_start:%Y-%m} → {span_end:%Y-%m}  ({len(months)} months)")

    # FAA registry
    refresh_faa_registry(force=args.force_faa)
    faa = load_faa_lookup()
    log(f"FAA lookup loaded: {len(faa):,} tail→model entries")

    # BTS matches cache
    matches_cache = load_json(MATCHES_PATH, {})
    # Structure: { "YYYY-MM": [ {match}, … ], "_meta": {"processed_at": iso} }
    processed_months = set(k for k in matches_cache.keys() if not k.startswith("_"))
    log(f"Cache: {len(processed_months)} months already processed")

    if args.dry_run:
        to_do = [m for m in months if f"{m[0]}-{m[1]:02d}" not in processed_months]
        log(f"[DRY RUN] Would fetch {len(to_do)} new months: {to_do[:6]}…")
        return

    new_matches = 0
    deferred = []      # months not ready yet — will retry next run
    for year, month in months:
        mkey = f"{year}-{month:02d}"
        if mkey in processed_months:
            continue
        zpath, status = download_bts_month(year, month)
        if status == "not_found":
            # BTS gave a clean 404 — definitively no data. Cache as empty so
            # we never re-fetch this month. (Real for months before BTS's
            # earliest published date, or rarely, months they've purged.)
            matches_cache[mkey] = []
            save_json(MATCHES_PATH, matches_cache)
            continue
        if status in ("not_ready", "error"):
            # 200 with non-zip body, or transient network error. DO NOT cache
            # — this lets the next weekly run pick it up once BTS publishes.
            deferred.append(mkey)
            continue
        # status == "ok": we have a real zip
        log(f"  parsing {mkey} …")
        matched = parse_bts_csv(zpath, set(wanted.keys()))
        if matched is None:
            # Corrupt zip detected at parse time — same treatment as "not_ready"
            deferred.append(mkey)
            continue
        matches_cache[mkey] = matched
        new_matches += len(matched)
        log(f"  → {mkey}: {len(matched)} flights matched")
        # Save incrementally so a crash doesn't lose progress
        save_json(MATCHES_PATH, matches_cache)
        if not args.keep_raw:
            zpath.unlink(missing_ok=True)

    log(f"BTS matching complete. {new_matches} new flight matches across {len(months)} months.")
    if deferred:
        log(f"Deferred {len(deferred)} month(s) — BTS hasn't published yet "
            f"(or transient failure). Will retry next run: {', '.join(deferred)}")

    # Apply matches → flights.json
    updated = 0
    for mkey, rows in matches_cache.items():
        if mkey.startswith("_"):
            continue
        for m in rows:
            key = (m["carrier"], m["flight"], m["date"], m["from"])
            for idx in wanted.get(key, []):
                if merge_match_into_flight(flights[idx], m, faa):
                    updated += 1
    log(f"Updated {updated} flight records in flights.json")

    matches_cache["_meta"] = {"processed_at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    save_json(MATCHES_PATH, matches_cache)
    save_json(flights_path, flights)
    stamp_meta("bts_enriched_at")
    log("Done.")


if __name__ == "__main__":
    main()
