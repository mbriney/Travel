// timeline.js — chronological "watch the map grow" view. Slider + play/pause.
//
// Pre-computes, for every month from the user's first flight through today:
//   - the cumulative SET of airports, routes, country/state codes visited
//     up to the END of that month
//   - the cumulative flight/mile/minute totals
//   - any new "milestones" that triggered in that month (first international,
//     first to each new country, longest flight to date, etc.)
//
// The flat-map SVG is built once. Every airport gets a <circle>, every route
// gets an arc <path>, every country gets a fill <path>. Each carries a
// `data-since-idx` (the month-index it first applies). On every slider tick
// we toggle visibility based on whether data-since-idx ≤ current month.
// That keeps scrubbing buttery — no DOM rebuilds, just class toggles.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import { formatNumber } from "./stats.js";

// Inlined to avoid coupling: haversine great-circle distance in statute miles.
function haversineMiles(a, b) {
  if (!a || !b || a.lat == null || a.lon == null || b.lat == null || b.lon == null) return 0;
  const R = 3958.7613;  // Earth radius in mi
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

let _worldCache = null;
async function loadWorld() {
  if (_worldCache) return _worldCache;
  _worldCache = await (await fetch(WORLD_URL)).json();
  return _worldCache;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function monthKey(date) {
  // "YYYY-MM" — sortable as a string, comparable with <=/<.
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key) {
  // "Aug 2010"
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "short", year: "numeric", timeZone: "UTC",
  });
}
function nextMonth(key) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // m is 1-12 → next month is correct
  return monthKey(d);
}

