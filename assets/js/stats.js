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

const LONG_HAUL_MI = 2400;
const INTL_COUNTRY_HOME = "US";

// Region buckets used for the Countries & Territories breakdown.
// Following Flighty / IATA-style region splits (Central America and the
// Caribbean broken out from N. America; Middle East split off from Asia).
export const COUNTRY_REGION_MAP = {
  // N. America (Anglo-American)
  US:"N. America", CA:"N. America", MX:"N. America", BM:"N. America", GL:"N. America", PM:"N. America",
  // C. America
  BZ:"C. America", CR:"C. America", SV:"C. America", GT:"C. America", HN:"C. America", NI:"C. America", PA:"C. America",
  // Caribbean
  AG:"Caribbean", BS:"Caribbean", BB:"Caribbean", CU:"Caribbean", DM:"Caribbean", DO:"Caribbean", GD:"Caribbean",
  HT:"Caribbean", JM:"Caribbean", KN:"Caribbean", LC:"Caribbean", VC:"Caribbean", TT:"Caribbean", AI:"Caribbean",
  AW:"Caribbean", BL:"Caribbean", BQ:"Caribbean", CW:"Caribbean", GP:"Caribbean", KY:"Caribbean", MF:"Caribbean",
  MQ:"Caribbean", MS:"Caribbean", PR:"Caribbean", SX:"Caribbean", TC:"Caribbean", VG:"Caribbean", VI:"Caribbean",
  // S. America
  AR:"S. America", BO:"S. America", BR:"S. America", CL:"S. America", CO:"S. America", EC:"S. America",
  FK:"S. America", GF:"S. America", GY:"S. America", PE:"S. America", PY:"S. America", SR:"S. America",
  UY:"S. America", VE:"S. America",
  // Europe (incl. Russia, Turkey, Caucasus per IATA)
  AD:"Europe", AL:"Europe", AT:"Europe", BA:"Europe", BE:"Europe", BG:"Europe", BY:"Europe", CH:"Europe",
  CY:"Europe", CZ:"Europe", DE:"Europe", DK:"Europe", EE:"Europe", ES:"Europe", FI:"Europe", FO:"Europe",
  FR:"Europe", GB:"Europe", GG:"Europe", GI:"Europe", GR:"Europe", HR:"Europe", HU:"Europe", IE:"Europe",
  IM:"Europe", IS:"Europe", IT:"Europe", JE:"Europe", LI:"Europe", LT:"Europe", LU:"Europe", LV:"Europe",
  MC:"Europe", MD:"Europe", ME:"Europe", MK:"Europe", MT:"Europe", NL:"Europe", NO:"Europe", PL:"Europe",
  PT:"Europe", RO:"Europe", RS:"Europe", RU:"Europe", SE:"Europe", SI:"Europe", SK:"Europe", SM:"Europe",
  TR:"Europe", UA:"Europe", VA:"Europe", XK:"Europe",
  // Middle East
  AE:"Middle East", AM:"Middle East", AZ:"Middle East", BH:"Middle East", GE:"Middle East", IL:"Middle East",
  IQ:"Middle East", IR:"Middle East", JO:"Middle East", KW:"Middle East", LB:"Middle East", OM:"Middle East",
  PS:"Middle East", QA:"Middle East", SA:"Middle East", SY:"Middle East", YE:"Middle East",
  // Asia
  AF:"Asia", BD:"Asia", BN:"Asia", BT:"Asia", CN:"Asia", HK:"Asia", ID:"Asia", IN:"Asia", JP:"Asia",
  KG:"Asia", KH:"Asia", KP:"Asia", KR:"Asia", KZ:"Asia", LA:"Asia", LK:"Asia", MM:"Asia", MN:"Asia",
  MO:"Asia", MV:"Asia", MY:"Asia", NP:"Asia", PH:"Asia", PK:"Asia", SG:"Asia", TH:"Asia", TJ:"Asia",
  TL:"Asia", TM:"Asia", TW:"Asia", UZ:"Asia", VN:"Asia",
  // Africa
  AO:"Africa", BF:"Africa", BI:"Africa", BJ:"Africa", BW:"Africa", CD:"Africa", CF:"Africa", CG:"Africa",
  CI:"Africa", CM:"Africa", CV:"Africa", DJ:"Africa", DZ:"Africa", EG:"Africa", EH:"Africa", ER:"Africa",
  ET:"Africa", GA:"Africa", GH:"Africa", GM:"Africa", GN:"Africa", GQ:"Africa", GW:"Africa", KE:"Africa",
  KM:"Africa", LR:"Africa", LS:"Africa", LY:"Africa", MA:"Africa", MG:"Africa", ML:"Africa", MR:"Africa",
  MU:"Africa", MW:"Africa", MZ:"Africa", NA:"Africa", NE:"Africa", NG:"Africa", RE:"Africa", RW:"Africa",
  SC:"Africa", SD:"Africa", SL:"Africa", SN:"Africa", SO:"Africa", SS:"Africa", ST:"Africa", SZ:"Africa",
  TD:"Africa", TG:"Africa", TN:"Africa", TZ:"Africa", UG:"Africa", YT:"Africa", ZA:"Africa", ZM:"Africa", ZW:"Africa",
  // Oceania
  AU:"Oceania", CK:"Oceania", FJ:"Oceania", FM:"Oceania", GU:"Oceania", KI:"Oceania", MH:"Oceania",
  MP:"Oceania", NC:"Oceania", NF:"Oceania", NR:"Oceania", NU:"Oceania", NZ:"Oceania", PF:"Oceania",
  PG:"Oceania", PN:"Oceania", PW:"Oceania", SB:"Oceania", TK:"Oceania", TO:"Oceania", TV:"Oceania",
  VU:"Oceania", WF:"Oceania", WS:"Oceania", AS:"Oceania",
};

