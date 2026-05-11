// stats.js — derive all stats from raw flights[] + airports{}.
//
// Input flight shape (from fetch_tripit.py):
//   { from, from_city, to, to_city, depart, arrive, airline, airline_code,
//     flight_number, miles, duration, ... }

const EARTH_CIRC_MI = 24901;
const MOON_DIST_MI  = 238900;
const SUN_DIST_MI   = 92955807;

function haversineMiles(a, b) {
  if (!a || !b) return null;
  const R = 3958.7613;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function parseDurationToMinutes(s) {
  if (!s) return 0;
  // "3h, 25m" or "3h 25m" or "45m" or "2 hours 15 minutes"
  const m = String(s).match(/(\d+)\s*h.*?(\d+)?\s*m?/i);
  if (m) {
    const h = parseInt(m[1] || 0, 10);
    const mins = parseInt(m[2] || 0, 10);
    if (h || mins) return h * 60 + mins;
  }
  const mOnly = String(s).match(/^\s*(\d+)\s*m/i);
  if (mOnly) return parseInt(mOnly[1], 10);
  return 0;
}

function inc(map, key, by=1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + by);
}

function topN(map, n) {
  return [...map.entries()]
    .sort((a,b) => b[1] - a[1])
    .slice(0, n)
    .map(([k,v]) => ({ key: k, value: v }));
}

const LONG_HAUL_MI = 2400;       // Flighty's rough cutoff: ~6h+ international
const INTL_COUNTRY_HOME = "US";  // Matt is US-based

