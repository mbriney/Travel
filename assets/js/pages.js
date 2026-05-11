// pages.js — passport book contents (cover + bio + stamp pages).
// Maps, stats, and flight log live in views.js (top-level tabs).

import { formatDate } from "./stats.js";

const BEARER = {
  surname: "BRINEY",
  given: "MATTHEW",
  nationality: "UNITED STATES OF AMERICA",
  sex: "M",
  birthplace: "VIRGINIA, U.S.A.",
  residence: "DALLAS, TEXAS",
  passportNo: "TPL501283",
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

const STATE_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",
  FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",
  LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",
  MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",
  NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",
  RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"D.C.",PR:"Puerto Rico",
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
function pageNumBadge(num) { return `<span class="page-num">${num}</span>`; }

// ---------------------------------------------------------------------------
// GREAT SEAL — single detailed SVG, color via currentColor.
// Used three ways:
//   - gold on the cover (color: var(--pp-gold))
//   - faint watermark on bio top half + on stamp pages
//   - small emblem on the bio "PASSPORT" header (now removed)
// ---------------------------------------------------------------------------
export function greatSealSVG() {
  // Clouds with 13 stars in a ring, eagle with spread wings, shield on chest,
  // olive branch (left) / 13 arrows (right), E PLURIBUS UNUM banner in beak.
  return `
    <svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.6"
         stroke-linejoin="round" stroke-linecap="round">

        <!-- Outer glory of clouds (rays + scalloped clouds) -->
        <g opacity="0.95">
          <path d="M70 80
                   q14 -22 36 -22
                   q14 -22 40 -16
                   q14 -22 38 -14
                   q12 -22 38 -12
                   q14 -20 40 -8
                   q16 0 26 16"/>
          <path d="M90 92
                   q12 -16 30 -16
                   q12 -18 34 -12
                   q12 -16 32 -10
                   q12 -16 32 -6
                   q14 -16 32 -4
                   q14 0 22 12"/>
          <path d="M110 104
                   q12 -12 26 -12
                   q12 -14 30 -8
                   q10 -12 26 -6
                   q10 -12 26 -2
                   q12 -10 26 0"/>
        </g>

        <!-- Sun rays / shafts inside the cloud -->
        <g stroke-width="0.8" opacity="0.7">
          ${Array.from({length: 11}).map((_, i) => {
            const a = -Math.PI/2 + (i - 5) * 0.16;
            const x1 = 180, y1 = 80;
            const x2 = 180 + Math.cos(a) * 28;
            const y2 = 80 + Math.sin(a) * 28;
            return `<path d="M${x1} ${y1} L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
          }).join("")}
        </g>

        <!-- 13 stars in the glory -->
        <g fill="currentColor" stroke="none">
          ${Array.from({length: 13}).map((_, i) => {
            const a = -Math.PI/2 + (i - 6) * 0.22;
            const cx = 180 + Math.cos(a) * 60;
            const cy = 86 + Math.sin(a) * 60;
            return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.2"/>`;
          }).join("")}
        </g>

        <!-- Eagle head -->
        <path d="M180 120
                 c -10 -2 -16 -10 -14 -18
                 c 2 -8 12 -12 22 -10
                 c 10 2 18 10 16 18
                 c -2 8 -14 12 -24 10 z"/>
        <circle cx="186" cy="112" r="1.4" fill="currentColor"/>
        <!-- beak (open, holding banner) -->
        <path d="M198 116 L222 118 L208 124 Z" fill="currentColor" opacity="0.85"/>
        <!-- banner E PLURIBUS UNUM in beak -->
        <path d="M118 144 Q180 130 242 144" stroke-width="0.9"/>
        <path d="M118 144 L108 148 L118 152" stroke-width="0.9"/>
        <path d="M242 144 L252 148 L242 152" stroke-width="0.9"/>
        <text x="180" y="148" text-anchor="middle" font-family="serif"
              font-size="9" letter-spacing="2.4" fill="currentColor" stroke="none"
              font-weight="500">E PLURIBUS UNUM</text>

        <!-- Eagle body / neck (small underbody before shield) -->
        <path d="M168 138 q12 -2 24 0 q4 4 4 10 q-12 4 -28 0 q-4 -6 0 -10 z"/>

        <!-- Wings — sweeping upward in primary/secondary feather groups -->
        <!-- LEFT wing (viewer's left) -->
        <g>
          <path d="M168 142
                   c -28 -16 -54 -8 -76 12
                   c -22 18 -38 44 -46 76
                   c 22 -14 46 -22 70 -22
                   c 24 -2 44 4 60 14 z"
                stroke-width="1.4"/>
          <!-- feather separator lines -->
          <g opacity="0.65" stroke-width="0.9">
            <path d="M156 152 q-40 -12 -76 12"/>
            <path d="M148 168 q-44 -8 -76 20"/>
            <path d="M138 184 q-42 0 -72 24"/>
            <path d="M126 196 q-36 4 -66 24"/>
          </g>
          <!-- feather tips -->
          <g opacity="0.55" stroke-width="0.7">
            <path d="M92 152 l-12 -8"/><path d="M76 168 l-12 -8"/>
            <path d="M64 184 l-12 -8"/><path d="M56 200 l-12 -6"/>
            <path d="M50 216 l-12 -4"/>
          </g>
        </g>
        <!-- RIGHT wing -->
        <g>
          <path d="M192 142
                   c 28 -16 54 -8 76 12
                   c 22 18 38 44 46 76
                   c -22 -14 -46 -22 -70 -22
                   c -24 -2 -44 4 -60 14 z"
                stroke-width="1.4"/>
          <g opacity="0.65" stroke-width="0.9">
            <path d="M204 152 q40 -12 76 12"/>
            <path d="M212 168 q44 -8 76 20"/>
            <path d="M222 184 q42 0 72 24"/>
            <path d="M234 196 q36 4 66 24"/>
          </g>
          <g opacity="0.55" stroke-width="0.7">
            <path d="M268 152 l12 -8"/><path d="M284 168 l12 -8"/>
            <path d="M296 184 l12 -8"/><path d="M304 200 l12 -6"/>
            <path d="M310 216 l12 -4"/>
          </g>
        </g>

        <!-- Shield (chief + pales) -->
        <g>
          <path d="M148 162 H212 V184 c0 22 -32 38 -32 38 c0 0 -32 -16 -32 -38 z" stroke-width="1.4"/>
          <!-- chief (top horizontal blue band) -->
          <path d="M148 162 H212 V176 H148 z" fill="currentColor" opacity="0.85"/>
          <!-- 6 pale lines (vertical) below the chief -->
          <g stroke-width="2.2">
            <path d="M156 178 V214"/><path d="M165 178 V218"/><path d="M174 178 V222"/>
            <path d="M186 178 V222"/><path d="M195 178 V218"/><path d="M204 178 V214"/>
          </g>
        </g>

        <!-- Tail feathers under shield -->
        <g>
          <path d="M168 224 L180 256 L192 224 Z"/>
          <g opacity="0.6" stroke-width="0.7">
            <path d="M172 230 L180 252"/><path d="M180 226 V254"/><path d="M188 230 L180 252"/>
          </g>
        </g>

        <!-- Talons + olive branch (left) -->
        <g>
          <path d="M154 224 q-6 4 -14 6 q-2 -6 4 -10 q4 -2 10 4 z" stroke-width="1"/>
          <!-- olive branch -->
          <path d="M84 260 q40 0 78 -28" stroke-width="1.2"/>
          ${Array.from({length: 9}).map((_, i) => {
            const x = 90 + i * 9;
            const y = 260 - i * 2.5;
            return `<ellipse cx="${x.toFixed(1)}" cy="${(y - 6).toFixed(1)}" rx="3.4" ry="1.6" fill="currentColor" stroke="currentColor" stroke-width="0.4" opacity="0.85" transform="rotate(${-30 + i*4} ${x} ${y - 6})"/>`;
          }).join("")}
          ${Array.from({length: 5}).map((_, i) => {
            const x = 100 + i * 12;
            const y = 268 - i * 2;
            return `<circle cx="${x}" cy="${y}" r="2.4" fill="currentColor" stroke="none" opacity="0.85"/>`;
          }).join("")}
        </g>

        <!-- Talons + 13 arrows (right) -->
        <g>
          <path d="M206 224 q6 4 14 6 q2 -6 -4 -10 q-4 -2 -10 4 z" stroke-width="1"/>
          <g stroke-width="1.2">
            ${Array.from({length: 13}).map((_, i) => {
              const x = 218 + (i % 7) * 1.4;
              const y = 224 + Math.floor(i / 7) * 4;
              return `
                <path d="M${x} ${y} L${x + 60} ${y + 32}"/>
                <path d="M${x + 60} ${y + 32} l-5 -2 m5 2 l-2 -5"/>`;
            }).join("")}
          </g>
        </g>

        <!-- "ANNUIT COEPTIS" / outer ring text (skip for now to keep clean) -->
      </g>
    </svg>`;
}

// ---------------------------------------------------------------------------
// COVER
// ---------------------------------------------------------------------------
function buildCover(ctx) {
  const p = page("cover", "cover-page");
  p.innerHTML = `
    <div class="cover">
      <div class="cover-shimmer" aria-hidden="true"></div>
      <div class="cover-inner">
        <div class="cover-emblem" aria-hidden="true"></div>
        <div class="cover-titles">
          <h1>Passport</h1>
          <h2>United States of America</h2>
        </div>
        <div class="cover-chip" aria-hidden="true" title="contactless chip"></div>
      </div>
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// BIO PAGE — top half "We the People" + eagle illustration;
// bottom half photo + fields. No PASSPORT reverse-label box.
// ---------------------------------------------------------------------------
function buildBio(ctx) {
  const p = page("bearer", "bio-page");
  const s = ctx.stats;
  const memberSince = s.firstFlight ? formatDate(s.firstFlight) : "—";
  const dateOfIssue = formatDate(new Date());
  const surName  = BEARER.surname.padEnd(10, "<");
  const givenName = BEARER.given.padEnd(15, "<");
  const mrz1 = `P<USA${surName}<<${givenName}`.padEnd(44, "<").slice(0, 44);
  const mrz2 = `${BEARER.passportNo}USA000000${s.total.toString().padStart(6,"0")}M0000000`.padEnd(44, "<").slice(0, 44);

  p.innerHTML = `
    <div class="bio">
      <!-- Faint watermark seal centered in the page (CSS uses the PNG) -->
      <div class="bio-watermark" aria-hidden="true"></div>

      <!-- TOP HALF -->
      <div class="bio-top">
        <div class="bio-flag-stripes" aria-hidden="true"></div>
        <div class="bio-top-left">
          <div class="we-the-people" aria-label="We the People">We the People</div>
          <p class="preamble">Of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.</p>
          <div class="signature-line">
            <span class="signature">${BEARER.given} ${BEARER.surname}</span>
            <hr/>
            <small>SIGNATURE OF BEARER · SIGNATURE DU TITULAIRE · FIRMA DEL TITULAR</small>
          </div>
        </div>
        <div class="bio-top-right" aria-hidden="true">${bioEagleSVG()}</div>
      </div>

      <!-- BOTTOM HALF -->
      <div class="bio-bottom">
        <div class="bio-bottom-left">
          <div class="bio-photo"><span aria-hidden="true">MB</span></div>
        </div>
        <div class="bio-bottom-right">
          <h3 class="bio-country">UNITED STATES OF AMERICA</h3>
          <div class="bio-fields">
            <div class="row triple">
              <div class="field"><dt>Type / Type / Tipo</dt><dd>P</dd></div>
              <div class="field"><dt>Code / Código</dt><dd>USA</dd></div>
              <div class="field span-2"><dt>Passport No. / No. du Passeport</dt><dd>${BEARER.passportNo}</dd></div>
            </div>
            <div class="row"><div class="field"><dt>Surname / Nom / Apellidos</dt><dd>${BEARER.surname}</dd></div></div>
            <div class="row"><div class="field"><dt>Given Names / Prénoms / Nombres</dt><dd>${BEARER.given}</dd></div></div>
            <div class="row"><div class="field"><dt>Nationality / Nationalité / Nacionalidad</dt><dd>${BEARER.nationality}</dd></div></div>
            <div class="row">
              <div class="field"><dt>Member Since / Membre depuis</dt><dd>${memberSince.toUpperCase()}</dd></div>
              <div class="field"><dt>Sex / Sexe / Sexo</dt><dd>${BEARER.sex}</dd></div>
            </div>
            <div class="row"><div class="field"><dt>Place of Residence / Lugar de Residencia</dt><dd>${BEARER.residence}</dd></div></div>
            <div class="row">
              <div class="field"><dt>Date of Issue / Fecha de Expedición</dt><dd>${dateOfIssue.toUpperCase()}</dd></div>
              <div class="field"><dt>Authority / Autorité</dt><dd>TRIPIT</dd></div>
            </div>
            <div class="row"><div class="field"><dt>Endorsements / Anotaciones</dt><dd>SEE VISA STAMPS</dd></div></div>
          </div>
        </div>
      </div>

      <div class="bio-mrz">${mrz1}<br/>${mrz2}</div>
      ${pageNumBadge(2)}
    </div>`;
  return p;
}

function bioEagleSVG() {
  return `
    <svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="eagleHead" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="80%" stop-color="#dfe6f0"/>
          <stop offset="100%" stop-color="#b9c4d3"/>
        </linearGradient>
        <linearGradient id="eagleBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5a4528"/>
          <stop offset="100%" stop-color="#2c2113"/>
        </linearGradient>
      </defs>
      <g>
        <path d="M40 240 C 60 180 100 150 150 145 C 200 142 245 160 270 180 L 270 240 Z"
              fill="url(#eagleBody)" opacity="0.85"/>
        <g stroke="#0c0c10" stroke-width="0.4" fill="none" opacity="0.5">
          <path d="M70 220 q40 -40 100 -60"/>
          <path d="M80 230 q50 -36 110 -56"/>
          <path d="M120 232 q50 -22 120 -28"/>
        </g>
        <path d="M148 138 C 130 124 132 102 154 92 C 178 84 200 100 206 116
                 C 210 130 196 144 178 146 C 168 146 158 144 148 138 Z" fill="url(#eagleHead)"/>
        <path d="M174 104 C 158 100 152 86 168 78 C 188 70 214 76 226 88
                 C 232 96 226 104 216 108 L 200 110 L 190 116 Z" fill="url(#eagleHead)"/>
        <circle cx="206" cy="92" r="2.4" fill="#a8740a"/>
        <circle cx="205.4" cy="91.4" r="1.2" fill="#1c1306"/>
        <path d="M226 92 L 252 96 L 230 102 Z" fill="#dfa53b"/>
        <path d="M226 96 L 250 100" stroke="#7a5414" stroke-width="0.7" fill="none"/>
        <g stroke="#9fa9b8" stroke-width="0.5" fill="none" opacity="0.6">
          <path d="M158 100 q12 -8 30 -6"/>
          <path d="M160 110 q14 -6 32 -4"/>
          <path d="M170 124 q12 -2 26 0"/>
        </g>
      </g>
    </svg>`;
}

// ---------------------------------------------------------------------------
// STAMP PAGES — countries + US states. Random scatter layout so stamps
// sit nearby with only slight overlap.
// ---------------------------------------------------------------------------
const STAMP_SHAPES_COUNTRY = ["rect", "rect", "oval", "circle", "square"];
const STAMP_COLORS_COUNTRY = ["red", "blue", "green", "purple", "brown", "black"];
const STAMP_VERBS_COUNTRY  = ["ARRIVAL", "DEPARTURE", "ADMITTED", "IMMIGRATION", "ENTRADA"];

const STAMP_COLORS_STATE   = ["blue", "red", "black"];  // domestic / TSA feel
const STAMP_VERBS_STATE    = ["ADMITTED", "INSPECTED", "ENTRY"];

function seedRand(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) | 0;
  s = (s ^ 0x9e3779b9) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

function collectCountryStamps(ctx) {
  const entries = [...ctx.stats.countries.entries()]
    .filter(([code]) => code !== "US")
    .sort((a,b) => b[1].count - a[1].count);
  return entries.map(([code, info]) => buildCountryStampData(code, info, ctx));
}

function buildCountryStampData(code, info, ctx) {
  const rng = seedRand("C:" + code);
  const list = ctx.stats.flightsByCountry.get(code) || [];
  const airports = new Map();
  let firstDate = null;
  for (const f of list) {
    const ap = ctx.airports[f.to];
    if (!ap || ap.country !== code) continue;
    airports.set(ap.code, ap);
    const d = new Date(f.depart);
    if (!isNaN(d) && (!firstDate || d < firstDate)) firstDate = d;
  }
  const apCodes = [...airports.keys()].slice(0, 3).join(" · ");
  const dateStr = firstDate
    ? firstDate.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase()
    : "";
  return {
    kind: "country",
    code,
    name: info.name || code,
    region: COUNTRY_REGION[code] || "",
    shape: STAMP_SHAPES_COUNTRY[Math.floor(rng() * STAMP_SHAPES_COUNTRY.length)],
    color: STAMP_COLORS_COUNTRY[Math.floor(rng() * STAMP_COLORS_COUNTRY.length)],
    verb:  STAMP_VERBS_COUNTRY [Math.floor(rng() * STAMP_VERBS_COUNTRY.length)],
    rot:   (rng() * 18 - 9).toFixed(1) + "deg",
    apCodes,
    date: dateStr,
    visits: info.count,
    rng,
  };
}

function collectStateStamps(ctx) {
  // Sort visited states by flight count desc
  const entries = [...ctx.stats.states.entries()].sort((a,b) => b[1].count - a[1].count);
  return entries.map(([code, info]) => buildStateStampData(code, info, ctx));
}

function buildStateStampData(code, info, ctx) {
  const rng = seedRand("S:" + code);
  // Find airports in this state and their first-visit date
  const airports = new Map();
  let firstDate = null;
  for (const f of ctx.flights) {
    const ap = ctx.airports[f.to];
    if (!ap || ap.country !== "US" || ap.state !== code) continue;
    airports.set(ap.code, ap);
    const d = new Date(f.depart);
    if (!isNaN(d) && (!firstDate || d < firstDate)) firstDate = d;
  }
  const apCodes = [...airports.keys()].slice(0, 3).join(" · ");
  const dateStr = firstDate
    ? firstDate.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase()
    : "";
  return {
    kind: "state",
    code,
    name: STATE_NAMES[code] || code,
    region: "U.S.A.",
    shape: "state",
    color: STAMP_COLORS_STATE[Math.floor(rng() * STAMP_COLORS_STATE.length)],
    verb:  STAMP_VERBS_STATE [Math.floor(rng() * STAMP_VERBS_STATE.length)],
    rot:   (rng() * 16 - 8).toFixed(1) + "deg",
    apCodes,
    date: dateStr,
    visits: info.count,
    rng,
  };
}

// Pack stamps into pages — countries first, then US states. 6 stamps per page,
// each placed in a randomized "anchor" position so they sit nearby with slight
// overlap rather than aligned to a strict grid.
function buildStampPages(ctx) {
  const all = [...collectCountryStamps(ctx), ...collectStateStamps(ctx)];
  const PER_PAGE = 6;
  const pages = [];
  for (let i = 0; i < all.length; i += PER_PAGE) {
    const slice = all.slice(i, i + PER_PAGE);
    const num = i / PER_PAGE + 1;
    const p = page("stamps", "stamps-page");
    p.innerHTML = `
      <div class="paper blue stamps">
        <div class="bio-watermark watermark-light" aria-hidden="true"></div>
        <div class="page-header"><span>Visas · Stamps</span><small>page ${num}</small></div>
        <div class="stamps-inner">
          <div class="stamps-scatter">
            ${slice.map((d, idx) => renderScatteredStamp(d, idx)).join("")}
          </div>
        </div>
        ${pageNumBadge(2 + num)}
      </div>`;
    pages.push(p);
  }
  return pages;
}

// Place stamps in randomized anchor points within the page — 3x2 grid of
// "neighborhoods" with small jitter so adjacent stamps slightly overlap.
function renderScatteredStamp(d, idx) {
  // 3 cols x 2 rows anchor grid
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  const baseX = 18 + col * 28;   // %
  const baseY = 22 + row * 38;   // %
  const jx = (d.rng() * 14 - 7);
  const jy = (d.rng() * 14 - 7);
  const x = (baseX + jx).toFixed(1);
  const y = (baseY + jy).toFixed(1);
  return `
    <div class="stamp-anchor" style="left:${x}%;top:${y}%">
      ${renderStamp(d)}
    </div>`;
}

function renderStamp(d) {
  const cls = `stamp shape-${d.shape} color-${d.color}` + (d.kind === "state" ? " kind-state" : "");
  const planeIcon = d.kind === "state" ? "★" : "✈";
  let inner;
  if (d.shape === "circle" || d.shape === "square") {
    inner = `
      <span class="plane" aria-hidden="true">${planeIcon}</span>
      <div class="country">${escapeHtml(d.name)}</div>
      <div class="verb">${d.verb}</div>
      <div class="date">${d.date}</div>
      <div class="codes">${d.apCodes}</div>`;
  } else if (d.shape === "state") {
    // State stamp: compact rectangle with USA banner + state code + name
    inner = `
      <div class="state-banner">United States · ${escapeHtml(d.code)}</div>
      <div class="country">${escapeHtml(d.name.toUpperCase())}</div>
      <div class="verb">${d.verb}</div>
      <div class="codes">${d.apCodes}</div>
      <div class="date">${d.date}</div>`;
  } else {
    inner = `
      <span class="plane" aria-hidden="true">${planeIcon}</span>
      <div class="country"><span>${escapeHtml(d.name)}</span><span class="region">${escapeHtml(d.region)}</span></div>
      <div class="verb">${d.verb}</div>
      <div class="date">${d.date}</div>
      <div class="codes">${d.apCodes}</div>`;
  }
  const dense = d.name.length > 10 ? " dense" : "";
  return `<div class="${cls}${dense}" style="--rot:${d.rot}">${inner}</div>`;
}

// ---------------------------------------------------------------------------
// Assembly — cover, bio, stamp pages. (Flight log removed.)
// ---------------------------------------------------------------------------
export function buildPages(ctx) {
  const pages = [];
  pages.push(buildCover(ctx));
  pages.push(buildBio(ctx));
  for (const p of buildStampPages(ctx)) pages.push(p);
  return pages;
}
