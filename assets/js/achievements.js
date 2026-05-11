// achievements.js — TravStats-inspired achievement system.
import { openDetailModal } from "./views.js";
import { formatDate, formatDuration, formatNumber } from "./stats.js";
// Definitions are a curated subset of https://github.com/Abrechen2/TravStats's
// `backend/src/data/achievements.ts` — only the ones we can evaluate from
// TripIt data (no aircraft, seat, cancellation, or service-class info).

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = [
  // ── EXPLORER (flight count) ────────────────────────────────────────────
  { code: "FIRST_FLIGHT",        name: "Taking Off",          desc: "Complete your first flight",                            category: "explorer", icon: "✈️", tier: "bronze",   req: 1,    type: "flights_count",          points: 10 },
  { code: "FREQUENT_FLYER_10",   name: "Frequent Flyer",      desc: "Complete 10 flights",                                   category: "explorer", icon: "🛫", tier: "bronze",   req: 10,   type: "flights_count",          points: 25 },
  { code: "FREQUENT_FLYER_25",   name: "Sky Veteran",         desc: "Complete 25 flights",                                   category: "explorer", icon: "🛫", tier: "silver",   req: 25,   type: "flights_count",          points: 50 },
  { code: "FREQUENT_FLYER_50",   name: "Aviation Enthusiast", desc: "Complete 50 flights",                                   category: "explorer", icon: "✈️", tier: "gold",     req: 50,   type: "flights_count",          points: 100 },
  { code: "FREQUENT_FLYER_100",  name: "Centurion",           desc: "Complete 100 flights",                                  category: "explorer", icon: "🏆", tier: "platinum", req: 100,  type: "flights_count",          points: 200 },
  { code: "FREQUENT_FLYER_250",  name: "Sky Master",          desc: "Complete 250 flights",                                  category: "explorer", icon: "👑", tier: "diamond",  req: 250,  type: "flights_count",          points: 500 },
  { code: "FREQUENT_FLYER_500",  name: "Legend of the Skies", desc: "Complete 500 flights",                                  category: "explorer", icon: "💎", tier: "diamond",  req: 500,  type: "flights_count",          points: 1000 },

  // ── DISTANCE ───────────────────────────────────────────────────────────
  { code: "DISTANCE_1000",       name: "First Thousand",      desc: "Fly 1,000 km",                                          category: "distance", icon: "📏", tier: "bronze",   req: 1000,    type: "distance_km",         points: 15 },
  { code: "DISTANCE_10000",      name: "Ten Thousand Club",   desc: "Fly 10,000 km",                                         category: "distance", icon: "🌍", tier: "silver",   req: 10000,   type: "distance_km",         points: 50 },
  { code: "DISTANCE_50000",      name: "Around the World",    desc: "Fly 50,000 km (circumference of Earth)",                category: "distance", icon: "🌎", tier: "gold",     req: 50000,   type: "distance_km",         points: 150 },
  { code: "DISTANCE_100000",     name: "Globe Trotter",       desc: "Fly 100,000 km",                                        category: "distance", icon: "🌏", tier: "platinum", req: 100000,  type: "distance_km",         points: 300 },
  { code: "DISTANCE_250000",     name: "Distance Warrior",    desc: "Fly 250,000 km",                                        category: "distance", icon: "🚀", tier: "diamond",  req: 250000,  type: "distance_km",         points: 750 },
  { code: "DISTANCE_500000",     name: "Orbital Achievement", desc: "Fly 500,000 km",                                        category: "distance", icon: "🛰️", tier: "diamond", req: 500000,  type: "distance_km",         points: 1500 },
  { code: "DISTANCE_1M",         name: "Planetary Perspective", desc: "Fly 1,000,000 km total",                              category: "distance", icon: "🪐", tier: "diamond",  req: 1000000, type: "distance_km",         points: 1000 },

  // ── DISTANCE — flight time ─────────────────────────────────────────────
  { code: "FLIGHT_TIME_100",     name: "Century Hours",       desc: "Accumulate 100 hours of flight time",                   category: "distance", icon: "⏱️", tier: "silver",   req: 100,  type: "flight_hours",           points: 100 },
  { code: "FLIGHT_TIME_500",     name: "Sky Veteran Hours",   desc: "Accumulate 500 hours of flight time",                   category: "distance", icon: "⏰", tier: "gold",     req: 500,  type: "flight_hours",           points: 300 },
  { code: "FLIGHT_TIME_1000",    name: "Thousand Hour Club",  desc: "Accumulate 1,000 hours of flight time",                 category: "distance", icon: "⌚", tier: "platinum", req: 1000, type: "flight_hours",           points: 750 },

  // ── COLLECTOR — countries ──────────────────────────────────────────────
  { code: "COUNTRIES_5",         name: "Passport Starter",    desc: "Visit 5 different countries",                           category: "collector", icon: "🗺️", tier: "bronze",   req: 5,   type: "countries",              points: 20 },
  { code: "COUNTRIES_10",        name: "International Traveler", desc: "Visit 10 different countries",                       category: "collector", icon: "🌐", tier: "silver",   req: 10,  type: "countries",              points: 50 },
  { code: "COUNTRIES_25",        name: "World Explorer",      desc: "Visit 25 different countries",                          category: "collector", icon: "🗺️", tier: "gold",     req: 25,  type: "countries",              points: 125 },
  { code: "COUNTRIES_50",        name: "Global Citizen",      desc: "Visit 50 different countries",                          category: "collector", icon: "🌍", tier: "platinum", req: 50,  type: "countries",              points: 300 },
  { code: "COUNTRIES_100",       name: "Master of Nations",   desc: "Visit 100 different countries",                         category: "collector", icon: "👑", tier: "diamond",  req: 100, type: "countries",              points: 1000 },

  // ── COLLECTOR — airlines ───────────────────────────────────────────────
  { code: "AIRLINES_5",          name: "Airline Sampler",     desc: "Fly with 5 different airlines",                         category: "collector", icon: "🏢", tier: "bronze",   req: 5,   type: "airlines",               points: 15 },
  { code: "AIRLINES_10",         name: "Airline Collector",   desc: "Fly with 10 different airlines",                        category: "collector", icon: "✈️", tier: "silver",   req: 10,  type: "airlines",               points: 40 },
  { code: "AIRLINES_25",         name: "Airline Enthusiast",  desc: "Fly with 25 different airlines",                        category: "collector", icon: "🛫", tier: "gold",     req: 25,  type: "airlines",               points: 100 },
  { code: "AIRLINES_50",         name: "Airline Master",      desc: "Fly with 50 different airlines",                        category: "collector", icon: "🏆", tier: "platinum", req: 50,  type: "airlines",               points: 250 },

  // ── COLLECTOR — airports ───────────────────────────────────────────────
  { code: "AIRPORTS_10",         name: "Airport Explorer",    desc: "Visit 10 different airports",                           category: "collector", icon: "🏢", tier: "bronze",   req: 10,  type: "airports",               points: 20 },
  { code: "AIRPORTS_25",         name: "Terminal Hopper",     desc: "Visit 25 different airports",                           category: "collector", icon: "🏛️", tier: "silver",   req: 25,  type: "airports",               points: 50 },
  { code: "AIRPORTS_50",         name: "Hub Master",          desc: "Visit 50 different airports",                           category: "collector", icon: "🏗️", tier: "gold",     req: 50,  type: "airports",               points: 125 },
  { code: "AIRPORTS_100",        name: "Airport Connoisseur", desc: "Visit 100 different airports",                          category: "collector", icon: "🎯", tier: "platinum", req: 100, type: "airports",               points: 300 },
  { code: "AIRPORTS_200",        name: "Lord of Terminals",   desc: "Visit 200 different airports",                          category: "collector", icon: "👑", tier: "diamond",  req: 200, type: "airports",               points: 750 },

  // ── COLLECTOR — continents ─────────────────────────────────────────────
  { code: "CONTINENTS_3",        name: "Tri-Continental",     desc: "Visit airports on 3 different continents",              category: "collector", icon: "🌏", tier: "silver",   req: 3,   type: "continents",             points: 50 },
  { code: "CONTINENTS_5",        name: "Five Continents Club",desc: "Visit airports on 5 different continents",              category: "collector", icon: "🌍", tier: "gold",     req: 5,   type: "continents",             points: 150 },
  { code: "CONTINENTS_7",        name: "Seven Continents Master", desc: "Visit airports on all 7 continents",                category: "collector", icon: "🌎", tier: "diamond",  req: 7,   type: "continents",             points: 500 },

  // ── COLLECTOR — US states (custom — not in TravStats) ──────────────────
  { code: "STATES_10",           name: "State Sampler",       desc: "Visit 10 different US states",                          category: "collector", icon: "🇺🇸", tier: "bronze",   req: 10,  type: "us_states",              points: 25 },
  { code: "STATES_25",           name: "Half the Union",      desc: "Visit 25 different US states",                          category: "collector", icon: "🦅", tier: "silver",   req: 25,  type: "us_states",              points: 75 },
  { code: "STATES_40",           name: "Almost All Fifty",    desc: "Visit 40 different US states",                          category: "collector", icon: "🗽", tier: "gold",     req: 40,  type: "us_states",              points: 200 },
  { code: "STATES_50",           name: "All Fifty States",    desc: "Visit all 50 US states",                                category: "collector", icon: "🏵️", tier: "diamond",  req: 50,  type: "us_states",              points: 750 },

  // ── ELITE — long-haul ──────────────────────────────────────────────────
  { code: "LONG_HAUL_5000",      name: "Long Haul Rookie",    desc: "Complete a flight over 5,000 km",                       category: "elite", icon: "🌏", tier: "silver",   req: 5000,  type: "single_flight_distance", points: 50 },
  { code: "LONG_HAUL_10000",     name: "Intercontinental Pro",desc: "Complete a flight over 10,000 km",                      category: "elite", icon: "🌍", tier: "gold",     req: 10000, type: "single_flight_distance", points: 150 },
  { code: "LONG_HAUL_MARATHON",  name: "Long-Haul Marathon",  desc: "Complete a single flight of 11,000 km or more",         category: "elite", icon: "🏃", tier: "gold",     req: 11000, type: "single_flight_distance", points: 75 },
  { code: "LONG_HAUL_15000",     name: "Ultra Long Range",    desc: "Complete a flight over 15,000 km",                      category: "elite", icon: "🚀", tier: "platinum", req: 15000, type: "single_flight_distance", points: 300 },
  { code: "TRANSCONTINENTAL",    name: "Transcontinental",    desc: "Complete a flight crossing an ocean",                   category: "elite", icon: "🌊", tier: "gold",     req: 1,     type: "ocean_crossing",         points: 100 },

  // ── ELITE — airline loyalty ────────────────────────────────────────────
  { code: "AIRLINE_LOYAL_10",    name: "Airline Loyalty",     desc: "Complete 10 flights with the same airline",             category: "elite", icon: "💙", tier: "bronze",   req: 10,  type: "airline_loyalty",        points: 40 },
  { code: "AIRLINE_LOYAL_25",    name: "Brand Ambassador",    desc: "Complete 25 flights with the same airline",             category: "elite", icon: "❤️", tier: "silver",   req: 25,  type: "airline_loyalty",        points: 100 },
  { code: "AIRLINE_LOYAL_50",    name: "Elite Member",        desc: "Complete 50 flights with the same airline",             category: "elite", icon: "💎", tier: "gold",     req: 50,  type: "airline_loyalty",        points: 250 },
  { code: "LEGACY_LOYALIST",     name: "Legacy Loyalist",     desc: "15 flights with the same flagship airline",             category: "elite", icon: "🎖️", tier: "gold",     req: 100, type: "airline_loyalty",        points: 60 },

  // ── SPECIAL — time-of-day ──────────────────────────────────────────────
  { code: "NIGHT_OWL",           name: "Night Owl",           desc: "10 flights departing between midnight and 6 AM",        category: "special", icon: "🦉", tier: "silver", req: 10,  type: "night_flights",          points: 75 },
  { code: "RED_EYE_MASTER",      name: "Red Eye Master",      desc: "25 flights departing between midnight and 6 AM",        category: "special", icon: "🌙", tier: "gold",   req: 25,  type: "night_flights",          points: 150 },
  { code: "NOT_A_MORNING_PERSON",name: "Not a Morning Person",desc: "10 flights with a departure between 04:00 and 07:00",   category: "special", icon: "☕", tier: "bronze", req: 10,  type: "early_morning_flights",  points: 25 },

  // ── SPECIAL — streaks / patterns ───────────────────────────────────────
  { code: "WEEKEND_WARRIOR",     name: "Weekend Warrior",     desc: "Complete 10 flights on weekends",                       category: "special", icon: "🎉", tier: "silver", req: 10, type: "weekend_flights",        points: 50 },
  { code: "MONTHLY_FLYER",       name: "Monthly Flyer",       desc: "At least one flight every month for 6 consecutive months", category: "special", icon: "📅", tier: "gold",   req: 6,  type: "consecutive_months",     points: 200 },
  { code: "YEARLY_COMMITMENT",   name: "Yearly Commitment",   desc: "At least one flight every month for 12 consecutive months", category: "special", icon: "🗓️", tier: "platinum", req: 12, type: "consecutive_months", points: 500 },
  { code: "YEAR_ROUND",          name: "Year-Round Flyer",    desc: "Complete flights in all 4 seasons in a year",           category: "special", icon: "🍂", tier: "gold",   req: 4,  type: "all_seasons",            points: 150 },

  // ── SPECIAL — routes ──────────────────────────────────────────────────
  { code: "FAVORITE_ROUTE",      name: "Favorite Route",      desc: "Fly the same route 5 times",                            category: "special", icon: "🔄", tier: "bronze", req: 5,  type: "same_route",             points: 30 },
  { code: "ROUTE_MASTER",        name: "Route Master",        desc: "Fly the same route 10 times",                           category: "special", icon: "🔁", tier: "silver", req: 10, type: "same_route",             points: 75 },
  { code: "COMMUTER",            name: "Commuter",            desc: "Fly the same route 25 times",                           category: "special", icon: "💼", tier: "gold",   req: 25, type: "same_route",             points: 200 },

  // ── SPECIAL — volume ──────────────────────────────────────────────────
  { code: "BUSY_MONTH",          name: "Busy Month",          desc: "Complete 10 flights in a single month",                 category: "special", icon: "📆", tier: "silver", req: 10, type: "flights_per_month",      points: 100 },
  { code: "BUSY_YEAR",           name: "Busy Year",           desc: "Complete 50 flights in a single year",                  category: "special", icon: "📊", tier: "gold",   req: 50, type: "flights_per_year",       points: 250 },

  // ── SPECIAL — geographic curiosities ──────────────────────────────────
  { code: "EQUATOR_CROSSING",    name: "Equator Crossing",    desc: "Complete a flight crossing the equator",                category: "special", icon: "🌍", tier: "silver", req: 1, type: "equator_crossing",        points: 75 },
  { code: "POLAR_EXPLORER",      name: "Polar Explorer",      desc: "Fly above the Arctic Circle (66.5°N)",                  category: "special", icon: "🧊", tier: "platinum", req: 1, type: "arctic_flight",         points: 200 },
  { code: "MICRO_FLIGHT",        name: "Micro-Flight",        desc: "Complete a flight shorter than 250 km",                 category: "special", icon: "🐜", tier: "bronze", req: 1, type: "micro_flight",            points: 15 },
];

