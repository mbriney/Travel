#!/usr/bin/env python3
"""
build_airports.py — Download the OurAirports public dataset and produce a
slim data/airports.json keyed by IATA code, plus data/airlines.json keyed by
IATA airline code.

Run once after cloning, and any time you want to refresh the airport list.

    python tools/build_airports.py
"""
from __future__ import annotations

import csv
import io
import json
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

OURAIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv"
COUNTRIES_URL = "https://davidmegginson.github.io/ourairports-data/countries.csv"
# OpenFlights airline database (MIT-ish, free for non-commercial use). Columns:
#   AirlineID, Name, Alias, IATA, ICAO, Callsign, Country, Active
OPENFLIGHTS_AIRLINES_URL = (
    "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat"
)


def fetch(url: str) -> str:
    print(f"GET {url}")
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.text


def build_countries() -> dict[str, dict]:
    csv_text = fetch(COUNTRIES_URL)
    out: dict[str, dict] = {}
    for row in csv.DictReader(io.StringIO(csv_text)):
        code = (row.get("code") or "").upper()
        if not code:
            continue
        out[code] = {
            "code": code,
            "name": row.get("name") or "",
            "continent": row.get("continent") or "",
        }
    return out


def flag_emoji(iso2: str) -> str:
    if not iso2 or len(iso2) != 2:
        return ""
    return "".join(chr(0x1F1E6 + (ord(c) - ord("A"))) for c in iso2.upper())


def build_airports(countries: dict[str, dict]) -> dict[str, dict]:
    csv_text = fetch(OURAIRPORTS_URL)
    out: dict[str, dict] = {}
    skipped = 0
    for row in csv.DictReader(io.StringIO(csv_text)):
        iata = (row.get("iata_code") or "").strip().upper()
        if not iata or len(iata) != 3:
            continue
        if row.get("type") in ("closed", "heliport", "seaplane_base"):
            skipped += 1
            continue
        try:
            lat = float(row["latitude_deg"])
            lon = float(row["longitude_deg"])
        except (KeyError, ValueError):
            continue
        country_code = (row.get("iso_country") or "").upper()
        country = countries.get(country_code, {})
        region = (row.get("iso_region") or "").upper()  # e.g. "US-TX"
        state = region.split("-", 1)[1] if "-" in region else ""
        try:
            elev = int(float(row.get("elevation_ft") or "0"))
        except Exception:
            elev = 0
        out[iata] = {
            "code": iata,
            "icao": row.get("ident") or "",
            "name": row.get("name") or "",
            "city": row.get("municipality") or "",
            "state": state if country_code == "US" else "",
            "region": region,
            "country": country_code,
            "country_name": country.get("name", ""),
            "continent": country.get("continent", ""),
            "lat": lat,
            "lon": lon,
            "elevation_ft": elev,
            "flag": flag_emoji(country_code),
        }
    print(f"  kept {len(out)} airports (skipped {skipped} closed/heliport/seaplane)")
    return out


CURATED_AIRLINES_FILE   = Path(__file__).resolve().parent / "curated_airlines.json"
CURATED_ALLIANCES_FILE  = Path(__file__).resolve().parent / "curated_alliances.json"


def build_alliances() -> dict[str, dict]:
    """Build the IATA → {alliance, name, ...} map from curated_alliances.json.
    Returns a dict keyed by IATA code (suitable for direct lookup).
    """
    if not CURATED_ALLIANCES_FILE.exists():
        print(f"  no curated alliances file at {CURATED_ALLIANCES_FILE}")
        return {}
    raw = json.loads(CURATED_ALLIANCES_FILE.read_text())
    out: dict[str, dict] = {}
    for alliance, members in raw.items():
        if alliance.startswith("_") or not isinstance(members, list):
            continue
        for m in members:
            iata = (m.get("iata") or "").upper()
            if not iata:
                continue
            out[iata] = {
                "iata": iata,
                "alliance": alliance,
                "name": m.get("name"),
                "country": m.get("country"),
                "joined": m.get("joined"),
                "notes": m.get("notes"),
            }
    return out