// Total UN-recognized countries / territories per region (for "X of Y" %)
export const REGION_TOTALS = {
  "N. America": 6,
  "C. America": 7,
  "Caribbean":  28,
  "S. America": 14,
  "Europe":     51,
  "Middle East":17,
  "Asia":       32,
  "Africa":     54,
  "Oceania":    25,
};

export const REGION_DISPLAY_ORDER = [
  "Europe", "Asia", "N. America",
  "Caribbean", "Middle East", "S. America",
  "Oceania", "Africa", "C. America",
];

// Curated "Top 50 Major Hubs" — used for the Airport Explorer percentage stat.
// Mix of the world's busiest airports by international + total passenger traffic.
const TOP_HUBS = [
  "ATL","DFW","DEN","ORD","LAX","JFK","LAS","MIA","CLT","MCO","SEA","PHX","EWR","SFO","IAH","BOS",
  "MSP","FLL","LGA","DTW","BWI","PHL","SAN","TPA","DCA","HNL","AUS","SLC","MDW","SJC","DAL","IAD",
  "LHR","CDG","AMS","FRA","IST","MAD","BCN","FCO","MUC","ZRH","CPH","ARN","VIE","ATH","LIS","DUB",
  "HND","NRT","ICN","PEK","PVG","HKG","TPE","SIN","BKK","KUL","DEL","BOM","DXB","DOH","AUH","TLV",
  "SYD","MEL","AKL","BNE",
  "YYZ","YVR","YUL","MEX","CUN","GRU","GIG","EZE","SCL",
  "JNB","CAI","ADD","NBO","CPT",
];

