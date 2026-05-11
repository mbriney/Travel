// main.js — entry point. Loads data, builds pages, wires up navigation.
import { computeStats } from "./stats.js";
import { buildPages } from "./pages.js";
import { initPassport } from "./passport.js";

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
  const book = document.getElementById("book-wrap");
  empty.classList.remove("hidden");
  book.classList.add("hidden");
  if (message) {
    empty.querySelector("p").textContent = message;
  }
}

async function boot() {
  const [flights, airports, airlines, countries] = await Promise.all([
    tryLoadJSON(DATA_PATHS.flights),
    tryLoadJSON(DATA_PATHS.airports),
    tryLoadJSON(DATA_PATHS.airlines),
    tryLoadJSON(DATA_PATHS.countries),
  ]);

  // No flights at all -> show getting-started state.
  if (!flights || !flights.length) {
    showEmptyState();
    return;
  }
  if (!airports) {
    showEmptyState("airports.json is missing. Run python tools/build_airports.py first.");
    return;
  }

  // Filter out segments that lack both endpoints in the airport DB.
  // (TripIt sometimes has odd codes; we still keep them but stats handle nulls.)
  const ctx = {
    flights,
    airports,
    airlines: airlines || {},
    countries: countries || {},
  };

  // Mark the bearer name on the topbar
  document.getElementById("meta-flights").textContent =
    `${flights.length.toLocaleString()} flights · ${ctx.airports ? Object.keys(airports).length.toLocaleString() : "—"} airports loaded`;

  const stats = computeStats(ctx);
  ctx.stats = stats;

  const book = document.getElementById("book");
  const pages = buildPages(ctx);
  // passport.js builds the sheet DOM and inserts each page as a face.
  initPassport(book, pages);
}

boot().catch(err => {
  console.error(err);
  showEmptyState("Something went wrong loading data. Check the console.");
});
