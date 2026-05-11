# Travel Passport

An interactive virtual passport built from my TripIt flight history.
Static site, hand-built in vanilla HTML/CSS/JS + D3 for the maps.

**Live site:** https://mbriney.github.io/Travel/

## What's inside

A passport-style book you can page through:

1. **Cover** — embossed passport cover
2. **Bearer page** — name, residence, headline stats
3. **Flight stats** — Flighty-style cards: weekday histogram, distance factoids (Earth laps, Moon trips), top airports / airlines / routes, shortest & longest flights
4. **World map** — countries shaded by visits, great-circle arcs for routes, dots for visited airports
5. **United States** — choropleth of visited states with abbreviation labels
6. **Stamp pages** — one customs-style stamp per visited country, with arrival/departure dates and the airports visited there
7. **Flight log** — full reverse-chronological log of every flight

Navigation: click left/right halves of the passport, use ← / → arrow keys, the page-jump pills in the header, or swipe on mobile.

## Project layout

```
.
├── index.html              # site entry point
├── assets/
│   ├── css/passport.css    # all styling (passport, flips, maps, stamps)
│   └── js/                 # ES modules
│       ├── main.js         # boot — load JSON, build pages
│       ├── stats.js        # aggregate flight stats from the raw list
│       ├── pages.js        # build each passport page
│       ├── passport.js     # flip-book navigation
│       ├── worldmap.js     # D3 world map with arcs
│       └── usmap.js        # D3 US states map
├── data/                   # the data the site reads at runtime
│   ├── flights.json        # one entry per flight segment (from TripIt)
│   ├── airports.json       # IATA -> { lat, lon, name, country, state }
│   ├── airlines.json       # IATA -> { name, country }
│   └── countries.json      # ISO2 -> { name, continent }
└── tools/                  # Python pipeline scripts
    ├── build_airports.py   # one-time: download airport / airline DB
    ├── fetch_tripit.py     # OAuth + paginated trip fetch -> flights.json
    ├── make_sample.py      # generate demo data (used when no TripIt data yet)
    └── requirements.txt
```

## Refreshing your travel data

```bash
# One-time setup (only needs to be run again to refresh the airport DB)
python3 -m pip install -r tools/requirements.txt
python3 tools/build_airports.py

# Configure TripIt credentials (one-time)
cp tools/credentials.example.json tools/credentials.json
# edit tools/credentials.json and paste your consumer_key + consumer_secret

# Fetch your flights (first run opens browser for OAuth approval)
python3 tools/fetch_tripit.py
```

After that, just rerun `python3 tools/fetch_tripit.py` whenever you want a fresh snapshot.

## TripIt credentials

The fetcher uses OAuth 1.0a. You'll need:

- `consumer_key` — your TripIt **API ID** from the developer console
- `consumer_secret` — your TripIt **API Secret**

The script opens your browser for a one-time approval, then stores the access token + secret back into `tools/credentials.json` (which is gitignored). All subsequent fetches are silent.

## Hosting on GitHub Pages

This repo is set up to serve the site from the root via GitHub Pages.

1. Push the repo to GitHub.
2. Settings → Pages → Source: **Deploy from a branch** → branch `main` (or `master`), folder `/ (root)`.
3. Your site will be live at `https://<username>.github.io/Travel/`.

No build step. The pre-baked `data/*.json` files are the entire payload.

## Local preview

```bash
cd Travel
python3 -m http.server 8080
# open http://localhost:8080
```

A static server is required because the page loads JSON via `fetch()` — opening `index.html` from `file://` will be blocked by the browser.

## Credits

- Map data: [world-atlas](https://github.com/topojson/world-atlas), [us-atlas](https://github.com/topojson/us-atlas)
- Airport / airline data: [OurAirports](https://ourairports.com), [OpenFlights](https://openflights.org)
- Visual inspiration: the [Flighty](https://www.flighty.com) annual passport screenshots and [TravStats](https://github.com/Abrechen2/TravStats)