// Common IATA aircraft codes → readable names
const AIRCRAFT_NAMES = {
  "734":"Boeing 737-400","735":"Boeing 737-500","736":"Boeing 737-600","737":"Boeing 737",
  "738":"Boeing 737-800","739":"Boeing 737-900",
  "73G":"Boeing 737-700","73H":"Boeing 737-800","73W":"Boeing 737-700 (winglets)",
  "7M7":"Boeing 737 MAX 7","7M8":"Boeing 737 MAX 8","7M9":"Boeing 737 MAX 9","7M0":"Boeing 737 MAX 10",
  "319":"Airbus A319","320":"Airbus A320","321":"Airbus A321",
  "31J":"Airbus A319neo","32N":"Airbus A320neo","32Q":"Airbus A321neo","32A":"Airbus A320",
  "318":"Airbus A318",
  "330":"Airbus A330","332":"Airbus A330-200","333":"Airbus A330-300",
  "339":"Airbus A330-900neo","338":"Airbus A330-800neo",
  "340":"Airbus A340","342":"Airbus A340-200","343":"Airbus A340-300","345":"Airbus A340-500","346":"Airbus A340-600",
  "350":"Airbus A350","351":"Airbus A350-1000","359":"Airbus A350-900",
  "380":"Airbus A380",
  "747":"Boeing 747","744":"Boeing 747-400","748":"Boeing 747-8",
  "757":"Boeing 757","752":"Boeing 757-200","753":"Boeing 757-300",
  "767":"Boeing 767","762":"Boeing 767-200","763":"Boeing 767-300","764":"Boeing 767-400",
  "777":"Boeing 777","772":"Boeing 777-200","77L":"Boeing 777-200LR","773":"Boeing 777-300","77W":"Boeing 777-300ER",
  "787":"Boeing 787","788":"Boeing 787-8","789":"Boeing 787-9","78J":"Boeing 787-10",
  "E70":"Embraer E170","E75":"Embraer E175","E90":"Embraer E190","E95":"Embraer E195",
  "E7W":"Embraer E175","E55":"Embraer ERJ-145",
  "CR2":"Bombardier CRJ-200","CR7":"Bombardier CRJ-700","CR9":"Bombardier CRJ-900","CRA":"Bombardier CRJ-1000",
  "DH4":"Bombardier Dash 8 Q400","DH3":"Bombardier Dash 8 Q300","DH1":"Bombardier Dash 8",
  "AT4":"ATR 42","AT5":"ATR 42-500","AT7":"ATR 72","AT8":"ATR 72-600",
  "SF3":"Saab 340","S20":"Saab 2000",
  "AT4":"ATR 42","M88":"McDonnell Douglas MD-88","M90":"McDonnell Douglas MD-90","M80":"McDonnell Douglas MD-80",
  "BCS1":"Airbus A220-100","BCS3":"Airbus A220-300","223":"Airbus A220-100","221":"Airbus A220-100","220":"Airbus A220","221":"Airbus A220-100","223":"Airbus A220-300",
};
export function aircraftName(code) {
  if (!code) return "Unknown";
  return AIRCRAFT_NAMES[code] || code;
}
// Aircraft family grouping for a high-level chart
export function aircraftFamily(code) {
  if (!code) return "Unknown";
  if (/^73|^7M/.test(code)) return "Boeing 737";
  if (/^74/.test(code))     return "Boeing 747";
  if (/^75/.test(code))     return "Boeing 757";
  if (/^76/.test(code))     return "Boeing 767";
  if (/^77/.test(code))     return "Boeing 777";
  if (/^78/.test(code))     return "Boeing 787";
  if (/^31|^32/.test(code)) return "Airbus A320 family";
  if (/^33/.test(code))     return "Airbus A330";
  if (/^34/.test(code))     return "Airbus A340";
  if (/^35/.test(code))     return "Airbus A350";
  if (/^38/.test(code))     return "Airbus A380";
  if (/^22|^BCS/.test(code))return "Airbus A220";
  if (/^E/.test(code))      return "Embraer E-Jet";
  if (/^CR/.test(code))     return "Bombardier CRJ";
  if (/^DH/.test(code))     return "Dash 8";
  if (/^AT/.test(code))     return "ATR";
  if (/^SF|^S20/.test(code))return "Saab";
  if (/^M8|^M9/.test(code)) return "MD-80 family";
  return code;
}

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

  // ── Region breakdown ──────────────────────────────────────────────────
  // Bucket each visited country into a region, count flights+countries per
  // region, plus the % of the world's countries in that region you've hit.
  const regionStats = new Map();
  for (const r of Object.keys(REGION_TOTALS)) {
    regionStats.set(r, { name: r, countries: new Set(), flights: 0, total: REGION_TOTALS[r] });
  }
  for (const [code, info] of out.countries) {
    const region = COUNTRY_REGION_MAP[code];
    if (!region) continue;
    const bucket = regionStats.get(region);
    bucket.countries.add(code);
    bucket.flights += info.count;
  }
  out.regionStats = [...regionStats.values()].map(r => ({
    name: r.name,
    count: r.countries.size,
    total: r.total,
    flights: r.flights,
    pct: r.total ? Math.round((r.countries.size / r.total) * 100) : 0,
  }));

  // ── Flight-time unit conversions ──────────────────────────────────────
  const totalMinutes = out.minutes;
  out.timeBreakdown = {
    totalMinutes,
    totalHours: totalMinutes / 60,
    days:      totalMinutes / (60 * 24),
    weeks:     totalMinutes / (60 * 24 * 7),
    months:    totalMinutes / (60 * 24 * 30.44),
    years:     totalMinutes / (60 * 24 * 365.25),
    avgPerLeg: out.avgMinutes,
    // ICAO's typical taxi block is ~12–15 min per flight on each end.
    // Use 30 min per leg as a conservative all-in estimate.
    taxiMinutes:   30 * out.total,
    inAirMinutes:  Math.max(0, totalMinutes - 30 * out.total),
  };

  // ── Velocity (avg ground speed across all flights) ────────────────────
  out.avgSpeedMph = out.minutes ? (out.miles / (out.minutes / 60)) : 0;

  // ── Aircraft types ────────────────────────────────────────────────────
  const aircraftCount = new Map();
  for (const f of flights) {
    const code = f.aircraft;
    if (!code) continue;
    inc(aircraftCount, code);
  }
  out.aircraft = aircraftCount;
  out.topAircraft = topN(aircraftCount, 12);

  // ── Specific tail-number tracking (AeroDataBox enrichment only) ────────
  const tailCount = new Map();
  const tailModel = new Map();
  const tailAirline = new Map();   // tail -> first-seen IATA airline_code
  for (const f of flights) {
    if (!f.tail_number) continue;
    inc(tailCount, f.tail_number);
    if (f.aircraft_model) tailModel.set(f.tail_number, f.aircraft_model);
    if (f.airline_code && !tailAirline.has(f.tail_number)) {
      tailAirline.set(f.tail_number, f.airline_code);
    }
  }
  out.tails = tailCount;
  out.tailModels = tailModel;
  out.tailAirlines = tailAirline;
  out.topTails = topN(tailCount, 8);
  out.uniqueTails = tailCount.size;
  out.enrichedFlights = flights.filter(f => f.tail_number).length;

  // ── Service class breakdown ───────────────────────────────────────────
  const classBuckets = { economy: 0, premium: 0, business: 0, first: 0, unknown: 0 };
  for (const f of flights) {
    const c = (f.service_class || "").toLowerCase();
    if (!c) classBuckets.unknown++;
    else if (/(first)/.test(c)) classBuckets.first++;
    else if (/(business)/.test(c)) classBuckets.business++;
    else if (/(premium|prem econ)/.test(c)) classBuckets.premium++;
    else classBuckets.economy++;  // also catches "coach", "wanna get away", "economy (X)" etc.
  }
  out.classBuckets = classBuckets;

  // ── Yearly + monthly-of-year (Jan-Dec aggregated) distributions ───────
  const monthOfYear = new Array(12).fill(0);
  const yearTotals = new Map();
  for (const f of flights) {
    if (!f.depart) continue;
    const d = new Date(f.depart);
    if (isNaN(d)) continue;
    monthOfYear[d.getMonth()]++;
    inc(yearTotals, d.getFullYear());
  }
  out.monthOfYear = monthOfYear;
  out.yearTotals  = yearTotals;
  out.busiestMonth = monthOfYear.indexOf(Math.max(...monthOfYear));

  // ── Calendar heatmap data: { year: { "YYYY-MM-DD": count } } ──────────
  const heatmap = new Map();
  for (const f of flights) {
    if (!f.depart) continue;
    const d = new Date(f.depart);
    if (isNaN(d)) continue;
    const ymd = d.toISOString().slice(0, 10);
    const y = d.getFullYear();
    if (!heatmap.has(y)) heatmap.set(y, new Map());
    const day = heatmap.get(y);
    day.set(ymd, (day.get(ymd) || 0) + 1);
  }
  out.heatmap = heatmap;

  // ── Geographic extremes & centroid ────────────────────────────────────
  let n = null, s = null, e = null, w = null;
  let latSum = 0, lonSum = 0, count = 0;
  for (const code of out.airports.keys()) {
    const ap = airports[code];
    if (!ap || ap.lat == null || ap.lon == null) continue;
    if (!n || ap.lat > n.lat) n = ap;
    if (!s || ap.lat < s.lat) s = ap;
    if (!e || ap.lon > e.lon) e = ap;
    if (!w || ap.lon < w.lon) w = ap;
    latSum += ap.lat; lonSum += ap.lon; count++;
  }
  out.extremes = { north: n, south: s, east: e, west: w };
  out.centroid = count ? { lat: latSum / count, lon: lonSum / count } : null;

  // ── Average great-circle distance from "home" (most-visited airport) ──
  // topAirports is computed below, but we just need the top by count here:
  let homeCode = null, homeMax = -1;
  for (const [code, n] of out.airports.entries()) {
    if (n > homeMax) { homeMax = n; homeCode = code; }
  }
  const homeAp = homeCode && airports[homeCode];
  if (homeAp) {
    let totalDist = 0, hits = 0;
    for (const code of out.airports.keys()) {
      if (code === homeCode) continue;
      const ap = airports[code];
      if (!ap || ap.lat == null) continue;
      totalDist += haversineMiles(homeAp, ap);
      hits++;
    }
    out.homeAirport = homeAp;
    out.avgDistanceFromHome = hits ? totalDist / hits : 0;
    let furthest = null, furthestDist = 0;
    for (const code of out.airports.keys()) {
      if (code === homeCode) continue;
      const ap = airports[code];
      if (!ap || ap.lat == null) continue;
      const d = haversineMiles(homeAp, ap);
      if (d > furthestDist) { furthestDist = d; furthest = ap; }
    }
    out.furthestAirport = furthest;
    out.furthestDistance = furthestDist;
  }

  // ── Major Hubs visited (overlap with a curated Top-50 list) ───────────
  out.topHubsVisited = TOP_HUBS.filter(c => out.airports.has(c));
  out.topHubsCount = out.topHubsVisited.length;
  out.topHubsTotal = TOP_HUBS.length;

  // ── Carbon footprint ────────────────────────────────────────────────────
  // ICAO-style economy-class emissions factors per passenger-km:
  //   short-haul   (<800 km)   : 158 g CO₂ / pkm
  //   medium-haul  (800–3700)  : 133 g CO₂ / pkm
  //   long-haul    (>3700 km)  : 115 g CO₂ / pkm
  // Add a fixed ~30 kg per leg to account for taxi/take-off/landing burn.
  const KM_PER_MI = 1.60934;
  let co2Kg = 0;
  for (const f of flights) {
    const km = (f._miles || 0) * KM_PER_MI;
    if (km <= 0) continue;
    const factor = km < 800 ? 0.158 : km < 3700 ? 0.133 : 0.115;
    co2Kg += km * factor + 30;
  }
  out.co2Kg     = co2Kg;
  out.co2Tonnes = co2Kg / 1000;
  // Equivalent activities (rough): one tree absorbs ~21 kg CO₂/yr.
  out.treesNeededPerYear = co2Kg / 21;
  // Average gasoline car emits ~404 g CO₂ / mile.
  out.carEquivalentMiles = co2Kg * 1000 / 404;

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

