#!/usr/bin/env python3
"""
fetch_tripit.py — Pull all past flights from TripIt and write data/flights.json.

First run: walks you through OAuth authorization in your browser, then stores the
authorized access token in tools/credentials.json so future runs are silent.

Usage:
    pip install -r tools/requirements.txt
    python tools/fetch_tripit.py            # incremental — only new trips
    python tools/fetch_tripit.py --full     # refetch everything

Required credentials.json keys:
    consumer_key       (your TripIt API ID)
    consumer_secret    (your TripIt API Secret)

After OAuth, the script also writes:
    access_token, access_token_secret
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import webbrowser
from pathlib import Path
from urllib.parse import parse_qsl

import requests
from requests_oauthlib import OAuth1, OAuth1Session

# ---------------------------------------------------------------------------
# Paths and constants
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
DATA = ROOT / "data"
RAW = DATA / "raw"
CREDS_FILE = TOOLS / "credentials.json"
AIRPORTS_FILE = DATA / "airports.json"
FLIGHTS_FILE = DATA / "flights.json"

API_BASE = "https://api.tripit.com"
REQUEST_TOKEN_URL = f"{API_BASE}/oauth/request_token"
AUTHORIZE_URL = "https://www.tripit.com/oauth/authorize"
ACCESS_TOKEN_URL = f"{API_BASE}/oauth/access_token"
LIST_TRIP_URL = f"{API_BASE}/v1/list/trip"
LIST_OBJECT_URL = f"{API_BASE}/v1/list/object"

USER_AGENT = "Matt-Briney-Travel-Passport/1.0 (+https://github.com/mbriney/Travel)"


# ---------------------------------------------------------------------------
# Credentials
# ---------------------------------------------------------------------------

def load_creds() -> dict:
    if not CREDS_FILE.exists():
        print(f"ERROR: {CREDS_FILE} not found.")
        print("Copy credentials.example.json -> credentials.json and fill it in.")
        sys.exit(1)
    return json.loads(CREDS_FILE.read_text())


def save_creds(creds: dict) -> None:
    CREDS_FILE.write_text(json.dumps(creds, indent=2))
    os.chmod(CREDS_FILE, 0o600)


# ---------------------------------------------------------------------------
# OAuth 1.0a 3-legged authorization
# ---------------------------------------------------------------------------

def do_oauth_dance(creds: dict) -> dict:
    """Walk the user through the standard OAuth 1.0a flow and persist tokens."""
    print("=" * 70)
    print("First-time TripIt authorization required")
    print("=" * 70)

    consumer_key = creds["consumer_key"]
    consumer_secret = creds["consumer_secret"]

    # Step 1: request token
    print("\n1) Requesting unauthorized request token...")
    oauth = OAuth1Session(consumer_key, client_secret=consumer_secret)
    r = oauth.fetch_request_token(REQUEST_TOKEN_URL)
    request_token = r.get("oauth_token")
    request_token_secret = r.get("oauth_token_secret")
    print(f"   got request token: {request_token[:10]}...")

    # Step 2: send user to authorize
    auth_url = f"{AUTHORIZE_URL}?oauth_token={request_token}&oauth_callback=oob"
    print("\n2) Opening browser for you to grant access:")
    print(f"   {auth_url}")
    try:
        webbrowser.open(auth_url)
    except Exception:
        pass
    print("\n   Click 'Approve' in the browser. TripIt will redirect to a page")
    print("   that says authorization succeeded. Come back here when done.")
    input("\n   Press Enter once you've approved access in TripIt...")

    # Step 3: exchange for access token.
    #
    # TripIt's docs describe OAuth 1.0 (pre-verifier), so we can't use
    # OAuth1Session.fetch_access_token() — it strictly requires oauth_verifier.
    # Sign the POST manually with the request token as the resource owner.
    print("\n3) Exchanging request token for access token...")
    auth = OAuth1(
        consumer_key,
        client_secret=consumer_secret,
        resource_owner_key=request_token,
        resource_owner_secret=request_token_secret,
        signature_type="auth_header",
    )
    resp = requests.post(ACCESS_TOKEN_URL, auth=auth, timeout=30)
    if not resp.ok:
        print(f"   HTTP {resp.status_code}: {resp.text[:300]}")
        resp.raise_for_status()
    tokens = dict(parse_qsl(resp.text))
    if "oauth_token" not in tokens or "oauth_token_secret" not in tokens:
        raise SystemExit(f"Unexpected access token response: {resp.text!r}")
    creds["access_token"] = tokens["oauth_token"]
    creds["access_token_secret"] = tokens["oauth_token_secret"]
    save_creds(creds)
    print("   ✓ access token saved to credentials.json\n")
    return creds


def get_signer(creds: dict) -> OAuth1:
    return OAuth1(
        creds["consumer_key"],
        client_secret=creds["consumer_secret"],
        resource_owner_key=creds["access_token"],
        resource_owner_secret=creds["access_token_secret"],
        signature_type="auth_header",
    )


# ---------------------------------------------------------------------------
# TripIt API fetch
# ---------------------------------------------------------------------------

def get_json(url: str, params: dict, auth: OAuth1, timeout: int = 90) -> dict:
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "User-Agent": USER_AGENT,
    }
    last_exc = None
    for attempt in range(5):
        try:
            r = requests.get(url, params=params, auth=auth, headers=headers, timeout=timeout)
        except (requests.ConnectionError, requests.Timeout) as e:
            last_exc = e
            sleep = 2 ** attempt
            print(f"   {type(e).__name__}, retrying in {sleep}s...")
            time.sleep(sleep)
            continue
        if r.status_code == 429 or 500 <= r.status_code < 600:
            sleep = 2 ** attempt
            print(f"   HTTP {r.status_code}, retrying in {sleep}s...")
            time.sleep(sleep)
            continue
        r.raise_for_status()
        return r.json()
    if last_exc is not None:
        raise last_exc
    r.raise_for_status()
    return {}


def fetch_past_air_objects(auth: OAuth1) -> list[dict]:
    """List all past AirObjects directly via /list/object?type=air&past=true.

    Much faster than /list/trip?include_objects=true since we skip lodging,
    weather, activities, etc. and only pull what we need for the passport.
    """
    all_airs: list[dict] = []
    page = 1
    page_size = 50
    while True:
        print(f"   page {page} (size {page_size})...", end=" ", flush=True)
        params = {
            "format": "json",
            "past": "true",
            "type": "air",
            "page_size": page_size,
            "page_num": page,
        }
        try:
            data = get_json(LIST_OBJECT_URL, params, auth, timeout=120)
        except requests.Timeout:
            # If even a large page times out, halve the page size and retry.
            if page_size > 5:
                page_size = max(5, page_size // 2)
                print(f"timeout — shrinking page_size to {page_size}")
                continue
            raise
        airs = _aslist(data.get("AirObject"))
        all_airs.extend(airs)
        max_page = int(data.get("max_page", page))
        print(f"got {len(airs)} air objs (page {page}/{max_page}, total {len(all_airs)})")
        if page >= max_page or not airs:
            break
        page += 1
    return all_airs


def fetch_past_trip_metadata(auth: OAuth1) -> dict[str, dict]:
    """Pull /v1/list/trip?past=true to populate trip_name / primary_location
    that the air-objects endpoint doesn't include.

    Returns a dict keyed by str(trip_id) -> { display_name, primary_location,
    start_date, end_date, location_country, location_state }.
    """
    out: dict[str, dict] = {}
    page = 1
    page_size = 50
    while True:
        print(f"   page {page} (size {page_size})...", end=" ", flush=True)
        params = {
            "format": "json",
            "past": "true",
            "page_size": page_size,
            "page_num": page,
        }
        try:
            data = get_json(LIST_TRIP_URL, params, auth, timeout=120)
        except requests.Timeout:
            if page_size > 5:
                page_size = max(5, page_size // 2)
                print(f"timeout — shrinking page_size to {page_size}")
                continue
            raise
        trips = _aslist(data.get("Trip"))
        for t in trips:
            tid = str(t.get("id"))
            addr = t.get("PrimaryLocationAddress") or {}
            out[tid] = {
                "display_name":      t.get("display_name"),
                "primary_location":  t.get("primary_location"),
                "start_date":        t.get("start_date"),
                "end_date":          t.get("end_date"),
                "location_city":     addr.get("city"),
                "location_state":    addr.get("state"),
                "location_country":  addr.get("country"),
                "location_lat":      addr.get("latitude"),
                "location_lon":      addr.get("longitude"),
            }
        max_page = int(data.get("max_page", page))
        print(f"got {len(trips)} trips (page {page}/{max_page}, total {len(out)})")
        if page >= max_page or not trips:
            break
        page += 1
    return out


def _aslist(x):
    if x is None:
        return []
    if isinstance(x, list):
        return x
    return [x]


# ---------------------------------------------------------------------------
# Flight extraction
# ---------------------------------------------------------------------------

# Distance is reported as e.g. "677 miles". Parse the numeric part.
def parse_distance(raw) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    s = str(raw).strip().lower().replace(",", "")
    try:
        return float(s.split()[0])
    except Exception:
        return None


def parse_datetime(d: dict | None) -> str | None:
    """Combine TripIt's date/time/utc_offset into an ISO-8601 string."""
    if not d:
        return None
    date = d.get("date")
    t = d.get("time")
    off = d.get("utc_offset")
    if not date:
        return None
    base = f"{date}T{t or '00:00:00'}"
    if off:
        # TripIt offset already looks like '-07:00' or '+10:00'
        return base + off
    return base


