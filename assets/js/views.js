// views.js — top-level standalone views (Stats, World Map, US States).
// These render into their own <section> elements rather than passport pages.

import { formatNumber, formatDuration, formatDate, aircraftName, aircraftFamily, airlineLogoUrl, airlineBannerUrl, airlineDisplayName } from "./stats.js";

// Helper: small <img> for an airline. Hides itself gracefully if 404.
function airlineLogoImg(iata, airlinesIndex, alt) {
  const url = airlineLogoUrl(iata, airlinesIndex);
  if (!url) return "";
  return `<img class="airline-logo" src="${url}" alt="${escapeHtml(alt || iata || "")}" loading="lazy" onerror="this.classList.add('is-missing')" />`;
}
function airlineBannerImg(iata, airlinesIndex, alt) {
  const url = airlineBannerUrl(iata, airlinesIndex);
  if (!url) return "";
  return `<img class="airline-banner" src="${url}" alt="${escapeHtml(alt || iata || "")}" loading="lazy" onerror="this.classList.add('is-missing')" />`;
}
import { drawWorldMap } from "./worldmap.js";
import { drawUSMap }    from "./usmap.js";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ---------------------------------------------------------------------------
// Stat-card sub-renderers
// ---------------------------------------------------------------------------

function renderYearlyChart(s) {
  const entries = [...s.yearTotals.entries()].sort((a,b) => a[0] - b[0]);
  if (!entries.length) return `<div class="muted">No dated flights.</div>`;
  const max = Math.max(...entries.map(([, n]) => n));
  return `
    <div class="bar-chart" style="--cols:${entries.length}">
      ${entries.map(([y, n]) => `
        <div class="bar-col">
          <div class="bar" style="height:${(n/max)*100}%" title="${y}: ${n} flights"></div>
          <div class="bar-val">${n}</div>
          <div class="bar-lbl">${String(y).slice(2)}</div>
        </div>`).join("")}
    </div>`;
}

function renderMonthOfYearChart(s) {
  const max = Math.max(...s.monthOfYear);
  return `
    <div class="bar-chart" style="--cols:12">
      ${s.monthOfYear.map((n, i) => `
        <div class="bar-col">
          <div class="bar" style="height:${max ? (n/max)*100 : 0}%" title="${MONTH_FULL[i]}: ${n}"></div>
          <div class="bar-lbl">${MONTH_LABELS[i][0]}</div>
        </div>`).join("")}
    </div>`;
}