// ---------------------------------------------------------------------------
// Airline logo / banner URLs.
//
// Resolution order:
//   1. Local override at  assets/img/airlines/<ICAO>.png|.svg
//      — for defunct/merged carriers the CDN doesn't carry (FL, CO, NW, …).
//      Drop a file there with the right ICAO filename and the UI picks it up.
//   2. Jxck-S/airline-logos CDN — covers most current carriers.
//   3. A brand-coloured TEXT TILE rendered as an inline SVG data: URI — so
//      even when neither source has an image, the row gets a tidy logo
//      shape instead of a broken-image icon.
//
// The local override lookup is implemented inline (just an <img src> string);
// the actual existence check happens in the browser via the <img onerror>
// chain wired up in views.js's airlineLogoImg() helper.
// ---------------------------------------------------------------------------
const LOGO_BASE = "https://raw.githubusercontent.com/Jxck-S/airline-logos/main";
const LOCAL_LOGO_BASE = "assets/img/airlines";

// Brand colors for the SVG text-tile placeholder. Keyed by ICAO so we can
// resolve them even for carriers TripIt only knows by IATA. If a code isn't
// listed, we fall back to the project accent purple.
const AIRLINE_BRAND_COLOR = {
  // Defunct US carriers — these are the ones most likely to need the tile.
  TRS: "#c81e2e", // AirTran (red)
  COA: "#053f7c", // Continental (deep blue)
  NWA: "#a01e1e", // Northwest (red)
  USA: "#003a70", // US Airways (navy)
  TWA: "#a31b22", // TWA (red)
  AWE: "#13418f", // America West (blue)
  VRD: "#cf1f44", // Virgin America (red)
  RPA: "#0070b8", // Republic Airways (blue)
  // Active carriers — only listed where the placeholder might still be
  // needed (e.g. CDN miss). Most active carriers' real logos come through.
  AAL: "#0078d2", AA: "#0078d2",   // American
  DAL: "#003366", DL: "#003366",   // Delta
  UAL: "#005daa", UA: "#005daa",   // United
  SWA: "#304cb2", WN: "#304cb2",   // Southwest
  ASA: "#00529b", AS: "#00529b",   // Alaska
  JBU: "#003876", B6: "#003876",   // JetBlue
};

