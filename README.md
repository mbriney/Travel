# Travel Passport

An interactive virtual passport built from your TripIt flight history.
Static site, hand-built in vanilla HTML/CSS/JS + D3 for the maps.

**Live site:** https://mbriney.github.io/Travel/

## What's inside

Seven tabs across the top:

1. **Passport** — flippable book with cover, bio page, and customs-style stamp pages for every visited country and US state. Click a stamp to see every flight that contributed to it.
2. **Stats** — Flighty-style summary cards: distance/time totals, top airports/airlines/routes, cabin class, aircraft types & specific tails, carbon footprint, region breakdown, flight-time conversions, time-of-day & day-of-week histograms.
3. **World** — toggleable between a flat Natural Earth map and a 3D rotating orthographic globe. Both show visited countries shaded, great-circle arcs for every route, and a dot per visited airport (top hubs in gold). Drag the globe to spin it.
4. **USA** — choropleth of visited US states.
5. **Achievements** — 130+ TravStats-inspired badges across explorer/distance/collector/elite/special categories. Click any badge for a detailed unlock breakdown.
6. **Timeline** — chronological scrubber. Drag the month slider (or hit Play) to watch your travel map grow from your first flight forward. Live stats and milestone callouts update as you scrub.
7. **Log** — full reverse-chronological log of every flight.

Navigation in the passport view: click the left/right halves of the book, use ← / → arrow keys, the nav arrows, or swipe on mobile. The cover slides over and the page curls forward to reveal the next spread.

## Project layout

```
.
├── index.html                       # site entry point
├── CNAME                            # custom domain (optional)
├── assets/
│   ├── css/passport.css             # all styling
│   └── js/                          # ES modules
│       ├── main.js                  # boot — load JSON, init tabs
│       ├── stats.js                 # aggregate flight stats
│       ├── pages.js                 # build the passport pages
│       ├── passport.js              # flip-book navigation + animation
│       ├── views.js                 # Stats / World / USA / Log renderers + modal
│       ├── worldmap.js              # D3 flat world map (Natural Earth)
│       ├── worldglobe.js            # D3 orthographic globe
│       ├── usmap.js                 # D3 US states choropleth
│       ├── achievements.js          # 130+ achievements: defs, evaluator, modal
│       └── timeline.js              # Timeline tab: slider + play/pause
├── data/                            # everything the site reads at runtime
│   ├── flights.json                 # one entry per flight segment (from TripIt)
│   ├── airports.json                # IATA → { lat, lon, name, country, state, type, is_island, … }
│   ├── airlines.json                # IATA → { name, country, alliance, … }
│   ├── alliances.json               # Star/oneworld/SkyTeam membership
│   ├── countries.json               # ISO2 → { name, continent }
│   ├── profile.json                 # bearer name, residence, etc. (merged TripIt+overrides)
│   ├── meta.json                    # build/fetch timestamps shown in the topbar
│   ├── bts_matches.json             # tail numbers matched from BTS On-Time Performance
│   └── faa_registry.csv.gz          # tail → manufacturer/model from FAA Aircraft Registry
├── tools/                           # Python pipeline
│   ├── requirements.txt
│   ├── credentials.example.json     # template — copy to credentials.json
│   ├── credentials.json             # OAuth tokens (gitignored)
│   ├── profile.example.json         # template — copy to profile.json
│   ├── profile.json                 # personal overrides (committed, see below)
│   ├── curated_airlines.json        # hand-curated IATA→ICAO, defunct carriers, mergers
│   ├── curated_alliances.json       # authoritative alliance membership
│   ├── curated_islands.json         # island airports for the Island Hopper achievement
│   ├── fetch_tripit.py              # OAuth + paginated trip fetch → flights.json + profile.json
│   ├── build_airports.py            # download/merge airports + airlines + alliances
│   ├── enrich_aerodatabox.py        # tail-number lookups for last ~365 days (paid API)
│   ├── enrich_bts.py                # BTS + FAA registry: free, 20+ years of history
│   ├── cache_bust.py                # invoked by deploy workflow; stamps ?v= on every JS import
│   └── make_sample.py               # generate synthetic demo data for dev
└── .github/workflows/
    ├── pages.yml                    # deploy: cache-bust + push to GitHub Pages on every commit
    └── refresh-data.yml             # weekly auto-refresh: fetches TripIt + enrichments
```