// ─── Pre-compute monthly snapshots ──────────────────────────────────────────
function buildTimeline(ctx) {
  // Sort flights chronologically. Skip flights without a departure date.
  const flights = ctx.flights
    .filter(f => f.depart)
    .map(f => ({ ...f, _date: new Date(f.depart) }))
    .filter(f => !isNaN(f._date))
    .sort((a, b) => a._date - b._date);

  if (!flights.length) return null;

  const firstKey = monthKey(flights[0]._date);
  const lastKey  = monthKey(new Date());  // through "now"
  // Materialize every month from first to now (inclusive).
  const months = [];
  for (let k = firstKey; k <= lastKey; k = nextMonth(k)) months.push(k);

  // Per-flight enrichment: pre-compute miles & minutes once.
  for (const f of flights) {
    const aFrom = ctx.airports[f.from], aTo = ctx.airports[f.to];
    f._miles = +f.miles || (aFrom && aTo ? haversineMiles(aFrom, aTo) || 0 : 0);
    f._minutes = +f.minutes || 0;
    if (!f._minutes && f.depart && f.arrive) {
      const t = (new Date(f.arrive) - new Date(f._date)) / 60000;
      if (Number.isFinite(t) && t > 0) f._minutes = t;
    }
    f._monthIdx = months.indexOf(monthKey(f._date));
  }

  // Per-month accumulator
  const byMonth = months.map(() => ({
    airports: new Set(),
    routes: new Map(),     // "AAA-BBB" sorted → count
    countries: new Set(),
    states: new Set(),
    addFlights: 0,
    addMiles: 0,
    addMinutes: 0,
  }));

  // First-time discovery trackers (running, across all months)
  const everAirports = new Set();
  const everCountries = new Set();
  const everStates = new Set();
  const everRoutes = new Set();

  // Milestones: emit one note per month when notable things happen.
  const milestones = months.map(() => null);
  function noteMilestone(idx, text) {
    if (!milestones[idx]) milestones[idx] = text;
  }

  let longestMilesSoFar = 0;
  let runningTotalFlights = 0;

  for (const f of flights) {
    const i = f._monthIdx;
    const bucket = byMonth[i];
    bucket.addFlights += 1;
    bucket.addMiles += f._miles;
    bucket.addMinutes += f._minutes;
    if (f.from) bucket.airports.add(f.from);
    if (f.to)   bucket.airports.add(f.to);

    // Routes (directional, like main stats)
    if (f.from && f.to) {
      const dir = `${f.from}-${f.to}`;
      bucket.routes.set(dir, (bucket.routes.get(dir) || 0) + 1);
    }

    // Country / state discovery via the destination airport (matches the
    // main stats convention: a country counts when it appears as an arrival).
    const aTo = ctx.airports[f.to];
    if (aTo?.country) bucket.countries.add(aTo.country);
    if (aTo?.country === "US" && aTo.state) bucket.states.add(aTo.state);

    // First-ever events → milestones
    runningTotalFlights += 1;
    if (runningTotalFlights === 1) noteMilestone(i, "First flight ever ✈");
    if (aTo?.country && !everCountries.has(aTo.country)) {
      everCountries.add(aTo.country);
      const name = aTo.country_name || aTo.country;
      if (everCountries.size === 1) {
        // intentionally suppress — usually US, redundant with "first flight"
      } else if (aTo.country !== "US") {
        // Special call-out for the very first international
        const intlSoFar = [...everCountries].filter(c => c !== "US").length;
        if (intlSoFar === 1) noteMilestone(i, `First international flight 🌍 — ${name}`);
        else                 noteMilestone(i, `First flight to ${name}`);
      }
    }
    if (aTo?.country === "US" && aTo.state && !everStates.has(aTo.state)) {
      everStates.add(aTo.state);
    }
    if (f.from) everAirports.add(f.from);
    if (f.to)   everAirports.add(f.to);
    if (f.from && f.to) {
      const pair = [f.from, f.to].sort().join("|");
      everRoutes.add(pair);
    }
    if (f._miles > longestMilesSoFar) {
      longestMilesSoFar = f._miles;
      // Only note the longest-ever if it's a meaningful upgrade (>10% longer).
      if (longestMilesSoFar >= 3000) {
        noteMilestone(i, `Longest flight to date — ${Math.round(longestMilesSoFar).toLocaleString()} mi (${f.from}→${f.to})`);
      }
    }
  }

  // Now roll up cumulative snapshots
  const cum = months.map(() => ({
    airports: new Set(),
    routes: new Map(),
    countries: new Set(),
    states: new Set(),
    flights: 0,
    miles: 0,
    minutes: 0,
    milestone: null,
  }));
  const allAirports = new Set();
  const allRoutes = new Map();
  const allCountries = new Set();
  const allStates = new Set();
  let totalFlights = 0, totalMiles = 0, totalMinutes = 0;
  for (let i = 0; i < months.length; i++) {
    const b = byMonth[i];
    for (const a of b.airports) allAirports.add(a);
    for (const [k, v] of b.routes) allRoutes.set(k, (allRoutes.get(k) || 0) + v);
    for (const c of b.countries) allCountries.add(c);
    for (const s of b.states)    allStates.add(s);
    totalFlights += b.addFlights;
    totalMiles   += b.addMiles;
    totalMinutes += b.addMinutes;
    cum[i] = {
      airports: new Set(allAirports),
      routes:   new Map(allRoutes),
      countries:new Set(allCountries),
      states:   new Set(allStates),
      flights:  totalFlights,
      miles:    totalMiles,
      minutes:  totalMinutes,
      milestone: milestones[i],
    };
  }

  // For each airport / route / country / state, compute the month-index of
  // its FIRST appearance (data-since-idx). That lets the renderer just toggle
  // visibility based on the current slider month.
  const airportSince = new Map();    // code → idx
  const routeSince   = new Map();    // "from-to" → idx
  const countrySince = new Map();    // ISO2 → idx
  const stateSince   = new Map();    // 2-letter → idx
  for (let i = 0; i < months.length; i++) {
    for (const code of byMonth[i].airports) {
      if (!airportSince.has(code)) airportSince.set(code, i);
    }
    for (const key of byMonth[i].routes.keys()) {
      if (!routeSince.has(key)) routeSince.set(key, i);
    }
    for (const c of byMonth[i].countries) {
      if (!countrySince.has(c)) countrySince.set(c, i);
    }
    for (const s of byMonth[i].states) {
      if (!stateSince.has(s)) stateSince.set(s, i);
    }
  }

  return { months, cum, airportSince, routeSince, countrySince, stateSince };
}

