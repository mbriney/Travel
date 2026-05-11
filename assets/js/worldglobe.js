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

// We track a single globe instance per stage so toggling tabs cleanly
// disposes of the prior render loop.
const _activeGlobes = new WeakMap();

export async function drawWorldGlobe(svg, ctx) {
  // Tear down any previously-running globe on this SVG, AND clear out its
  // DOM completely — using innerHTML so we don't leave any element behind
  // that an old animation loop might still be querying via selector.
  const prior = _activeGlobes.get(svg);
  if (prior) prior.stop();
  svg.innerHTML = "";

  // Install a "shutting down" stub immediately. If another call sneaks in
  // before our async loadWorld() resolves, it'll see this stub and call
  // .stop() on it, which we'll check before we start drawing.
  let stopped = false;
  const stubHandle = { stop() { stopped = true; } };
  _activeGlobes.set(svg, stubHandle);

  const w = 600, h = 600;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  const world = await loadWorld();
  if (stopped) return null;
  const countries = topojson.feature(world, world.objects.countries);

  // Final guard: if the SVG was repopulated by a competing call while we
  // waited on the world atlas, abort.
  if (svg.childElementCount > 0) {
    svg.innerHTML = "";
  }

  const projection = d3.geoOrthographic()
    .scale((Math.min(w, h) - 20) / 2)
    .translate([w / 2, h / 2])
    .clipAngle(90)
    .rotate([0, -20, 0]);

  const path = d3.geoPath(projection);
  const root = d3.select(svg);

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

  // Airport dots — top hubs bigger. Plain DOM (no D3 data joins) so every dot
  // is guaranteed to be repositioned on every redraw. Keep an explicit array
  // of {node, ap} pairs so we never lose the airport reference.
  const topSet = new Set(ctx.stats.topAirports.slice(0, 6).map(r => r.key));
  const dotsLayer = root.append("g").attr("class", "dots").node();
  const SVGNS = "http://www.w3.org/2000/svg";
  const dotEntries = [];
  for (const ap of visitedAirports) {
    const isTop = topSet.has(ap.code);
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("class", "airport-dot" + (isTop ? " big" : ""));
    c.setAttribute("r", isTop ? "3.5" : "1.6");
    c.setAttribute("fill", isTop ? "#c8a04a" : "#7a1a1a");
    c.setAttribute("stroke", "white");
    c.setAttribute("stroke-width", isTop ? "1.2" : "0.8");
    const t = document.createElementNS(SVGNS, "title");
    t.textContent = `${ap.code} — ${ap.name} (${ap.city})`;
    c.appendChild(t);
    dotsLayer.appendChild(c);
    dotEntries.push({ node: c, ap });
  }

  function updateDots() {
    for (const { node, ap } of dotEntries) {
      const pt = projection([ap.lon, ap.lat]);
      if (!pt) {
        node.style.display = "none";
      } else {
        node.style.display = "";
        node.setAttribute("cx", String(pt[0]));
        node.setAttribute("cy", String(pt[1]));
      }
    }
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
  // `stopped` is declared at the top of the function (shared with the stub
  // handle so a superseding call can short-circuit our async work).
  let dragging = false;
  let dragStart = null;
  let lastFrame = performance.now();
  let userIdleSince = performance.now();
  const DEG_PER_SEC = 8;

  function tick(now) {
    if (stopped) return;
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;
    if (!dragging && now - userIdleSince > 1500) {
      // Read the current rotation each frame so any drag-induced tilt
      // (the latitude component) is preserved across the auto-rotation loop.
      const r = projection.rotate();
      projection.rotate([(r[0] + DEG_PER_SEC * dt) % 360, r[1], r[2]]);
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