def build_airlines() -> dict[str, dict]:
    """Build the airline catalog.

    Source priority (highest wins on any field):
      1. tools/curated_airlines.json  — hand-curated, includes defunct/merged
                                         carriers, alliance, operating dates,
                                         and authoritative IATA->ICAO mappings.
      2. OpenFlights airlines.dat     — broad coverage of currently-active
                                         carriers, but stale for reassigned
                                         IATA codes (FL, CO, US, NW, TW, …).
    """
    txt = fetch(OPENFLIGHTS_AIRLINES_URL)
    out: dict[str, dict] = {}
    # Pass 1: OpenFlights baseline
    for row in csv.reader(io.StringIO(txt)):
        if len(row) < 8:
            continue
        _id, name, alias, iata, icao, callsign, country, active = row[:8]
        iata = (iata or "").strip().upper()
        if not iata or len(iata) != 2 or iata == "\\N":
            continue
        if active.strip().upper() != "Y":
            if iata in out:
                continue
        out[iata] = {
            "iata": iata,
            "icao": (icao or "").strip().upper(),
            "name": name.strip(),
            "country": country.strip(),
            "active": active.strip().upper() == "Y",
            "source": "openflights",
        }

    # Pass 2: apply the curated airline overlay. We strip any `alliance`
    # field from these entries — alliance membership is owned exclusively by
    # tools/curated_alliances.json so there's only one source of truth.
    if CURATED_AIRLINES_FILE.exists():
        curated = json.loads(CURATED_AIRLINES_FILE.read_text())
        applied = 0
        for code, entry in curated.items():
            if code.startswith("_"):
                continue
            if not isinstance(entry, dict):
                continue
            entry = dict(entry)
            entry.pop("alliance", None)
            entry["source"] = "curated"
            out[code] = entry
            applied += 1
        print(f"  applied {applied} curated airline overrides")
    else:
        print(f"  no curated overlay at {CURATED_AIRLINES_FILE}")

    # Also strip any pre-existing alliance carry-over from OpenFlights data
    # so we don't keep stale info (e.g. SAS's old Star Alliance affiliation).
    for entry in out.values():
        entry.pop("alliance", None)

    # Pass 3: apply curated alliance membership (the only authoritative source)
    alliances = build_alliances()
    if alliances:
        ally_applied = 0
        for iata, info in alliances.items():
            if iata not in out:
                out[iata] = {
                    "iata": iata,
                    "icao": "",
                    "name": info["name"],
                    "country": info["country"],
                    "active": True,
                    "source": "alliance",
                }
            out[iata]["alliance"] = info["alliance"]
            ally_applied += 1
        print(f"  applied alliance membership to {ally_applied} airlines")

    print(f"  kept {len(out)} airlines")
    return out


def main() -> None:
    DATA.mkdir(exist_ok=True)
    print("Building countries...")
    countries = build_countries()
    print(f"  {len(countries)} countries")

    print("Building airports...")
    airports = build_airports(countries)
    (DATA / "airports.json").write_text(json.dumps(airports, separators=(",", ":")))
    print(f"  wrote data/airports.json ({(DATA / 'airports.json').stat().st_size // 1024} KB)")

    print("Building airlines...")
    airlines = build_airlines()
    (DATA / "airlines.json").write_text(json.dumps(airlines, separators=(",", ":")))
    print(f"  wrote data/airlines.json ({(DATA / 'airlines.json').stat().st_size // 1024} KB)")

    print("Writing standalone alliances lookup...")
    flat = {iata: {"alliance": e["alliance"], "name": e.get("name"), "country": e.get("country")}
            for iata, e in airlines.items() if e.get("alliance")}
    (DATA / "alliances.json").write_text(json.dumps(flat, indent=2))
    print(f"  wrote data/alliances.json ({len(flat)} airlines mapped)")

    (DATA / "countries.json").write_text(json.dumps(countries, indent=2))
    print(f"  wrote data/countries.json")


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        print(f"HTTP error: {e}", file=sys.stderr)
        sys.exit(1)