// ─── View renderer ──────────────────────────────────────────────────────────
export async function renderTimelineView(root, ctx) {
  const tl = buildTimeline(ctx);
  if (!tl) {
    root.innerHTML = `<div class="empty" style="margin:48px auto;max-width:520px;text-align:center"><h1>No timeline yet</h1><p>Once flight data is loaded, this view will let you scrub through your travel history month-by-month.</p></div>`;
    return;
  }
  const { months, cum, airportSince, routeSince, countrySince, stateSince } = tl;
  const lastIdx = months.length - 1;

  root.innerHTML = `
    <div class="page-head">
      <h1>Timeline</h1>
      <p class="subtitle">Drag the slider — or hit play — to watch your map grow chronologically.</p>
    </div>

    <section class="card timeline-stats-card" aria-label="Cumulative stats">
      <div class="tl-stat"><span class="num" id="tl-stat-flights">0</span><span class="lbl">flights</span></div>
      <div class="tl-stat"><span class="num" id="tl-stat-miles">0</span><span class="lbl">miles</span></div>
      <div class="tl-stat"><span class="num" id="tl-stat-hours">0</span><span class="lbl">hours aloft</span></div>
      <div class="tl-stat"><span class="num" id="tl-stat-countries">0</span><span class="lbl">countries</span></div>
      <div class="tl-stat"><span class="num" id="tl-stat-states">0</span><span class="lbl">states</span></div>
    </section>

    <div class="timeline-milestone" id="tl-milestone" aria-live="polite"></div>

    <div class="map-stage timeline-stage">
      <svg class="map-svg world-svg timeline-map" viewBox="0 0 960 480"
           preserveAspectRatio="xMidYMid meet" aria-label="Travel timeline map"></svg>
    </div>

    <div class="timeline-controls card" role="group" aria-label="Timeline controls">
      <button class="tl-play" id="tl-play" aria-label="Play timeline">
        <svg class="tl-icon-play" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M7 4l13 8-13 8V4z" fill="currentColor"/>
        </svg>
        <svg class="tl-icon-pause" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="display:none">
          <rect x="6" y="4" width="4" height="16" fill="currentColor" rx="1"/>
          <rect x="14" y="4" width="4" height="16" fill="currentColor" rx="1"/>
        </svg>
      </button>
      <div class="tl-date" id="tl-date">${monthLabel(months[lastIdx])}</div>
      <input class="tl-slider" id="tl-slider" type="range" min="0" max="${lastIdx}" value="${lastIdx}" step="1" aria-label="Timeline month"/>
      <label class="tl-speed">
        <span class="tl-speed-label">Speed</span>
        <select id="tl-speed">
          <option value="0.5">½×</option>
          <option value="1" selected>1×</option>
          <option value="2">2×</option>
          <option value="4">4×</option>
        </select>
      </label>
    </div>
  `;

  const svg       = root.querySelector(".timeline-map");
  const slider    = root.querySelector("#tl-slider");
  const playBtn   = root.querySelector("#tl-play");
  const playIcon  = playBtn.querySelector(".tl-icon-play");
  const pauseIcon = playBtn.querySelector(".tl-icon-pause");
  const speedSel  = root.querySelector("#tl-speed");
  const dateEl    = root.querySelector("#tl-date");
  const mileEl    = root.querySelector("#tl-milestone");
  const elFlights = root.querySelector("#tl-stat-flights");
  const elMiles   = root.querySelector("#tl-stat-miles");
  const elHours   = root.querySelector("#tl-stat-hours");
  const elCount   = root.querySelector("#tl-stat-countries");
  const elStates  = root.querySelector("#tl-stat-states");

  // ── Build base map ──────────────────────────────────────────────────────
  const world = await loadWorld();
  const countries = topojson.feature(world, world.objects.countries);

  const w = 960, h = 480;
  const projection = d3.geoNaturalEarth1().fitSize([w, h - 20], countries);
  const path = d3.geoPath(projection);
  const sel = d3.select(svg);
  sel.selectAll("*").remove();

  // Graticule
  sel.append("path")
    .attr("class", "graticule")
    .attr("d", path(d3.geoGraticule10()));

  // Build a map of ISO numeric country id → ISO2 (so we can color visited)
  // via airport coordinate-in-polygon test. Doing it once up front.
  const numericToISO2 = new Map();
  const isVisitable = new Set([...airportSince.keys()]
    .map(c => ctx.airports[c]?.country).filter(Boolean));
  for (const feat of countries.features) {
    for (const code of isVisitable) {
      const airport = [...airportSince.keys()].find(a =>
        ctx.airports[a]?.country === code && ctx.airports[a]?.lon != null
      );
      if (!airport) continue;
      const ap = ctx.airports[airport];
      if (d3.geoContains(feat, [ap.lon, ap.lat])) {
        numericToISO2.set(feat.id, code);
        break;
      }
    }
  }

  // Countries (land paths) — each gets data-since if visited
  sel.append("g").attr("class", "lands")
    .selectAll("path")
    .data(countries.features)
    .enter().append("path")
    .attr("class", "land")
    .attr("d", path)
    .attr("data-iso2", d => numericToISO2.get(d.id) || "")
    .attr("data-since", d => {
      const iso = numericToISO2.get(d.id);
      const since = iso != null ? countrySince.get(iso) : undefined;
      return since != null ? since : "";
    });

  // Routes (great-circle arcs). Pre-build every route the user has ever
  // flown; we'll toggle visibility by data-since.
  const routesLayer = sel.append("g").attr("class", "arcs");
  const allRouteKeys = [...routeSince.keys()];
  const maxRouteCount = Math.max(...[...cum[lastIdx].routes.values()], 1);
  for (const key of allRouteKeys) {
    const [a, b] = key.split("-");
    const A = ctx.airports[a], B = ctx.airports[b];
    if (!A || !B) continue;
    const interp = d3.geoInterpolate([A.lon, A.lat], [B.lon, B.lat]);
    const samples = 36;
    const coords = [];
    for (let i = 0; i <= samples; i++) coords.push(interp(i / samples));
    const lineGen = d3.line()
      .x(d => (projection(d) || [NaN, NaN])[0])
      .y(d => (projection(d) || [NaN, NaN])[1])
      .defined(d => projection(d) !== null);
    const finalCount = cum[lastIdx].routes.get(key) || 1;
    routesLayer.append("path")
      .attr("class", "arc")
      .attr("d", lineGen(coords))
      .attr("data-since", routeSince.get(key))
      .attr("stroke-width", 0.4 + 1.2 * (finalCount / maxRouteCount))
      .attr("opacity", 0.18 + 0.40 * (finalCount / maxRouteCount));
  }

  // Airport dots
  const dotsLayer = sel.append("g").attr("class", "dots");
  for (const [code, since] of airportSince) {
    const ap = ctx.airports[code];
    if (!ap || ap.lon == null || ap.lat == null) continue;
    const pt = projection([ap.lon, ap.lat]);
    if (!pt) continue;
    dotsLayer.append("circle")
      .attr("class", "airport-dot")
      .attr("cx", pt[0]).attr("cy", pt[1])
      .attr("r", 1.8)
      .attr("data-since", since)
      .append("title").text(`${code} — ${ap.name} (${ap.city || ap.country})`);
  }

  // ── Apply state at index ────────────────────────────────────────────────
  let currentIdx = lastIdx;
  let lastMilestoneIdx = -1;

  function applyAt(idx) {
    idx = Math.max(0, Math.min(lastIdx, idx));
    currentIdx = idx;
    slider.value = String(idx);
    dateEl.textContent = monthLabel(months[idx]);

    // Visibility: anything whose data-since > idx gets `.future` class
    sel.selectAll(".airport-dot").each(function () {
      const since = +this.getAttribute("data-since");
      this.style.display = since <= idx ? "" : "none";
    });
    sel.selectAll(".arc").each(function () {
      const since = +this.getAttribute("data-since");
      this.style.display = since <= idx ? "" : "none";
    });
    sel.selectAll(".land").each(function () {
      const raw = this.getAttribute("data-since");
      const since = raw === "" ? Infinity : +raw;
      this.classList.toggle("visited", since <= idx);
    });

    // Stats
    const c = cum[idx];
    elFlights.textContent = formatNumber(c.flights);
    elMiles.textContent   = formatNumber(Math.round(c.miles));
    elHours.textContent   = formatNumber(Math.round(c.minutes / 60));
    elCount.textContent   = String(c.countries.size);
    elStates.textContent  = String(c.states.size);

    // Milestone: show the most recent non-null milestone up to this idx.
    let lastNote = null, lastNoteIdx = -1;
    for (let j = idx; j >= 0; j--) {
      if (cum[j].milestone) { lastNote = cum[j].milestone; lastNoteIdx = j; break; }
    }
    if (lastNote) {
      mileEl.innerHTML =
        `<span class="tl-milestone-tag">${monthLabel(months[lastNoteIdx])}</span>` +
        `<span class="tl-milestone-text">${lastNote}</span>`;
      mileEl.classList.add("has-note");
      if (lastNoteIdx !== lastMilestoneIdx) {
        mileEl.classList.remove("flash");
        // restart CSS animation
        void mileEl.offsetWidth;
        mileEl.classList.add("flash");
        lastMilestoneIdx = lastNoteIdx;
      }
    } else {
      mileEl.classList.remove("has-note", "flash");
      mileEl.textContent = "";
    }
  }

  applyAt(lastIdx);

  // ── Slider interaction ─────────────────────────────────────────────────
  slider.addEventListener("input", () => {
    pause();
    applyAt(+slider.value);
  });

  // ── Play/pause ─────────────────────────────────────────────────────────
  let playing = false;
  let rafId = null;
  let lastFrameTs = 0;
  // Base speed: cover the full timeline in ~30 s at 1× → months/sec ≈ N/30.
  let monthsPerSecBase = Math.max(2, months.length / 30);

  function setPlayUI(state) {
    playing = state;
    playIcon.style.display  = state ? "none" : "";
    pauseIcon.style.display = state ? "" : "none";
    playBtn.setAttribute("aria-label", state ? "Pause timeline" : "Play timeline");
  }

  function step(ts) {
    if (!playing) return;
    if (!lastFrameTs) lastFrameTs = ts;
    const dt = (ts - lastFrameTs) / 1000;
    lastFrameTs = ts;
    const mps = monthsPerSecBase * (+speedSel.value || 1);
    let next = currentIdx + mps * dt;
    if (next >= lastIdx) {
      applyAt(lastIdx);
      pause();
      return;
    }
    applyAt(next);
    rafId = requestAnimationFrame(step);
  }

  function play() {
    if (playing) return;
    if (currentIdx >= lastIdx) applyAt(0);  // restart if at end
    setPlayUI(true);
    lastFrameTs = 0;
    rafId = requestAnimationFrame(step);
  }
  function pause() {
    if (!playing) return;
    setPlayUI(false);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
  function toggle() { playing ? pause() : play(); }

  playBtn.addEventListener("click", toggle);

  // Keyboard: space to play/pause when this view is active
  function onKey(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
    const active = document.getElementById("view-timeline").classList.contains("is-active");
    if (!active) return;
    if (e.key === " " || e.code === "Space") { e.preventDefault(); toggle(); }
  }
  document.addEventListener("keydown", onKey);
}
