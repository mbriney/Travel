// pages.js — produce an array of <div class="page"> elements in display order.
// They will be paired into sheets by passport.js.

import { formatNumber, formatMiles, formatHours, formatDuration, formatDate } from "./stats.js";
import { drawWorldMap }  from "./worldmap.js";
import { drawUSMap }     from "./usmap.js";

const BEARER = {
  surname: "BRINEY",
  given: "MATTHEW",
  nationality: "UNITED STATES OF AMERICA",
  sex: "M",
  city: "DALLAS, TEXAS",
  passportNo: "AA0000001",  // decorative
};

const COUNTRY_REGION = {
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

function page(name, extraClass = "") {
  const n = document.createElement("div");
  n.className = "page" + (extraClass ? " " + extraClass : "");
  n.dataset.name = name;
  return n;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function pageNumBadge(num) {
  return `<span class="page-num">${num}</span>`;
}

// ---------------------------------------------------------------------------
// COVER (front cover of the passport — sheet 0 front face)
// ---------------------------------------------------------------------------
function buildCover(ctx) {
  const p = page("cover");
  const issuedYear = ctx.stats.lastFlight ? ctx.stats.lastFlight.getFullYear() : new Date().getFullYear();
  p.innerHTML = `
    <div class="cover">
      <div class="cover-shimmer" aria-hidden="true"></div>
      <div class="cover-inner">
        <div class="cover-eyebrow">United States of America</div>
        <div class="cover-emblem" aria-hidden="true">${greatSealSVG()}</div>
        <h2>Travel</h2>
        <h1>Passport</h1>
        <div class="cover-name">${BEARER.given} ${BEARER.surname}</div>
        <div class="cover-chip" title="contactless chip"></div>
        <div class="cover-foot">ISSUED ${issuedYear} · DCA</div>
      </div>
    </div>`;
  return p;
}

// Stylized US Great Seal (eagle + shield) for the cover
function greatSealSVG() {
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="goldGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%"  stop-color="#f5dc94"/>
          <stop offset="55%" stop-color="#c8a04a"/>
          <stop offset="100%" stop-color="#7a5e1f"/>
        </radialGradient>
      </defs>
      <g fill="url(#goldGrad)" stroke="currentColor" stroke-width="0.8" stroke-linejoin="round">
        <!-- 13 stars in a circle around the head -->
        <g fill="currentColor" opacity="0.85">
          ${Array.from({length:13}).map((_,i)=>{
            const a = (i/13)*Math.PI*2 - Math.PI/2;
            const r = 36;
            const cx = 100 + Math.cos(a)*r;
            const cy = 56 + Math.sin(a)*r;
            return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.8"/>`;
          }).join("")}
        </g>
        <!-- eagle body / head -->
        <ellipse cx="100" cy="56" rx="14" ry="12"/>
        <circle cx="106" cy="50" r="1.2" fill="#1a1a1a"/>
        <!-- beak -->
        <path d="M114 54 l8 -2 -6 4 z"/>
        <!-- wings (stylized fan shape) -->
        <path d="M100 70 C 60 60, 40 90, 30 110 C 60 102, 80 100, 100 96 Z"/>
        <path d="M100 70 C 140 60, 160 90, 170 110 C 140 102, 120 100, 100 96 Z"/>
        <!-- tail feathers -->
        <path d="M88 96 L100 130 L112 96 Z"/>
        <!-- shield -->
        <g transform="translate(100 110)">
          <path d="M-22 -8 H22 V8 C 22 22, 0 30, 0 30 C 0 30, -22 22, -22 8 Z"
                fill="#f8efd2" stroke="#8a6d2e" stroke-width="1.2"/>
          <rect x="-22" y="-8" width="44" height="6" fill="#173273"/>
          <g fill="#7a1a1a">
            ${Array.from({length:6}).map((_,i)=>`<rect x="${-22 + i*7.3}" y="-2" width="3.2" height="32" />`).join("")}
          </g>
        </g>
        <!-- olive branch left -->
        <path d="M58 138 C 70 140, 86 138, 98 132" fill="none" stroke="currentColor" stroke-width="2"/>
        ${Array.from({length:5}).map((_,i)=>`<ellipse cx="${64 + i*7}" cy="${139 - (i%2)*3}" rx="2.4" ry="1.2" />`).join("")}
        <!-- arrows right -->
        <g stroke="currentColor" stroke-width="2" fill="none">
          <path d="M142 138 L 110 130"/>
          <path d="M144 134 L 112 126"/>
          <path d="M146 130 L 114 122"/>
        </g>
        <!-- banner E PLURIBUS UNUM -->
        <path d="M70 78 Q 100 70 130 78" fill="none" stroke="currentColor" stroke-width="0.8"/>
        <text x="100" y="80" text-anchor="middle" font-family="serif" font-size="6.5"
              letter-spacing="1.2" fill="currentColor">E PLURIBUS UNUM</text>
      </g>
    </svg>`;
}

// ---------------------------------------------------------------------------
// BEARER / BIO PAGE — sheet 0 back face (visible on left after opening)
// ---------------------------------------------------------------------------
function buildBearer(ctx) {
  const p = page("bearer", "bearer-page");
  const s = ctx.stats;
  const memberSince = s.firstFlight ? formatDate(s.firstFlight) : "—";
  const dateOfIssue = formatDate(new Date());
  const surName = BEARER.surname.padEnd(10, "<");
  const givenName = BEARER.given.padEnd(15, "<");
  const mrz1 = `P<USA${surName}<<${givenName}`.padEnd(44, "<").slice(0, 44);
  const mrz2 = `${BEARER.passportNo}USA000000${s.total.toString().padStart(6,"0")}M0000000`.padEnd(44, "<").slice(0, 44);

  p.innerHTML = `
    <div class="paper">
      <div class="bio">
        <div class="bio-header">
          <span class="title">Bearer · Porteur · Titular</span>
          <span class="country-code">USA</span>
        </div>
        <div class="bio-body">
          <div class="bio-photo" aria-hidden="true">MB</div>
          <dl class="bio-fields">
            <div class="row"><dt>Type</dt><dd>P</dd></div>
            <div class="row"><dt>Country Code</dt><dd>USA</dd></div>
            <div class="row"><dt>Surname</dt><dd>${BEARER.surname}</dd></div>
            <div class="row"><dt>Given Names</dt><dd>${BEARER.given}</dd></div>
            <div class="row"><dt>Nationality</dt><dd>${BEARER.nationality}</dd></div>
            <div class="row"><dt>Sex</dt><dd>${BEARER.sex}</dd></div>
            <div class="row"><dt>Place of Residence</dt><dd>${BEARER.city}</dd></div>
            <div class="row"><dt>Member Since</dt><dd>${memberSince.toUpperCase()}</dd></div>
            <div class="row"><dt>Date of Issue</dt><dd>${dateOfIssue.toUpperCase()}</dd></div>
            <div class="row"><dt>Authority</dt><dd>TRIPIT.COM</dd></div>
          </dl>
        </div>
        <div class="bio-mrz">${mrz1}<br/>${mrz2}</div>
      </div>
      ${pageNumBadge(2)}
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// STATS PAGES — split across two sides of a spread.
// Left side (stats-a): hero totals + distance + weekday
// Right side (stats-b): top airports + airlines + routes + extremes
// ---------------------------------------------------------------------------
function buildStatsA(ctx) {
  const p = page("stats", "stats-page");
  const s = ctx.stats;
  const wkMax = Math.max(...s.weekday) || 1;
  const wkLabels = ["S","M","T","W","T","F","S"];
  const wkBars = s.weekday.map((v,i) =>
    `<div class="bar" style="height:${(v/wkMax)*100}%" data-label="${wkLabels[i]}" title="${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][i]}: ${v}"></div>`
  ).join("");
  const earthCap = Math.min(s.earthLaps / 30, 1);
  const moonCap  = Math.min(s.moonTrips / 4, 1);
  const sunCap   = Math.min(s.sunLaps   / 1, 1);

  p.innerHTML = `
    <div class="paper">
      <div class="page-header"><span>Statistics · Statistiques</span><small>Travel summary</small></div>
      <div class="inner">
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="num">${formatNumber(s.total)}</div>
            <div class="label">Flights</div>
            <div class="sub">${s.domestic} domestic · ${s.international} intl · ${s.longHaul} long-haul</div>
          </div>
          <div class="hero-stat">
            <div class="num">${formatNumber(s.miles)}</div>
            <div class="label">Miles flown</div>
            <div class="sub">avg ${formatNumber(s.avgMiles)} mi / leg</div>
          </div>
          <div class="hero-stat">
            <div class="num">${formatDuration(s.minutes).split(" ").slice(0,2).join(" ")}</div>
            <div class="label">In the air</div>
            <div class="sub">${formatDuration(s.minutes)}</div>
          </div>
          <div class="hero-stat">
            <div class="num">${formatNumber(s.airportsCount)}</div>
            <div class="label">Airports</div>
            <div class="sub">${s.countriesCount} countries · ${s.statesCount} US states</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="title">Flights by weekday</div>
          <div class="weekday-chart" aria-label="Flights per weekday">${wkBars}</div>
          <div style="height:18px"></div>
        </div>

        <div class="stat-card">
          <div class="title">Distance</div>
          <div class="big">${formatNumber(s.miles)} mi</div>
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
      </div>
      ${pageNumBadge(3)}
    </div>`;
  return p;
}

function buildStatsB(ctx) {
  const p = page("stats", "stats-page");
  const s = ctx.stats;
  const apMax = s.topAirports[0]?.value || 1;
  const apRows = s.topAirports.slice(0,8).map(r =>
    `<li>
      <code>${r.key}</code>
      <div class="rank-bar" style="width:${(r.value/apMax)*100}%"></div>
      <span class="v">${r.value}</span>
    </li>`
  ).join("");
  const alMax = s.topAirlines[0]?.value || 1;
  const alRows = s.topAirlines.slice(0,8).map(r => {
    const name = r.info?.name || r.key;
    return `<li>
      <code>${r.key}</code>
      <div class="rank-bar" style="width:${(r.value/alMax)*100}%" title="${escapeHtml(name)}"></div>
      <span class="v">${r.value}</span>
    </li>`;
  }).join("");
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
          <div class="leg">${escapeHtml(f.from_city || f.from)} → ${escapeHtml(f.to_city || f.to)}</div>
          <div class="meta">${escapeHtml([f.airline_code, f.flight_number].filter(Boolean).join(" "))} · ${formatDate(f.depart)}</div>
        </div>
        <div class="val">${valFmt(f)}</div>
      </div>`
    : `<div class="flight-extreme"><div class="meta">no data</div></div>`;

  p.innerHTML = `
    <div class="paper">
      <div class="page-header"><span>Top Lists · Records</span><small>airports · airlines · routes</small></div>
      <div class="inner">
        <div class="stat-card">
          <div class="title">Top Airports · ${s.airportsCount} total</div>
          <ul class="rank-list" style="margin-top:8px">${apRows}</ul>
        </div>
        <div class="stat-card">
          <div class="title">Top Airlines · ${s.airlines.size} total</div>
          <ul class="rank-list" style="margin-top:8px">${alRows}</ul>
        </div>
        <div class="stat-card">
          <div class="title">Top Routes · ${s.routes.size} total</div>
          <ul class="rank-list" style="margin-top:8px">${rtRows}</ul>
        </div>
        <div class="stat-card">
          <div class="title">Extremes</div>
          <div class="flight-extremes">
            ${fe(s.shortest, f => `${Math.round(f._miles)} mi`)}
            ${fe(s.longest,  f => `${Math.round(f._miles).toLocaleString()} mi`)}
          </div>
        </div>
      </div>
      ${pageNumBadge(4)}
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// WORLD MAP
// ---------------------------------------------------------------------------
function buildWorld(ctx) {
  const p = page("world", "world-page");
  p.innerHTML = `
    <div class="paper map-page">
      <div class="wrap">
        <h2><span>World Map</span><small>routes & countries</small></h2>
        <svg class="map-svg" viewBox="0 0 960 480" preserveAspectRatio="xMidYMid meet"></svg>
        <div class="map-legend">
          <span><span class="sw" style="background:#2d4d9b"></span> Visited country</span>
          <span><span class="sw" style="background:#7a1a1a"></span> Airport</span>
          <span><span class="sw" style="background:#c8a04a"></span> Top hub</span>
        </div>
      </div>
      ${pageNumBadge(5)}
    </div>`;
  queueMicrotask(() => drawWorldMap(p.querySelector(".map-svg"), ctx).catch(console.error));
  return p;
}

// ---------------------------------------------------------------------------
// US STATES MAP
// ---------------------------------------------------------------------------
function buildUSA(ctx) {
  const p = page("usa", "us-map-page");
  const s = ctx.stats;
  p.innerHTML = `
    <div class="paper">
      <div class="page-header"><span>United States</span><small>states visited</small></div>
      <div class="inner">
        <div class="us-map-panel">
          <svg class="map-svg us-map" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet"></svg>
        </div>
        <div class="us-stats">
          <div class="cell"><div class="big">${s.statesCount}</div><div class="lbl">States</div></div>
          <div class="cell"><div class="big">${50 - s.statesCount}</div><div class="lbl">To go</div></div>
          <div class="cell"><div class="big">${Math.round((s.statesCount/50)*100)}%</div><div class="lbl">Complete</div></div>
        </div>
      </div>
      ${pageNumBadge(6)}
    </div>`;
  queueMicrotask(() => drawUSMap(p.querySelector(".map-svg"), ctx).catch(console.error));
  return p;
}

// ---------------------------------------------------------------------------
// STAMP PAGES — playful varied stamps with multiple shapes/colors/rotations
// ---------------------------------------------------------------------------
const STAMP_SHAPES = ["rect", "rect", "oval", "circle", "square"];   // weighted
const STAMP_COLORS = ["red", "blue", "green", "purple", "brown", "black"];
const STAMP_VERBS  = ["ARRIVAL", "DEPARTURE", "ADMITTED", "IMMIGRATION", "ENTRADA"];

// Tiny seeded RNG so each country gets stable random styling
function seedRand(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) | 0;
  s = (s ^ 0x9e3779b9) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function buildStampPages(ctx) {
  const s = ctx.stats;
  // Skip the home country here — too many domestic "stamps" would just be noise.
  const entries = [...s.countries.entries()]
    .filter(([code]) => code !== "US")
    .sort((a,b) => b[1].count - a[1].count);

  const STAMPS_PER_PAGE = 4;
  const pages = [];
  for (let i = 0; i < entries.length; i += STAMPS_PER_PAGE) {
    const slice = entries.slice(i, i + STAMPS_PER_PAGE);
    const num = i / STAMPS_PER_PAGE + 1;
    const p = page("stamps");
    p.innerHTML = `
      <div class="paper blue stamps">
        <div class="page-header"><span>Visas · Stamps</span><small>page ${num}</small></div>
        <div class="stamps-inner">
          <div class="stamps-grid">
            ${slice.map((entry, idx) => `<div class="stamp-cell">${renderStamp(entry, ctx, i + idx)}</div>`).join("")}
          </div>
        </div>
        ${pageNumBadge(7 + (num - 1) * 2)}
      </div>`;
    pages.push(p);
  }
  return pages;
}

function renderStamp([code, info], ctx, idx) {
  const rng = seedRand(code);
  const shape   = STAMP_SHAPES[Math.floor(rng() * STAMP_SHAPES.length)];
  const color   = STAMP_COLORS[Math.floor(rng() * STAMP_COLORS.length)];
  const verb    = STAMP_VERBS[Math.floor(rng() * STAMP_VERBS.length)];
  const rot     = (rng() * 14 - 7).toFixed(1) + "deg";
  const tx      = (rng() * 16 - 8).toFixed(0) + "px";
  const ty      = (rng() * 12 - 6).toFixed(0) + "px";

  // Country flights to find first/last + airports
  const list = ctx.stats.flightsByCountry.get(code) || [];
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
  const apCodes = [...airports.keys()].slice(0, 3).join(" · ");
  const dateStr = firstDate
    ? firstDate.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase()
    : "";
  const dense = (info.name || "").length > 10 ? " dense" : "";
  const region = COUNTRY_REGION[code] || "";
  const plane = "✈";

  // Build content per shape — circle/square get a more compact layout
  let inner;
  if (shape === "circle" || shape === "square") {
    inner = `
      <span class="plane" aria-hidden="true">${plane}</span>
      <div class="country">${escapeHtml(info.name || code)}</div>
      <div class="verb">${verb}</div>
      <div class="date">${dateStr}</div>
      <div class="codes">${apCodes}</div>`;
  } else {
    inner = `
      <span class="plane" aria-hidden="true">${plane}</span>
      <div class="country"><span>${escapeHtml(info.name || code)}</span><span style="font-size:11px;letter-spacing:.18em">${region}</span></div>
      <div class="verb">${verb}</div>
      <div class="date">${dateStr}</div>
      <div class="codes">${apCodes}</div>`;
  }

  return `
    <div class="stamp shape-${shape} color-${color}${dense}"
         style="--rot:${rot};--tx:${tx};--ty:${ty}">
      ${inner}
    </div>`;
}

// ---------------------------------------------------------------------------
// FLIGHT LOG
// ---------------------------------------------------------------------------
function buildLog(ctx) {
  const p = page("log", "log-page");
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
      <div class="page-header"><span>Flight Log</span><small>${flights.length.toLocaleString()} flights</small></div>
      <div class="log">
        <div class="inner-scroll">
          <table>
            <thead><tr><th>Date</th><th>Route</th><th>Flight</th><th style="text-align:right">Miles</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      ${pageNumBadge(99)}
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// Assembly — produce the flat sequence of pages.
//
// Pairing into spreads (handled by passport.js, 2 per sheet):
//   Sheet 0: cover    | bearer       (cover, open to bio)
//   Sheet 1: stats-A  | stats-B      (totals + extremes)
//   Sheet 2: world    | usa          (the two maps as a spread)
//   Sheet 3+: stamps  | stamps       (2 stamp pages per spread)
//   Sheet N: stamps_last | log       (or log alone on its own sheet)
// ---------------------------------------------------------------------------
export function buildPages(ctx) {
  const pages = [];
  pages.push(buildCover(ctx));
  pages.push(buildBearer(ctx));
  pages.push(buildStatsA(ctx));
  pages.push(buildStatsB(ctx));
  pages.push(buildWorld(ctx));
  pages.push(buildUSA(ctx));
  const stampPages = buildStampPages(ctx);
  for (const p of stampPages) pages.push(p);
  // Make sure log lands on a right-side page so it gets its own sheet front.
  if (pages.length % 2 !== 0) {
    // odd -> log will be on a sheet back (left). That's fine but feels off.
    // Insert a small filler? Skipping — leave as-is.
  }
  pages.push(buildLog(ctx));
  return pages;
}