export function computeStats(ctx) {
  const { flights, airports } = ctx;

  const out = {
    total: flights.length,
    domestic: 0,
    international: 0,
    longHaul: 0,
    miles: 0,
    minutes: 0,
    shortest: null,
    longest: null,
    shortestTime: null,
    longestTime: null,
    avgMiles: 0,
    avgMinutes: 0,
    routes: new Map(),     // "FROM-TO" -> count
    routesUnordered: new Map(), // sorted pair "AAA|BBB" -> count
    airports: new Map(),   // code -> count
    airlines: new Map(),   // code or name -> { count, miles }
    countries: new Map(),  // country code -> { count, miles, name }
    states: new Map(),     // US state -> { count }
    weekday: [0,0,0,0,0,0,0],
    yearly: new Map(),
    monthly: new Map(),
    firstFlight: null,
    lastFlight: null,
  };

  for (const f of flights) {
    const aFrom = airports[f.from];
    const aTo   = airports[f.to];

    // Distance fallback
    let miles = +f.miles || 0;
    if (!miles && aFrom && aTo) miles = haversineMiles(aFrom, aTo) || 0;
    f._miles = miles;

    // Time
    let minutes = parseDurationToMinutes(f.duration);
    if (!minutes && f.depart && f.arrive) {
      const t = (new Date(f.arrive) - new Date(f.depart)) / 60000;
      if (t > 0 && t < 24 * 60) minutes = t;
    }
    f._minutes = minutes || 0;

    out.miles   += miles;
    out.minutes += minutes;

    // Domestic / international / long haul
    const cFrom = aFrom?.country, cTo = aTo?.country;
    const isIntl = (cFrom && cTo && cFrom !== cTo) ||
                   (cFrom && cFrom !== INTL_COUNTRY_HOME) ||
                   (cTo && cTo !== INTL_COUNTRY_HOME);
    if (isIntl) out.international++; else out.domestic++;
    if (miles >= LONG_HAUL_MI) out.longHaul++;

    // Extremes
    if (miles > 0) {
      if (!out.shortest || miles < out.shortest._miles) out.shortest = f;
      if (!out.longest  || miles > out.longest._miles)  out.longest  = f;
    }
    if (minutes > 0) {
      if (!out.shortestTime || minutes < out.shortestTime._minutes) out.shortestTime = f;
      if (!out.longestTime  || minutes > out.longestTime._minutes)  out.longestTime  = f;
    }

    // Routes
    const dir = `${f.from}-${f.to}`;
    inc(out.routes, dir);
    const pair = [f.from, f.to].sort().join("|");
    inc(out.routesUnordered, pair);

    // Airports
    inc(out.airports, f.from);
    inc(out.airports, f.to);

    // Airlines
    const aKey = f.airline_code || f.airline;
    if (aKey) {
      const cur = out.airlines.get(aKey) || { count: 0, miles: 0, name: f.airline };
      cur.count++; cur.miles += miles;
      out.airlines.set(aKey, cur);
    }

    // Countries
    for (const ap of [aFrom, aTo]) {
      if (!ap || !ap.country) continue;
      const cur = out.countries.get(ap.country) || { count: 0, miles: 0, name: ap.country_name || ap.country, flag: ap.flag };
      cur.count++; cur.miles += miles / 2;
      out.countries.set(ap.country, cur);
    }

    // US states
    for (const ap of [aFrom, aTo]) {
      if (!ap || ap.country !== "US" || !ap.state) continue;
      const cur = out.states.get(ap.state) || { count: 0 };
      cur.count++;
      out.states.set(ap.state, cur);
    }

    // Time series
    if (f.depart) {
      const d = new Date(f.depart);
      if (!isNaN(d)) {
        out.weekday[d.getDay()]++;
        const y = d.getFullYear();
        inc(out.yearly, y);
        const ym = `${y}-${String(d.getMonth()+1).padStart(2,"0")}`;
        inc(out.monthly, ym);
        if (!out.firstFlight || d < out.firstFlight) out.firstFlight = d;
        if (!out.lastFlight  || d > out.lastFlight)  out.lastFlight  = d;
      }
    }
  }

  out.avgMiles   = out.total ? out.miles   / out.total : 0;
  out.avgMinutes = out.total ? out.minutes / out.total : 0;

  out.topAirports = topN(out.airports, 10);
  out.topAirlines = topN(new Map([...out.airlines.entries()].map(([k,v]) => [k, v.count])), 10)
    .map(r => ({ ...r, info: out.airlines.get(r.key) }));
  out.topRoutes   = topN(out.routes, 12);

  out.countriesCount = out.countries.size;
  out.statesCount    = out.states.size;
  out.airportsCount  = out.airports.size;

  // Around-the-Earth-style factoids
  out.earthLaps = out.miles / EARTH_CIRC_MI;
  out.moonTrips = out.miles / MOON_DIST_MI;
  out.sunLaps   = out.miles / SUN_DIST_MI;

  // Country -> flights list (for stamp pages)
  out.flightsByCountry = new Map();
  for (const f of flights) {
    const aTo = airports[f.to];
    if (!aTo || !aTo.country) continue;
    if (!out.flightsByCountry.has(aTo.country)) out.flightsByCountry.set(aTo.country, []);
    out.flightsByCountry.get(aTo.country).push(f);
  }
  // Sort each country's flights by date asc, dedupe airports visited per country
  for (const list of out.flightsByCountry.values()) {
    list.sort((a,b) => (a.depart||"").localeCompare(b.depart||""));
  }

  return out;
}

// Helpers exported for pages.js
export function formatNumber(n) {
  return Math.round(n).toLocaleString();
}
export function formatMiles(n) {
  return `${Math.round(n).toLocaleString()} mi`;
}
export function formatHours(m) {
  if (!m) return "0h 0m";
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return `${h.toLocaleString()}h ${mins}m`;
}
export function formatDuration(m) {
  if (!m) return "—";
  const days = Math.floor(m / (60 * 24));
  const h = Math.floor((m % (60 * 24)) / 60);
  const mins = Math.round(m % 60);
  if (days > 0) return `${days}d ${h}h ${mins}m`;
  return `${h}h ${mins}m`;
}
export function formatDate(d, opts = {}) {
  if (!d) return "—";
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", ...opts });
}
