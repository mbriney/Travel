// worldmap.js — D3 world map with visited-country shading and flight arcs.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

let _worldCache = null;
async function loadWorld() {
  if (_worldCache) return _worldCache;
  const r = await fetch(WORLD_URL);
  _worldCache = await r.json();
  return _worldCache;
}

// Color a country if its polygon contains any of our visited airports.
// (world-atlas IDs are ISO 3166-1 numeric, not ISO2, so this is more robust
// than a code-based mapping.)
export async function drawWorldMap(svg, ctx) {
  const w = 960, h = 480;
  const world = await loadWorld();
  const countries = topojson.feature(world, world.objects.countries);

  const projection = d3.geoNaturalEarth1().fitSize([w, h - 20], countries);
  const path = d3.geoPath(projection);

  const root = d3.select(svg);
  root.selectAll("*").remove();

  // Graticule
  const graticule = d3.geoGraticule10();
  root.append("path").attr("class", "graticule").attr("d", path(graticule));

  // Build a fast lookup of visited countries based on the airports we have.
  // We need ISO2 -> set of country polygon ids. Iterate over each country
  // feature and check if any of our visited airports falls within it.
  const visitedAirports = [];
  for (const code of ctx.stats.airports.keys()) {
    const ap = ctx.airports[code];
    if (ap && ap.lon != null && ap.lat != null) visitedAirports.push(ap);
  }
  const visitedCountryNumeric = new Set();
  for (const feat of countries.features) {
    // Quick bbox check first, then polygon containment.
    const b = path.bounds(feat);  // pixel bbox
    if (!b) continue;
    for (const ap of visitedAirports) {
      const pt = projection([ap.lon, ap.lat]);
      if (!pt) continue;
      if (pt[0] < b[0][0] || pt[0] > b[1][0] || pt[1] < b[0][1] || pt[1] > b[1][1]) continue;
      if (d3.geoContains(feat, [ap.lon, ap.lat])) {
        visitedCountryNumeric.add(feat.id);
        break;
      }
    }
  }

  // Draw countries
  root.append("g")
    .selectAll("path")
    .data(countries.features)
    .enter().append("path")
    .attr("class", d => "land" + (visitedCountryNumeric.has(d.id) ? " visited" : ""))
    .attr("d", path)
    .append("title").text(d => d.properties.name);

  // Compute most-flown route counts for stroke weighting
  const pairs = new Map(); // "AAA-BBB" sorted -> { count, a, b }
  for (const [route, count] of ctx.stats.routes) {
    const [a, b] = route.split("-");
    const A = ctx.airports[a], B = ctx.airports[b];
    if (!A || !B) continue;
    const key = [a, b].sort().join("|");
    const cur = pairs.get(key) || { count: 0, a: A, b: B };
    cur.count += count;
    pairs.set(key, cur);
  }

  // Draw great-circle arcs
  const arcGroup = root.append("g").attr("class", "arcs");
  const maxCount = Math.max(...[...pairs.values()].map(p => p.count), 1);
  for (const { a, b, count } of pairs.values()) {
    const interp = d3.geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
    const samples = 40;
    const coords = [];
    for (let i = 0; i <= samples; i++) coords.push(interp(i / samples));
    const lineGen = d3.line()
      .x(d => projection(d)[0])
      .y(d => projection(d)[1])
      .defined(d => projection(d) !== null);
    arcGroup.append("path")
      .attr("class", "arc")
      .attr("d", lineGen(coords))
      .attr("stroke-width", 0.4 + 1.8 * (count / maxCount))
      .attr("opacity", 0.18 + 0.45 * (count / maxCount));
  }

  // Airport dots — top hubs bigger
  const topSet = new Set(ctx.stats.topAirports.slice(0, 6).map(r => r.key));
  const dotGroup = root.append("g").attr("class", "dots");
  for (const ap of visitedAirports) {
    const pt = projection([ap.lon, ap.lat]);
    if (!pt) continue;
    const isTop = topSet.has(ap.code);
    dotGroup.append("circle")
      .attr("class", "airport-dot" + (isTop ? " big" : ""))
      .attr("cx", pt[0]).attr("cy", pt[1])
      .attr("r", isTop ? 3.5 : 1.6)
      .append("title").text(`${ap.code} — ${ap.name} (${ap.city})`);
  }
}
