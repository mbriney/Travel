// views.js — top-level standalone views (Stats, World Map, US States).
// These render into their own <section> elements rather than passport pages.

import { formatNumber, formatDuration, formatDate } from "./stats.js";
import { drawWorldMap } from "./worldmap.js";
import { drawUSMap }    from "./usmap.js";

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
    const name = r.info?.name || r.key;
    return `<li><code>${r.key}</code><div class="rank-bar" style="width:${(r.value/alMax)*100}%" title="${escapeHtml(name)}"></div><span class="v">${r.value}</span></li>`;
  }).join("");

  const rtMax = s.topRoutes[0]?.value || 1;
  const rtRows = s.topRoutes.slice(0,10).map(r =>
    `<li><code>${r.key}</code><div class="rank-bar" style="width:${(r.value/rtMax)*100}%"></div><span class="v">${r.value}</span></li>`
  ).join("");

  const fe = (f, valFmt) => f
    ? `<div class="flight-extreme">
        <div>
          <div class="leg">${escapeHtml(f.from_city || f.from)} → ${escapeHtml(f.to_city || f.to)}</div>
          <div class="meta">${escapeHtml([f.airline_code, f.flight_number].filter(Boolean).join(" "))} · ${formatDate(f.depart)}</div>
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
      <td class="airline">${escapeHtml([f.airline_code, f.flight_number].filter(Boolean).join(" "))}</td>
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

let _modalOnceWired = false;
function ensureModalWired() {
  if (_modalOnceWired) return;
  _modalOnceWired = true;
  const modal = document.getElementById("flight-modal");
  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close !== undefined) closeFlightModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeFlightModal();
  });
}

function openFlightModal(f, ctx) {
  ensureModalWired();
  const modal = document.getElementById("flight-modal");
  const body  = document.getElementById("flight-modal-body");

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

  body.innerHTML = `
    <header class="flight-detail-head">
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
      ${row("Aircraft",    f.aircraft)}
      ${row("Seat",        f.seat)}
      ${row("Class",       f.service_class)}
      ${row("Airline",     (airline?.name) || f.airline)}
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

function closeFlightModal() {
  const modal = document.getElementById("flight-modal");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
