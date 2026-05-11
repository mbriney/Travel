// worldglobe.js — 3D rotating globe of visited countries, flight arcs, and
// airport dots, using d3.geoOrthographic. Auto-rotates and supports drag-to-spin.

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

// We track a single globe instance per stage so toggling tabs cleanly disposes
// of the prior render loop.
const _activeGlobes = new WeakMap();

export async function drawWorldGlobe(svg, ctx) {
  // Tear down any previous globe attached to this svg
  const prior = _activeGlobes.get(svg);
  if (prior) prior.stop();

  const w = 600, h = 600;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  const world = await loadWorld();
  const countries = topojson.feature(world, world.objects.countries);

  const projection = d3.geoOrthographic()
    .scale((Math.min(w, h) - 20) / 2)
    .translate([w / 2, h / 2])
    .clipAngle(90)
    .rotate([0, -20, 0]);

  const path = d3.geoPath(projection);
  const root = d3.select(svg);
  root.selectAll("*").remove();

  // Defs: a radial gradient for the sphere surface + drop shadow filter
  const defs = root.append("defs");
  defs.append("radialGradient")
    .attr("id", "globe-grad")
    .attr("cx", "50%").attr("cy", "35%").attr("r", "65%")
    .selectAll("stop").data([
      { offset: "0%",   color: "rgba(124, 58, 237, 0.20)" },
      { offset: "55%",  color: "rgba(10, 15, 44, 0.85)"  },
      { offset: "100%", color: "rgba(6, 10, 31, 0.95)"   },
    ]).enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

  // Sphere background
  root.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "globe-sphere")
    .attr("fill", "url(#globe-grad)")
    .attr("stroke", "rgba(167, 139, 250, 0.30)")
    .attr("stroke-width", 1)
    .attr("d", path);

  // Graticule
  const graticule = d3.geoGraticule10();
  const graticulePath = root.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("fill", "none")
    .attr("stroke", "rgba(167, 139, 250, 0.10)")
    .attr("stroke-width", 0.5)
    .attr("d", path);

  // Build set of visited country numeric IDs (same logic as worldmap.js)
  const visitedAirports = [];
  for (const code of ctx.stats.airports.keys()) {
    const ap = ctx.airports[code];
    if (ap && ap.lon != null && ap.lat != null) visitedAirports.push(ap);
  }
  const visitedCountryNumeric = new Set();
  for (const feat of countries.features) {
    for (const ap of visitedAirports) {
      if (d3.geoContains(feat, [ap.lon, ap.lat])) {
        visitedCountryNumeric.add(feat.id);
        break;
      }
    }
  }

  // Land
  const landPaths = root.append("g")
    .selectAll("path")
    .data(countries.features)
    .enter().append("path")
    .attr("class", d => "land" + (visitedCountryNumeric.has(d.id) ? " visited" : ""))
    .attr("d", path)
    .append("title").text(d => d.properties.name);

  // Routes — great-circle arcs as line features
  const pairs = new Map();
  for (const [route, count] of ctx.stats.routes) {
    const [a, b] = route.split("-");
    const A = ctx.airports[a], B = ctx.airports[b];
    if (!A || !B) continue;
    const key = [a, b].sort().join("|");
    const cur = pairs.get(key) || { count: 0, a: A, b: B };
    cur.count += count;
    pairs.set(key, cur);
  }
  const maxCount = Math.max(...[...pairs.values()].map(p => p.count), 1);
  const arcsData = [...pairs.values()].map(({ a, b, count }) => ({
    type: "LineString",
    coordinates: [[a.lon, a.lat], [b.lon, b.lat]],
    weight: count / maxCount,
  }));
  const arcPaths = root.append("g").attr("class", "arcs")
    .selectAll("path")
    .data(arcsData)
    .enter().append("path")
    .attr("class", "arc")
    .attr("fill", "none")
    .attr("stroke", "#a78bfa")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", d => 0.4 + 1.8 * d.weight)
    .attr("opacity", d => 0.20 + 0.55 * d.weight)
    .attr("d", path);

  // Airport dots — top hubs bigger
  const topSet = new Set(ctx.stats.topAirports.slice(0, 6).map(r => r.key));
  const dotsLayer = root.append("g").attr("class", "dots");

  function updateDots() {
    const visible = visitedAirports.filter(ap => {
      const pt = projection([ap.lon, ap.lat]);
      return pt != null;
    });
    const sel = dotsLayer.selectAll("circle").data(visible, ap => ap.code);
    sel.exit().remove();
    const enter = sel.enter().append("circle")
      .attr("class", ap => "airport-dot" + (topSet.has(ap.code) ? " big" : ""))
      .attr("r", ap => topSet.has(ap.code) ? 3.5 : 1.6)
      .attr("fill", ap => topSet.has(ap.code) ? "#c8a04a" : "#7a1a1a")
      .attr("stroke", "white")
      .attr("stroke-width", ap => topSet.has(ap.code) ? 1.2 : 0.8);
    enter.append("title").text(ap => `${ap.code} — ${ap.name} (${ap.city})`);
    sel.merge(enter)
      .attr("cx", ap => projection([ap.lon, ap.lat])[0])
      .attr("cy", ap => projection([ap.lon, ap.lat])[1]);
  }

  function redraw() {
    root.selectAll(".land").attr("d", path);
    graticulePath.attr("d", path);
    arcPaths.attr("d", path);
    root.select(".globe-sphere").attr("d", path);
    updateDots();
  }

  updateDots();

  // ── Auto-rotation + drag handling ─────────────────────────────────────
  let rotationLon = projection.rotate()[0];
  const rotationLat = projection.rotate()[1];
  let dragging = false;
  let dragStart = null;
  let lastFrame = performance.now();
  let stopped = false;
  let userIdleSince = performance.now();
  // Degrees per second when auto-rotating
  const DEG_PER_SEC = 8;

  function tick(now) {
    if (stopped) return;
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;
    // Resume auto-rotation if user has been idle for 1.5s after a drag
    if (!dragging && now - userIdleSince > 1500) {
      rotationLon = (rotationLon + DEG_PER_SEC * dt) % 360;
      projection.rotate([rotationLon, rotationLat, 0]);
      redraw();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Drag to spin
  function onDragStart(e) {
    dragging = true;
    const pt = pointer(e);
    dragStart = { pt, rotation: projection.rotate() };
    svg.style.cursor = "grabbing";
  }
  function onDragMove(e) {
    if (!dragging) return;
    const pt = pointer(e);
    const [x0, y0] = dragStart.pt;
    const [x1, y1] = pt;
    const sensitivity = 0.4;
    const r = dragStart.rotation;
    projection.rotate([
      r[0] + (x1 - x0) * sensitivity,
      Math.max(-85, Math.min(85, r[1] - (y1 - y0) * sensitivity)),
      r[2],
    ]);
    rotationLon = projection.rotate()[0];
    redraw();
  }
  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    svg.style.cursor = "grab";
    userIdleSince = performance.now();
  }
  function pointer(e) {
    const r = svg.getBoundingClientRect();
    const event = e.touches ? e.touches[0] : e;
    return [
      ((event.clientX - r.left) / r.width)  * w,
      ((event.clientY - r.top)  / r.height) * h,
    ];
  }

  svg.style.cursor = "grab";
  svg.addEventListener("mousedown",  onDragStart);
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup",   onDragEnd);
  svg.addEventListener("touchstart", onDragStart, { passive: true });
  window.addEventListener("touchmove",  onDragMove, { passive: true });
  window.addEventListener("touchend",   onDragEnd);

  const handle = {
    stop() {
      stopped = true;
      svg.removeEventListener("mousedown", onDragStart);
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup",   onDragEnd);
      svg.removeEventListener("touchstart", onDragStart);
      window.removeEventListener("touchmove",  onDragMove);
      window.removeEventListener("touchend",   onDragEnd);
      svg.style.cursor = "";
    },
  };
  _activeGlobes.set(svg, handle);
  return handle;
}