function renderHeatmap(s) {
  // GitHub-style grid: each year is one row of 53 weeks × 7 days
  const years = [...s.heatmap.keys()].sort();
  if (!years.length) return `<div class="muted">No data.</div>`;
  // Determine global max for scaling
  let max = 0;
  for (const dayMap of s.heatmap.values()) {
    for (const n of dayMap.values()) if (n > max) max = n;
  }
  function shade(n) {
    if (!n) return "0";
    const pct = Math.min(1, n / Math.max(max, 4));
    if (pct < 0.25) return "1";
    if (pct < 0.5)  return "2";
    if (pct < 0.75) return "3";
    return "4";
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function isoOf(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

  return `
    <div class="heatmap">
      ${years.map(y => {
        const dayMap = s.heatmap.get(y);
        const start = new Date(y, 0, 1);
        const end   = new Date(y, 11, 31);
        // Pad to start on Sunday
        const startDow = start.getDay();
        const cells = [];
        // empty cells before Jan 1
        for (let i = 0; i < startDow; i++) cells.push(`<div class="hm-cell hm-empty"></div>`);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const iso = isoOf(d);
          const n = dayMap.get(iso) || 0;
          cells.push(`<div class="hm-cell" data-c="${shade(n)}" title="${iso}${n ? ` · ${n} flight${n>1?"s":""}` : ""}"></div>`);
        }
        return `
          <div class="hm-row">
            <div class="hm-year">${y}</div>
            <div class="hm-grid">${cells.join("")}</div>
          </div>`;
      }).join("")}
      <div class="hm-legend">
        Less
        <span class="hm-cell" data-c="0"></span>
        <span class="hm-cell" data-c="1"></span>
        <span class="hm-cell" data-c="2"></span>
        <span class="hm-cell" data-c="3"></span>
        <span class="hm-cell" data-c="4"></span>
        More
      </div>
    </div>`;
}

function renderAircraftList(s) {
  if (!s.topAircraft.length) return `<div class="muted">No aircraft data.</div>`;
  const max = s.topAircraft[0].value;
  return `
    <ul class="rank-list">
      ${s.topAircraft.slice(0, 10).map(a => `
        <li>
          <code>${a.key}</code>
          <div class="rank-bar" style="width:${(a.value/max)*100}%" title="${escapeHtml(aircraftName(a.key))}"></div>
          <span class="v">${a.value}</span>
        </li>
        <li class="rank-sub muted small">${escapeHtml(aircraftName(a.key))} · ${escapeHtml(aircraftFamily(a.key))}</li>
      `).join("")}
    </ul>`;
}

function renderTailList(s, ctx) {
  if (!s.topTails.length) return "";
  const max = s.topTails[0].value;
  return `
    <ul class="rank-list">
      ${s.topTails.map(t => {
        const airlineCode = s.tailAirlines?.get(t.key);
        const airlineName = airlineCode ? airlineDisplayName(airlineCode, ctx.airlines) : "";
        const logo = airlineCode ? airlineLogoImg(airlineCode, ctx.airlines, airlineName) : "";
        return `
        <li>
          <span class="logo-code" title="${escapeHtml(airlineName)}">${logo}<code>${t.key}</code></span>
          <div class="rank-bar" style="width:${(t.value/max)*100}%" title="${escapeHtml(s.tailModels.get(t.key) || "")}"></div>
          <span class="v">${t.value}×</span>
        </li>
        ${s.tailModels.has(t.key) ? `<li class="rank-sub muted small">${escapeHtml(s.tailModels.get(t.key))}${airlineName ? " · " + escapeHtml(airlineName) : ""}</li>` : ""}
      `;
      }).join("")}
    </ul>`;
}

function renderClassChart(s) {
  const buckets = s.classBuckets;
  const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;
  const order = [
    ["economy",  "Economy",         "#7c3aed"],
    ["premium",  "Premium Economy", "#38bdf8"],
    ["business", "Business",        "#f59e0b"],
    ["first",    "First",           "#f43f5e"],
    ["unknown",  "Unknown",         "#64748b"],
  ];
  return `
    <div class="class-bar">
      ${order.map(([k, lbl, col]) => {
        const v = buckets[k] || 0;
        if (!v) return "";
        const pct = (v / total) * 100;
        return `<div class="class-seg" style="flex:${v};background:${col}" title="${lbl}: ${v} (${Math.round(pct)}%)"></div>`;
      }).join("")}
    </div>
    <ul class="class-legend">
      ${order.map(([k, lbl, col]) => {
        const v = buckets[k] || 0;
        if (!v) return "";
        return `<li><span class="sw" style="background:${col}"></span>${lbl} <strong>${v}</strong> <span class="muted">${Math.round((v/total)*100)}%</span></li>`;
      }).join("")}
    </ul>`;
}

function geoExtreme(ap, axis, suffix) {
  if (!ap) return `<div class="muted">—</div>`;
  const coord = axis === "lat" ? ap.lat : ap.lon;
  return `
    <div class="big-line">${ap.code} ${ap.flag || ""}</div>
    <div class="muted small">${escapeHtml(ap.city || ap.name || "")} · ${coord.toFixed(2)}${suffix}</div>`;
}

function renderHubChips(s) {
  const visited = new Set(s.topHubsVisited);
  // Show all 50 hubs, visited ones highlighted
  const order = [
    "ATL","DFW","DEN","ORD","LAX","JFK","LAS","MIA","CLT","MCO","SEA","PHX","EWR","SFO","IAH","BOS",
    "MSP","FLL","LGA","DTW","BWI","PHL","SAN","TPA","DCA","HNL","AUS","SLC","MDW","SJC","DAL","IAD",
    "LHR","CDG","AMS","FRA","IST","MAD","BCN","FCO","MUC","ZRH","CPH","ARN","VIE","ATH","LIS","DUB",
    "HND","NRT","ICN","PEK","PVG","HKG","TPE","SIN","BKK","KUL","DEL","BOM","DXB","DOH","AUH","TLV",
    "SYD","MEL","AKL","BNE","YYZ","YVR","YUL","MEX","CUN","GRU","GIG","EZE","SCL","JNB","CAI","ADD","NBO","CPT",
  ];
  return order.map(code => `<span class="hub-chip${visited.has(code) ? " is-visited" : ""}">${code}</span>`).join("");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

// ---------------------------------------------------------------------------
// STATS dashboard
// ---------------------------------------------------------------------------
export function renderStatsView(root, ctx) {
  const s = ctx.stats;

  const wkMax = Math.max(...s.weekday) || 1;
  const wkLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const wkBars = s.weekday.map((v,i) =>
    `<div class="bar" style="height:${(v/wkMax)*100}%" data-label="${wkLabels[i]}" title="${wkLabels[i]}: ${v}"></div>`
  ).join("");

  const earthCap = Math.min(s.earthLaps / 30, 1);
  const moonCap  = Math.min(s.moonTrips / 4, 1);
  const sunCap   = Math.min(s.sunLaps   / 1, 1);

  const apMax = s.topAirports[0]?.value || 1;
  const apRows = s.topAirports.slice(0,10).map(r =>
    `<li><code>${r.key}</code><div class="rank-bar" style="width:${(r.value/apMax)*100}%"></div><span class="v">${r.value}</span></li>`
  ).join("");

  const alMax = s.topAirlines[0]?.value || 1;
  const alRows = s.topAirlines.slice(0,10).map(r => {
    const name = airlineDisplayName(r.key, ctx.airlines, r.info?.name);
    return `<li>
      <span class="logo-code" title="${escapeHtml(name)}">
        ${airlineLogoImg(r.key, ctx.airlines, name)}
        <code>${r.key}</code>
      </span>
      <div class="rank-bar" style="width:${(r.value/alMax)*100}%"></div>
      <span class="v">${r.value}</span>
    </li>`;
  }).join("");

  const rtMax = s.topRoutes[0]?.value || 1;
  const rtRows = s.topRoutes.slice(0,10).map(r =>
    `<li><code>${r.key}</code><div class="rank-bar" style="width:${(r.value/rtMax)*100}%"></div><span class="v">${r.value}</span></li>`
  ).join("");

  const fe = (f, valFmt) => f
    ? `<div class="flight-extreme">
        <div class="extreme-info">
          ${airlineLogoImg(f.airline_code, ctx.airlines, f.airline)}
          <div>
            <div class="leg">${escapeHtml(f.from_city || f.from)} → ${escapeHtml(f.to_city || f.to)}</div>
            <div class="meta">${escapeHtml([f.airline_code, f.flight_number].filter(Boolean).join(" "))} · ${formatDate(f.depart)}</div>
          </div>
        </div>
        <div class="val">${valFmt(f)}</div>
      </div>`
    : "";

  root.innerHTML = `
    <div class="view-inner">
      <header class="view-header">
        <h1>Flight Statistics</h1>
        <p class="muted">${formatDate(s.firstFlight)} – ${formatDate(s.lastFlight)} · ${s.total.toLocaleString()} flights</p>
      </header>

      <div class="hero-row">
        <div class="hero">
          <div class="num">${formatNumber(s.total)}</div>
          <div class="label">Flights</div>
          <div class="sub">${s.domestic} domestic · ${s.international} international · ${s.longHaul} long-haul</div>
        </div>
        <div class="hero">
          <div class="num">${formatNumber(s.miles)}</div>
          <div class="label">Miles flown</div>
          <div class="sub">avg ${formatNumber(s.avgMiles)} mi / leg</div>
        </div>
        <div class="hero">
          <div class="num">${formatDuration(s.minutes)}</div>
          <div class="label">In the air</div>
          <div class="sub">avg ${formatDuration(s.avgMinutes)} per flight</div>
        </div>
        <div class="hero">
          <div class="num">${formatNumber(s.airportsCount)}</div>
          <div class="label">Airports</div>
          <div class="sub">${s.countriesCount} countries · ${s.statesCount} US states</div>
        </div>
      </div>

      <div class="grid-2col">

        <section class="card">
          <h2>Flights by weekday</h2>
          <div class="weekday-chart">${wkBars}</div>
          <div class="weekday-labels">${wkLabels.map(l=>`<span>${l[0]}</span>`).join("")}</div>
        </section>

        <section class="card">
          <h2>Distance covered</h2>
          <div class="distance-bars">
            <div class="row">
              <span class="emoji">🌍</span>
              <div class="track"><div class="fill" style="width:${earthCap*100}%"></div></div>
              <span class="mul">${s.earthLaps.toFixed(1)}× Earth</span>
            </div>
            <div class="row">
              <span class="emoji">🌑</span>
              <div class="track"><div class="fill" style="width:${moonCap*100}%"></div></div>
              <span class="mul">${s.moonTrips.toFixed(2)}× Moon</span>
            </div>
            <div class="row">
              <span class="emoji">☀️</span>
              <div class="track"><div class="fill" style="width:${sunCap*100}%"></div></div>
              <span class="mul">${s.sunLaps.toFixed(3)}× Sun</span>
            </div>
          </div>
        </section>

        <section class="card">
          <h2>Top airports <span class="muted">${s.airportsCount} total</span></h2>
          <ul class="rank-list">${apRows}</ul>
        </section>

        <section class="card">
          <h2>Top airlines <span class="muted">${s.airlines.size} total</span></h2>
          <ul class="rank-list">${alRows}</ul>
        </section>

        <section class="card span-2">
          <h2>Top routes <span class="muted">${s.routes.size} total</span></h2>
          <ul class="rank-list two-col">${rtRows}</ul>
        </section>

        <section class="card span-2">
          <h2>Notable flights</h2>
          <div class="extremes-grid">
            <div>
              <div class="extreme-label">Shortest</div>
              ${fe(s.shortest, f => `${Math.round(f._miles)} mi`)}
            </div>
            <div>
              <div class="extreme-label">Longest</div>
              ${fe(s.longest, f => `${Math.round(f._miles).toLocaleString()} mi`)}
            </div>
            <div>
              <div class="extreme-label">Quickest in the air</div>
              ${fe(s.shortestTime, f => formatDuration(f._minutes))}
            </div>
            <div>
              <div class="extreme-label">Longest in the air</div>
              ${fe(s.longestTime, f => formatDuration(f._minutes))}
            </div>
          </div>
        </section>

        <!-- ── GEOGRAPHY ───────────────────────────────────────────── -->
        <h2 class="section-head span-2">Geography</h2>

        <section class="card span-2">
          <h2>Range &amp; reach</h2>
          <div class="geo-grid">
            <div class="geo-cell">
              <div class="lbl">Northernmost</div>
              ${geoExtreme(s.extremes?.north, "lat", "°N")}
            </div>
            <div class="geo-cell">
              <div class="lbl">Southernmost</div>
              ${geoExtreme(s.extremes?.south, "lat", "°")}
            </div>
            <div class="geo-cell">
              <div class="lbl">Westernmost</div>
              ${geoExtreme(s.extremes?.west, "lon", "°")}
            </div>
            <div class="geo-cell">
              <div class="lbl">Easternmost</div>
              ${geoExtreme(s.extremes?.east, "lon", "°")}
            </div>
            <div class="geo-cell">
              <div class="lbl">Centroid of travel</div>
              <div class="big-line">${s.centroid ? `${s.centroid.lat.toFixed(2)}, ${s.centroid.lon.toFixed(2)}` : "—"}</div>
              <div class="muted small">Geographic center of every airport you've touched</div>
            </div>
            <div class="geo-cell">
              <div class="lbl">Home base</div>
              <div class="big-line">${s.homeAirport ? s.homeAirport.code : "—"}</div>
              <div class="muted small">${s.homeAirport ? escapeHtml(s.homeAirport.name || "") : ""}</div>
            </div>
            <div class="geo-cell">
              <div class="lbl">Avg distance from home</div>
              <div class="big-line">${s.avgDistanceFromHome ? Math.round(s.avgDistanceFromHome).toLocaleString() + " mi" : "—"}</div>
            </div>
            <div class="geo-cell">
              <div class="lbl">Furthest point</div>
              <div class="big-line">${s.furthestAirport ? s.furthestAirport.code : "—"}</div>
              <div class="muted small">${s.furthestAirport ? escapeHtml(s.furthestAirport.name || "") + " · " + Math.round(s.furthestDistance).toLocaleString() + " mi" : ""}</div>
            </div>
          </div>
        </section>

        <section class="card span-2">
          <h2>Airport Explorer <span class="muted">global top 50 hubs</span></h2>
          <div class="hub-bar">
            <div class="hub-fill" style="width:${(s.topHubsCount/s.topHubsTotal)*100}%"></div>
          </div>
          <div class="hub-stats">
            <div><strong>${s.topHubsCount}</strong> of ${s.topHubsTotal} major hubs · <strong>${Math.round((s.topHubsCount/s.topHubsTotal)*100)}%</strong></div>
            <div class="muted small">Top 50 by international passenger traffic — visit them all for full credit.</div>
          </div>
          <div class="hub-chip-grid">
            ${renderHubChips(s)}
          </div>
        </section>

        <section class="card span-2 carbon-card">
          <h2>Carbon footprint <span class="muted">estimated</span></h2>
          <div class="carbon-grid">
            <div class="carbon-headline">
              <div class="num">${(s.co2Tonnes).toFixed(1)}<span class="den"> t</span></div>
              <div class="label">CO₂ emitted across all flights</div>
              <div class="sub">${Math.round(s.co2Kg).toLocaleString()} kg total · ${(s.co2Kg / Math.max(s.total, 1)).toFixed(0)} kg per flight avg</div>
            </div>
            <div class="carbon-context">
              <div class="row">
                <span class="emoji">🌳</span>
                <div><strong>${Math.round(s.treesNeededPerYear).toLocaleString()}</strong> mature trees, working for a year, to absorb that</div>
              </div>
              <div class="row">
                <span class="emoji">🚗</span>
                <div><strong>${Math.round(s.carEquivalentMiles).toLocaleString()} mi</strong> in an average gasoline car</div>
              </div>
              <div class="row">
                <span class="emoji">🏠</span>
                <div><strong>${(s.co2Tonnes / 4.6).toFixed(1)}</strong> years of an average US household's electricity</div>
              </div>
              <div class="row caveat">
                <span class="emoji">ℹ️</span>
                <div class="muted">ICAO-style economy-class factors (158/133/115 g/pkm by haul) plus ~30 kg LTO per leg. Premium-cabin multipliers not applied; actual emissions depend on aircraft, load factor, routing, and seat class.</div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── CADENCE ─────────────────────────────────────────────── -->
        <h2 class="section-head span-2">Cadence</h2>

        <section class="card span-2">
          <h2>Flights by year</h2>
          ${renderYearlyChart(s)}
        </section>

        <section class="card">
          <h2>Busiest months <span class="muted">all-time</span></h2>
          ${renderMonthOfYearChart(s)}
          <div class="muted small mt-8">Most-flown: <strong>${MONTH_FULL[s.busiestMonth]}</strong></div>
        </section>

        <section class="card">
          <h2>Velocity</h2>
          <div class="kpi"><span class="big">${Math.round(s.avgSpeedMph)}</span> <span class="den">mph avg</span></div>
          <div class="muted small">Total miles ÷ total time aloft across all flights</div>
          <div class="kpi-row mt-12">
            <div><div class="lbl">Total time</div><div class="val">${formatDuration(s.minutes)}</div></div>
            <div><div class="lbl">Avg per leg</div><div class="val">${formatDuration(s.avgMinutes)}</div></div>
          </div>
        </section>

        <section class="card span-2">
          <h2>Travel intensity <span class="muted">heatmap · darker = more flights</span></h2>
          ${renderHeatmap(s)}
        </section>

        <!-- ── AVIATION ────────────────────────────────────────────── -->
        <h2 class="section-head span-2">Aviation</h2>

        <section class="card">
          <h2>Top aircraft <span class="muted">${s.aircraft.size} types</span></h2>
          ${renderAircraftList(s)}
        </section>

        <section class="card">
          <h2>Cabin class</h2>
          ${renderClassChart(s)}
        </section>

        ${s.enrichedFlights > 0 ? `
        <section class="card span-2">
          <h2>Specific aircraft <span class="muted">${s.uniqueTails} unique tails · ${s.enrichedFlights} flights enriched</span></h2>
          ${renderTailList(s, ctx)}
          <div class="muted small mt-8">Tail numbers, models, and callsigns pulled via AeroDataBox. Coverage is limited to flights within ~365 days of when the enrichment was run.</div>
        </section>` : `
        <section class="card span-2 enrich-hint">
          <h2>Tail-number tracking <span class="muted">optional</span></h2>
          <p>Want to see <em>which specific aircraft</em> you've been on? Run <code>python tools/enrich_aerodatabox.py</code> with an AeroDataBox API key (free tier 600 req/mo) to fill in tail numbers, aircraft models, and ATC callsigns for flights within the last 365 days. See the README for setup.</p>
        </section>`}

      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// WORLD map view
// ---------------------------------------------------------------------------
export function renderWorldView(root, ctx) {
  const s = ctx.stats;
  // Country list sorted by flight count desc
  const countries = [...s.countries.entries()]
    .map(([code, info]) => ({ code, ...info }))
    .sort((a, b) => b.count - a.count);
  const flagStrip = countries.map(c => `
    <div class="flag-chip" title="${escapeHtml(c.name || c.code)} · ${c.count} airport visits">
      <span class="flag">${c.flag || ""}</span>
      <span class="flag-name">${escapeHtml(c.name || c.code)}</span>
      <span class="flag-count">${c.count}</span>
    </div>`).join("");

  root.innerHTML = `
    <div class="view-inner">
      <header class="view-header">
        <h1>World Map</h1>
        <p class="muted">${s.countriesCount} countries · ${s.airportsCount} airports · ${s.routes.size} routes</p>
      </header>
      <div class="map-stage">
        <svg class="map-svg world-svg" viewBox="0 0 960 480" preserveAspectRatio="xMidYMid meet" aria-label="World map of flight routes"></svg>
        <div class="map-legend">
          <span><span class="sw" style="background:#2d4d9b"></span> Visited country</span>
          <span><span class="sw" style="background:#a78bfa"></span> Flight route</span>
          <span><span class="sw" style="background:#7a1a1a"></span> Airport</span>
          <span><span class="sw" style="background:#c8a04a"></span> Top hub</span>
        </div>
      </div>
      <section class="card flags-card">
        <h2>Countries visited <span class="muted">${countries.length}</span></h2>
        <div class="flag-strip">${flagStrip}</div>
      </section>
    </div>`;
  queueMicrotask(() => drawWorldMap(root.querySelector(".world-svg"), ctx).catch(console.error));
}

// ---------------------------------------------------------------------------
// US STATES view
// ---------------------------------------------------------------------------
export function renderUSView(root, ctx) {
  const s = ctx.stats;
  const sortedStates = [...s.states.entries()].sort((a,b) => b[1].count - a[1].count);
  const visitedList = sortedStates.slice(0, 16).map(([code, info]) =>
    `<li><code>${code}</code><span class="v">${info.count}</span></li>`
  ).join("");

  root.innerHTML = `
    <div class="view-inner">
      <header class="view-header">
        <h1>United States</h1>
        <p class="muted">${s.statesCount} of 50 states · ${Math.round((s.statesCount/50)*100)}% complete</p>
      </header>
      <div class="us-grid">
        <div class="map-stage">
          <svg class="map-svg us-svg" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet" aria-label="US states visited"></svg>
        </div>
        <aside class="us-side">
          <div class="us-tally">
            <div class="cell"><div class="big">${s.statesCount}</div><div class="lbl">Visited</div></div>
            <div class="cell"><div class="big">${50 - s.statesCount}</div><div class="lbl">To go</div></div>
            <div class="cell"><div class="big">${Math.round((s.statesCount/50)*100)}%</div><div class="lbl">Complete</div></div>
          </div>
          <div class="card">
            <h3>Most-flown US airports</h3>
            <ul class="rank-list us-airports">${visitedList || "<li><span class=\"muted\">—</span></li>"}</ul>
          </div>
        </aside>
      </div>
    </div>`;
  queueMicrotask(() => drawUSMap(root.querySelector(".us-svg"), ctx).catch(console.error));
}

// ---------------------------------------------------------------------------
// FLIGHT LOG view (own tab) + click-for-detail modal
// ---------------------------------------------------------------------------
export function renderLogView(root, ctx) {
  const flights = [...ctx.flights]
    .sort((a, b) => (b.depart || "").localeCompare(a.depart || ""));

  // Stash a global index so the modal handler can look flights up by air_id+seg
  ctx._flightById = new Map();
  flights.forEach((f, i) => ctx._flightById.set(String(i), f));

  const rows = flights.map((f, i) => `
    <tr data-fi="${i}" tabindex="0">
      <td class="date">${formatDate(f.depart, { year: "2-digit", month: "short", day: "numeric" })}</td>
      <td class="route">
        <span class="from">${f.from}</span>
        <span class="arrow">→</span>
        <span class="to">${f.to}</span>
        <span class="cities muted">${escapeHtml(f.from_city || "")} – ${escapeHtml(f.to_city || "")}</span>
      </td>
      <td class="airline">
        ${airlineLogoImg(f.airline_code, ctx.airlines, f.airline)}
        <span>${escapeHtml([f.airline_code, f.flight_number].filter(Boolean).join(" "))}</span>
      </td>
      <td class="miles">${f._miles ? Math.round(f._miles).toLocaleString() : "—"}</td>
      <td class="duration">${f.duration || "—"}</td>
    </tr>`).join("");

  root.innerHTML = `
    <div class="view-inner log-view">
      <header class="view-header">
        <h1>Flight Log</h1>
        <p class="muted">${flights.length.toLocaleString()} flights · most recent first · click a row for details</p>
      </header>
      <div class="log-filters">
        <input type="search" id="log-search" placeholder="Search by airline, airport, city…" autocomplete="off" />
      </div>
      <div class="card log-card">
        <table class="log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Route</th>
              <th>Flight</th>
              <th style="text-align:right">Miles</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody id="log-tbody">${rows}</tbody>
        </table>
      </div>
    </div>`;

  // Row click / keyboard open
  const tbody = root.querySelector("#log-tbody");
  function openFromTarget(t) {
    const tr = t.closest("tr[data-fi]");
    if (!tr) return;
    const f = ctx._flightById.get(tr.dataset.fi);
    if (f) openFlightModal(f, ctx);
  }
  tbody.addEventListener("click", e => openFromTarget(e.target));
  tbody.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFromTarget(e.target);
    }
  });

  // Filter
  const search = root.querySelector("#log-search");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    for (const tr of tbody.children) {
      const txt = tr.textContent.toLowerCase();
      tr.style.display = q && !txt.includes(q) ? "none" : "";
    }
  });
}

// ---------------------------------------------------------------------------
// Reusable detail modal (used by flight rows, passport stamps, achievements)
// ---------------------------------------------------------------------------

let _modalOnceWired = false;
function ensureModalWired() {
  if (_modalOnceWired) return;
  _modalOnceWired = true;
  const modal = document.getElementById("detail-modal");
  modal.addEventListener("click", (e) => {
    // Use closest() so clicks on the SVG path inside the X button still match
    // the [data-close] attribute on the parent button.
    if (e.target.closest("[data-close]")) closeDetailModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeDetailModal();
  });
}

export function openDetailModal(html) {
  ensureModalWired();
  const modal = document.getElementById("detail-modal");
  const body  = document.getElementById("detail-modal-body");
  body.innerHTML = html;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

export function closeDetailModal() {
  const modal = document.getElementById("detail-modal");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openFlightModal(f, ctx) {
  const modal = document.getElementById("detail-modal");
  const body  = document.getElementById("detail-modal-body");
  ensureModalWired();

  const aFrom = ctx.airports[f.from];
  const aTo   = ctx.airports[f.to];
  const airline = ctx.airlines && ctx.airlines[f.airline_code];
  const km = (f._miles || 0) * 1.60934;
  const co2Factor = km < 800 ? 0.158 : km < 3700 ? 0.133 : 0.115;
  const co2kg = km > 0 ? (km * co2Factor + 30) : 0;
  const haul = km < 800 ? "short-haul" : km < 3700 ? "medium-haul" : "long-haul";

  function row(label, val) {
    if (val == null || val === "") return "";
    return `<div class="detail-row"><dt>${label}</dt><dd>${val}</dd></div>`;
  }

  const bannerHtml = airlineBannerImg(f.airline_code, ctx.airlines, (airline?.name) || f.airline);
  body.innerHTML = `
    <header class="flight-detail-head">
      ${bannerHtml ? `<div class="flight-airline-banner">${bannerHtml}</div>` : ""}
      <div class="route-big">
        <div class="airport">
          <div class="code">${f.from || "—"}</div>
          <div class="city">${escapeHtml(f.from_city || aFrom?.city || "")}</div>
          ${aFrom ? `<div class="muted">${escapeHtml(aFrom.name || "")}</div>` : ""}
        </div>
        <div class="arrow-big">
          <svg viewBox="0 0 80 24" width="80" height="24"><path d="M2 12 H 70 M 64 6 L 78 12 L 64 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="muted small">${f._miles ? Math.round(f._miles).toLocaleString() + " mi" : ""}${f.duration ? " · " + f.duration : ""}</div>
        </div>
        <div class="airport">
          <div class="code">${f.to || "—"}</div>
          <div class="city">${escapeHtml(f.to_city || aTo?.city || "")}</div>
          ${aTo ? `<div class="muted">${escapeHtml(aTo.name || "")}</div>` : ""}
        </div>
      </div>
      <h2 id="flight-modal-title" class="muted">
        ${escapeHtml((airline?.name) || f.airline || f.airline_code || "Flight")}${f.flight_number ? " · " + escapeHtml([f.airline_code, f.flight_number].filter(Boolean).join(" ")) : ""}
      </h2>
    </header>

    <dl class="flight-details">
      ${row("Departure",   formatDate(f.depart) + (f.depart ? " · " + new Date(f.depart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""))}
      ${row("Arrival",     formatDate(f.arrive) + (f.arrive ? " · " + new Date(f.arrive).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""))}
      ${row("Duration",    f.duration)}
      ${row("Distance",    f._miles ? `${Math.round(f._miles).toLocaleString()} mi · ${Math.round(km).toLocaleString()} km` : "")}
      ${row("Aircraft",        [f.aircraft_model, f.aircraft && f.aircraft_model ? `(${f.aircraft})` : f.aircraft].filter(Boolean).join(" "))}
      ${row("Tail number",     f.tail_number)}
      ${row("Mode-S hex",      f.aircraft_mode_s)}
      ${row("Callsign",        f.callsign)}
      ${row("Seat",            f.seat)}
      ${row("Class",           f.service_class)}
      ${row("Airline",         (airline?.name) || f.airline)}
      ${row("Operating",       f.is_codeshare ? `${escapeHtml(f.operating_airline || "")} (codeshare)` : "")}
      ${row("From city",   `${escapeHtml(f.from_city || aFrom?.city || "")} ${aFrom ? `· ${aFrom.flag || ""} ${escapeHtml(aFrom.country_name || aFrom.country || "")}` : ""}`)}
      ${row("To city",     `${escapeHtml(f.to_city   || aTo?.city   || "")} ${aTo   ? `· ${aTo.flag   || ""} ${escapeHtml(aTo.country_name   || aTo.country   || "")}` : ""}`)}
      ${row("Trip",        f.trip_name)}
      ${row("Stops",       f.stops)}
      ${row("CO₂ estimate", co2kg > 0 ? `${Math.round(co2kg).toLocaleString()} kg <span class="muted">(${haul})</span>` : "")}
    </dl>`;

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// ---------------------------------------------------------------------------
// STAMP MODAL — clicked from a passport stamp page
// ---------------------------------------------------------------------------
const REGION_FOR_COUNTRY = {
  US: "N. America", CA: "N. America", MX: "N. America",
  GB: "Europe", IE: "Europe", FR: "Europe", DE: "Europe", IT: "Europe", ES: "Europe", PT: "Europe",
  NL: "Europe", BE: "Europe", CH: "Europe", AT: "Europe", HR: "Europe", DK: "Europe", FI: "Europe",
  SE: "Europe", NO: "Europe", PL: "Europe", CZ: "Europe", GR: "Europe",
  JP: "Asia", CN: "Asia", SG: "Asia", KR: "Asia", TH: "Asia", VN: "Asia", IN: "Asia", PH: "Asia",
  TR: "Middle East", AE: "Middle East", IL: "Middle East", JO: "Middle East", SA: "Middle East",
  AU: "Oceania", NZ: "Oceania", FJ: "Oceania",
  AR: "S. America", BR: "S. America", CL: "S. America", PE: "S. America", CO: "S. America",
  PR: "Caribbean", DO: "Caribbean", JM: "Caribbean", BS: "Caribbean", CU: "Caribbean", BB: "Caribbean",
  EG: "Africa", ZA: "Africa", MA: "Africa", KE: "Africa", TZ: "Africa",
  CR: "C. America", PA: "C. America", GT: "C. America", BZ: "C. America",
};

const STATE_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
  DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",
  MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",
  NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",
  ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",
  SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"D.C.",PR:"Puerto Rico",
};

export function openStampModal(kind, code, ctx) {
  const isState = kind === "state";
  // Find every flight that landed in this country/state
  const matched = [];
  const airportsHit = new Map();
  for (const f of ctx.flights) {
    const ap = ctx.airports[f.to];
    if (!ap) continue;
    let hit = false;
    if (isState) {
      if (ap.country === "US" && ap.state === code) hit = true;
    } else {
      if (ap.country === code) hit = true;
    }
    if (hit) {
      matched.push(f);
      airportsHit.set(ap.code, ap);
    }
  }
  // Sort newest first
  matched.sort((a, b) => (b.depart || "").localeCompare(a.depart || ""));

  const titleName = isState ? (STATE_NAMES[code] || code) : (ctx.airports && [...airportsHit.values()][0]?.country_name) || code;
  const flag = isState ? "🇺🇸" : ([...airportsHit.values()][0]?.flag || "");
  const region = isState ? "United States" : (REGION_FOR_COUNTRY[code] || "");
  const firstDate = matched.length ? matched[matched.length - 1].depart : null;
  const lastDate  = matched.length ? matched[0].depart : null;
  const totalMiles = matched.reduce((s, f) => s + (f._miles || 0), 0);

  const airportRows = [...airportsHit.values()]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(ap => {
      const visits = matched.filter(f => f.to === ap.code).length;
      return `<li><code>${ap.code}</code> <span class="ap-name">${escapeHtml(ap.name || "")}</span> <span class="ap-city muted">${escapeHtml(ap.city || "")}</span> <span class="ap-count">${visits}×</span></li>`;
    }).join("");

  const flightRows = matched.map(f => `
    <tr>
      <td>${formatDate(f.depart, { year:"2-digit", month:"short", day:"numeric" })}</td>
      <td class="route">${f.from} → ${f.to}</td>
      <td class="airline">
        ${airlineLogoImg(f.airline_code, ctx.airlines, f.airline)}
        ${escapeHtml([f.airline_code, f.flight_number].filter(Boolean).join(" "))}
      </td>
      <td class="miles">${f._miles ? Math.round(f._miles).toLocaleString() : "—"}</td>
    </tr>`).join("");

  openDetailModal(`
    <header class="stamp-detail-head">
      <div class="stamp-flag" aria-hidden="true">${flag}</div>
      <div>
        <div class="stamp-region">${region}${isState ? ` · ${code}` : ""}</div>
        <h2 id="detail-modal-title" class="stamp-title">${escapeHtml(titleName)}</h2>
      </div>
    </header>

    <div class="stamp-stats">
      <div class="stamp-stat"><div class="lbl">Visits</div><div class="val">${matched.length}</div></div>
      <div class="stamp-stat"><div class="lbl">Airports</div><div class="val">${airportsHit.size}</div></div>
      <div class="stamp-stat"><div class="lbl">Miles flown to</div><div class="val">${Math.round(totalMiles).toLocaleString()}</div></div>
    </div>

    <div class="stamp-dates">
      <div><span class="lbl">First visit</span> <span class="val">${firstDate ? formatDate(firstDate) : "—"}</span></div>
      <div><span class="lbl">Most recent</span> <span class="val">${lastDate ? formatDate(lastDate) : "—"}</span></div>
    </div>

    <h3 class="stamp-section-h">Airports visited</h3>
    <ul class="ap-list">${airportRows}</ul>

    <h3 class="stamp-section-h">All flights here <span class="muted">(${matched.length})</span></h3>
    <div class="stamp-flight-table-wrap">
      <table class="stamp-flight-table">
        <thead><tr><th>Date</th><th>Route</th><th>Flight</th><th style="text-align:right">Miles</th></tr></thead>
        <tbody>${flightRows}</tbody>
      </table>
    </div>
  `);
}
