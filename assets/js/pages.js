// pages.js — pages that live inside the passport book.
// Maps and stats live in views.js (top-level tabs), not here.

import { formatDate } from "./stats.js";

const BEARER = {
  surname: "BRINEY",
  given: "MATTHEW",
  nationality: "UNITED STATES OF AMERICA",
  sex: "M",
  birthplace: "VIRGINIA, U.S.A.",
  residence: "DALLAS, TEXAS",
  passportNo: "TPL501283",   // decorative — based on flight stats
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

function pageNumBadge(num, side="right") {
  return `<span class="page-num page-num-${side}">${num}</span>`;
}

// ---------------------------------------------------------------------------
// COVER — front of the closed passport.
// Clean US passport visual: navy field, embossed gold Great Seal,
// uppercase PASSPORT, italic "United States of America", chip.
// ---------------------------------------------------------------------------
function buildCover(ctx) {
  const p = page("cover", "cover-page");
  p.innerHTML = `
    <div class="cover">
      <div class="cover-shimmer" aria-hidden="true"></div>
      <div class="cover-inner">
        <div class="cover-emblem" aria-hidden="true">${greatSealSVG()}</div>
        <div class="cover-titles">
          <h1>Passport</h1>
          <h2>United States of America</h2>
        </div>
        <div class="cover-chip" aria-hidden="true" title="contactless chip"></div>
      </div>
    </div>`;
  return p;
}

// Cleaner Great Seal: outlined eagle/shield silhouette, gold on navy.
// Closely mirrors the silhouette reference image.
function greatSealSVG() {
  return `
    <svg viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">
        <!-- glory of clouds above the eagle -->
        <g opacity="0.85">
          <path d="M50 36 q12 -14 28 -12 q14 -16 36 -8 q14 -14 34 -4 q16 -2 22 14"/>
          <path d="M60 46 q10 -10 22 -8 q12 -12 30 -6 q12 -10 28 -2"/>
        </g>
        <!-- 13 stars in a ring -->
        ${Array.from({length:13}).map((_,i)=>{
          const a = (i/12)*Math.PI - Math.PI;
          const r = 44;
          const cx = 110 + Math.cos(a)*r;
          const cy = 56 + Math.sin(a)*r;
          return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.6" fill="currentColor" stroke="none"/>`;
        }).join("")}

        <!-- eagle head -->
        <path d="M110 78 q-9 -2 -13 6 q-1 8 6 11 q6 4 14 1 q5 -3 4 -10 q-3 -6 -11 -8z"/>
        <circle cx="115" cy="86" r="1" fill="currentColor"/>
        <path d="M122 87 l9 0 l-5 4 z" fill="currentColor"/>

        <!-- spread wings (outline) -->
        <path d="M110 96
                 q-16 -4 -32 4 q-18 8 -32 24 q-10 12 -16 28
                 q14 -10 30 -14 q18 -4 32 -2 q12 2 18 6"/>
        <path d="M110 96
                 q16 -4 32 4 q18 8 32 24 q10 12 16 28
                 q-14 -10 -30 -14 q-18 -4 -32 -2 q-12 2 -18 6"/>

        <!-- feather suggestion lines on wings -->
        <g opacity="0.6">
          <path d="M52 130 l16 -2 M44 138 l20 -1 M40 148 l24 0"/>
          <path d="M168 130 l-16 -2 M176 138 l-20 -1 M180 148 l-24 0"/>
        </g>

        <!-- shield -->
        <g>
          <path d="M84 116 H136 V134 q0 18 -26 30 q-26 -12 -26 -30 z"/>
          <path d="M84 122 H136" opacity="0.7"/>
          <!-- vertical stripes -->
          <g opacity="0.7">
            <path d="M91 122 V158"/><path d="M98 122 V161"/><path d="M105 122 V163"/>
            <path d="M115 122 V163"/><path d="M122 122 V161"/><path d="M129 122 V158"/>
          </g>
        </g>

        <!-- olive branch left -->
        <path d="M50 184 q22 4 50 -2"/>
        ${Array.from({length:7}).map((_,i)=>`<ellipse cx="${56+i*6}" cy="${184 - (i%2)*3}" rx="2.6" ry="1.4" fill="currentColor" stroke="none" opacity="0.85"/>`).join("")}

        <!-- arrows right -->
        <g stroke-width="1.4">
          <path d="M170 188 L122 178"/>
          <path d="M172 184 L124 174"/>
          <path d="M174 180 L126 170"/>
          <path d="M170 188 l-4 -3 m4 3 l-1 -5"/>
          <path d="M172 184 l-4 -3 m4 3 l-1 -5"/>
          <path d="M174 180 l-4 -3 m4 3 l-1 -5"/>
        </g>

        <!-- banner with E PLURIBUS UNUM -->
        <path d="M70 100 Q 110 90 150 100"/>
        <text x="110" y="103" text-anchor="middle" font-family="serif" font-size="7"
              letter-spacing="1.6" fill="currentColor" stroke="none">E&nbsp;PLURIBUS&nbsp;UNUM</text>
      </g>
    </svg>`;
}

// ---------------------------------------------------------------------------
// BIO PAGE — the real-US-passport bearer page.
//
// Layout (top half / bottom half):
//   TOP HALF
//     left:  "We the People" calligraphic + preamble snippet + signature line
//     right: bald-eagle illustration with US flag stripes behind
//   BOTTOM HALF
//     "PASSPORT · PASAPORTE" header on left + Great Seal emblem
//     "UNITED STATES OF AMERICA" title row
//     photo on left | fields grid on right
//     MRZ at bottom
// ---------------------------------------------------------------------------
function buildBio(ctx) {
  const p = page("bearer", "bio-page");
  const s = ctx.stats;
  const memberSince = s.firstFlight ? formatDate(s.firstFlight) : "—";
  const dateOfIssue = formatDate(new Date());
  const dateOfExp   = formatDate(new Date(Date.now() + 10 * 365.25 * 24 * 3600 * 1000));
  const surName  = BEARER.surname.padEnd(10, "<");
  const givenName = BEARER.given.padEnd(15, "<");
  const mrz1 = `P<USA${surName}<<${givenName}`.padEnd(44, "<").slice(0, 44);
  const mrz2 = `${BEARER.passportNo}USA000000${s.total.toString().padStart(6,"0")}M0000000`.padEnd(44, "<").slice(0, 44);

  p.innerHTML = `
    <div class="bio">

      <!-- TOP HALF: We the People + eagle -->
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

      <!-- BOTTOM HALF: passport ID block -->
      <div class="bio-bottom">

        <div class="bio-bottom-left">
          <div class="passport-label">
            <div class="passport-emblem" aria-hidden="true">${smallSealSVG()}</div>
            <div class="passport-label-text">
              <strong>PASSPORT</strong><br/>
              <span>PASAPORTE</span>
            </div>
          </div>
          <div class="bio-photo">
            <span aria-hidden="true">MB</span>
          </div>
          <div class="bio-corner-seal" aria-hidden="true">${smallSealSVG()}</div>
        </div>

        <div class="bio-bottom-right">
          <h3 class="bio-country">UNITED STATES OF AMERICA</h3>

          <div class="bio-fields">
            <div class="row triple">
              <div class="field"><dt>Type / Type / Tipo</dt><dd>P</dd></div>
              <div class="field"><dt>Code / Código</dt><dd>USA</dd></div>
              <div class="field span-2"><dt>Passport No. / No. du Passeport</dt><dd>${BEARER.passportNo}</dd></div>
            </div>
            <div class="row">
              <div class="field"><dt>Surname / Nom / Apellidos</dt><dd>${BEARER.surname}</dd></div>
            </div>
            <div class="row">
              <div class="field"><dt>Given Names / Prénoms / Nombres</dt><dd>${BEARER.given}</dd></div>
            </div>
            <div class="row">
              <div class="field"><dt>Nationality / Nationalité / Nacionalidad</dt><dd>${BEARER.nationality}</dd></div>
            </div>
            <div class="row">
              <div class="field"><dt>Member Since / Membre depuis</dt><dd>${memberSince.toUpperCase()}</dd></div>
              <div class="field"><dt>Sex / Sexe / Sexo</dt><dd>${BEARER.sex}</dd></div>
            </div>
            <div class="row">
              <div class="field"><dt>Place of Residence / Lugar de Residencia</dt><dd>${BEARER.residence}</dd></div>
            </div>
            <div class="row">
              <div class="field"><dt>Date of Issue / Fecha de Expedición</dt><dd>${dateOfIssue.toUpperCase()}</dd></div>
              <div class="field"><dt>Authority / Autorité</dt><dd>TRIPIT</dd></div>
            </div>
            <div class="row">
              <div class="field"><dt>Endorsements / Anotaciones</dt><dd>SEE FLIGHT LOG</dd></div>
            </div>
          </div>
        </div>

      </div>

      <!-- MRZ -->
      <div class="bio-mrz">${mrz1}<br/>${mrz2}</div>
      ${pageNumBadge(2, "right")}
    </div>`;
  return p;
}

// Bald-eagle illustration for the bio top-right — head + neck profile, looking right.
// Inspired by the engraving on real US passport bio pages.
function bioEagleSVG() {
  return `
    <svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="eagleHeadGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="80%" stop-color="#dfe6f0"/>
          <stop offset="100%" stop-color="#b9c4d3"/>
        </linearGradient>
        <linearGradient id="eagleBodyGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5a4528"/>
          <stop offset="100%" stop-color="#2c2113"/>
        </linearGradient>
      </defs>
      <g>
        <!-- shoulder / body feathers -->
        <path d="M40 240 C 60 180 100 150 150 145 C 200 142 245 160 270 180 L 270 240 Z"
              fill="url(#eagleBodyGrad)" opacity="0.85"/>
        <!-- feather edge highlights -->
        <g stroke="#0c0c10" stroke-width="0.4" fill="none" opacity="0.5">
          <path d="M70 220 q40 -40 100 -60"/>
          <path d="M80 230 q50 -36 110 -56"/>
          <path d="M120 232 q50 -22 120 -28"/>
        </g>
        <!-- white neck -->
        <path d="M148 138 C 130 124 132 102 154 92 C 178 84 200 100 206 116
                 C 210 130 196 144 178 146 C 168 146 158 144 148 138 Z"
              fill="url(#eagleHeadGrad)"/>
        <!-- head -->
        <path d="M174 104 C 158 100 152 86 168 78 C 188 70 214 76 226 88
                 C 232 96 226 104 216 108 L 200 110 L 190 116 Z"
              fill="url(#eagleHeadGrad)"/>
        <!-- eye -->
        <circle cx="206" cy="92" r="2.4" fill="#a8740a"/>
        <circle cx="205.4" cy="91.4" r="1.2" fill="#1c1306"/>
        <!-- beak -->
        <path d="M226 92 L 252 96 L 230 102 Z" fill="#dfa53b"/>
        <path d="M226 96 L 250 100" stroke="#7a5414" stroke-width="0.7" fill="none"/>
        <!-- subtle feather lines on head/neck -->
        <g stroke="#9fa9b8" stroke-width="0.5" fill="none" opacity="0.6">
          <path d="M158 100 q12 -8 30 -6"/>
          <path d="M160 110 q14 -6 32 -4"/>
          <path d="M170 124 q12 -2 26 0"/>
        </g>
      </g>
    </svg>`;
}

// Small Great Seal emblem for the bio "PASSPORT" label box.
function smallSealSVG() {
  return `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="0.9">
        <circle cx="32" cy="32" r="28"/>
        <circle cx="32" cy="32" r="22"/>
        <!-- stylized eagle in the middle -->
        <path d="M16 30 C 24 26 28 30 32 28 C 36 30 40 26 48 30"/>
        <path d="M32 28 V 38"/>
        <path d="M26 38 H 38" />
        <path d="M24 42 C 28 46 36 46 40 42"/>
        <!-- 13 stars -->
        ${Array.from({length:13}).map((_,i)=>{
          const a = (i/13)*Math.PI*2 - Math.PI/2;
          const r = 9;
          const cx = 32 + Math.cos(a)*r;
          const cy = 22 + Math.sin(a)*r;
          return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="0.6" fill="currentColor" stroke="none"/>`;
        }).join("")}
      </g>
      <text x="32" y="60" text-anchor="middle" font-family="serif" font-size="3.4"
            letter-spacing="0.5" fill="currentColor" stroke="none">UNITED STATES</text>
    </svg>`;
}

// ---------------------------------------------------------------------------
// STAMP PAGES — playful varied stamps
// ---------------------------------------------------------------------------
const STAMP_SHAPES = ["rect", "rect", "oval", "circle", "square"];
const STAMP_COLORS = ["red", "blue", "green", "purple", "brown", "black"];
const STAMP_VERBS  = ["ARRIVAL", "DEPARTURE", "ADMITTED", "IMMIGRATION", "ENTRADA"];

function seedRand(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) | 0;
  s = (s ^ 0x9e3779b9) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

function buildStampPages(ctx) {
  const s = ctx.stats;
  const entries = [...s.countries.entries()]
    .filter(([code]) => code !== "US")
    .sort((a,b) => b[1].count - a[1].count);

  const STAMPS_PER_PAGE = 4;
  const pages = [];
  for (let i = 0; i < entries.length; i += STAMPS_PER_PAGE) {
    const slice = entries.slice(i, i + STAMPS_PER_PAGE);
    const num = i / STAMPS_PER_PAGE + 1;
    const p = page("stamps", "stamps-page");
    p.innerHTML = `
      <div class="paper blue stamps">
        <div class="page-header"><span>Visas · Stamps</span><small>page ${num}</small></div>
        <div class="stamps-inner">
          <div class="stamps-grid">
            ${slice.map((entry, idx) => `<div class="stamp-cell">${renderStamp(entry, ctx, i + idx)}</div>`).join("")}
          </div>
        </div>
        ${pageNumBadge(2 + num, "right")}
      </div>`;
    pages.push(p);
  }
  return pages;
}

function renderStamp([code, info], ctx, idx) {
  const rng = seedRand(code);
  const shape = STAMP_SHAPES[Math.floor(rng() * STAMP_SHAPES.length)];
  const color = STAMP_COLORS[Math.floor(rng() * STAMP_COLORS.length)];
  const verb  = STAMP_VERBS[Math.floor(rng() * STAMP_VERBS.length)];
  const rot   = (rng() * 14 - 7).toFixed(1) + "deg";
  const tx    = (rng() * 16 - 8).toFixed(0) + "px";
  const ty    = (rng() * 12 - 6).toFixed(0) + "px";

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
      <div class="country"><span>${escapeHtml(info.name || code)}</span><span style="font-size:10px;letter-spacing:.18em">${region}</span></div>
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
      <div class="page-header"><span>Flight Log</span><small>${flights.length.toLocaleString()} flights · most recent first</small></div>
      <div class="log">
        <div class="inner-scroll">
          <table>
            <thead><tr><th>Date</th><th>Route</th><th>Flight</th><th style="text-align:right">Miles</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      ${pageNumBadge(99, "right")}
    </div>`;
  return p;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------
export function buildPages(ctx) {
  const pages = [];
  pages.push(buildCover(ctx));
  pages.push(buildBio(ctx));
  for (const p of buildStampPages(ctx)) pages.push(p);
  pages.push(buildLog(ctx));
  return pages;
}