function logoTextTileSvgDataUri(label, fillHex) {
  // ~64×64 SVG with the airline code centered on a brand-coloured square.
  // Encoded as a data URI so a single <img src=...> works without any
  // extra file. Letters lighten for very dark backgrounds.
  const fg = "#fff";
  // Escape the label minimally — labels are always 2-3 ASCII letters in
  // practice, but defensive in case someone passes a longer name.
  const safe = String(label).replace(/[<>&"]/g, "").slice(0, 3) || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="${fillHex}"/><text x="32" y="42" font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif" font-weight="700" font-size="${safe.length > 2 ? 22 : 26}" fill="${fg}" text-anchor="middle" letter-spacing="0.5">${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// All airline metadata now lives in data/airlines.json — built from
// OpenFlights with a hand-curated overlay (tools/curated_airlines.json) that
// supplies authoritative entries for defunct/reassigned IATA codes.
export function airlineEntry(iata, airlinesIndex) {
  if (!iata) return null;
  return airlinesIndex?.[iata.toUpperCase()] || null;
}
export function airlineIcao(iata, airlinesIndex) {
  return airlineEntry(iata, airlinesIndex)?.icao || null;
}
// Display name: prefer curated/OpenFlights data; if the IATA code was retired
// (active === false), the curated overlay already gives us the historical
// name (e.g. FL → "AirTran Airways" not "Fly Lili"). Fall back to whatever
// TripIt stored, then the raw code.
export function airlineDisplayName(iata, airlinesIndex, tripitName) {
  const e = airlineEntry(iata, airlinesIndex);
  if (e?.name) return e.name;
  if (tripitName) return tripitName;
  return iata || "";
}
// Returns the FIRST URL to try (local override). Use `airlineLogoFallbackUrl`
// for the second-pass CDN URL, and `airlineLogoPlaceholder` for the final
// brand-coloured text-tile. Callers wire these together with <img onerror>.
export function airlineLogoUrl(iata, airlinesIndex) {
  const icao = airlineIcao(iata, airlinesIndex);
  return icao ? `${LOCAL_LOGO_BASE}/${icao}.png` : null;
}
// Second-pass URL: hit Jxck-S/airline-logos on jsdelivr CDN.
export function airlineLogoFallbackUrl(iata, airlinesIndex) {
  const icao = airlineIcao(iata, airlinesIndex);
  return icao ? `${LOGO_BASE}/radarbox_logos/${icao}.png` : null;
}
// Final-pass: generated text-tile SVG, never fails to load. We prefer the
// ICAO if known (more distinctive across history — `TRS` reads as AirTran)
// and fall back to the IATA if we don't have one.
export function airlineLogoPlaceholder(iata, airlinesIndex) {
  const icao = airlineIcao(iata, airlinesIndex);
  const label = (icao || iata || "??").toUpperCase();
  const color = AIRLINE_BRAND_COLOR[label] || AIRLINE_BRAND_COLOR[(iata || "").toUpperCase()] || "#7c3aed";
  return logoTextTileSvgDataUri(label, color);
}

export function airlineBannerUrl(iata, airlinesIndex) {
  const icao = airlineIcao(iata, airlinesIndex);
  return icao ? `${LOGO_BASE}/radarbox_banners/${icao}.png` : null;
}
// Useful for the flight detail modal: tell the user when an airline they flew
// has since merged into another carrier.
export function airlineSuccessor(iata, airlinesIndex) {
  const e = airlineEntry(iata, airlinesIndex);
  if (!e || e.active !== false) return null;
  return {
    name: e.successor_name || e.merged_into || null,
    iata: e.merged_into || null,
    endedYear: e.ended ? e.ended.slice(0, 4) : null,
  };
}
