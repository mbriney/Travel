// Smoke test for stats.js — runs the real stats logic against data/flights.json
// to verify nothing throws and the numbers are sane.

import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { computeStats, formatNumber, formatDuration } from "../assets/js/stats.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const flights  = JSON.parse(await readFile(path.join(ROOT, "data/flights.json"), "utf8"));
const airports = JSON.parse(await readFile(path.join(ROOT, "data/airports.json"), "utf8"));
const airlines = JSON.parse(await readFile(path.join(ROOT, "data/airlines.json"), "utf8"));

const stats = computeStats({ flights, airports, airlines });

const rows = [
  ["Flights",        stats.total],
  ["Domestic",       stats.domestic],
  ["International",  stats.international],
  ["Long-haul",      stats.longHaul],
  ["Miles",          formatNumber(stats.miles)],
  ["Time aloft",     formatDuration(stats.minutes)],
  ["Airports",       stats.airportsCount],
  ["Countries",      stats.countriesCount],
  ["US States",      stats.statesCount],
  ["Routes",         stats.routes.size],
  ["Airlines",       stats.airlines.size],
  ["Earth laps",     stats.earthLaps.toFixed(2)],
  ["Moon trips",     stats.moonTrips.toFixed(2)],
  ["First flight",   stats.firstFlight?.toDateString?.()],
  ["Last flight",    stats.lastFlight?.toDateString?.()],
  ["Shortest",       stats.shortest ? `${stats.shortest.from}-${stats.shortest.to} (${Math.round(stats.shortest._miles)} mi)` : "—"],
  ["Longest",        stats.longest  ? `${stats.longest.from}-${stats.longest.to} (${Math.round(stats.longest._miles).toLocaleString()} mi)` : "—"],
  ["Top airports",   stats.topAirports.slice(0,5).map(r=>`${r.key}:${r.value}`).join(" ")],
  ["Top airlines",   stats.topAirlines.slice(0,5).map(r=>`${r.key}:${r.value}`).join(" ")],
  ["Top routes",     stats.topRoutes.slice(0,5).map(r=>`${r.key}:${r.value}`).join(" ")],
];

console.log("PASSPORT STATS SMOKE TEST");
console.log("=========================");
for (const [k, v] of rows) console.log(k.padEnd(16), "·", v);

// Sanity checks
const errs = [];
if (stats.total !== flights.length) errs.push(`total ${stats.total} != flights.length ${flights.length}`);
if (stats.miles <= 0) errs.push("miles should be > 0");
if (stats.airportsCount < 5) errs.push(`only ${stats.airportsCount} airports — too few`);
if (stats.countriesCount < 2) errs.push(`only ${stats.countriesCount} countries — too few`);
if (!stats.topRoutes.length) errs.push("no top routes computed");

if (errs.length) {
  console.error("\nFAILED:");
  errs.forEach(e => console.error("  - " + e));
  process.exit(1);
}
console.log("\nOK");