def airport_distance_haversine(a: dict, b: dict) -> float | None:
    """Great-circle distance in miles when both airports are in our DB."""
    import math
    if not a or not b:
        return None
    lat1, lon1 = a.get("lat"), a.get("lon")
    lat2, lon2 = b.get("lat"), b.get("lon")
    if None in (lat1, lon1, lat2, lon2):
        return None
    R = 3958.7613  # earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    h = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def extract_flights(airs: list[dict], airports: dict[str, dict],
                    trip_meta: dict[str, dict] | None = None) -> list[dict]:
    """Flatten a list of AirObjects into one row per segment.
    If trip_meta is provided, decorate each flight with its trip's name + primary location.
    """
    trip_meta = trip_meta or {}
    flights: list[dict] = []
    for air in airs:
        segments = _aslist(air.get("Segment"))
        meta = trip_meta.get(str(air.get("trip_id"))) or {}
        for seg in segments:
            from_code = (seg.get("start_airport_code") or "").upper()
            to_code = (seg.get("end_airport_code") or "").upper()
            from_ap = airports.get(from_code)
            to_ap = airports.get(to_code)
            miles = parse_distance(seg.get("distance"))
            if miles is None:
                miles = airport_distance_haversine(from_ap, to_ap)
            # TripIt sometimes returns the IATA code in marketing_airline and
            # leaves marketing_airline_code empty (notably for VX / NK
            # historical records). Normalize: if the code is missing but the
            # name field looks like a 2-3 char IATA code, promote it.
            airline_name = seg.get("marketing_airline") or ""
            airline_code = seg.get("marketing_airline_code") or ""
            if not airline_code and re.fullmatch(r"[A-Z0-9]{2,3}", airline_name.strip().upper() or ""):
                airline_code = airline_name.strip().upper()
                airline_name = ""  # don't double-display the code as a name
            flights.append({
                "trip_id": air.get("trip_id"),
                "trip_name":        meta.get("display_name"),
                "trip_location":    meta.get("primary_location"),
                "trip_start":       meta.get("start_date"),
                "trip_end":         meta.get("end_date"),
                "air_id": air.get("id"),
                "from": from_code,
                "from_city": seg.get("start_city_name"),
                "to": to_code,
                "to_city": seg.get("end_city_name"),
                "depart": parse_datetime(seg.get("StartDateTime")),
                "arrive": parse_datetime(seg.get("EndDateTime")),
                "airline": airline_name or None,
                "airline_code": airline_code or None,
                "flight_number": seg.get("marketing_flight_number"),
                "aircraft": seg.get("aircraft"),
                "seat": seg.get("seats"),
                "service_class": seg.get("service_class"),
                "miles": miles,
                "duration": seg.get("duration"),
                "stops": seg.get("stops"),
            })
    # Sort oldest-first
    flights.sort(key=lambda f: f.get("depart") or "")
    return flights


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def load_airports() -> dict[str, dict]:
    if not AIRPORTS_FILE.exists():
        print(f"WARN: {AIRPORTS_FILE} not found. Flights will lack lat/long.")
        print("      Run: python tools/build_airports.py")
        return {}
    return json.loads(AIRPORTS_FILE.read_text())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true",
                        help="(Reserved.) Currently always fetches all past trips.")
    parser.add_argument("--save-raw", action="store_true",
                        help="Also write the raw TripIt JSON pages under data/raw/.")
    args = parser.parse_args()

    DATA.mkdir(exist_ok=True)
    RAW.mkdir(exist_ok=True)

    creds = load_creds()
    if "access_token" not in creds:
        creds = do_oauth_dance(creds)

    auth = get_signer(creds)

    print("\nFetching past air objects from TripIt...")
    try:
        airs = fetch_past_air_objects(auth)
    except requests.HTTPError as e:
        if e.response is not None and e.response.status_code == 401:
            print("\n401 from TripIt — token may be revoked. Re-running OAuth.")
            creds.pop("access_token", None)
            creds.pop("access_token_secret", None)
            save_creds(creds)
            creds = do_oauth_dance(creds)
            auth = get_signer(creds)
            airs = fetch_past_air_objects(auth)
        else:
            raise

    print(f"\nFetched {len(airs)} past air objects.")
    if args.save_raw:
        (RAW / "air_objects.json").write_text(json.dumps(airs, indent=2))
        print(f"  raw saved: {RAW / 'air_objects.json'}")

    print("\nFetching past trip metadata from TripIt...")
    try:
        trip_meta = fetch_past_trip_metadata(auth)
    except requests.HTTPError as e:
        # Trip metadata is best-effort — without it, flights still work,
        # they just lack trip_name / primary_location decoration.
        print(f"  WARN: trip metadata fetch failed ({e}); continuing without it.")
        trip_meta = {}
    print(f"\nFetched metadata for {len(trip_meta)} trips.")
    if args.save_raw and trip_meta:
        (RAW / "trip_meta.json").write_text(json.dumps(trip_meta, indent=2))
        print(f"  raw saved: {RAW / 'trip_meta.json'}")

    airports = load_airports()
    flights = extract_flights(airs, airports, trip_meta)
    print(f"Extracted {len(flights)} flight segments.")
    enriched = sum(1 for f in flights if f.get("trip_name"))
    print(f"  trip_name populated on {enriched}/{len(flights)} ({100*enriched/max(len(flights),1):.0f}%)")

    FLIGHTS_FILE.write_text(json.dumps(flights, indent=2, default=str))
    print(f"  wrote: {FLIGHTS_FILE}")
    print("\nDone.")


if __name__ == "__main__":
    main()
