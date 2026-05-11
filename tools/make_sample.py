#!/usr/bin/env python3
"""
make_sample.py — write a small, plausible demo data/flights.json so the site
renders before the real TripIt fetcher has been run.

Once you've authorized TripIt and run fetch_tripit.py, the real data will
overwrite this file.
"""
import json
import math
import random
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

random.seed(7)

AIRPORTS = json.loads((DATA / "airports.json").read_text())

# Hand-picked itinerary skeleton: (airline_code, airline, [(from, to, year), ...])
ITIN = [
    # Dallas hub stuff
    ("AA", "American Airlines", [
        ("DFW","DCA",2019),("DCA","DFW",2019),("DFW","DCA",2020),("DCA","DFW",2020),
        ("DFW","BIS",2021),("BIS","DFW",2021),("DFW","BIS",2022),("BIS","DFW",2022),
        ("DFW","ORD",2022),("ORD","DFW",2022),
        ("DFW","LAX",2023),("LAX","DFW",2023),
        ("DFW","JFK",2023),("JFK","DFW",2023),
        ("DFW","LHR",2023),("LHR","DFW",2024),
        ("DFW","CDG",2024),("CDG","DFW",2024),
        ("DFW","SFO",2025),("SFO","DFW",2025),
    ]),
    ("WN", "Southwest Airlines", [
        ("DAL","DCA",2020),("DCA","DAL",2020),
        ("DAL","DCA",2021),("DCA","DAL",2021),
        ("DAL","DEN",2022),("DEN","DAL",2022),
        ("DAL","BNA",2023),("BNA","DAL",2023),
    ]),
    ("UA", "United Airlines", [
        ("IAD","ORD",2021),("ORD","IAD",2021),
        ("IAD","SFO",2022),("SFO","IAD",2022),
        ("IAD","FRA",2023),("FRA","IAD",2023),
    ]),
    ("DL", "Delta Air Lines", [
        ("ATL","DFW",2022),("DFW","ATL",2022),
        ("ATL","SLC",2024),("SLC","ATL",2024),
    ]),
    ("B6", "JetBlue Airways", [
        ("BOS","HYA",2023),  # ~62 mi — shortest
        ("HYA","BOS",2023),
        ("BOS","JFK",2023),
    ]),
    ("AC", "Air Canada", [
        ("YYZ","DFW",2022),("DFW","YYZ",2022),
        ("YVR","YYZ",2024),
    ]),
    ("QF", "Qantas", [
        ("LAX","MEL",2009),  # 7,927 mi — longest
        ("MEL","SYD",2009),
        ("SYD","LAX",2009),
    ]),
    ("AA", "American Airlines", [
        # Pacific
        ("DFW","NRT",2018),("NRT","DFW",2018),
        # Caribbean
        ("DFW","SJU",2021),("SJU","DFW",2021),
    ]),
]


def airport(code):
    a = AIRPORTS.get(code)
    if not a:
        raise SystemExit(f"airport not found: {code}")
    return a


def haversine_mi(a, b):
    R = 3958.7613
    lat1, lat2 = map(math.radians, (a["lat"], b["lat"]))
    dlat = math.radians(b["lat"] - a["lat"])
    dlon = math.radians(b["lon"] - a["lon"])
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(h))


def make():
    flights = []
    seq = 1
    # Spread dates across the year per (airline, year)
    for airline_code, airline_name, legs in ITIN:
        for from_code, to_code, year in legs:
            a, b = airport(from_code), airport(to_code)
            miles = haversine_mi(a, b)
            # Approximate jet cruise ~500 mph + 35 min ground
            minutes = int(round(miles / 500 * 60 + 35))
            # Spread dates
            d = date(year, random.randint(1, 12), random.randint(1, 28))
            t = datetime(d.year, d.month, d.day, random.randint(6, 22), random.choice([5, 25, 45]))
            arrive = t + timedelta(minutes=minutes)
            flights.append({
                "trip_id": 1000 + seq // 5,
                "trip_name": f"{a['city']} ↔ {b['city']}",
                "air_id": 9000 + seq,
                "from": from_code,
                "from_city": a["city"],
                "to": to_code,
                "to_city": b["city"],
                "depart": t.isoformat() + "-06:00",
                "arrive": arrive.isoformat() + "-06:00",
                "airline": airline_name,
                "airline_code": airline_code,
                "flight_number": str(random.randint(100, 5999)),
                "aircraft": None,
                "seat": random.choice(["7A","12C","15F","23D","8B"]),
                "service_class": "Economy",
                "miles": round(miles, 1),
                "duration": f"{minutes // 60}h {minutes % 60}m",
                "stops": "nonstop",
            })
            seq += 1

    # Sort old -> new
    flights.sort(key=lambda f: f["depart"])
    out = DATA / "flights.json"
    out.write_text(json.dumps(flights, indent=2))
    print(f"wrote {out} ({len(flights)} flights)")


if __name__ == "__main__":
    make()
