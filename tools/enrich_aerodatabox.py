#!/usr/bin/env python3
"""
enrich_aerodatabox.py — Enrich data/flights.json with aircraft registration
(tail number), aircraft model, Mode-S transponder hex, and ATC callsign via
the AeroDataBox API on RapidAPI.

Why this exists
---------------
The TripIt API only gives us short aircraft codes like "738" or "320".
AeroDataBox is the only public API that, given a flight number + date,
returns the actual tail number that flew that route — e.g. AA1839 on
2024-03-12 was N802NN, a 737-823.

Why it's limited
----------------
AeroDataBox's historical window is the last ~365 days. Anything older is
gone from their data. So a 2009 flight will never get a tail number from
any public source.

What it does
------------
1. Reads data/flights.json.
2. Filters to flights that (a) have airline_code + flight_number + depart,
   (b) are within the last 365 days, and (c) haven't been enriched yet
   (no `_enrichment` block).
3. For each, hits GET /flights/number/{IATA}/{YYYY-MM-DD} with a 1.1s
   delay between calls (the free tier's rate cap is 1 req/sec).
4. Caches every response to data/_aerodatabox_cache/{flight}_{date}.json
   so re-runs are free.
5. Writes results back into data/flights.json under each flight's
   `tail_number`, `aircraft_model`, `aircraft_mode_s`, `callsign`,
   `is_codeshare`, `operating_airline`, plus a `_enrichment` block with
   the source and timestamp.

Required credentials.json keys:
    aerodatabox_rapidapi_key   (RapidAPI key — get one at
                                https://rapidapi.com/aedbx-aedbx/api/aerodatabox)

Usage:
    python3 tools/enrich_aerodatabox.py            # incremental, respects budget
    python3 tools/enrich_aerodatabox.py --limit 50 # cap this run to N calls
    python3 tools/enrich_aerodatabox.py --dry-run  # show what would be fetched
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
DATA = ROOT / "data"
CACHE = DATA / "_aerodatabox_cache"
CREDS_FILE = TOOLS / "credentials.json"
FLIGHTS_FILE = DATA / "flights.json"

HOST = "aerodatabox.p.rapidapi.com"
BASE_URL = f"https://{HOST}"

# AeroDataBox covers ~last 365 days
WINDOW_DAYS = 365

# Free tier: 1 req/sec, 600/mo. Keep a hair above 1.0 for safety.
RATE_LIMIT_SECONDS = 1.1


def load_creds() -> dict:
    if not CREDS_FILE.exists():
        sys.exit(f"ERROR: {CREDS_FILE} not found. Copy credentials.example.json and fill it in.")
    return json.loads(CREDS_FILE.read_text())


def load_flights() -> list[dict]:
    if not FLIGHTS_FILE.exists():
        sys.exit(f"ERROR: {FLIGHTS_FILE} not found. Run tools/fetch_tripit.py first.")
    return json.loads(FLIGHTS_FILE.read_text())


def save_flights(flights: list[dict]) -> None:
    FLIGHTS_FILE.write_text(json.dumps(flights, indent=2, default=str))


def normalize_flight_number(airline_code: str | None, flight_number: str | None) -> str | None:
    if not airline_code or not flight_number:
        return None
    return f"{airline_code.strip().upper()}{str(flight_number).strip()}"


def parse_depart_date(s: str | None) -> str | None:
    """Return YYYY-MM-DD or None."""
    if not s:
        return None
    try:
        # depart looks like '2024-03-12T08:15:00-06:00'
        return s[:10]
    except Exception:
        return None


def in_window(date_str: str) -> bool:
    try:
        d = datetime.fromisoformat(date_str)
    except Exception:
        return False
    today = datetime.now()
    return (today - d).days <= WINDOW_DAYS and d <= today + timedelta(days=365)


def cache_path(flight_num: str, date: str) -> Path:
    return CACHE / f"{flight_num}_{date}.json"


def fetch_aerodatabox(flight_num: str, date: str, api_key: str, timeout: int = 12) -> dict | None:
    """Return the AeroDataBox 'operator' entry for a flight, or None."""
    cp = cache_path(flight_num, date)
    if cp.exists():
        cached = json.loads(cp.read_text())
        return cached if cached else None

    url = f"{BASE_URL}/flights/number/{flight_num}/{date}"
    headers = {
        "x-rapidapi-host": HOST,
        "x-rapidapi-key": api_key,
    }
    params = {"withAircraftImage": "false", "withLocation": "false"}
    r = requests.get(url, headers=headers, params=params, timeout=timeout)

    # Persist rate-limit info for the user
    remaining = r.headers.get("X-RateLimit-Requests-Remaining")
    if remaining is not None:
        try:
            (CACHE / "_quota.txt").write_text(str(remaining))
        except Exception:
            pass

    if r.status_code == 404:
        # Save an empty cache so we don't ask again
        cp.write_text(json.dumps(None))
        return None
    if r.status_code == 429:
        raise RuntimeError("Rate-limited or monthly quota exhausted — try again later.")
    if r.status_code in (401, 403):
        raise RuntimeError(f"AeroDataBox auth failed (HTTP {r.status_code}). Check your API key.")
    r.raise_for_status()

    data = r.json()
    # Empty array = no data for this flight/date
    if not isinstance(data, list) or not data:
        cp.write_text(json.dumps(None))
        return None

    # Prefer the operator entry; otherwise first
    operator = next((f for f in data if f.get("codeshareStatus") == "isOperator"), data[0])
    cp.write_text(json.dumps(operator, indent=2))
    return operator


def extract_enrichment(entry: dict, requested_number: str) -> dict:
    """Pull the fields we want out of an AeroDataBox flight entry."""
    aircraft = entry.get("aircraft") or {}
    airline  = entry.get("airline") or {}
    out = {
        "tail_number":         aircraft.get("reg"),
        "aircraft_model":      aircraft.get("model"),
        "aircraft_mode_s":     aircraft.get("modeS"),
        "callsign":            entry.get("callSign"),
        "operating_airline":   airline.get("name"),
        "operating_airline_iata": airline.get("iata"),
        "operating_airline_icao": airline.get("icao"),
        "is_codeshare":        entry.get("codeshareStatus") == "isCodeshare",
        "is_cargo":            entry.get("isCargo"),
        "_enrichment": {
            "source": "aerodatabox",
            "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "match": entry.get("number"),
            "requested": requested_number,
        },
    }
    # Strip None values for cleanliness, except _enrichment
    return {k: v for k, v in out.items() if v not in (None, "") or k == "_enrichment"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Max API calls this run (0 = no cap)")
    parser.add_argument("--dry-run", action="store_true", help="Don't call the API; show what would be done")
    parser.add_argument("--rate", type=float, default=RATE_LIMIT_SECONDS, help="Seconds between calls")
    args = parser.parse_args()

    CACHE.mkdir(parents=True, exist_ok=True)

    # Two ways to provide the key, in priority order:
    #   1. AERODATABOX_API_KEY env var — used by the GitHub Action which
    #      injects the secret without writing to credentials.json.
    #   2. tools/credentials.json's `aerodatabox_rapidapi_key` field — used
    #      by local runs alongside the TripIt OAuth creds.
    api_key = os.environ.get("AERODATABOX_API_KEY") or load_creds().get("aerodatabox_rapidapi_key")
    if not api_key:
        print("ERROR: AeroDataBox API key not found.")
        print("Get a key (Free tier 600 req/mo) at:")
        print("  https://rapidapi.com/aedbx-aedbx/api/aerodatabox")
        print("Then either:")
        print("  • set AERODATABOX_API_KEY in your environment, or")
        print('  • add "aerodatabox_rapidapi_key": "YOUR_KEY_HERE" to tools/credentials.json')
        sys.exit(1)

    flights = load_flights()
    total = len(flights)

    eligible: list[tuple[int, str, str]] = []
    for i, f in enumerate(flights):
        if f.get("_enrichment"):  # already done
            continue
        fn = normalize_flight_number(f.get("airline_code"), f.get("flight_number"))
        date = parse_depart_date(f.get("depart"))
        if not fn or not date:
            continue
        if not in_window(date):
            continue
        eligible.append((i, fn, date))

    print(f"Loaded {total} flights · {len(eligible)} are eligible for AeroDataBox enrichment.")
    if not eligible:
        print("Nothing to enrich. Done.")
        return

    if args.limit > 0 and len(eligible) > args.limit:
        print(f"  capping to first {args.limit} per --limit")
        eligible = eligible[:args.limit]

    if args.dry_run:
        for i, fn, date in eligible[:20]:
            print(f"  would fetch  {fn:8s}  {date}")
        if len(eligible) > 20:
            print(f"  ...and {len(eligible) - 20} more")
        return

    enriched = 0
    skipped = 0
    errors = 0
    for n, (idx, fn, date) in enumerate(eligible, start=1):
        print(f"  [{n}/{len(eligible)}] {fn:8s} {date} ...", end=" ", flush=True)
        try:
            entry = fetch_aerodatabox(fn, date, api_key)
        except RuntimeError as e:
            print(f"FAIL: {e}")
            break
        except requests.HTTPError as e:
            print(f"HTTP {e.response.status_code if e.response else '?'}")
            errors += 1
            time.sleep(args.rate)
            continue
        except requests.RequestException as e:
            print(f"network error: {e}")
            errors += 1
            time.sleep(args.rate)
            continue

        if not entry:
            print("no data")
            skipped += 1
        else:
            enrichment = extract_enrichment(entry, fn)
            flights[idx].update(enrichment)
            enriched += 1
            tail = enrichment.get("tail_number") or "—"
            model = enrichment.get("aircraft_model") or ""
            print(f"OK  tail={tail}  {model}")

        # Persist progress every 10 calls — protects against losing work on Ctrl-C
        if n % 10 == 0:
            save_flights(flights)

        # Respect free-tier rate cap
        if n < len(eligible):
            time.sleep(args.rate)

    save_flights(flights)

    quota_file = CACHE / "_quota.txt"
    quota = quota_file.read_text().strip() if quota_file.exists() else "?"
    print()
    print(f"Done. Enriched {enriched}, no-data {skipped}, errors {errors}.")
    print(f"AeroDataBox quota remaining this billing window: {quota}")


if __name__ == "__main__":
    main()
