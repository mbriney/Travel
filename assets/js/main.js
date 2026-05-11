// main.js — entry point. Loads data, builds passport pages + standalone views,
// and wires up tab switching across the top.

import { computeStats } from "./stats.js";
import { buildPages } from "./pages.js";
import { initPassport } from "./passport.js";
import { renderStatsView, renderWorldView, renderUSView } from "./views.js";
import { renderAchievementsView } from "./achievements.js";

const DATA_PATHS = {
  flights:  "data/flights.json",
  airports: "data/airports.json",
  airlines: "data/airlines.json",
  countries:"data/countries.json",
};

async function loadJSON(path) {
  const r = await fetch(path, { cache: "force-cache" });
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

  const ctx = {
    flights,
    airports,
    airlines: airlines || {},
    countries: countries || {},
  };

  document.getElementById("meta-flights").textContent =
    `${flights.length.toLocaleString()} flights · ${Object.keys(airports).length.toLocaleString()} airports loaded`;

  ctx.stats = computeStats(ctx);

  // Build the passport book
  const book = document.getElementById("book");
  const pages = buildPages(ctx);
  initPassport(book, pages);

  // Wire up tab switching (lazy-renders Stats/World/USA on first reveal)
  initTabs(ctx);
}

boot().catch(err => {
  console.error(err);
  showEmptyState("Something went wrong loading data. Check the console.");
});
