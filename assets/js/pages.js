// pages.js — produce an array of <section class="page"> elements in display order.
import { formatNumber, formatMiles, formatHours, formatDuration, formatDate } from "./stats.js";
import { drawWorldMap }  from "./worldmap.js";
import { drawUSMap }     from "./usmap.js";

const BEARER_NAME = "MATTHEW BRINEY";
const BEARER_NATIONALITY = "USA";
const BEARER_CITY = "DALLAS, TEXAS";

const COUNTRY_REGION = { // ISO2 -> region bucket (Flighty-style)
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

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function page(name) {
  const sec = el("section", "page");
  sec.dataset.name = name;
  return sec;
}

// ---------------------------------------------------------------------------
// 1. Cover
// ---------------------------------------------------------------------------
function buildCover(ctx) {
  const p = page("cover");
  const issuedYear = ctx.stats.lastFlight ? ctx.stats.lastFlight.getFullYear() : new Date().getFullYear();
  const startYear  = ctx.stats.firstFlight ? ctx.stats.firstFlight.getFullYear() : "";
  p.innerHTML = `
    <div class="cover">
      <div class="cover-shimmer" aria-hidden="true"></div>
      <div class="cover-inner">
        <div class="cover-eyebrow">United States of America</div>
        <div class="cover-emblem">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M32 12 v40 M12 32 h40
                     M18 18 l28 28 M46 18 l-28 28
                     M32 14 a18 18 0 0 1 0 36 a18 18 0 0 1 0 -36
                     M14 32 a18 18 0 0 0 36 0 a18 18 0 0 0 -36 0"
                  fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.6"/>
            <path d="M22 30 l8 6 14 -16" fill="none" stroke="currentColor"
                  stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>Travel</h2>
        <h1>Passport</h1>
        <div class="cover-name">${BEARER_NAME}</div>
        <div class="cover-foot">P&lt;USA&lt;BRINEY&lt;&lt;MATTHEW&lt;&lt;&lt; · ISSUED ${issuedYear} · MEMBER SINCE ${startYear || "—"}</div>
      </div>
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// 2. Bearer info + hero stats
// ---------------------------------------------------------------------------
function buildBearer(ctx) {
  const p = page("bearer");
  const s = ctx.stats;
  const memberSince = s.firstFlight ? formatDate(s.firstFlight) : "—";
  p.innerHTML = `
    <div class="paper">
      <div class="bearer">
        <div class="bearer-head">
          <div class="bearer-portrait" aria-hidden="true">MB</div>
          <dl class="bearer-fields">
            <div><dt>Surname</dt><dd>BRINEY</dd></div>
            <div><dt>Given Names</dt><dd>MATTHEW</dd></div>
            <div><dt>Nationality</dt><dd>${BEARER_NATIONALITY}</dd></div>
            <div><dt>Residence</dt><dd>${BEARER_CITY}</dd></div>
            <div><dt>Place of Issue</dt><dd>DFW · DAL · DCA</dd></div>
            <div><dt>Member Since</dt><dd>${memberSince}</dd></div>
          </dl>
        </div>

        <div class="hero-stats">
          <div class="hero-stat">
            <div class="num">${formatNumber(s.total)}</div>
            <div class="label">Flights</div>
            <div class="sub">${s.domestic} domestic · ${s.international} international · ${s.longHaul} long-haul</div>
          </div>
          <div class="hero-stat">
            <div class="num">${formatNumber(s.miles)}</div>
            <div class="label">Miles flown</div>
            <div class="sub">avg ${formatNumber(s.avgMiles)} mi / leg</div>
          </div>
          <div class="hero-stat">
            <div class="num">${formatHours(s.minutes).replace(" ", "")}</div>
            <div class="label">In the air</div>
            <div class="sub">${formatDuration(s.minutes)}</div>
          </div>
          <div class="hero-stat">
            <div class="num">${formatNumber(s.airportsCount)}</div>
            <div class="label">Airports</div>
            <div class="sub">${s.countriesCount} countries · ${s.statesCount} US states</div>
          </div>
        </div>

        <div class="mrz">
          P&lt;USA&lt;BRINEY&lt;&lt;MATTHEW&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br/>
          ${("FLIGHTS" + String(s.total).padStart(6,"0") + "MI" + String(Math.round(s.miles)).padStart(7,"0") + "HRS" + String(Math.round(s.minutes/60)).padStart(5,"0")).padEnd(44,"<")}
        </div>
      </div>
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// 3. Stats dashboard
// ---------------------------------------------------------------------------
function buildStats(ctx) {
  const p = page("stats");
  const s = ctx.stats;

  // Weekday chart
  const wkMax = Math.max(...s.weekday) || 1;
  const wkLabels = ["S","M","T","W","T","F","S"];
  const wkBars = s.weekday.map((v,i) =>
    `<div class="bar" style="height:${(v/wkMax)*100}%" data-label="${wkLabels[i]}" title="${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]}: ${v}"></div>`
  ).join("");

  // Distance factoids
  const earthCap = Math.min(s.earthLaps / 30, 1);
  const moonCap  = Math.min(s.moonTrips / 4, 1);
  const sunCap   = Math.min(s.sunLaps   / 1, 1);

  // Top airports — top 8
  const apMax = s.topAirports[0]?.value || 1;
  const apRows = s.topAirports.slice(0,8).map(r =>
    `<li>
      <code>${r.key}</code>
      <div class="rank-bar" style="width:${(r.value/apMax)*100}%"></div>
      <span class="v">${r.value}</span>
    </li>`
  ).join("");

  // Top airlines
  const alMax = s.topAirlines[0]?.value || 1;
  const alRows = s.topAirlines.slice(0,8).map(r => {
    const name = r.info?.name || r.key;
    return `<li>
      <code>${r.key}</code>
      <div class="rank-bar" style="width:${(r.value/alMax)*100}%" title="${escapeHtml(name)}"></div>
      <span class="v">${r.value}</span>
    </li>`;
  }).join("");

  // Top routes
  const rtMax = s.topRoutes[0]?.value || 1;
  const rtRows = s.topRoutes.slice(0,8).map(r =>
    `<li>
      <code>${r.key}</code>
      <div class="rank-bar" style="width:${(r.value/rtMax)*100}%"></div>
      <span class="v">${r.value}</span>
    </li>`
  ).join("");

  const fe = (f, valFmt) => f
    ? `<div class="flight-extreme">
        <div>
          <div class="leg">${f.from_city || f.from} <span style="opacity:.5">→</span> ${f.to_city || f.to}</div>
          <div class="meta">${[f.airline_code, f.flight_number].filter(Boolean).join(" ")} · ${formatDate(f.depart)}</div>
        </div>
        <div class="val">${valFmt(f)}</div>
      </div>`
    : `<div class="flight-extreme"><div class="meta">no data</div></div>`;

  p.innerHTML = `
    <div class="paper">
      <div class="inner">
        <h2>Flight Statistics<small>at a glance</small></h2>
        <div class="inner-scroll">
          <div class="stat-grid">

            <div class="stat-card">
              <div class="title">Flights / weekday</div>
              <div class="big">${s.total}</div>
              <div class="sub">${s.domestic} domestic · ${s.international} intl · ${s.longHaul} long-haul</div>
              <div class="weekday-chart" aria-label="Flights per weekday">${wkBars}</div>
              <div style="height:18px"></div>
            </div>

            <div class="stat-card">
              <div class="title">Distance</div>
              <div class="big">${formatNumber(s.miles)} mi</div>
              <div class="sub">avg ${formatNumber(s.avgMiles)} mi / leg</div>
              <div class="distance-bars">
                <div class="row">
                  <span>🌍</span>
                  <div class="track"><div class="fill" style="width:${earthCap*100}%"></div></div>
                  <span class="mul">${s.earthLaps.toFixed(1)}× Earth</span>
                </div>
                <div class="row">
                  <span>🌑</span>
                  <div class="track"><div class="fill" style="width:${moonCap*100}%"></div></div>
                  <span class="mul">${s.moonTrips.toFixed(1)}× Moon</span>
                </div>
                <div class="row">
                  <span>☀️</span>
                  <div class="track"><div class="fill" style="width:${sunCap*100}%"></div></div>
                  <span class="mul">${s.sunLaps.toFixed(2)}× Sun</span>
                </div>
              </div>
            </div>

            <div class="stat-card" style="grid-column:1/-1">
              <div class="title">Time aloft</div>
              <div class="big">${formatDuration(s.minutes)}</div>
              <div class="sub">avg ${formatDuration(s.avgMinutes)} per flight</div>
              <div class="flight-extremes">
                ${fe(s.shortest, f => `${Math.round(f._miles)} mi`)}
                ${fe(s.longest,  f => `${Math.round(f._miles).toLocaleString()} mi`)}
              </div>
            </div>

            <div class="stat-card">
              <div class="title">Top Airports</div>
              <div class="big">${s.airportsCount}</div>
              <div class="sub">total airports</div>
              <ul class="rank-list" style="margin-top:8px">${apRows}</ul>
            </div>

            <div class="stat-card">
              <div class="title">Top Airlines</div>
              <div class="big">${s.airlines.size}</div>
              <div class="sub">total airlines</div>
              <ul class="rank-list" style="margin-top:8px">${alRows}</ul>
            </div>

            <div class="stat-card" style="grid-column:1/-1">
              <div class="title">Top Routes</div>
              <div class="big">${s.routes.size}</div>
              <div class="sub">total routes</div>
              <ul class="rank-list" style="margin-top:8px">${rtRows}</ul>
            </div>

          </div>
        </div>
      </div>
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// 4. World map page
// ---------------------------------------------------------------------------
function buildWorld(ctx) {
  const p = page("world");
  p.innerHTML = `
    <div class="paper map-page">
      <div class="wrap">
        <h2>Flight Map<small>routes & countries</small></h2>
        <svg class="map-svg" viewBox="0 0 960 480" preserveAspectRatio="xMidYMid meet" aria-label="World map of flight routes"></svg>
        <div class="map-legend">
          <span><span class="sw" style="background:#a78bfa"></span> Visited country</span>
          <span><span class="sw" style="background:#7c3aed"></span> Airport</span>
          <span><span class="sw" style="background:#d83b3b"></span> Top hub</span>
        </div>
      </div>
    </div>`;
  // Defer drawing until page is in DOM
  queueMicrotask(() => drawWorldMap(p.querySelector(".map-svg"), ctx).catch(console.error));
  return p;
}

// ---------------------------------------------------------------------------
// 5. US States page
// ---------------------------------------------------------------------------
function buildUSA(ctx) {
  const p = page("usa");
  const s = ctx.stats;
  p.innerHTML = `
    <div class="paper">
      <div class="inner">
        <h2>United States<small>states & territories visited</small></h2>
        <svg class="map-svg us-map" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet" aria-label="US states visited"></svg>
        <div class="us-stats">
          <div class="cell"><div class="big">${s.statesCount}</div><div class="lbl">States</div></div>
          <div class="cell"><div class="big">${50 - s.statesCount}</div><div class="lbl">To go</div></div>
          <div class="cell"><div class="big">${Math.round((s.statesCount/50)*100)}%</div><div class="lbl">Complete</div></div>
        </div>
      </div>
    </div>`;
  queueMicrotask(() => drawUSMap(p.querySelector(".us-map"), ctx).catch(console.error));
  return p;
}

// ---------------------------------------------------------------------------
// 6+. Country stamp pages
// ---------------------------------------------------------------------------
const STAMP_VERBS = ["ENTRY", "ARRIVAL", "VISITED", "DEPARTURE", "TRANSIT"];

function buildStampPages(ctx) {
  const s = ctx.stats;
  // Sort countries by flight count desc
  const entries = [...s.countries.entries()]
    .sort((a,b) => b[1].count - a[1].count);

  // Skip the home country from individual stamp pages — give it a "home" stamp page first
  const pages = [];

  // Build 4 stamps per page
  const STAMPS_PER_PAGE = 4;
  for (let i = 0; i < entries.length; i += STAMPS_PER_PAGE) {
    const slice = entries.slice(i, i + STAMPS_PER_PAGE);
    const p = page("stamps");
    const inner = `
      <div class="paper">
        <div class="stamps">
          <h2>Stamps · page ${Math.floor(i/STAMPS_PER_PAGE)+1}</h2>
          <div class="grid">
            ${slice.map((entry, idx) => renderStamp(entry, ctx, (i + idx) % 4)).join("")}
          </div>
        </div>
      </div>`;
    p.innerHTML = inner;
    pages.push(p);
  }
  return pages;
}

function renderStamp([code, info], ctx, styleIdx) {
  const list = ctx.stats.flightsByCountry.get(code) || [];
  // Build a unique set of airports visited in this country (as destination)
  const airports = new Map();
  let firstDate = null, lastDate = null;
  for (const f of list) {
    const ap = ctx.airports[f.to];
    if (!ap || ap.country !== code) continue;
    airports.set(ap.code, ap);
    const d = new Date(f.depart);
    if (!isNaN(d)) {
      if (!firstDate || d < firstDate) firstDate = d;
      if (!lastDate  || d > lastDate)  lastDate  = d;
    }
  }
  const apCodes = [...airports.keys()].slice(0, 6).join(" · ");
  const region = COUNTRY_REGION[code] || "";
  const verb = STAMP_VERBS[styleIdx % STAMP_VERBS.length];
  return `
    <div class="stamp style-${(styleIdx % 4) + 1}">
      <div class="head">
        <span>${escapeHtml(info.name || code)}</span>
        <span class="flag">${info.flag || ""}</span>
      </div>
      <div class="row">${verb} · ${region}</div>
      <div class="row">${firstDate ? formatDate(firstDate) : "—"}${(lastDate && +lastDate !== +firstDate) ? "  →  " + formatDate(lastDate) : ""}</div>
      <div class="codes">${apCodes || "—"}</div>
      <div class="seal">
        ${info.count}<br/>visits
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Last. Flight log
// ---------------------------------------------------------------------------
function buildLog(ctx) {
  const p = page("log");
  const flights = [...ctx.flights].sort((a,b) => (b.depart||"").localeCompare(a.depart||""));
  const rows = flights.map(f => `
    <tr>
      <td>${formatDate(f.depart, { year:"2-digit", month:"short", day:"numeric" })}</td>
      <td class="route">${f.from} → ${f.to}</td>
      <td class="airline">${[f.airline_code, f.flight_number].filter(Boolean).join(" ")}</td>
      <td class="miles">${f._miles ? Math.round(f._miles).toLocaleString() : "—"}</td>
    </tr>`).join("");
  p.innerHTML = `
    <div class="paper">
      <div class="log">
        <h2>Flight Log<small>most recent first · ${flights.length.toLocaleString()} flights</small></h2>
        <div class="inner-scroll">
          <table>
            <thead><tr><th>Date</th><th>Route</th><th>Flight</th><th style="text-align:right">Miles</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------
export function buildPages(ctx) {
  const pages = [];
  pages.push(buildCover(ctx));
  pages.push(buildBearer(ctx));
  pages.push(buildStats(ctx));
  pages.push(buildWorld(ctx));
  pages.push(buildUSA(ctx));
  for (const p of buildStampPages(ctx)) pages.push(p);
  pages.push(buildLog(ctx));
  return pages;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