// ---------------------------------------------------------------------------
// Evaluator — given flights + airports + stats, compute progress for each type
// ---------------------------------------------------------------------------

const MI_TO_KM = 1.60934;
const ARCTIC_LAT = 66.5;
// Continents that don't share a landmass with the Americas. Used as a rough
// proxy for "this flight crossed an ocean."
const TRANS_CONTINENTAL_PAIRS = new Set();
function pairKey(a, b) { return [a, b].sort().join("|"); }
for (const A of ["NA", "SA"]) {
  for (const B of ["EU", "AS", "AF", "OC", "AN"]) {
    TRANS_CONTINENTAL_PAIRS.add(pairKey(A, B));
  }
}
// Asia ↔ Oceania (e.g. SIN-SYD) also counts as ocean crossing
TRANS_CONTINENTAL_PAIRS.add(pairKey("AS", "OC"));
TRANS_CONTINENTAL_PAIRS.add(pairKey("EU", "OC"));
TRANS_CONTINENTAL_PAIRS.add(pairKey("AF", "OC"));

export function evaluateAchievements(ctx) {
  const { flights, airports, stats } = ctx;

  // Build a map of requirementType -> current numeric value
  const metrics = {};

  metrics.flights_count = stats.total;
  metrics.distance_km   = stats.miles * MI_TO_KM;
  metrics.flight_hours  = stats.minutes / 60;
  metrics.countries     = stats.countries.size;
  metrics.airlines      = stats.airlines.size;
  metrics.airports      = stats.airportsCount;
  metrics.us_states     = stats.statesCount;

  const continents = new Set();
  for (const code of stats.airports.keys()) {
    const ap = airports[code];
    if (ap && ap.continent) continents.add(ap.continent);
  }
  metrics.continents = continents.size;

  let maxSingle = 0;
  let oceanCrossing = 0;
  let microFlight = 0;
  let equatorCrossing = 0;
  let arcticFlight = 0;
  let nightFlights = 0;
  let earlyMorningFlights = 0;
  let weekendFlights = 0;

  const monthSet = new Set();          // "YYYY-MM"
  const yearSet = new Set();           // "YYYY"
  const flightsByMonth = new Map();
  const flightsByYear = new Map();
  const seasonsByYear = new Map();     // year -> Set of "spring/summer/fall/winter"
  const routesCount = new Map();
  const airlineCount = new Map();

  function getDate(f) {
    const d = new Date(f.depart);
    return isNaN(d) ? null : d;
  }

  for (const f of flights) {
    const km = (f._miles || 0) * MI_TO_KM;
    if (km > maxSingle) maxSingle = km;
    if (km > 0 && km < 250) microFlight = 1;

    const aFrom = airports[f.from];
    const aTo   = airports[f.to];

    // Ocean / continental crossings
    if (aFrom && aTo && aFrom.continent && aTo.continent && aFrom.continent !== aTo.continent) {
      if (TRANS_CONTINENTAL_PAIRS.has(pairKey(aFrom.continent, aTo.continent))) oceanCrossing = 1;
    }
    if (aFrom && aTo && aFrom.lat != null && aTo.lat != null) {
      if (Math.sign(aFrom.lat) !== Math.sign(aTo.lat) && aFrom.lat !== 0 && aTo.lat !== 0) equatorCrossing = 1;
      if (aFrom.lat >= ARCTIC_LAT || aTo.lat >= ARCTIC_LAT) arcticFlight = 1;
    }

    const d = getDate(f);
    if (d) {
      const h = d.getHours();
      if (h >= 0 && h < 6) nightFlights++;
      if (h >= 4 && h < 7) earlyMorningFlights++;
      const dow = d.getDay();
      if (dow === 0 || dow === 6) weekendFlights++;
      const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      monthSet.add(ym);
      yearSet.add(String(d.getFullYear()));
      flightsByMonth.set(ym, (flightsByMonth.get(ym) || 0) + 1);
      flightsByYear.set(d.getFullYear(), (flightsByYear.get(d.getFullYear()) || 0) + 1);
      // Season by month (northern hemisphere)
      const m = d.getMonth();
      const season = m < 2 || m === 11 ? "winter"
                    : m < 5  ? "spring"
                    : m < 8  ? "summer"
                    : "fall";
      const y = d.getFullYear();
      if (!seasonsByYear.has(y)) seasonsByYear.set(y, new Set());
      seasonsByYear.get(y).add(season);
    }

    if (f.from && f.to) {
      const key = `${f.from}-${f.to}`;
      routesCount.set(key, (routesCount.get(key) || 0) + 1);
    }
    if (f.airline_code) airlineCount.set(f.airline_code, (airlineCount.get(f.airline_code) || 0) + 1);
  }

  metrics.single_flight_distance = maxSingle;
  metrics.ocean_crossing         = oceanCrossing;
  metrics.equator_crossing       = equatorCrossing;
  metrics.arctic_flight          = arcticFlight;
  metrics.micro_flight           = microFlight;
  metrics.night_flights          = nightFlights;
  metrics.early_morning_flights  = earlyMorningFlights;
  metrics.weekend_flights        = weekendFlights;
  metrics.flights_per_month      = Math.max(0, ...flightsByMonth.values());
  metrics.flights_per_year       = Math.max(0, ...flightsByYear.values());
  metrics.same_route             = Math.max(0, ...routesCount.values());
  metrics.airline_loyalty        = Math.max(0, ...airlineCount.values());
  metrics.all_seasons            = Math.max(0, ...[...seasonsByYear.values()].map(s => s.size));

  // Consecutive months: longest streak in monthSet
  metrics.consecutive_months = longestConsecutiveMonths(monthSet);

  // Decorate each definition with its progress
  const results = ACHIEVEMENTS.map(a => {
    const current = metrics[a.type] ?? 0;
    const ratio = Math.max(0, Math.min(1, a.req > 0 ? current / a.req : 0));
    return {
      ...a,
      current,
      ratio,
      unlocked: current >= a.req,
    };
  });

  const unlocked = results.filter(r => r.unlocked);
  const totalPoints = unlocked.reduce((s, r) => s + r.points, 0);
  const maxPoints   = results.reduce((s, r) => s + r.points, 0);

  return {
    results,
    unlockedCount: unlocked.length,
    totalCount: results.length,
    totalPoints,
    maxPoints,
    metrics,
  };
}

