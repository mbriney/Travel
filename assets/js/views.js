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

      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// WORLD map view
// ---------------------------------------------------------------------------
export function renderWorldView(root, ctx) {
  const s = ctx.stats;
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
