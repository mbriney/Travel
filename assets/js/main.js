// main.js — entry point. Loads data, builds passport pages + standalone views,
// and wires up tab switching across the top.

import { computeStats } from "./stats.js";
import { buildPages } from "./pages.js";
import { initPassport } from "./passport.js";
import { renderStatsView, renderWorldView, renderUSView, renderLogView, openStampModal } from "./views.js";
import { renderAchievementsView } from "./achievements.js";

const DATA_PATHS = {
  flights:  "data/flights.json",
  airports: "data/airports.json",
  airlines: "data/airlines.json",
  countries:"data/countries.json",
  meta:     "data/meta.json",
};

// Cache-bust data files using the page-load timestamp so a freshly-rebuilt
// data file (after running tools/build_airports.py or fetch_tripit.py) is
// picked up immediately on refresh, with no manual hard-reload needed.
const _CACHEBUST = String(Date.now());
async function loadJSON(path) {
  const url = `${path}${path.includes("?") ? "&" : "?"}v=${_CACHEBUST}`;
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`fetch ${path}: ${r.status}`);
  return r.json();
}
async function tryLoadJSON(path) {
  try { return await loadJSON(path); } catch (e) { return null; }
}

function showEmptyState(message) {
  const empty = document.getElementById("empty");
  const views = document.getElementById("views");
  empty.classList.remove("hidden");
  views.classList.add("hidden");
  if (message) empty.querySelector("p").textContent = message;
}

function initTabs(ctx) {
  const tabs = [...document.querySelectorAll(".view-tabs button[data-view]")];
  const views = [...document.querySelectorAll(".view[data-view]")];
  const rendered = new Set();

  function activate(name) {
    for (const t of tabs) t.classList.toggle("is-active", t.dataset.view === name);
    for (const v of views) {
      const isOn = v.dataset.view === name;
      v.classList.toggle("is-active", isOn);
      v.hidden = !isOn;
    }
    // Lazy-render the heavier views the first time they're shown.
    if (!rendered.has(name)) {
      const root = document.getElementById(`view-${name}`);
      if (name === "stats") renderStatsView(root, ctx);
      else if (name === "world") renderWorldView(root, ctx);
      else if (name === "usa") renderUSView(root, ctx);
      else if (name === "achievements") renderAchievementsView(root, ctx);
      else if (name === "log") renderLogView(root, ctx);
      rendered.add(name);
    }
    history.replaceState(null, "", `#${name}`);
  }

  tabs.forEach(t => t.addEventListener("click", () => activate(t.dataset.view)));

  // Allow deep-linking via #stats, #world, etc.
  const hash = (location.hash || "").slice(1);
  if (hash && tabs.some(t => t.dataset.view === hash)) {
    activate(hash);
  } else {
    // Passport view is active by default; nothing to lazy-render.
    rendered.add("passport");
  }
}