## First-time setup

```bash
# 1. Clone + install Python deps
git clone https://github.com/<you>/Travel.git
cd Travel
python3 -m pip install -r tools/requirements.txt

# 2. Build the airport / airline / country reference data (one-time —
#    rerun whenever you want fresh data from OurAirports / OpenFlights)
python3 tools/build_airports.py

# 3. Configure TripIt OAuth credentials
cp tools/credentials.example.json tools/credentials.json
# edit tools/credentials.json — paste your consumer_key + consumer_secret

# 4. Personalize the passport bearer info (optional)
cp tools/profile.example.json tools/profile.json
# edit tools/profile.json — set display_name, residence, etc.

# 5. Fetch your TripIt history (first run opens a browser for OAuth)
python3 tools/fetch_tripit.py

# 6. (Optional) tail-number enrichment — see "Enrichment" below
python3 tools/enrich_bts.py            # free, last 20+ years, US carriers
python3 tools/enrich_aerodatabox.py    # paid (free tier 600/mo), last ~365 days
```

## Personal config: `tools/profile.json`

The passport bio page shows your legal name, nationality, residence, etc. These come from a single config file you can edit. Anything you set here wins over what `fetch_tripit.py` pulls from `/v1/get/profile`; anything you leave `null` falls back to TripIt's value or a sensible default.

```json
{
  "display_name":     "Matt Briney",            // shown in topbar
  "legal_first_name": "MATTHEW",                // bio page (Given Names)
  "legal_last_name":  "BRINEY",                 // bio page (Surname)
  "nationality":      "UNITED STATES OF AMERICA",
  "birthplace":       "VIRGINIA, U.S.A.",
  "residence":        "DALLAS, TEXAS",
  "sex":              "M",
  "passport_number":  "TPL501283",
  "site_title":       null,                      // defaults to "<display_name> — Travel Passport"
  "user_agent":       null
}
```

The file is committed (its contents are the same as the publicly-deployed `data/profile.json` anyway). The frontend reads the merged result from `data/profile.json`.

## TripIt credentials

The fetcher uses OAuth 1.0a. You'll need:

- `consumer_key` — your TripIt **API ID** from https://www.tripit.com/developer
- `consumer_secret` — your TripIt **API Secret**

The script opens your browser for a one-time approval, then stores `access_token` + `access_token_secret` back into `tools/credentials.json` (gitignored). All subsequent fetches are silent. If TripIt ever revokes the access token, re-run `fetch_tripit.py` interactively to redo the OAuth dance.

## Enrichment: tail numbers + aircraft models

TripIt gives you a short aircraft type code (e.g. `738`) but not the actual aircraft. Two free-or-cheap data sources can fill in the rest.

### BTS + FAA registry (free, 20+ years, US carriers)

The **Bureau of Transportation Statistics** publishes per-flight on-time performance data for every U.S. reporting carrier (AA, DL, UA, WN, AS, B6, F9, etc.) including domestic and international segments, going back to 1987. From 2003 onwards each record includes the actual aircraft tail number. We cross-reference those tails against the **FAA Aircraft Registry** to get the manufacturer + model + year-of-manufacture.

```bash
python3 tools/enrich_bts.py             # full backfill from your first flight forward
python3 tools/enrich_bts.py --dry-run   # show which months would be fetched
python3 tools/enrich_bts.py --start 2018-01   # only since Jan 2018
python3 tools/enrich_bts.py --force-faa # force-refresh the FAA registry
```

The first run takes ~30–60 min and downloads ~9 GB of monthly zips to `data/_bts_cache/raw/` (gitignored). It then filters them down to only your flights and writes the distilled result to `data/bts_matches.json` (committed — tiny). Subsequent runs only fetch the newest published month.

**Coverage gaps:** flights on foreign-flag carriers (SQ, BA, AF, LH, JL, etc.) are not in BTS — those need AeroDataBox or stay unenriched.

**FAA bot protection:** the FAA registry download occasionally returns HTTP 403 from non-browser User-Agents. If that happens, the script prints clear manual-download instructions: grab the zip from `https://registry.faa.gov/database/ReleasableAircraft.zip` in your browser, save it to `data/_bts_cache/ReleasableAircraft.zip`, and re-run.