function longestConsecutiveMonths(monthSet) {
  if (!monthSet.size) return 0;
  const sorted = [...monthSet].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (nextMonth(sorted[i-1]) === sorted[i]) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}
function nextMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);  // m is 1-based, Date months are 0-based, so +1 here
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const CATEGORY_ORDER = ["collector", "distance", "elite", "explorer", "special"];
const CATEGORY_LABELS = {
  collector: "Collector",
  distance:  "Distance",
  elite:     "Elite",
  explorer:  "Explorer",
  special:   "Special",
};
const TIERS = ["bronze", "silver", "gold", "platinum", "diamond"];

function formatProgress(a) {
  if (a.unlocked) return `${a.req.toLocaleString()} / ${a.req.toLocaleString()}`;
  return `${Math.floor(a.current).toLocaleString()} / ${a.req.toLocaleString()}`;
}

export function renderAchievementsView(root, ctx) {
  const data = evaluateAchievements(ctx);
  const pct = Math.round((data.unlockedCount / data.totalCount) * 100);

  root.innerHTML = `
    <div class="view-inner ach-view">
      <header class="view-header">
        <h1>Achievements</h1>
        <p class="muted">${data.unlockedCount} of ${data.totalCount} unlocked · inspired by <a href="https://github.com/Abrechen2/TravStats" rel="noopener">TravStats</a></p>
      </header>

      <div class="ach-summary">
        <div class="ach-summary-cell">
          <div class="lbl">Total Points</div>
          <div class="num">${data.totalPoints.toLocaleString()}<span class="den"> / ${data.maxPoints.toLocaleString()}</span></div>
        </div>
        <div class="ach-summary-cell">
          <div class="lbl">Unlocked</div>
          <div class="num">${data.unlockedCount}<span class="den"> / ${data.totalCount}</span></div>
        </div>
        <div class="ach-summary-cell">
          <div class="lbl">Progress</div>
          <div class="num"><span style="color:var(--accent)">${pct}%</span></div>
          <div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>

      <div class="ach-filters">
        <label>
          <span>Category</span>
          <select id="ach-cat">
            <option value="all">All</option>
            ${CATEGORY_ORDER.map(c => `<option value="${c}">${CATEGORY_LABELS[c]}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Tier</span>
          <select id="ach-tier">
            <option value="all">All</option>
            ${TIERS.map(t => `<option value="${t}">${t[0].toUpperCase()+t.slice(1)}</option>`).join("")}
          </select>
        </label>
        <label class="toggle">
          <input type="checkbox" id="ach-unlocked-only" />
          <span>Show unlocked only</span>
        </label>
      </div>

      <div id="ach-categories">
        ${CATEGORY_ORDER.map(cat => renderCategory(cat, data.results.filter(r => r.category === cat))).join("")}
      </div>
    </div>`;

  // Filter logic
  const catEl   = root.querySelector("#ach-cat");
  const tierEl  = root.querySelector("#ach-tier");
  const unlEl   = root.querySelector("#ach-unlocked-only");
  function applyFilters() {
    const cat  = catEl.value;
    const tier = tierEl.value;
    const unlockedOnly = unlEl.checked;
    for (const card of root.querySelectorAll(".ach-card")) {
      const c = card.dataset.cat;
      const t = card.dataset.tier;
      const u = card.dataset.unlocked === "1";
      let show = true;
      if (cat !== "all" && c !== cat) show = false;
      if (tier !== "all" && t !== tier) show = false;
      if (unlockedOnly && !u) show = false;
      card.style.display = show ? "" : "none";
    }
    // Hide sections that have no visible cards
    for (const sec of root.querySelectorAll(".ach-section")) {
      const anyVisible = [...sec.querySelectorAll(".ach-card")].some(c => c.style.display !== "none");
      sec.style.display = anyVisible ? "" : "none";
    }
  }
  catEl.addEventListener("change", applyFilters);
  tierEl.addEventListener("change", applyFilters);
  unlEl.addEventListener("change", applyFilters);

  // Stash the evaluated results so the click handler can look them up by code.
  root.querySelector("#ach-categories").addEventListener("click", (e) => {
    const card = e.target.closest(".ach-card[data-code]");
    if (!card) return;
    const code = card.dataset.code;
    const ach = data.results.find(a => a.code === code);
    if (ach) openAchievementModal(ach, ctx);
  });
  root.querySelector("#ach-categories").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".ach-card[data-code]");
    if (!card) return;
    e.preventDefault();
    const ach = data.results.find(a => a.code === card.dataset.code);
    if (ach) openAchievementModal(ach, ctx);
  });
}

// ---------------------------------------------------------------------------
// Per-achievement detail builder — explains how a given achievement was
// earned, lists contributing items where applicable, or shows what's left.
// ---------------------------------------------------------------------------

function findUnlockingFlight(ach, ctx) {
  // For COUNT-based achievements (flights_count, distance_km, flight_hours,
  // night_flights, weekend_flights, same_route_count, etc.) we can pinpoint
  // the flight that crossed the threshold by walking flights chronologically
  // and tracking the relevant metric.
  const KM = 1.60934;
  const flights = [...ctx.flights].sort((a, b) => (a.depart || "").localeCompare(b.depart || ""));
  let acc = 0;
  const routes = new Map();
  const airlines = new Map();
  for (const f of flights) {
    const d = new Date(f.depart);
    const km = (f._miles || 0) * KM;
    let increment = 0;
    if (ach.type === "flights_count") increment = 1;
    else if (ach.type === "distance_km") increment = km;
    else if (ach.type === "flight_hours") increment = (f._minutes || 0) / 60;
    else if (ach.type === "night_flights") {
      if (!isNaN(d) && d.getHours() < 6) increment = 1;
    } else if (ach.type === "early_morning_flights") {
      if (!isNaN(d) && d.getHours() >= 4 && d.getHours() < 7) increment = 1;
    } else if (ach.type === "weekend_flights") {
      const dow = isNaN(d) ? -1 : d.getDay();
      if (dow === 0 || dow === 6) increment = 1;
    } else if (ach.type === "same_route") {
      const key = `${f.from}-${f.to}`;
      routes.set(key, (routes.get(key) || 0) + 1);
      if (routes.get(key) === ach.req) return f;
      continue;
    } else if (ach.type === "airline_loyalty") {
      if (f.airline_code) {
        airlines.set(f.airline_code, (airlines.get(f.airline_code) || 0) + 1);
        if (airlines.get(f.airline_code) === ach.req) return f;
      }
      continue;
    } else if (ach.type === "single_flight_distance") {
      if (km >= ach.req) return f;
      continue;
    } else if (ach.type === "micro_flight") {
      if (km > 0 && km < ach.req * 1000) return f;
      continue;
    }
    acc += increment;
    if (acc >= ach.req) return f;
  }
  return null;
}

function listContributingItems(ach, ctx, limit = 30) {
  // For SET-based achievements (countries, airlines, airports, continents,
  // us_states), list the actual items in the set.
  const s = ctx.stats;
  if (ach.type === "countries") {
    return [...s.countries.entries()]
      .map(([code, info]) => `${info.flag || ""} ${info.name || code} <span class="muted small">${info.count} stops</span>`)
      .slice(0, limit);
  }
  if (ach.type === "us_states") {
    return [...s.states.entries()]
      .sort((a,b) => b[1].count - a[1].count)
      .map(([code, info]) => `<code>${code}</code> <span class="muted small">${info.count} stops</span>`)
      .slice(0, limit);
  }
  if (ach.type === "airlines") {
    return [...s.airlines.entries()]
      .sort((a,b) => b[1].count - a[1].count)
      .map(([code, info]) => `<code>${code}</code> ${info.name ? escapeHtml(info.name) : ""} <span class="muted small">${info.count} flights</span>`)
      .slice(0, limit);
  }
  if (ach.type === "airports") {
    return [...s.airports.entries()]
      .sort((a,b) => b[1] - a[1])
      .slice(0, limit)
      .map(([code, n]) => `<code>${code}</code> <span class="muted small">${n} visits</span>`);
  }
  if (ach.type === "continents") {
    const cs = new Set();
    for (const code of s.airports.keys()) {
      const ap = ctx.airports[code];
      if (ap?.continent) cs.add(ap.continent);
    }
    return [...cs].map(c => `<code>${c}</code>`);
  }
  return [];
}

function describeRequirement(ach) {
  // A "what unlocks this" sentence based on requirement type.
  switch (ach.type) {
    case "flights_count":          return `${ach.req} total flights`;
    case "distance_km":            return `${ach.req.toLocaleString()} km flown across all flights`;
    case "flight_hours":           return `${ach.req} hours of flight time`;
    case "countries":              return `Visit airports in ${ach.req} different countries`;
    case "us_states":              return `Visit airports in ${ach.req} different US states`;
    case "airlines":               return `Fly with ${ach.req} different airlines`;
    case "airports":               return `Visit ${ach.req} different airports`;
    case "continents":             return `Touch ${ach.req} of the 7 continents`;
    case "single_flight_distance": return `One flight of ${ach.req.toLocaleString()} km or more`;
    case "airline_loyalty":        return `${ach.req} flights with the same carrier`;
    case "night_flights":          return `${ach.req} flights departing midnight–6 AM`;
    case "early_morning_flights":  return `${ach.req} flights departing 4–7 AM`;
    case "weekend_flights":        return `${ach.req} flights on Saturdays or Sundays`;
    case "consecutive_months":     return `At least one flight every month for ${ach.req} consecutive months`;
    case "flights_per_month":      return `${ach.req} flights in a single calendar month`;
    case "flights_per_year":       return `${ach.req} flights in a single year`;
    case "same_route":             return `Fly the same exact route ${ach.req} times`;
    case "all_seasons":            return `Fly in all 4 seasons within a single year`;
    case "ocean_crossing":         return `A flight crossing an ocean`;
    case "equator_crossing":       return `A flight crossing the equator`;
    case "arctic_flight":          return `A flight above the Arctic Circle (66.5°N)`;
    case "micro_flight":           return `A flight shorter than 250 km`;
    default:                       return ach.desc;
  }
}

function progressLineFor(ach) {
  if (ach.unlocked) {
    return `<div class="ach-detail-progress unlocked">✓ Unlocked at ${formatNumber(ach.current)} / ${formatNumber(ach.req)}</div>`;
  }
  const remaining = Math.max(0, ach.req - ach.current);
  let remainingStr;
  if (ach.type === "distance_km") {
    remainingStr = `${Math.round(remaining).toLocaleString()} km`;
  } else if (ach.type === "flight_hours") {
    remainingStr = `${remaining.toFixed(1)} hours`;
  } else {
    remainingStr = `${Math.round(remaining).toLocaleString()}`;
  }
  return `
    <div class="ach-detail-progress">
      <div class="ach-detail-bar"><div class="ach-detail-bar-fill" style="width:${ach.ratio*100}%"></div></div>
      <div class="ach-detail-numbers">
        <strong>${formatNumber(ach.current)}</strong> of <strong>${formatNumber(ach.req)}</strong>
        · <span class="muted">${remainingStr} to go</span>
      </div>
    </div>`;
}

function openAchievementModal(ach, ctx) {
  const unlockingFlight = ach.unlocked ? findUnlockingFlight(ach, ctx) : null;
  const items = listContributingItems(ach, ctx, 60);

  const earnedSection = (() => {
    if (!ach.unlocked) return "";
    if (unlockingFlight) {
      return `
        <div class="ach-earned">
          <div class="lbl">Unlocked by this flight</div>
          <div class="earned-flight">
            <span class="route">${unlockingFlight.from} → ${unlockingFlight.to}</span>
            <span class="muted">${formatDate(unlockingFlight.depart)} · ${escapeHtml([unlockingFlight.airline_code, unlockingFlight.flight_number].filter(Boolean).join(" "))}</span>
          </div>
        </div>`;
    }
    return `<div class="ach-earned"><div class="lbl">Status</div><div>Unlocked</div></div>`;
  })();

  const stillNeeded = !ach.unlocked
    ? `<div class="ach-needs">
        <div class="lbl">How to unlock</div>
        <div>${describeRequirement(ach)}</div>
      </div>`
    : "";

  const itemsSection = items.length
    ? `<div class="ach-items">
        <div class="lbl">${ach.unlocked ? "Counted toward this" : "What you've contributed so far"} <span class="muted">(${items.length}${items.length >= 60 ? "+" : ""})</span></div>
        <div class="ach-items-list">
          ${items.map(it => `<div class="ach-item">${it}</div>`).join("")}
        </div>
      </div>`
    : "";

  openDetailModal(`
    <header class="ach-detail-head">
      <div class="ach-detail-icon tier-${ach.tier}">${ach.icon}</div>
      <div>
        <div class="ach-detail-cat">${ach.category} · ${ach.tier.toUpperCase()} · +${ach.points} pts</div>
        <h2 id="detail-modal-title" class="ach-detail-name">${escapeHtml(ach.name)}</h2>
        <div class="ach-detail-desc">${escapeHtml(ach.desc)}</div>
      </div>
    </header>

    ${progressLineFor(ach)}
    ${earnedSection}
    ${stillNeeded}
    ${itemsSection}
  `);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function renderCategory(cat, items) {
  if (!items.length) return "";
  // Sort: unlocked first (by tier asc), then locked by ratio desc
  items.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked) return TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier);
    return b.ratio - a.ratio;
  });
  return `
    <section class="ach-section" data-cat="${cat}">
      <h2 class="ach-section-title">${CATEGORY_LABELS[cat]}</h2>
      <div class="ach-grid">
        ${items.map(renderCard).join("")}
      </div>
    </section>`;
}

function renderCard(a) {
  const tierLabel = a.tier.toUpperCase();
  const progressPct = Math.round(a.ratio * 100);
  return `
    <article class="ach-card tier-${a.tier} ${a.unlocked ? "is-unlocked" : "is-locked"}"
             data-code="${a.code}" data-cat="${a.category}" data-tier="${a.tier}" data-unlocked="${a.unlocked ? "1" : "0"}"
             role="button" tabindex="0" title="Click for details">
      <div class="ach-card-head">
        <div class="ach-icon">${a.icon}</div>
        <div class="ach-meta">
          <div class="ach-name">${a.name}</div>
          <div class="ach-tier">${tierLabel}</div>
        </div>
        <div class="ach-points">+${a.points}</div>
      </div>
      <div class="ach-desc">${a.desc}</div>
      <div class="ach-bar"><div class="ach-bar-fill" style="width:${progressPct}%"></div></div>
      <div class="ach-progress">
        ${a.unlocked ? "✓ Unlocked" : `Progress: ${formatProgress(a)}`}
      </div>
    </article>`;
}