async function boot() {
  const [flights, airports, airlines, countries] = await Promise.all([
    tryLoadJSON(DATA_PATHS.flights),
    tryLoadJSON(DATA_PATHS.airports),
    tryLoadJSON(DATA_PATHS.airlines),
    tryLoadJSON(DATA_PATHS.countries),
  ]);

  if (!flights || !flights.length) { showEmptyState(); return; }
  if (!airports) { showEmptyState("airports.json is missing. Run python tools/build_airports.py first."); return; }

  // Sanity-check: every airport should carry elevation_ft. If not, the data
  // was built before that field was added — warn the user with a clear hint.
  const sampled = Object.values(airports).slice(0, 100);
  const hasElevation = sampled.some(a => typeof a.elevation_ft === "number" && a.elevation_ft !== 0);
  if (!hasElevation) {
    console.warn(
      "%cdata/airports.json is missing elevation_ft. Rebuild with: python tools/build_airports.py",
      "color: #f59e0b; font-weight: bold;"
    );
  }

  // Some TripIt records have the airline IATA code in `airline` (the name
  // field) instead of `airline_code`. Normalize so every downstream consumer
  // can trust f.airline_code, and back-fill the proper airline name from
  // the airlines DB when available.
  let fixed = 0;
  for (const f of flights) {
    if (!f.airline_code && f.airline && /^[A-Z0-9]{2,3}$/.test(String(f.airline).trim())) {
      f.airline_code = String(f.airline).trim().toUpperCase();
      const entry = airlines?.[f.airline_code];
      f.airline = entry?.name || f.airline;
      fixed++;
    }
  }
  if (fixed) console.log(`Normalized airline_code on ${fixed} flights`);

  const ctx = {
    flights,
    airports,
    airlines: airlines || {},
    countries: countries || {},
  };

  // Last-Updated indicator — prefer the explicit timestamp written by
  // tools/fetch_tripit.py to data/meta.json (it's the most accurate "when
  // did we last pull from TripIt"). Fall back to the flights.json file mtime
  // via Last-Modified header for older data files.
  (async () => {
    const meta = await tryLoadJSON(DATA_PATHS.meta);
    const iso = meta?.tripit_fetched_at;
    if (iso) {
      const d = new Date(iso);
      if (!isNaN(d)) {
        const el = document.getElementById("meta-updated");
        el.textContent = "Updated " + relativeTime(d);
        el.title = "TripIt last fetched " + d.toLocaleString();
        return;
      }
    }
    // Fallback: HTTP Last-Modified of flights.json
    try {
      const r = await fetch(DATA_PATHS.flights, { method: "HEAD", cache: "no-cache" });
      const lm = r.headers.get("Last-Modified");
      if (!lm) return;
      const d = new Date(lm);
      if (isNaN(d)) return;
      const el = document.getElementById("meta-updated");
      el.textContent = "Updated " + relativeTime(d);
      el.title = "flights.json last modified " + d.toLocaleString();
    } catch {}
  })();

  ctx.stats = computeStats(ctx);

  // Build the passport book
  const book = document.getElementById("book");
  const pages = buildPages(ctx);
  initPassport(book, pages);

  // Wire up tab switching (lazy-renders Stats/World/USA/Achievements/Log)
  initTabs(ctx);

  // "Travel Passport" brand returns to the Passport tab.
  document.getElementById("brand-home").addEventListener("click", () => {
    document.querySelector('.view-tabs button[data-view="passport"]').click();
  });

  // Stamp click → open detail modal with all flights to that country/state.
  // ────────────────────────────────────────────────────────────────────
  // We attach in the CAPTURE phase so we fire BEFORE passport.js's bubble-
  // phase page-flip handler. That lets us claim the click for a stamp and
  // call stopImmediatePropagation() so passport.js never tries to navigate.
  //
  // For stamps on the LEFT page (the .sheet-back of a flipped sheet), the
  // browser's native 3D hit-testing fails — clicks land on a parent element
  // like .paper, not on the .stamp. We work around that by doing our own
  // hit-test against every visible stamp's getBoundingClientRect, which
  // correctly accounts for all CSS transforms.
  function findStampAtPoint(clientX, clientY) {
    const candidates = [];
    // Topmost-flipped sheet's back face → left page. Last in DOM order among
    // flipped sheets = highest index = the one actually showing on the left.
    const flippedSheets = book.querySelectorAll('.sheet[data-state="flipped"]');
    const topFlipped = flippedSheets[flippedSheets.length - 1];
    if (topFlipped) {
      candidates.push(...topFlipped.querySelectorAll('.sheet-back .stamp[data-stamp-kind]'));
    }
    // Current sheet's front face → right page.
    const currentSheet = book.querySelector('.sheet[data-state="current"]');
    if (currentSheet) {
      candidates.push(...currentSheet.querySelectorAll('.sheet-front .stamp[data-stamp-kind]'));
    }
    for (const stamp of candidates) {
      const r = stamp.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (clientX >= r.left && clientX <= r.right &&
          clientY >= r.top  && clientY <= r.bottom) {
        return stamp;
      }
    }
    return null;
  }

  book.addEventListener("click", (e) => {
    // Fast path: browser hit-test landed inside the stamp.
    let stamp = e.target.closest(".stamp[data-stamp-kind]");
    // Fallback: JS hit-test (covers the left-page case where browser 3D
    // hit-testing routes the click into a parent like .paper instead).
    if (!stamp) stamp = findStampAtPoint(e.clientX, e.clientY);
    if (!stamp) return;
    // Both stopPropagation and stopImmediatePropagation — the latter prevents
    // passport.js's bubble-phase handler from running and flipping the page.
    e.stopPropagation();
    e.stopImmediatePropagation();
    openStampModal(stamp.dataset.stampKind, stamp.dataset.stampCode, ctx);
  }, /* useCapture */ true);

  book.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const stamp = e.target.closest(".stamp[data-stamp-kind]");
    if (!stamp) return;
    e.preventDefault();
    openStampModal(stamp.dataset.stampKind, stamp.dataset.stampCode, ctx);
  });
}

function relativeTime(date) {
  const sec = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (sec < 60)         return "just now";
  if (sec < 3600)       return `${Math.round(sec / 60)} min ago`;
  if (sec < 86400)      return `${Math.round(sec / 3600)} hr ago`;
  if (sec < 86400 * 7)  return `${Math.round(sec / 86400)} d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

boot().catch(err => {
  console.error(err);
  showEmptyState("Something went wrong loading data. Check the console.");
});
