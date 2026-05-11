// usmap.js — D3 US states choropleth: visited vs not.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

const US_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// FIPS numeric -> USPS state abbreviation
const FIPS_TO_USPS = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE",
  "11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA",
  "20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN",
  "28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM",
  "36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
  "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA",
  "54":"WV","55":"WI","56":"WY","60":"AS","66":"GU","69":"MP","72":"PR","78":"VI",
};

let _usCache = null;
async function loadUS() {
  if (_usCache) return _usCache;
  const r = await fetch(US_URL);
  _usCache = await r.json();
  return _usCache;
}

export async function drawUSMap(svg, ctx) {
  const w = 960, h = 600;
  const us = await loadUS();
  const states = topojson.feature(us, us.objects.states);
  const mesh = topojson.mesh(us, us.objects.states, (a, b) => a !== b);

  const projection = d3.geoAlbersUsa().fitSize([w, h], states);
  const path = d3.geoPath(projection);

  const root = d3.select(svg);
  root.selectAll("*").remove();

  const visited = new Set(ctx.stats.states.keys());

  root.append("g")
    .selectAll("path")
    .data(states.features)
    .enter().append("path")
    .attr("class", d => "land" + (visited.has(FIPS_TO_USPS[String(d.id).padStart(2, "0")]) ? " visited" : ""))
    .attr("d", path)
    .append("title").text(d => d.properties.name);

  root.append("path")
    .datum(mesh)
    .attr("class", "land")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "rgba(0,0,0,0.30)")
    .attr("stroke-width", 0.5);

  // Optional: state abbreviations as small labels for visited states
  root.append("g")
    .selectAll("text")
    .data(states.features.filter(d => visited.has(FIPS_TO_USPS[String(d.id).padStart(2, "0")])))
    .enter().append("text")
    .attr("class", "label")
    .attr("transform", d => {
      const c = path.centroid(d);
      return `translate(${c[0]},${c[1]})`;
    })
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .text(d => FIPS_TO_USPS[String(d.id).padStart(2, "0")] || "");
}