### AeroDataBox (paid, last ~365 days, all carriers)

For the most recent flights — including foreign-carrier segments — there's [AeroDataBox](https://rapidapi.com/aedbx-aedbx/api/aerodatabox/) on RapidAPI. Free tier is 600 requests/month, covering roughly the last 365 days.

```bash
python3 tools/enrich_aerodatabox.py             # incremental
python3 tools/enrich_aerodatabox.py --dry-run   # show what would be fetched
python3 tools/enrich_aerodatabox.py --limit 50  # cap a single run
```

Add the API key to `tools/credentials.json`:

```json
{ "aerodatabox_rapidapi_key": "YOUR_RAPIDAPI_KEY_HERE" }
```

The script rate-limits to 1 req/sec and caches every response under `data/_aerodatabox_cache/` (gitignored) so reruns are free against your quota.

**Run order:** BTS first (broader coverage, free), then AeroDataBox (fills the foreign-carrier holes and the very newest flights). The merge logic deliberately does *not* overwrite AeroDataBox-enriched flights with BTS data, since AeroDataBox typically has richer model strings.

After enrichment, the **Stats** tab shows a "Specific Aircraft" card with your most-flown tails, the **New Plane Smell** achievement unlocks when you fly a freshly-built aircraft (compares FAA's year-of-manufacture to the flight date), and each flight's detail modal displays its registration.

## Hosting on GitHub Pages

The repo is set up to deploy via **GitHub Actions** (not "Deploy from a branch"). Configuration:

1. Push the repo to GitHub.
2. Settings → Pages → Source: **GitHub Actions**
3. The included `.github/workflows/pages.yml` runs on every push to `main`. It:
   - Injects a per-deploy cache-busting `?v=<run_id>-<sha>` query onto every JS import + `<script src>` (so browsers always pick up the latest module graph)
   - Uploads the resulting artifact
   - Deploys to Pages
4. Your site will be live at `https://<username>.github.io/Travel/` (or your custom `CNAME`).

No bundling. No npm. The `data/*.json` files are the entire payload.

## Auto-refresh weekly via GitHub Actions

`.github/workflows/refresh-data.yml` runs every Monday at 08:00 UTC (manually triggerable from the Actions tab too) and:

1. Reconstructs `tools/credentials.json` from repository secrets
2. Runs `fetch_tripit.py` — pulls new flights + your profile
3. Reruns `build_airports.py` so new carriers/airports are picked up
4. Runs `enrich_bts.py` incrementally (just the latest published month — ~50 MB, <1 min)
5. Runs `enrich_aerodatabox.py` if the API key secret is set
6. Commits any data changes back to `main`, which triggers `pages.yml` and re-deploys

### Required GitHub Secrets

Configure these under **Settings → Secrets and variables → Actions → New repository secret** (or scope them to the `github-pages` Environment if you prefer):

| Secret | Where to get it |
| --- | --- |
| `TRIPIT_CONSUMER_KEY`        | from `tools/credentials.json` |
| `TRIPIT_CONSUMER_SECRET`     | from `tools/credentials.json` |
| `TRIPIT_ACCESS_TOKEN`        | from `tools/credentials.json` (after first OAuth dance) |
| `TRIPIT_ACCESS_TOKEN_SECRET` | from `tools/credentials.json` |
| `AERODATABOX_API_KEY`        | (optional) from RapidAPI |

If TripIt ever revokes the access token, the workflow will fail loudly (GitHub emails you on failed scheduled runs). Fix by running `fetch_tripit.py` locally once to redo OAuth interactively, then update the two `_TOKEN` / `_TOKEN_SECRET` secrets with the fresh values from `tools/credentials.json`.

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
- Airline logos: [Jxck-S/airline-logos](https://github.com/Jxck-S/airline-logos)
- Free historical flight data: [BTS Reporting Carrier On-Time Performance](https://www.transtats.bts.gov/Tables.asp?gnoyr_VQ=FGJ), [FAA Aircraft Registry](https://registry.faa.gov/database/ReleasableAircraft.zip)
- Recent flight enrichment: [AeroDataBox](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)
- Visual inspiration: the [Flighty](https://www.flighty.com) annual passport screenshots
- Achievement catalog inspired by [TravStats](https://github.com/Abrechen2/TravStats)
