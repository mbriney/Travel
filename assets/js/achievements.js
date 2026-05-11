// achievements.js — TravStats-inspired achievement system.
// `openDetailModal` from views.js is imported dynamically inside the click
// handler so this module remains pure (testable in plain Node without DOM).
import { formatDate, formatDuration, formatNumber, airlineLogoUrl, airlineDisplayName } from "./stats.js";
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

  // ── EXPANSION: Geography ──────────────────────────────────────────────
  { code: "TRANSATLANTIC",      name: "Transatlantic",         desc: "Fly between the Americas and Europe or Africa",         category: "elite",    icon: "🛬", tier: "silver",   req: 1,    type: "transatlantic",     points: 75 },
  { code: "TRANSPACIFIC",       name: "Transpacific",          desc: "Fly between the Americas and Asia or Oceania",          category: "elite",    icon: "🌊", tier: "gold",     req: 1,    type: "transpacific",      points: 150 },
  { code: "DOMESTIC_GOD",       name: "Domestic God",          desc: "Visit 10 unique airports inside the USA",               category: "collector",icon: "🦅", tier: "bronze",   req: 10,   type: "domestic_airports", points: 30 },
  { code: "LONGEST_LEG_15H",    name: "The Longest Leg",       desc: "Complete a single flight of 15 hours or more",          category: "elite",    icon: "🛌", tier: "platinum", req: 900,  type: "max_flight_minutes",points: 250 },
  { code: "SHORTEST_HOP",       name: "The Shortest Hop",      desc: "Complete a flight under 45 minutes",                    category: "special",  icon: "⚡", tier: "bronze",   req: 45,   type: "min_flight_minutes",points: 25 },
  { code: "COAST_TO_COAST",     name: "Coast to Coast",        desc: "Fly between a US east-coast and west-coast airport",    category: "explorer", icon: "🌅", tier: "silver",   req: 1,    type: "coast_to_coast",    points: 50 },
  { code: "INTERNATIONALIST",   name: "Internationalist",      desc: "Visit 5 different countries by air in a single year",   category: "explorer", icon: "🛂", tier: "gold",     req: 5,    type: "countries_per_year",points: 100 },
  { code: "BORDER_CROSSER_10",  name: "Border Crosser",        desc: "Cross 10 international borders in the air",             category: "explorer", icon: "🚧", tier: "silver",   req: 10,   type: "international_flights", points: 40 },
  { code: "BORDER_CROSSER_50",  name: "Frequent Border Crosser",desc: "Cross 50 international borders in the air",            category: "explorer", icon: "🛃", tier: "gold",     req: 50,   type: "international_flights", points: 200 },

  // ── EXPANSION: Aircraft & fleet (relies on TripIt's aircraft code) ────
  { code: "NARROWBODY",         name: "Narrowbody Navigator",  desc: "Fly on a 737 or A320 family aircraft",                  category: "collector",icon: "🛩️", tier: "bronze",   req: 1,    type: "has_narrowbody",    points: 15 },
  { code: "WIDEBODY",           name: "Widebody Wanderer",     desc: "Fly on a twin-aisle widebody",                          category: "collector",icon: "🛫", tier: "silver",   req: 1,    type: "has_widebody",      points: 50 },
  { code: "WHALE",              name: "The Whale",             desc: "Fly on an Airbus A380",                                 category: "collector",icon: "🐋", tier: "gold",     req: 1,    type: "has_a380",          points: 150 },
  { code: "QUEEN_OF_SKIES",     name: "Queen of the Skies",    desc: "Fly on a Boeing 747",                                   category: "collector",icon: "👑", tier: "gold",     req: 1,    type: "has_747",           points: 150 },
  { code: "DREAMLINER",         name: "Dreamliner Debut",      desc: "Fly on a Boeing 787",                                   category: "collector",icon: "💭", tier: "silver",   req: 1,    type: "has_787",           points: 75 },
  { code: "THE_NEO",            name: "The Neo",               desc: "Fly on a 320neo, 330neo, or 737 MAX",                   category: "collector",icon: "🆕", tier: "silver",   req: 1,    type: "has_neo",           points: 50 },
  { code: "PROPELLER_PILOT",    name: "Propeller Pilot",       desc: "Fly on a turboprop (ATR, Dash 8, Saab)",                category: "collector",icon: "🌀", tier: "bronze",   req: 1,    type: "has_propeller",     points: 25 },
  { code: "REGIONAL_RUNNER",    name: "Regional Runner",       desc: "Fly on a regional jet (Embraer or CRJ)",                category: "collector",icon: "🛬", tier: "bronze",   req: 1,    type: "has_regional",      points: 15 },
  { code: "FLEET_MASTER",       name: "Fleet Master",          desc: "Fly on 5 different aircraft families",                  category: "collector",icon: "🏭", tier: "gold",     req: 5,    type: "aircraft_families", points: 125 },
  { code: "BOEING_LOYALIST",    name: "Boeing Loyalist",       desc: "Log 25 segments on Boeing aircraft",                    category: "elite",    icon: "🇺🇸", tier: "silver",   req: 25,   type: "boeing_segments",   points: 60 },
  { code: "AIRBUS_ADVOCATE",    name: "Airbus Advocate",       desc: "Log 25 segments on Airbus aircraft",                    category: "elite",    icon: "🇪🇺", tier: "silver",   req: 25,   type: "airbus_segments",   points: 60 },
  { code: "RETRO_FLYER",        name: "Retro Flyer",           desc: "Fly on a retired MD-80 / MD-90 family jet",             category: "collector",icon: "📻", tier: "silver",   req: 1,    type: "has_md80",          points: 60 },
  { code: "DOUBLE_DECKER",      name: "Double Decker",         desc: "Fly on a two-deck aircraft (747 or A380)",              category: "collector",icon: "🥞", tier: "gold",     req: 1,    type: "has_doubledecker",  points: 100 },
  { code: "WORKHORSE",          name: "The Workhorse",         desc: "Fly on the same physical tail number twice (needs AeroDataBox enrichment)", category: "elite", icon: "🔧", tier: "silver", req: 2, type: "max_tail_repeats", points: 60 },

  // ── EXPANSION: Distance (mile-flavored, for that Million Miler feel) ──
  { code: "MILLION_MILER",      name: "Million Miler",         desc: "Fly 1,000,000 lifetime miles",                          category: "distance", icon: "🏅", tier: "diamond",  req: 1000000, type: "distance_mi",  points: 2000 },
  { code: "CIRCUMNAVIGATOR",    name: "Circumnavigator",       desc: "Fly the circumference of the Earth (24,901 mi)",        category: "distance", icon: "🌐", tier: "bronze",   req: 1,    type: "earth_laps",        points: 25 },
  { code: "EARTH_LAPS_5",       name: "5× Around the Earth",   desc: "Fly the equivalent of 5 trips around Earth",            category: "distance", icon: "🌍", tier: "silver",   req: 5,    type: "earth_laps",        points: 100 },
  { code: "EARTH_LAPS_10",      name: "10× Around the Earth",  desc: "Fly the equivalent of 10 trips around Earth",           category: "distance", icon: "🌎", tier: "gold",     req: 10,   type: "earth_laps",        points: 250 },
  { code: "MOON_WALKER",        name: "Moon Walker",           desc: "Fly the distance to the Moon (238,855 mi)",             category: "distance", icon: "🌑", tier: "diamond",  req: 1,    type: "moon_trips",        points: 1500 },

  // ── EXPANSION: Logistics / cadence ────────────────────────────────────
  { code: "RED_EYE_SURVIVOR",   name: "Red-Eye Survivor",      desc: "Take a flight that departs after 22:00 and arrives before 06:00", category: "special", icon: "🌃", tier: "bronze", req: 1, type: "red_eye_flights", points: 25 },
  { code: "LAYOVER_LEGEND",     name: "Layover Legend",        desc: "Have a layover longer than 8 hours between connecting flights",   category: "special", icon: "⏳", tier: "silver", req: 1, type: "max_layover_minutes", points: 50 },
  { code: "QUICK_TURNAROUND",   name: "Quick Turnaround",      desc: "Connect through an airport in under 60 minutes",        category: "special",  icon: "🏃", tier: "silver",   req: 1,    type: "tight_connection",  points: 40 },
  { code: "MULTI_LEG_MONSTER",  name: "Multi-Leg Monster",     desc: "Take a single trip with 4 or more flight segments",     category: "special",  icon: "🧩", tier: "silver",   req: 4,    type: "max_trip_legs",     points: 50 },
  { code: "COMMUTER_EXACT_5",   name: "Commuter (Exact)",      desc: "Take the same flight number 5 times",                   category: "special",  icon: "💼", tier: "silver",   req: 5,    type: "max_repeat_flightno", points: 50 },
  { code: "ALPHA_TO_ZULU",      name: "Alpha to Zulu",         desc: "Visit airports whose codes begin with every letter A–Z",category: "collector",icon: "🔤", tier: "diamond",  req: 26,   type: "airport_alphabet",  points: 250 },
  { code: "TOP_10_HUBS",        name: "Airport Hub Crawler",   desc: "Visit all 10 of the world's busiest airports",          category: "collector",icon: "🏙️", tier: "gold",     req: 10,   type: "top_10_hubs",       points: 200 },
  { code: "POINT_TO_POINT",     name: "Point-to-Point",        desc: "Fly a route where neither endpoint is a top-50 hub",    category: "special",  icon: "📍", tier: "bronze",   req: 1,    type: "point_to_point",    points: 20 },
  { code: "BACK_TO_BACK",       name: "Back-to-Back",          desc: "Take two flights within 24 hours of each other",        category: "special",  icon: "🔁", tier: "bronze",   req: 1,    type: "back_to_back",      points: 20 },
  { code: "HOLIDAY_FLYER",      name: "Holiday Flyer",         desc: "Fly on Christmas, New Year's, or Thanksgiving",         category: "special",  icon: "🎄", tier: "silver",   req: 1,    type: "holiday_flights",   points: 50 },

  // ── EXPANSION: Temporal / dateline ────────────────────────────────────
  { code: "DATELINE_WEST",      name: "Time Traveler",         desc: "Cross the International Date Line westbound",           category: "explorer", icon: "🕓", tier: "gold",     req: 1,    type: "idl_west_count",    points: 150 },
  { code: "DATELINE_EAST",      name: "Yesterday Today",       desc: "Cross the International Date Line eastbound",           category: "explorer", icon: "🕘", tier: "gold",     req: 1,    type: "idl_east_count",    points: 150 },
  { code: "NYE_TOAST",          name: "New Year's Toast",      desc: "Be airborne at midnight on December 31st",              category: "special",  icon: "🎆", tier: "gold",     req: 1,    type: "nye_airborne",      points: 200 },

  // ── EXPANSION: Mileage tiers (yearly) ─────────────────────────────────
  { code: "SILVER_WING",        name: "Silver Wing",           desc: "Fly 25,000 miles in a single calendar year",            category: "elite",    icon: "🥈", tier: "silver",   req: 25000,  type: "best_year_miles",   points: 60 },
  { code: "GOLD_WING",          name: "Gold Wing",             desc: "Fly 50,000 miles in a single calendar year",            category: "elite",    icon: "🥇", tier: "gold",     req: 50000,  type: "best_year_miles",   points: 150 },
  { code: "PLATINUM_WING",      name: "Platinum Wing",         desc: "Fly 100,000 miles in a single calendar year",           category: "elite",    icon: "💠", tier: "platinum", req: 100000, type: "best_year_miles",   points: 350 },

  // ── EXPANSION: Span ───────────────────────────────────────────────────
  { code: "DECADE_OF_FLIGHT",   name: "Decade of Flight",      desc: "Have flight data spanning over 10 years",               category: "special",  icon: "📜", tier: "gold",     req: 10,   type: "years_span",        points: 100 },
  { code: "TWO_DECADES",        name: "Two Decades Aloft",     desc: "Have flight data spanning over 20 years",               category: "special",  icon: "🏛️", tier: "diamond",  req: 20,   type: "years_span",        points: 300 },

  // ── EXPANSION: Regional bundles ───────────────────────────────────────
  { code: "EURO_FLIER",         name: "Euro-Flier",            desc: "Fly to 15 different European countries",                category: "collector",icon: "🇪🇺", tier: "gold",     req: 15,   type: "eu_countries",      points: 200 },
  { code: "ASIAN_ODYSSEY",      name: "Asian Odyssey",         desc: "Fly to 10 different Asian countries",                   category: "collector",icon: "🌏", tier: "gold",     req: 10,   type: "as_countries",      points: 200 },
  { code: "MIDDLE_EAST_HUB",    name: "Middle East Hub",       desc: "Connect through DXB, DOH, and AUH",                     category: "collector",icon: "🕌", tier: "silver",   req: 3,    type: "middle_east_set",   points: 60 },
  { code: "THE_SOUTHERNER",     name: "The Southerner",        desc: "Fly to Australia, New Zealand, and South Africa",       category: "collector",icon: "🦘", tier: "gold",     req: 3,    type: "southerner_set",    points: 150 },

  // ── EXPANSION v2: more from GitHub issue #12 ──────────────────────────
  { code: "FREQUENT_FLYER_20Y",  name: "Frequent Flyer (20/yr)", desc: "Log at least 20 flights in a single calendar year",      category: "special",   icon: "📈", tier: "bronze",   req: 20,  type: "flights_per_year",     points: 40 },
  { code: "CONTINENTAL_LINK",    name: "Continental Link",       desc: "Visit airports on two different continents in a single trip", category: "explorer", icon: "🛬", tier: "silver",   req: 2,   type: "max_continents_per_trip", points: 60 },
  { code: "CAPITAL_LINK",        name: "Capital Link",           desc: "Fly between two national capital cities",                category: "explorer",  icon: "🏛️", tier: "silver",   req: 1,   type: "capital_link",         points: 50 },
  { code: "HIGH_ALTITUDE",       name: "High Altitude",          desc: "Land at an airport over 10,000 ft (e.g. La Paz)",        category: "explorer",  icon: "🏔️", tier: "gold",     req: 10000, type: "max_airport_elevation",points: 100 },
  { code: "LOW_ALTITUDE",        name: "Low Altitude",           desc: "Land at an airport below sea level (e.g. Amsterdam)",    category: "explorer",  icon: "🌊", tier: "silver",   req: 1,    type: "below_sea_level",      points: 40 },
  { code: "ALPINE_ARRIVAL",      name: "Alpine Arrival",         desc: "Land at an airport higher than 5,000 ft",                category: "explorer",  icon: "⛰️", tier: "silver",   req: 5000, type: "max_airport_elevation",points: 50 },
  { code: "GLOBAL_NORTH",        name: "Global North",           desc: "Touch an airport at 60°N or higher",                     category: "explorer",  icon: "🧭", tier: "silver",   req: 60,   type: "max_lat_n",            points: 50 },
  { code: "GLOBAL_SOUTH",        name: "Global South",           desc: "Touch an airport at 40°S or lower",                      category: "explorer",  icon: "🐧", tier: "gold",     req: 40,   type: "max_lat_s",            points: 100 },
  { code: "ANTIPODEAN",          name: "Antipodean Adventure",   desc: "Fly to a country geographically opposite Washington D.C. (the Indian Ocean / W. Australia region)", category: "explorer", icon: "🌐", tier: "diamond", req: 1, type: "antipode_visited", points: 200 },
  { code: "TRI_JET",             name: "Tri-Jet Tribute",        desc: "Fly on a three-engined aircraft (MD-11, L-1011, DC-10)", category: "collector", icon: "🛫", tier: "gold",     req: 1,    type: "has_trijet",           points: 80 },
  { code: "ALLIANCE_ACE",        name: "Alliance Ace",           desc: "Fly on members of all three major alliances (Star, oneworld, SkyTeam)", category: "elite", icon: "🤝", tier: "gold", req: 3, type: "alliances",               points: 150 },
  { code: "CODESHARE",           name: "Code-Share Confusion",   desc: "Fly on a flight operated by an airline other than the one you booked (needs AeroDataBox enrichment)", category: "elite", icon: "🔀", tier: "silver", req: 1, type: "codeshare_count",     points: 40 },

  // ── META ──────────────────────────────────────────────────────────────
  { code: "WRIGHT_STUFF",       name: "The Wright Stuff",      desc: "Unlock at least one achievement in every category",     category: "special",  icon: "✈️", tier: "diamond",  req: 1,    type: "wright_stuff",      points: 500 },
];

// ---------------------------------------------------------------------------
// Evaluator — given flights + airports + stats, compute progress for each type
// ---------------------------------------------------------------------------

const MI_TO_KM = 1.60934;
const ARCTIC_LAT = 66.5;

// Curated list of national-capital airports (used for the Capital Link
// achievement). Mix of the primary international airport in each capital
// city; not exhaustive but covers the world's major political centres.
const CAPITAL_AIRPORTS = new Set([
  "DCA","IAD","BWI",                                  // Washington DC
  "YOW",                                              // Ottawa
  "MEX","NLU",                                        // Mexico City
  "LHR","LGW","STN","LTN","LCY",                      // London
  "CDG","ORY","BVA",                                  // Paris
  "BER",                                              // Berlin (Brandenburg)
  "FCO","CIA",                                        // Rome
  "MAD",                                              // Madrid
  "LIS",                                              // Lisbon
  "AMS",                                              // Amsterdam
  "VIE",                                              // Vienna
  "BRU","CRL",                                        // Brussels
  "BRN","ZRH",                                        // Bern (capital) / Zurich primary
  "CPH",                                              // Copenhagen
  "OSL",                                              // Oslo
  "ARN","BMA",                                        // Stockholm
  "HEL",                                              // Helsinki
  "WAW","WMI",                                        // Warsaw
  "PRG",                                              // Prague
  "BUD",                                              // Budapest
  "ATH",                                              // Athens
  "DUB",                                              // Dublin
  "KEF","RKV",                                        // Reykjavik
  "SVO","DME","VKO",                                  // Moscow
  "KBP","IEV",                                        // Kyiv
  "ESB",                                              // Ankara
  "TLV",                                              // Tel Aviv (de-facto for Israel)
  "AMM",                                              // Amman
  "BEY",                                              // Beirut
  "DOH",                                              // Doha
  "AUH",                                              // Abu Dhabi
  "KWI",                                              // Kuwait City
  "RUH",                                              // Riyadh
  "MCT",                                              // Muscat
  "BAH",                                              // Manama
  "TLV",                                              // Tel Aviv
  "CAI",                                              // Cairo
  "NBO",                                              // Nairobi
  "ADD",                                              // Addis Ababa
  "JNB","PRY",                                        // Pretoria capital / Joburg primary
  "DAR",                                              // Dar es Salaam
  "DEL",                                              // Delhi
  "ISB",                                              // Islamabad
  "DAC",                                              // Dhaka
  "KTM",                                              // Kathmandu
  "CMB",                                              // Colombo (Sri Jayawardenepura Kotte de jure)
  "MLE",                                              // Malé
  "PEK","PKX",                                        // Beijing
  "TPE","TSA",                                        // Taipei
  "HND","NRT",                                        // Tokyo
  "ICN","GMP",                                        // Seoul
  "FNJ",                                              // Pyongyang
  "BKK","DMK",                                        // Bangkok
  "HAN",                                              // Hanoi
  "PNH",                                              // Phnom Penh
  "VTE",                                              // Vientiane
  "RGN",                                              // Yangon
  "SIN",                                              // Singapore
  "KUL",                                              // KL
  "CGK","HLP",                                        // Jakarta
  "MNL",                                              // Manila
  "BWN",                                              // Bandar Seri Begawan
  "CBR",                                              // Canberra
  "WLG",                                              // Wellington
  "SUV","NAN",                                        // Suva (Nausori)
  "BSB",                                              // Brasília
  "EZE","AEP",                                        // Buenos Aires
  "LIM",                                              // Lima
  "SCL",                                              // Santiago
  "BOG",                                              // Bogotá
  "CCS",                                              // Caracas
  "PTY",                                              // Panama City
  "SJO",                                              // San José
  "GUA",                                              // Guatemala City
  "MGA",                                              // Managua
  "TGU",                                              // Tegucigalpa
  "SAL",                                              // San Salvador
  "BZE",                                              // Belmopan (BZE serves capital)
  "HAV",                                              // Havana
  "SDQ",                                              // Santo Domingo
  "SJU",                                              // San Juan (PR)
  "PAP",                                              // Port-au-Prince
  "KIN",                                              // Kingston
  "NAS",                                              // Nassau
  "ASU",                                              // Asunción
  "MVD",                                              // Montevideo
  "LPB",                                              // La Paz
  "POS",                                              // Port of Spain
]);

// Antipode of Matt's home base (Washington DC, ~38.85°N, -77.04°E). The
// geographic point on the opposite side of the Earth is roughly (-38.85,
// 102.96) — south-east of Madagascar / Indian Ocean / SW Australia. Any
// visited airport within ~1500 mi of this point earns "Antipodean Adventure."
const ANTIPODE_LAT = -38.85;
const ANTIPODE_LON = 102.96;
const ANTIPODE_RADIUS_MI = 1500;

// World's busiest top-50 hubs (used for Point-to-Point detection).
const TOP_HUBS_SET = new Set([
  "ATL","DFW","DEN","ORD","LAX","JFK","LAS","MIA","CLT","MCO","SEA","PHX","EWR","SFO","IAH","BOS",
  "MSP","FLL","LGA","DTW","BWI","PHL","SAN","TPA","DCA","HNL","AUS","SLC","MDW","SJC","DAL","IAD",
  "LHR","CDG","AMS","FRA","IST","MAD","BCN","FCO","MUC","ZRH","CPH","ARN","VIE","ATH","LIS","DUB",
  "HND","NRT","ICN","PEK","PVG","HKG","TPE","SIN","BKK","KUL","DEL","BOM","DXB","DOH","AUH","TLV",
  "SYD","MEL","AKL","BNE","YYZ","YVR","YUL","MEX","CUN","GRU","GIG","EZE","SCL","JNB","CAI","ADD","NBO","CPT",
]);
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
  metrics.distance_mi   = stats.miles;
  metrics.flight_hours  = stats.minutes / 60;
  metrics.countries     = stats.countries.size;
  metrics.airlines      = stats.airlines.size;
  metrics.airports      = stats.airportsCount;
  metrics.us_states     = stats.statesCount;
  metrics.earth_laps    = stats.earthLaps;
  metrics.moon_trips    = stats.moonTrips;

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

  // Expanded metrics
  let transatlantic = 0, transpacific = 0, coastToCoast = 0, internationalFlights = 0;
  let maxFlightMinutes = 0, minFlightMinutes = Infinity;
  let redEyeFlights = 0, holidayFlights = 0;
  let pointToPoint = 0, idlWest = 0, idlEast = 0, nyeAirborne = 0;
  let boeingSegments = 0, airbusSegments = 0;
  let hasNarrowbody = 0, hasWidebody = 0, hasA380 = 0, hasB747 = 0, hasB787 = 0;
  let hasNeo = 0, hasProp = 0, hasRegional = 0, hasMD80 = 0, hasDoubleDecker = 0;
  let hasTrijet = 0;
  let codeshareCount = 0;
  let capitalLink = 0;
  let maxAirportElevation = 0, belowSeaLevel = 0;
  let maxLatN = 0, maxLatS = 0;       // northernmost lat seen, southernmost (positive number magnitude)
  let antipodeVisited = 0;
  const alliancesSeen = new Set();
  const aircraftFamiliesSet = new Set();
  const flightNumberCount = new Map();       // "AA1839" -> n
  const tailCount = new Map();               // "N802NN" -> n
  const airportFirstLetters = new Set();     // {A,B,C,…}
  const domesticUSAirports = new Set();      // unique US airport codes
  const countriesPerYear = new Map();        // year -> Set of country codes
  const milesPerYear = new Map();            // year -> total miles
  const euCountries = new Set();             // ISO2 codes
  const asCountries = new Set();
  const TOP_10_HUB_CODES = ["ATL","DXB","DFW","LHR","HND","ORD","LAX","CDG","AMS","IST"];
  const top10Visited = new Set();

  const monthSet = new Set();
  const yearSet = new Set();
  const flightsByMonth = new Map();
  const flightsByYear = new Map();
  const seasonsByYear = new Map();
  const routesCount = new Map();
  const airlineCount = new Map();

  function getDate(f) {
    const d = new Date(f.depart);
    return isNaN(d) ? null : d;
  }
  // East/West coast US state buckets used for the Coast-to-Coast achievement
  const EAST_COAST = new Set(["ME","NH","MA","RI","CT","NY","NJ","PA","DE","MD","DC","VA","NC","SC","GA","FL"]);
  const WEST_COAST = new Set(["CA","OR","WA","AK","HI"]);
  // Aircraft family flags (TripIt's IATA 3-char codes)
  function classifyAircraft(code) {
    if (!code) return null;
    if (/^(73|7M)/.test(code))   return { fam: "Boeing 737",  mfr: "Boeing",  narrow: true };
    if (/^74/.test(code))        return { fam: "Boeing 747",  mfr: "Boeing",  wide: true, doubleDeck: true };
    if (/^75/.test(code))        return { fam: "Boeing 757",  mfr: "Boeing",  narrow: true };
    if (/^76/.test(code))        return { fam: "Boeing 767",  mfr: "Boeing",  wide: true };
    if (/^77/.test(code))        return { fam: "Boeing 777",  mfr: "Boeing",  wide: true };
    if (/^78/.test(code))        return { fam: "Boeing 787",  mfr: "Boeing",  wide: true };
    if (/^(31[89]|320|321|32A|31J|32N|32Q)$/.test(code)) return { fam: "Airbus A320 family", mfr: "Airbus", narrow: true, neo: /32N|32Q|31J/.test(code) };
    if (/^33/.test(code))        return { fam: "Airbus A330", mfr: "Airbus",  wide: true, neo: /339|338/.test(code) };
    if (/^34/.test(code))        return { fam: "Airbus A340", mfr: "Airbus",  wide: true };
    if (/^35/.test(code))        return { fam: "Airbus A350", mfr: "Airbus",  wide: true };
    if (/^38/.test(code))        return { fam: "Airbus A380", mfr: "Airbus",  wide: true, doubleDeck: true };
    if (/^(22|BCS)/.test(code))  return { fam: "Airbus A220", mfr: "Airbus",  narrow: true };
    if (/^E/.test(code))         return { fam: "Embraer E-Jet", mfr: "Embraer", regional: true };
    if (/^CR/.test(code))        return { fam: "Bombardier CRJ", mfr: "Bombardier", regional: true };
    if (/^DH/.test(code))        return { fam: "Dash 8",      mfr: "Bombardier", prop: true };
    if (/^AT/.test(code))        return { fam: "ATR",         mfr: "ATR",     prop: true };
    if (/^(SF|S20)/.test(code))  return { fam: "Saab",        mfr: "Saab",    prop: true };
    if (/^(M8|M9)/.test(code))   return { fam: "MD-80 family", mfr: "McDonnell Douglas", narrow: true, retro: true };
    return { fam: code };
  }
  // Capital hubs in middle east / southerner sets
  const MIDDLE_EAST_HUBS = ["DXB", "DOH", "AUH"];
  const SOUTHERNER_COUNTRIES = ["AU", "NZ", "ZA"];

  // Helper: holiday detection (Christmas, New Year's Day/Eve, Thanksgiving)
  function thanksgivingDate(year) {
    const nov1 = new Date(year, 10, 1);
    const dow = nov1.getDay();
    const firstThu = ((4 - dow + 7) % 7) + 1;
    return new Date(year, 10, firstThu + 21);
  }
  function isHoliday(d) {
    if (!d || isNaN(d)) return false;
    const m = d.getMonth(), day = d.getDate();
    if ((m === 11 && (day === 24 || day === 25 || day === 31)) || (m === 0 && day === 1)) return true;
    const tg = thanksgivingDate(d.getFullYear());
    return d.getMonth() === tg.getMonth() && d.getDate() === tg.getDate();
  }

  for (const f of flights) {
    const km = (f._miles || 0) * MI_TO_KM;
    if (km > maxSingle) maxSingle = km;
    if (km > 0 && km < 250) microFlight = 1;

    const aFrom = airports[f.from];
    const aTo   = airports[f.to];

    if (aFrom && aTo && aFrom.continent && aTo.continent && aFrom.continent !== aTo.continent) {
      if (TRANS_CONTINENTAL_PAIRS.has(pairKey(aFrom.continent, aTo.continent))) oceanCrossing = 1;
      // Transatlantic = Americas ↔ Europe/Africa
      const A = aFrom.continent, B = aTo.continent;
      const atlantic = (c1, c2) => (["NA","SA"].includes(c1) && ["EU","AF"].includes(c2)) ||
                                   (["EU","AF"].includes(c1) && ["NA","SA"].includes(c2));
      const pacific  = (c1, c2) => (["NA","SA"].includes(c1) && ["AS","OC"].includes(c2)) ||
                                   (["AS","OC"].includes(c1) && ["NA","SA"].includes(c2));
      if (atlantic(A, B)) transatlantic++;
      if (pacific(A, B))  transpacific++;
    }

    if (aFrom && aTo && aFrom.country && aTo.country && aFrom.country !== aTo.country) {
      internationalFlights++;
    }
    // Coast-to-coast (US only)
    if (aFrom?.country === "US" && aTo?.country === "US") {
      const e1 = EAST_COAST.has(aFrom.state), e2 = EAST_COAST.has(aTo.state);
      const w1 = WEST_COAST.has(aFrom.state), w2 = WEST_COAST.has(aTo.state);
      if ((e1 && w2) || (w1 && e2)) coastToCoast++;
    }
    // Point-to-point (neither endpoint in top-50 hub list)
    if (aFrom && aTo && !TOP_HUBS_SET.has(aFrom.code) && !TOP_HUBS_SET.has(aTo.code)) pointToPoint++;
    // Capital Link (both endpoints in the curated capital-airports set)
    if (aFrom && aTo && CAPITAL_AIRPORTS.has(aFrom.code) && CAPITAL_AIRPORTS.has(aTo.code)) capitalLink++;

    // Geographic curiosities (existing + extensions)
    if (aFrom && aTo && aFrom.lat != null && aTo.lat != null) {
      if (Math.sign(aFrom.lat) !== Math.sign(aTo.lat) && aFrom.lat !== 0 && aTo.lat !== 0) equatorCrossing = 1;
      if (aFrom.lat >= ARCTIC_LAT || aTo.lat >= ARCTIC_LAT) arcticFlight = 1;
      const lo1 = aFrom.lon, lo2 = aTo.lon;
      if (lo1 < -90 && lo2 > 90) idlWest++;
      else if (lo1 > 90 && lo2 < -90) idlEast++;
      // Northernmost / southernmost latitudes touched
      for (const ap of [aFrom, aTo]) {
        if (ap.lat >  maxLatN) maxLatN = ap.lat;
        if (ap.lat < -maxLatS) maxLatS = -ap.lat;
      }
    }

    // Airport elevation extremes (needs the rebuilt airports.json with elevation_ft)
    for (const ap of [aFrom, aTo]) {
      if (!ap) continue;
      const e = ap.elevation_ft || 0;
      if (e > maxAirportElevation) maxAirportElevation = e;
      if (e < 0) belowSeaLevel = 1;
      // Antipodean: any visited airport within ~1500 mi of Matt's antipode
      if (ap.lat != null && ap.lon != null) {
        const dist = airportHaversineMiles(ap.lat, ap.lon, ANTIPODE_LAT, ANTIPODE_LON);
        if (dist <= ANTIPODE_RADIUS_MI) antipodeVisited = 1;
      }
    }

    // Alliance of the marketing carrier (from curated_airlines overlay)
    if (f.airline_code) {
      const al = ctx.airlines?.[f.airline_code]?.alliance;
      if (al) alliancesSeen.add(al);
    }

    // Codeshare flag set by AeroDataBox enrichment
    if (f.is_codeshare) codeshareCount++;

    // Flight duration extremes
    const mins = f._minutes || 0;
    if (mins > maxFlightMinutes) maxFlightMinutes = mins;
    if (mins > 0 && mins < minFlightMinutes) minFlightMinutes = mins;

    // Aircraft classification
    const ac = classifyAircraft(f.aircraft);
    if (ac) {
      if (ac.fam) aircraftFamiliesSet.add(ac.fam);
      if (ac.mfr === "Boeing") boeingSegments++;
      if (ac.mfr === "Airbus") airbusSegments++;
      if (ac.narrow)     hasNarrowbody = 1;
      if (ac.wide)       hasWidebody = 1;
      if (ac.fam === "Airbus A380") hasA380 = 1;
      if (ac.fam === "Boeing 747") hasB747 = 1;
      if (ac.fam === "Boeing 787") hasB787 = 1;
      if (ac.neo)        hasNeo = 1;
      if (ac.prop)       hasProp = 1;
      if (ac.regional)   hasRegional = 1;
      if (ac.retro)      hasMD80 = 1;
      if (ac.doubleDeck) hasDoubleDecker = 1;
    }
    // Tri-jets: MD-11 (M11), DC-10 (D10), L-1011 (L10), Falcon (F50/F2T), B727 (72S)
    if (/^(M11|D10|L10|72S|F50|F2T)/.test(f.aircraft || "")) hasTrijet = 1;

    // Same flight number repeats
    if (f.airline_code && f.flight_number) {
      const k = `${f.airline_code}${f.flight_number}`;
      flightNumberCount.set(k, (flightNumberCount.get(k) || 0) + 1);
    }
    // Same tail repeats (AeroDataBox enrichment only)
    if (f.tail_number) tailCount.set(f.tail_number, (tailCount.get(f.tail_number) || 0) + 1);

    // Airport alphabet & domestic-US set
    if (f.from && f.from[0]) airportFirstLetters.add(f.from[0].toUpperCase());
    if (f.to   && f.to[0])   airportFirstLetters.add(f.to[0].toUpperCase());
    if (aFrom?.country === "US") domesticUSAirports.add(aFrom.code);
    if (aTo?.country   === "US") domesticUSAirports.add(aTo.code);

    // Top-10 global hub overlap
    if (aFrom && TOP_10_HUB_CODES.includes(aFrom.code)) top10Visited.add(aFrom.code);
    if (aTo   && TOP_10_HUB_CODES.includes(aTo.code))   top10Visited.add(aTo.code);

    // Regional country buckets (EU/AS)
    if (aTo?.continent === "EU") euCountries.add(aTo.country);
    if (aFrom?.continent === "EU") euCountries.add(aFrom.country);
    if (aTo?.continent === "AS") asCountries.add(aTo.country);
    if (aFrom?.continent === "AS") asCountries.add(aFrom.country);

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
      const m = d.getMonth();
      const season = m < 2 || m === 11 ? "winter"
                    : m < 5  ? "spring"
                    : m < 8  ? "summer"
                    : "fall";
      const y = d.getFullYear();
      if (!seasonsByYear.has(y)) seasonsByYear.set(y, new Set());
      seasonsByYear.get(y).add(season);

      // New per-flight temporal metrics
      if (h >= 22 || h < 6) redEyeFlights++;
      if (isHoliday(d)) holidayFlights++;
      // NYE airborne: depart Dec 31 + arrive Jan 1
      if (d.getMonth() === 11 && d.getDate() === 31 && f.arrive) {
        const a = new Date(f.arrive);
        if (!isNaN(a) && (a.getMonth() === 0 && a.getDate() === 1)) nyeAirborne++;
      }
      // Per-year country & miles tallies
      if (!countriesPerYear.has(y)) countriesPerYear.set(y, new Set());
      if (aFrom?.country) countriesPerYear.get(y).add(aFrom.country);
      if (aTo?.country)   countriesPerYear.get(y).add(aTo.country);
      milesPerYear.set(y, (milesPerYear.get(y) || 0) + (f._miles || 0));
    }

    if (f.from && f.to) {
      const key = `${f.from}-${f.to}`;
      routesCount.set(key, (routesCount.get(key) || 0) + 1);
    }
    if (f.airline_code) airlineCount.set(f.airline_code, (airlineCount.get(f.airline_code) || 0) + 1);
  }
  if (!isFinite(minFlightMinutes)) minFlightMinutes = 0;

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

  // ── EXPANSION metrics ─────────────────────────────────────────────────
  metrics.transatlantic         = transatlantic;
  metrics.transpacific          = transpacific;
  metrics.domestic_airports     = domesticUSAirports.size;
  metrics.coast_to_coast        = coastToCoast;
  metrics.international_flights = internationalFlights;
  metrics.max_flight_minutes    = maxFlightMinutes;
  metrics.min_flight_minutes    = minFlightMinutes;
  metrics.red_eye_flights       = redEyeFlights;
  metrics.holiday_flights       = holidayFlights;
  metrics.point_to_point        = pointToPoint;
  metrics.idl_west_count        = idlWest;
  metrics.idl_east_count        = idlEast;
  metrics.nye_airborne          = nyeAirborne;
  metrics.boeing_segments       = boeingSegments;
  metrics.airbus_segments       = airbusSegments;
  metrics.has_narrowbody        = hasNarrowbody;
  metrics.has_widebody          = hasWidebody;
  metrics.has_a380              = hasA380;
  metrics.has_747               = hasB747;
  metrics.has_787               = hasB787;
  metrics.has_neo               = hasNeo;
  metrics.has_propeller         = hasProp;
  metrics.has_regional          = hasRegional;
  metrics.has_md80              = hasMD80;
  metrics.has_doubledecker      = hasDoubleDecker;
  metrics.aircraft_families     = aircraftFamiliesSet.size;
  metrics.airport_alphabet      = airportFirstLetters.size;
  metrics.top_10_hubs           = top10Visited.size;
  metrics.max_tail_repeats      = tailCount.size ? Math.max(0, ...tailCount.values()) : 0;
  metrics.max_repeat_flightno   = flightNumberCount.size ? Math.max(0, ...flightNumberCount.values()) : 0;
  metrics.eu_countries          = euCountries.size;
  metrics.as_countries          = asCountries.size;

  // Span in years
  const years = [...yearSet].map(Number).filter(n => !isNaN(n));
  metrics.years_span = years.length ? (Math.max(...years) - Math.min(...years) + 1) : 0;

  // Countries-per-year: max number of distinct countries visited in any year
  metrics.countries_per_year = countriesPerYear.size
    ? Math.max(...[...countriesPerYear.values()].map(s => s.size))
    : 0;
  // Best year for miles
  metrics.best_year_miles = milesPerYear.size ? Math.max(...milesPerYear.values()) : 0;

  // Middle East hubs + Southerner-country bundles
  metrics.middle_east_set = MIDDLE_EAST_HUBS.filter(c => stats.airports.has(c)).length;
  metrics.southerner_set  = SOUTHERNER_COUNTRIES.filter(c => stats.countries.has(c)).length;

  // Expansion v2 metrics
  metrics.capital_link            = capitalLink;
  metrics.max_airport_elevation   = maxAirportElevation;
  metrics.below_sea_level         = belowSeaLevel;
  metrics.max_lat_n               = maxLatN;
  metrics.max_lat_s               = maxLatS;
  metrics.antipode_visited        = antipodeVisited;
  metrics.has_trijet              = hasTrijet;
  metrics.codeshare_count         = codeshareCount;
  metrics.alliances               = alliancesSeen.size;

  // ── Layover analysis (requires consecutive flights within a trip) ─────
  // Without trip metadata, fall back to "consecutive flights within 24h"
  // grouped by trip_id when present, by date-proximity when not.
  let maxLayover = 0;
  let tightConnection = 0;     // 1 if we ever connected in under 60min
  let maxTripLegs = 0;
  let backToBack = 0;
  {
    const byTrip = new Map();
    for (const f of flights) {
      const key = f.trip_id ?? "_loose_";
      if (!byTrip.has(key)) byTrip.set(key, []);
      byTrip.get(key).push(f);
    }
    for (const [tid, list] of byTrip) {
      list.sort((a, b) => (a.depart || "").localeCompare(b.depart || ""));
      if (tid !== "_loose_") {
        if (list.length > maxTripLegs) maxTripLegs = list.length;
      }
      for (let i = 1; i < list.length; i++) {
        const prev = list[i - 1], cur = list[i];
        if (!prev.arrive || !cur.depart) continue;
        const gap = (new Date(cur.depart).getTime() - new Date(prev.arrive).getTime()) / 60000;
        if (!isFinite(gap) || gap < 0) continue;
        if (gap < 24 * 60) backToBack = 1;
        // Only count as a "layover" if same trip — otherwise it's just two
        // unrelated trips back-to-back, not a connection.
        if (tid !== "_loose_" && gap < 12 * 60) {
          if (gap > maxLayover) maxLayover = gap;
          if (gap > 0 && gap < 60) tightConnection = 1;
        }
      }
    }
  }
  metrics.max_layover_minutes = maxLayover;
  metrics.tight_connection    = tightConnection;
  metrics.max_trip_legs       = maxTripLegs;
  metrics.back_to_back        = backToBack;

  // Continental Link — max number of continents touched in a single trip
  let maxContinentsPerTrip = 0;
  {
    const tripContinents = new Map();
    for (const f of flights) {
      if (!f.trip_id) continue;   // requires trip_id from /list/trip enrichment
      const set = tripContinents.get(f.trip_id) || new Set();
      for (const code of [f.from, f.to]) {
        const ap = airports[code];
        if (ap?.continent) set.add(ap.continent);
      }
      tripContinents.set(f.trip_id, set);
    }
    for (const set of tripContinents.values()) {
      if (set.size > maxContinentsPerTrip) maxContinentsPerTrip = set.size;
    }
  }
  metrics.max_continents_per_trip = maxContinentsPerTrip;

  // Decorate each definition with its progress.
  // Two-pass: skip the "wright_stuff" meta on the first pass so we can derive
  // it from how many categories have at least one unlocked achievement.
  let results = ACHIEVEMENTS.map(a => {
    if (a.type === "wright_stuff") return { ...a, current: 0, ratio: 0, unlocked: false };
    const current = metrics[a.type] ?? 0;
    const ratio = Math.max(0, Math.min(1, a.req > 0 ? current / a.req : 0));
    return { ...a, current, ratio, unlocked: current >= a.req };
  });
  // Now compute the meta achievement based on category coverage
  const categoriesUnlocked = new Set();
  for (const r of results) if (r.unlocked && r.type !== "wright_stuff") categoriesUnlocked.add(r.category);
  const wrightCategories = new Set(ACHIEVEMENTS.filter(a => a.type !== "wright_stuff").map(a => a.category));
  results = results.map(r => {
    if (r.type !== "wright_stuff") return r;
    const current = categoriesUnlocked.size;
    const required = wrightCategories.size;  // every category must be covered
    return { ...r, current, ratio: current / required, unlocked: current >= required, req: required };
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

// Great-circle distance in miles between two lat/lon points
function airportHaversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.7613;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
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
  if (ach.type === "domestic_airports") {
    const items = [];
    for (const [code, n] of s.airports) {
      const ap = ctx.airports[code];
      if (ap?.country === "US") items.push(`<code>${code}</code> <span class="muted small">${n}×</span>`);
    }
    return items.sort().slice(0, limit);
  }
  if (ach.type === "eu_countries") {
    const items = [];
    for (const [code, info] of s.countries) {
      const ap = ctx.airports[[...s.flightsByCountry.get(code) || []][0]?.to];
      if (ap?.continent === "EU" || REGION_HINT_EU.has(code)) {
        items.push(`${info.flag || ""} ${info.name || code}`);
      }
    }
    return items.slice(0, limit);
  }
  if (ach.type === "as_countries") {
    const items = [];
    for (const [code, info] of s.countries) {
      if (REGION_HINT_AS.has(code)) items.push(`${info.flag || ""} ${info.name || code}`);
    }
    return items.slice(0, limit);
  }
  if (ach.type === "top_10_hubs") {
    const top10 = ["ATL","DXB","DFW","LHR","HND","ORD","LAX","CDG","AMS","IST"];
    return top10.map(c => {
      const visited = s.airports.has(c);
      return `<code style="${visited ? "" : "opacity:.4;text-decoration:line-through"}">${c}</code>${visited ? " ✓" : ""}`;
    });
  }
  if (ach.type === "middle_east_set") {
    return ["DXB","DOH","AUH"].map(c => {
      const visited = s.airports.has(c);
      return `<code style="${visited ? "" : "opacity:.4;text-decoration:line-through"}">${c}</code>${visited ? " ✓" : ""}`;
    });
  }
  if (ach.type === "southerner_set") {
    return ["AU","NZ","ZA"].map(c => {
      const info = s.countries.get(c);
      const visited = !!info;
      return `<code style="${visited ? "" : "opacity:.4;text-decoration:line-through"}">${c}</code> ${info?.name || c}${visited ? " ✓" : ""}`;
    });
  }
  return [];
}

// Country code -> region hint used by the EU/AS list builders so we can
// classify even when an airport isn't in the visited-airports set yet.
const REGION_HINT_EU = new Set(["GB","IE","FR","DE","IT","ES","PT","NL","BE","CH","AT","HR","DK","FI","SE","NO","PL","CZ","GR","HU","RO","BG","SK","SI","RS","BA","ME","MK","AL","UA","BY","RU","TR","CY","MT","EE","LV","LT","IS","LU","LI","MC","SM","AD","VA"]);
const REGION_HINT_AS = new Set(["JP","CN","SG","KR","TH","VN","IN","PH","ID","MY","TW","HK","MO","KH","LA","MM","BD","LK","NP","PK","UZ","KZ","MN","BT","BN","TL","MV"]);

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
    // Expansion types
    case "transatlantic":          return `Any flight between the Americas and Europe/Africa`;
    case "transpacific":           return `Any flight between the Americas and Asia/Oceania`;
    case "domestic_airports":      return `Visit ${ach.req} unique US airports`;
    case "max_flight_minutes":     return `A single flight of ${Math.round(ach.req/60)}h ${ach.req%60}m or longer`;
    case "min_flight_minutes":     return `A single flight shorter than ${ach.req} minutes (you need any with duration ≤ ${ach.req}m)`;
    case "coast_to_coast":         return `A US flight connecting an east-coast and a west-coast state`;
    case "countries_per_year":     return `${ach.req} different countries visited within a single calendar year`;
    case "international_flights":  return `${ach.req} flights that cross an international border`;
    case "has_narrowbody":         return `One flight on a 737, A320 family, A220, or 757`;
    case "has_widebody":           return `One flight on any twin-aisle widebody`;
    case "has_a380":               return `One flight on an Airbus A380`;
    case "has_747":                return `One flight on a Boeing 747`;
    case "has_787":                return `One flight on a Boeing 787 Dreamliner`;
    case "has_neo":                return `One flight on an A320neo, A330neo, or 737 MAX`;
    case "has_propeller":          return `One flight on a turboprop (ATR, Dash 8, Saab)`;
    case "has_regional":           return `One flight on a regional jet (Embraer or CRJ)`;
    case "has_md80":               return `One flight on an MD-80 / MD-90 family jet`;
    case "has_doubledecker":       return `One flight on a 747 or A380 (any double-decker)`;
    case "aircraft_families":      return `Fly on ${ach.req} different aircraft families`;
    case "boeing_segments":        return `${ach.req} flight segments on Boeing aircraft`;
    case "airbus_segments":        return `${ach.req} flight segments on Airbus aircraft`;
    case "max_tail_repeats":       return `Fly on the same physical aircraft (tail number) ${ach.req} times — needs AeroDataBox enrichment`;
    case "distance_mi":            return `${ach.req.toLocaleString()} total miles flown`;
    case "earth_laps":             return `Fly the equivalent of ${ach.req} ${ach.req === 1 ? "lap" : "laps"} around Earth (24,901 mi each)`;
    case "moon_trips":             return `Fly the distance to the Moon (~238,855 miles)`;
    case "red_eye_flights":        return `A flight departing after 22:00 and arriving before 06:00 next day`;
    case "max_layover_minutes":    return `Have a connection between flights longer than ${Math.round(ach.req/60)} hours`;
    case "tight_connection":       return `Connect through an airport in under 60 minutes (same trip)`;
    case "max_trip_legs":          return `A trip containing ${ach.req} or more flight segments`;
    case "max_repeat_flightno":    return `The same airline + flight number, flown ${ach.req} times`;
    case "airport_alphabet":       return `Visit airports whose IATA codes begin with all 26 letters A–Z`;
    case "top_10_hubs":            return `Visit all 10 of the world's busiest airports (ATL, DXB, DFW, LHR, HND, ORD, LAX, CDG, AMS, IST)`;
    case "point_to_point":         return `A flight where neither airport is in the global top-50 hub list`;
    case "back_to_back":           return `Take two flights within 24 hours of each other`;
    case "holiday_flights":        return `A flight on Christmas Eve/Day, New Year's, or Thanksgiving`;
    case "idl_west_count":         return `A flight crossing the International Date Line westbound (e.g. LAX → SYD)`;
    case "idl_east_count":         return `A flight crossing the International Date Line eastbound (e.g. SYD → LAX)`;
    case "nye_airborne":           return `Be airborne when the clock strikes midnight on December 31st`;
    case "best_year_miles":        return `Fly ${ach.req.toLocaleString()} miles within a single calendar year`;
    case "years_span":             return `Span ${ach.req} years between your first and most recent flight`;
    case "eu_countries":           return `Visit airports in ${ach.req} different European countries`;
    case "as_countries":           return `Visit airports in ${ach.req} different Asian countries`;
    case "middle_east_set":        return `Visit all of DXB, DOH, and AUH`;
    case "southerner_set":         return `Visit all of Australia, New Zealand, and South Africa`;
    case "wright_stuff":           return `Unlock at least one achievement in every category`;
    // Expansion v2
    case "capital_link":           return `A flight where both airports serve national capital cities`;
    case "max_airport_elevation":  return `Land at an airport at or above ${ach.req.toLocaleString()} ft elevation`;
    case "below_sea_level":        return `Land at an airport below sea level`;
    case "max_lat_n":              return `Touch an airport at ${ach.req}°N or further north`;
    case "max_lat_s":              return `Touch an airport at ${ach.req}°S or further south`;
    case "antipode_visited":       return `Fly to an airport on the opposite side of the world from Washington D.C.`;
    case "has_trijet":             return `One flight on a 3-engined aircraft (MD-11, L-1011, DC-10, B727)`;
    case "codeshare_count":        return `Fly a flight where the operating airline differs from the marketing carrier`;
    case "alliances":              return `Fly on members of all three global alliances (Star, oneworld, SkyTeam)`;
    case "max_continents_per_trip":return `A trip whose flights touch ${ach.req} different continents`;
    default:                       return ach.desc;
  }
}

// Classify an achievement type by how it should be measured/displayed.
//   - "count"  : cumulative — unlocked when running total ≥ req. The
//                threshold-crossing flight is meaningful.
//   - "event"  : counts how many times something happened (>=1). For low
//                req, every qualifying flight is interesting.
//   - "set"    : unlocked when the cardinality of a distinct-item set ≥ req.
//                Show all items in the set.
//   - "maxof"  : pick the single best instance (longest, fastest, most
//                repeats, etc.) and show it. Other top instances are also
//                interesting.
//   - "span"   : time-span between first & last flight.
//   - "meta"   : derived from other achievements.
function metricKind(type) {
  if (["flights_count","distance_km","distance_mi","flight_hours","earth_laps","moon_trips","boeing_segments","airbus_segments"].includes(type)) return "count";
  if (["countries","airlines","airports","us_states","continents","domestic_airports","aircraft_families","airport_alphabet","top_10_hubs","eu_countries","as_countries","middle_east_set","southerner_set"].includes(type)) return "set";
  if (["single_flight_distance","max_flight_minutes","min_flight_minutes","airline_loyalty","same_route","flights_per_month","flights_per_year","best_year_miles","countries_per_year","max_layover_minutes","max_trip_legs","max_repeat_flightno","max_tail_repeats","consecutive_months"].includes(type)) return "maxof";
  if (type === "years_span") return "span";
  if (type === "wright_stuff") return "meta";
  return "event";
}

// Format a single flight as a compact row with its airline logo.
// Includes a stable data-fi handle so the modal can wire a click handler that
// opens the side pane with full flight detail.
function flightRow(f, ctx, opts = {}) {
  const code = f.airline_code;
  const name = airlineDisplayName(code, ctx.airlines, f.airline);
  const url  = airlineLogoUrl(code, ctx.airlines);
  const logo = url
    ? `<img class="airline-logo" src="${url}" alt="${escapeHtml(name || code || "")}" onerror="this.classList.add('is-missing')"/>`
    : "";
  const extra = opts.extra ? `<span class="muted small">${escapeHtml(opts.extra)}</span>` : "";
  const fi = f.__fi != null ? f.__fi : (ctx._flightIndex?.get?.(f) ?? "");
  return `
    <div class="ach-flight-row" data-fi="${fi}" tabindex="0" role="button" title="Click for full details">
      ${logo}
      <div class="ach-flight-info">
        <div class="ach-flight-route">${f.from} → ${f.to}</div>
        <div class="ach-flight-meta muted">
          ${escapeHtml([code, f.flight_number].filter(Boolean).join(" "))}
          ${escapeHtml(name) ? `· ${escapeHtml(name)}` : ""}
        </div>
      </div>
      <div class="ach-flight-side">
        <div>${formatDate(f.depart)}</div>
        ${extra}
      </div>
    </div>`;
}

// Build all detail sections for a given achievement. Returns an array of
// {label, html} blocks the modal renders in order.
function buildAchievementDetail(ach, ctx) {
  const kind = metricKind(ach.type);
  const s = ctx.stats;
  const blocks = [];

  // ── progress banner ────────────────────────────────────────────────────
  if (ach.unlocked) {
    const summary = buildUnlockedSummary(ach, ctx);
    blocks.push({ html: `<div class="ach-detail-progress unlocked">${summary}</div>` });
  } else {
    let remaining = Math.max(0, ach.req - ach.current);
    let remStr;
    if (ach.type === "distance_km")      remStr = `${Math.round(remaining).toLocaleString()} km`;
    else if (ach.type === "distance_mi") remStr = `${Math.round(remaining).toLocaleString()} mi`;
    else if (ach.type === "flight_hours")remStr = `${remaining.toFixed(1)} hours`;
    else if (ach.type === "years_span")  remStr = `${remaining} more year${remaining === 1 ? "" : "s"}`;
    else                                 remStr = `${Math.round(remaining).toLocaleString()}`;
    blocks.push({
      html: `
        <div class="ach-detail-progress">
          <div class="ach-detail-bar"><div class="ach-detail-bar-fill" style="width:${ach.ratio*100}%"></div></div>
          <div class="ach-detail-numbers">
            <strong>${formatNumber(ach.current)}</strong> of <strong>${formatNumber(ach.req)}</strong>
            · <span class="muted">${remStr} to go</span>
          </div>
        </div>
        <div class="ach-needs">
          <div class="lbl">How to unlock</div>
          <div>${describeRequirement(ach)}</div>
        </div>`,
    });
  }

  // ── type-specific detail body ──────────────────────────────────────────

  // SET: show all items in the set with checkmarks/dates
  if (kind === "set") {
    const items = buildSetItems(ach, ctx);
    if (items.length) {
      const collected = items.filter(i => i.visited).length;
      blocks.push({
        html: `<div class="ach-items">
          <div class="lbl">Items collected <span class="muted">(${collected}${ach.type === "us_states" ? " of 50" : items.length > collected ? " of " + items.length : ""})</span></div>
          <div class="ach-items-list">
            ${items.map(i =>
              `<div class="ach-item ${i.visited ? "is-visited" : "is-missing"}">${i.label}${i.date ? ` <span class="ach-item-date">${i.date}</span>` : ""}</div>`
            ).join("")}
          </div>
        </div>`,
      });
    }
  }

  // COUNT: show threshold flight + recent qualifying flights
  if (kind === "count") {
    const flights = qualifyingFlights(ach, ctx);
    const thresholdFlight = ach.unlocked ? findThresholdFlight(ach, ctx) : null;
    if (thresholdFlight) {
      blocks.push({
        html: `<div class="ach-earned">
          <div class="lbl">Threshold crossed by</div>
          ${flightRow(thresholdFlight, ctx, { extra: thresholdNote(ach, thresholdFlight, ctx) })}
        </div>`,
      });
    }
    if (flights.length > 1) {
      const recent = flights.slice(-8).reverse();
      blocks.push({
        html: `<div class="ach-items">
          <div class="lbl">Most recent qualifying flights <span class="muted">(showing ${recent.length} of ${flights.length})</span></div>
          ${recent.map(f => flightRow(f, ctx)).join("")}
        </div>`,
      });
    }
  }

  // EVENT: every flight that triggered this achievement
  if (kind === "event") {
    const flights = qualifyingFlights(ach, ctx);
    if (flights.length) {
      const sampleN = Math.min(flights.length, 12);
      const sample = flights.slice(-sampleN).reverse();
      blocks.push({
        html: `<div class="ach-items">
          <div class="lbl">Achieved ${flights.length} time${flights.length === 1 ? "" : "s"}${sampleN < flights.length ? ` <span class="muted">(showing ${sampleN} most recent)</span>` : ""}</div>
          ${sample.map(f => flightRow(f, ctx, { extra: eventExtra(ach, f, ctx) })).join("")}
        </div>`,
      });
    }
  }

  // MAXOF: show the record-holding instance + a top-N ranking
  if (kind === "maxof") {
    const max = buildMaxOf(ach, ctx);
    if (max?.record) {
      blocks.push({
        html: `<div class="ach-earned">
          <div class="lbl">Your record</div>
          ${max.record}
        </div>`,
      });
    }
    if (max?.ranking?.length) {
      blocks.push({
        html: `<div class="ach-items">
          <div class="lbl">${max.rankingLabel || "Top instances"}</div>
          ${max.ranking.join("")}
        </div>`,
      });
    }
  }

  // SPAN: first + last flight
  if (kind === "span") {
    if (s.firstFlight && s.lastFlight) {
      const firstF = ctx.flights.reduce((a,b) => (a.depart || "") < (b.depart || "") ? a : b);
      const lastF  = ctx.flights.reduce((a,b) => (a.depart || "") > (b.depart || "") ? a : b);
      blocks.push({
        html: `<div class="ach-earned">
          <div class="lbl">First flight on record</div>
          ${flightRow(firstF, ctx)}
        </div>
        <div class="ach-earned">
          <div class="lbl">Most recent flight</div>
          ${flightRow(lastF, ctx)}
        </div>`,
      });
    }
  }

  // META (Wright Stuff): show category coverage
  if (kind === "meta" && ach.type === "wright_stuff") {
    const results = (function () {
      // Re-derive category coverage from globally evaluated results.
      // We don't have access here, so just enumerate from ACHIEVEMENTS list.
      const byCat = new Map();
      for (const a of ACHIEVEMENTS) {
        if (a.type === "wright_stuff") continue;
        if (!byCat.has(a.category)) byCat.set(a.category, { unlocked: 0, total: 0 });
        byCat.get(a.category).total++;
      }
      // Stats can't tell us directly which are unlocked; the modal opener
      // resolves `ach` from a fully-evaluated list so we recompute briefly.
      return byCat;
    })();
    const rows = [...results.entries()].map(([cat, info]) =>
      `<div class="ach-item is-visited"><strong>${cat}</strong> <span class="muted small">${info.total} achievements</span></div>`
    );
    blocks.push({
      html: `<div class="ach-items">
        <div class="lbl">Categories</div>
        <div class="ach-items-list">${rows.join("")}</div>
      </div>`,
    });
  }

  return blocks;
}

// "Unlocked …" headline. Two-line: "✓ Unlocked at TARGET" + "Now at CURRENT".
// Phrasing varies by metric kind so each one reads naturally.
function buildUnlockedSummary(ach, ctx) {
  const kind = metricKind(ach.type);
  const noun = itemNoun(ach.type);

  function format(value) {
    switch (ach.type) {
      case "distance_km":   return `${formatNumber(value)} km`;
      case "distance_mi":   return `${formatNumber(value)} mi`;
      case "flight_hours":  return `${Number(value).toFixed(1)} hours`;
      case "earth_laps":    return `${Number(value).toFixed(2)}× around Earth`;
      case "moon_trips":    return `${Number(value).toFixed(2)}× to the Moon`;
      case "years_span":    return `${Math.round(value)} year${Math.round(value) === 1 ? "" : "s"}`;
      default:              return `${formatNumber(value)}${noun && noun !== "items" ? " " + noun : ""}`;
    }
  }

  // Maxof — the unlock condition itself is the best instance; no separate "now" line.
  if (kind === "maxof") {
    return `<strong>✓ Unlocked.</strong> ${maxOfSummary(ach, ctx)}`;
  }
  // Meta (Wright Stuff)
  if (kind === "meta") {
    return `<strong>✓ Unlocked.</strong> All <strong>${ach.current}</strong> categories covered.`;
  }

  const target = format(ach.req);
  const now    = format(ach.current);

  if (kind === "span") {
    return `<strong>✓ Unlocked at ${target}.</strong> You now span <strong>${now}</strong>.`;
  }
  if (kind === "set") {
    return `<strong>✓ Unlocked at ${target}.</strong> You've now collected <strong>${now}</strong>.`;
  }
  if (kind === "event") {
    if (ach.req === 1) {
      return ach.current === 1
        ? `<strong>✓ Unlocked</strong> on your first qualifying flight.`
        : `<strong>✓ Unlocked</strong> on your first qualifying flight. You've now done this <strong>${formatNumber(ach.current)}</strong> times.`;
    }
    return `<strong>✓ Unlocked at ${formatNumber(ach.req)}.</strong> You're now at <strong>${formatNumber(ach.current)}</strong>.`;
  }
  // count
  return `<strong>✓ Unlocked at ${target}.</strong> You're now at <strong>${now}</strong>.`;
}

function itemNoun(type) {
  switch (type) {
    case "countries":          return "countries";
    case "us_states":          return "states";
    case "airlines":           return "airlines";
    case "airports":           return "airports";
    case "continents":         return "continents";
    case "domestic_airports":  return "US airports";
    case "aircraft_families":  return "aircraft families";
    case "airport_alphabet":   return "letters";
    case "top_10_hubs":        return "hubs";
    case "eu_countries":       return "European countries";
    case "as_countries":       return "Asian countries";
    case "middle_east_set":    return "Middle East hubs";
    case "southerner_set":     return "southern-hemisphere countries";
    default:                   return "items";
  }
}

// "Best" line for maxof types
function maxOfSummary(ach, ctx) {
  const s = ctx.stats;
  switch (ach.type) {
    case "single_flight_distance":
      return s.longest ? `${s.longest.from} → ${s.longest.to}, ${Math.round(s.longest._miles).toLocaleString()} mi (${(s.longest._miles * 1.60934).toFixed(0)} km)` : "—";
    case "max_flight_minutes":
      return s.longestTime ? `${s.longestTime.from} → ${s.longestTime.to}, ${formatDuration(s.longestTime._minutes)}` : "—";
    case "min_flight_minutes":
      return s.shortestTime ? `${s.shortestTime.from} → ${s.shortestTime.to}, ${formatDuration(s.shortestTime._minutes)}` : "—";
    case "airline_loyalty": {
      const top = s.topAirlines[0];
      if (!top) return "—";
      const name = airlineDisplayName(top.key, ctx.airlines, top.info?.name);
      return `${name} (${top.key}) — ${top.value} flights`;
    }
    case "same_route":
      return s.topRoutes[0] ? `${s.topRoutes[0].key} flown ${s.topRoutes[0].value} times` : "—";
    case "flights_per_month": {
      let best = ["", 0];
      for (const [ym, n] of (s.monthly || [])) if (n > best[1]) best = [ym, n];
      return best[1] ? `${best[1]} flights in ${best[0]}` : `${ach.current} flights in your best month`;
    }
    case "flights_per_year": {
      let best = [null, 0];
      for (const [y, n] of (s.yearTotals || [])) if (n > best[1]) best = [y, n];
      return best[1] ? `${best[1]} flights in ${best[0]}` : `${ach.current} flights in your best year`;
    }
    case "best_year_miles": {
      // We don't have miles-per-year stored in stats, recompute
      const milesByYear = new Map();
      for (const f of ctx.flights) {
        const d = new Date(f.depart);
        if (isNaN(d)) continue;
        milesByYear.set(d.getFullYear(), (milesByYear.get(d.getFullYear()) || 0) + (f._miles || 0));
      }
      let best = [null, 0];
      for (const [y, m] of milesByYear) if (m > best[1]) best = [y, m];
      return best[1] ? `${Math.round(best[1]).toLocaleString()} mi in ${best[0]}` : "—";
    }
    case "countries_per_year": {
      const cpy = new Map();
      for (const f of ctx.flights) {
        const d = new Date(f.depart);
        if (isNaN(d)) continue;
        const y = d.getFullYear();
        if (!cpy.has(y)) cpy.set(y, new Set());
        const aFrom = ctx.airports[f.from];
        const aTo   = ctx.airports[f.to];
        if (aFrom?.country) cpy.get(y).add(aFrom.country);
        if (aTo?.country)   cpy.get(y).add(aTo.country);
      }
      let best = [null, 0];
      for (const [y, set] of cpy) if (set.size > best[1]) best = [y, set.size];
      return best[1] ? `${best[1]} countries in ${best[0]}` : "—";
    }
    case "max_layover_minutes": {
      const lay = findMaxLayover(ctx);
      return lay ? `${formatDuration(lay.minutes)} between ${lay.prev.to} arrivals and ${lay.next.from} departure (${formatDate(lay.prev.arrive)})` : `${formatDuration(ach.current)}`;
    }
    case "max_trip_legs":
      return `${ach.current}-leg trip`;
    case "max_repeat_flightno": {
      const top = topRepeatedFlightNumber(ctx);
      return top ? `${top.key} — flown ${top.count} times` : `${ach.current} repeats`;
    }
    case "max_tail_repeats": {
      const top = s.topTails?.[0];
      return top ? `Tail ${top.key} — ${top.value} flights` : `${ach.current} times`;
    }
    case "consecutive_months":
      return `${ach.current}-month streak`;
    default:
      return `${ach.current}`;
  }
}

// Build items for SET-type achievements, each with {label, visited, date}
function buildSetItems(ach, ctx) {
  const s = ctx.stats;
  function firstVisitDate(filterFn) {
    let first = null;
    for (const f of ctx.flights) {
      if (filterFn(f)) {
        const d = new Date(f.depart);
        if (!isNaN(d) && (!first || d < first)) first = d;
      }
    }
    return first;
  }
  if (ach.type === "countries") {
    const all = [...s.countries.entries()].sort((a,b) => b[1].count - a[1].count);
    return all.map(([code, info]) => {
      const d = firstVisitDate(f => ctx.airports[f.to]?.country === code || ctx.airports[f.from]?.country === code);
      return {
        label: `${info.flag || ""} ${escapeHtml(info.name || code)} <span class="muted">${info.count}×</span>`,
        visited: true,
        date: d ? formatDate(d) : null,
      };
    });
  }
  if (ach.type === "us_states") {
    const ALL_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
    return ALL_STATES.map(code => {
      const info = s.states.get(code);
      const visited = !!info;
      let date = null;
      if (visited) {
        const d = firstVisitDate(f => {
          const ap = ctx.airports[f.to] || ctx.airports[f.from];
          return ap?.country === "US" && ap?.state === code;
        });
        if (d) date = formatDate(d);
      }
      return {
        label: `<code>${code}</code> ${visited ? `<span class="muted">${info.count}×</span>` : ""}`,
        visited, date,
      };
    });
  }
  if (ach.type === "airlines") {
    const all = [...s.airlines.entries()].sort((a,b) => b[1].count - a[1].count);
    return all.map(([code, info]) => {
      const name = airlineDisplayName(code, ctx.airlines, info.name);
      const url = airlineLogoUrl(code, ctx.airlines);
      const logo = url ? `<img class="airline-logo" src="${url}" alt="${escapeHtml(name)}" onerror="this.classList.add('is-missing')"/>` : "";
      return {
        label: `${logo}<code>${code}</code> ${escapeHtml(name)} <span class="muted">${info.count}×</span>`,
        visited: true,
        date: null,
      };
    });
  }
  if (ach.type === "airports") {
    const all = [...s.airports.entries()].sort((a,b) => b[1] - a[1]).slice(0, 60);
    return all.map(([code, n]) => {
      const ap = ctx.airports[code];
      return {
        label: `<code>${code}</code> ${ap?.city ? `<span class="muted">${escapeHtml(ap.city)}</span>` : ""} <span class="muted">${n}×</span>`,
        visited: true, date: null,
      };
    });
  }
  if (ach.type === "continents") {
    const ALL = ["NA","SA","EU","AF","AS","OC","AN"];
    const visited = new Set();
    for (const code of s.airports.keys()) {
      const ap = ctx.airports[code];
      if (ap?.continent) visited.add(ap.continent);
    }
    const NAMES = { NA:"North America", SA:"South America", EU:"Europe", AF:"Africa", AS:"Asia", OC:"Oceania", AN:"Antarctica" };
    return ALL.map(c => ({ label: `<code>${c}</code> ${NAMES[c]}`, visited: visited.has(c), date: null }));
  }
  if (ach.type === "domestic_airports") {
    const items = [];
    for (const [code, n] of s.airports) {
      const ap = ctx.airports[code];
      if (ap?.country === "US") items.push([code, n]);
    }
    items.sort((a,b) => b[1] - a[1]);
    return items.map(([code, n]) => {
      const ap = ctx.airports[code];
      return { label: `<code>${code}</code> ${ap?.city ? `<span class="muted">${escapeHtml(ap.city)}</span>` : ""} <span class="muted">${n}×</span>`, visited: true, date: null };
    });
  }
  if (ach.type === "eu_countries" || ach.type === "as_countries") {
    const region = ach.type === "eu_countries" ? "EU" : "AS";
    const items = [];
    for (const [code, info] of s.countries) {
      const aFrom = info.flag || "";
      // Check continent via any visited airport in this country
      let isRegion = false;
      for (const c of s.airports.keys()) {
        const ap = ctx.airports[c];
        if (ap?.country === code && ap.continent === region) { isRegion = true; break; }
      }
      if (!isRegion && ach.type === "eu_countries" && REGION_HINT_EU.has(code)) isRegion = true;
      if (!isRegion && ach.type === "as_countries" && REGION_HINT_AS.has(code)) isRegion = true;
      if (isRegion) items.push({ label: `${info.flag || ""} ${escapeHtml(info.name || code)}`, visited: true, date: null });
    }
    return items;
  }
  if (ach.type === "aircraft_families") {
    // Re-derive families from flights
    const fams = new Set();
    for (const f of ctx.flights) {
      if (!f.aircraft) continue;
      const fam = (function (code) {
        if (/^(73|7M)/.test(code)) return "Boeing 737";
        if (/^74/.test(code))      return "Boeing 747";
        if (/^75/.test(code))      return "Boeing 757";
        if (/^76/.test(code))      return "Boeing 767";
        if (/^77/.test(code))      return "Boeing 777";
        if (/^78/.test(code))      return "Boeing 787";
        if (/^(31|32)/.test(code)) return "Airbus A320 family";
        if (/^33/.test(code))      return "Airbus A330";
        if (/^34/.test(code))      return "Airbus A340";
        if (/^35/.test(code))      return "Airbus A350";
        if (/^38/.test(code))      return "Airbus A380";
        if (/^E/.test(code))       return "Embraer E-Jet";
        if (/^CR/.test(code))      return "Bombardier CRJ";
        if (/^DH/.test(code))      return "Dash 8";
        if (/^AT/.test(code))      return "ATR";
        if (/^M[89]/.test(code))   return "MD-80 family";
        return code;
      })(f.aircraft);
      fams.add(fam);
    }
    return [...fams].map(fam => ({ label: escapeHtml(fam), visited: true, date: null }));
  }
  if (ach.type === "airport_alphabet") {
    const seen = new Map();
    for (const f of ctx.flights) {
      for (const code of [f.from, f.to]) {
        if (code && code[0]) {
          const L = code[0].toUpperCase();
          if (!seen.has(L)) seen.set(L, code);
        }
      }
    }
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return letters.map(L => ({
      label: `<strong>${L}</strong> ${seen.has(L) ? `<code>${seen.get(L)}</code>` : `<span class="muted">—</span>`}`,
      visited: seen.has(L), date: null,
    }));
  }
  if (ach.type === "top_10_hubs") {
    const top10 = ["ATL","DXB","DFW","LHR","HND","ORD","LAX","CDG","AMS","IST"];
    return top10.map(code => {
      const ap = ctx.airports[code];
      return {
        label: `<code>${code}</code> ${ap ? `<span class="muted">${escapeHtml(ap.city || ap.name || "")}</span>` : ""}`,
        visited: s.airports.has(code), date: null,
      };
    });
  }
  if (ach.type === "middle_east_set") {
    return ["DXB","DOH","AUH"].map(code => {
      const ap = ctx.airports[code];
      return { label: `<code>${code}</code> ${ap?.city ? `<span class="muted">${escapeHtml(ap.city)}</span>` : ""}`, visited: s.airports.has(code), date: null };
    });
  }
  if (ach.type === "southerner_set") {
    return ["AU","NZ","ZA"].map(code => {
      const info = s.countries.get(code);
      const NAMES = { AU: "Australia", NZ: "New Zealand", ZA: "South Africa" };
      return { label: `<code>${code}</code> ${NAMES[code]}`, visited: !!info, date: null };
    });
  }
  return [];
}

// Return ALL flights that qualify for a count/event-type achievement
function qualifyingFlights(ach, ctx) {
  const KM = 1.60934;
  const ARCTIC = 66.5;
  const f = ctx.flights;
  function flightKm(x) { return (x._miles || 0) * KM; }
  function airportPair(x) { return [ctx.airports[x.from], ctx.airports[x.to]]; }
  switch (ach.type) {
    case "flights_count":         return f.slice();
    case "distance_km":
    case "distance_mi":
    case "flight_hours":
    case "earth_laps":
    case "moon_trips":
      return f.slice();   // every flight contributes; recent list is useful
    case "night_flights":         return f.filter(x => { const d = new Date(x.depart); return !isNaN(d) && d.getHours() < 6; });
    case "early_morning_flights": return f.filter(x => { const d = new Date(x.depart); return !isNaN(d) && d.getHours() >= 4 && d.getHours() < 7; });
    case "weekend_flights":       return f.filter(x => { const d = new Date(x.depart); return !isNaN(d) && (d.getDay() === 0 || d.getDay() === 6); });
    case "red_eye_flights":       return f.filter(x => { const d = new Date(x.depart); return !isNaN(d) && (d.getHours() >= 22 || d.getHours() < 6); });
    case "holiday_flights":       return f.filter(x => isHolidayFlight(x));
    case "transatlantic":         return f.filter(x => {
      const [a,b] = airportPair(x);
      return a && b && a.continent && b.continent &&
        ((["NA","SA"].includes(a.continent) && ["EU","AF"].includes(b.continent)) ||
         (["EU","AF"].includes(a.continent) && ["NA","SA"].includes(b.continent)));
    });
    case "transpacific":          return f.filter(x => {
      const [a,b] = airportPair(x);
      return a && b && a.continent && b.continent &&
        ((["NA","SA"].includes(a.continent) && ["AS","OC"].includes(b.continent)) ||
         (["AS","OC"].includes(a.continent) && ["NA","SA"].includes(b.continent)));
    });
    case "international_flights": return f.filter(x => {
      const [a,b] = airportPair(x);
      return a && b && a.country && b.country && a.country !== b.country;
    });
    case "coast_to_coast": {
      const E = new Set(["ME","NH","MA","RI","CT","NY","NJ","PA","DE","MD","DC","VA","NC","SC","GA","FL"]);
      const W = new Set(["CA","OR","WA","AK","HI"]);
      return f.filter(x => {
        const [a,b] = airportPair(x);
        if (!a || !b || a.country !== "US" || b.country !== "US") return false;
        return (E.has(a.state) && W.has(b.state)) || (W.has(a.state) && E.has(b.state));
      });
    }
    case "point_to_point":        return f.filter(x => {
      const [a,b] = airportPair(x);
      return a && b && !TOP_HUBS_SET.has(a.code) && !TOP_HUBS_SET.has(b.code);
    });
    case "back_to_back": {
      // Pairs of flights within 24h — for display, return the second one of each pair
      const sorted = [...f].sort((a,b) => (a.depart || "").localeCompare(b.depart || ""));
      const out = [];
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i-1], cur = sorted[i];
        if (!prev.arrive || !cur.depart) continue;
        const gap = new Date(cur.depart) - new Date(prev.arrive);
        if (gap > 0 && gap < 24 * 3600 * 1000) out.push(cur);
      }
      return out;
    }
    case "equator_crossing":      return f.filter(x => {
      const [a,b] = airportPair(x);
      return a && b && a.lat != null && b.lat != null && Math.sign(a.lat) !== Math.sign(b.lat) && a.lat !== 0 && b.lat !== 0;
    });
    case "arctic_flight":         return f.filter(x => {
      const [a,b] = airportPair(x);
      return (a && a.lat >= ARCTIC) || (b && b.lat >= ARCTIC);
    });
    case "micro_flight":          return f.filter(x => flightKm(x) > 0 && flightKm(x) < 250);
    case "ocean_crossing":        return f.filter(x => {
      const [a,b] = airportPair(x);
      if (!a || !b || !a.continent || !b.continent || a.continent === b.continent) return false;
      const k = [a.continent, b.continent].sort().join("|");
      return TRANS_PAIRS_FOR_QUAL.has(k);
    });
    case "idl_west_count":        return f.filter(x => {
      const [a,b] = airportPair(x);
      return a && b && a.lon != null && b.lon != null && a.lon < -90 && b.lon > 90;
    });
    case "idl_east_count":        return f.filter(x => {
      const [a,b] = airportPair(x);
      return a && b && a.lon != null && b.lon != null && a.lon > 90 && b.lon < -90;
    });
    case "nye_airborne":          return f.filter(x => {
      const d = new Date(x.depart), a = new Date(x.arrive);
      return !isNaN(d) && !isNaN(a) && d.getMonth() === 11 && d.getDate() === 31 && a.getMonth() === 0 && a.getDate() === 1;
    });
    case "boeing_segments":       return f.filter(x => /^(7|MD-?[89]|717)/.test(x.aircraft || ""));
    case "airbus_segments":       return f.filter(x => /^(31|32|33|34|35|38|22|BCS|220|221|223)/.test(x.aircraft || ""));
    case "has_a380":              return f.filter(x => /^38/.test(x.aircraft || ""));
    case "has_747":               return f.filter(x => /^74/.test(x.aircraft || ""));
    case "has_787":               return f.filter(x => /^78/.test(x.aircraft || ""));
    case "has_neo":               return f.filter(x => /^(32N|32Q|31J|7M)/.test(x.aircraft || "") || /^(33[89])$/.test(x.aircraft || ""));
    case "has_propeller":         return f.filter(x => /^(DH|AT|SF|S20)/.test(x.aircraft || ""));
    case "has_regional":          return f.filter(x => /^(E|CR)/.test(x.aircraft || ""));
    case "has_md80":              return f.filter(x => /^M[89]/.test(x.aircraft || ""));
    case "has_doubledecker":      return f.filter(x => /^(38|74)/.test(x.aircraft || ""));
    case "has_narrowbody":        return f.filter(x => /^(73|7M|75|31|32|22|BCS|22[013])/.test(x.aircraft || ""));
    case "has_widebody":          return f.filter(x => /^(74|76|77|78|33|34|35|38)/.test(x.aircraft || ""));
    default:                      return [];
  }
}

const TRANS_PAIRS_FOR_QUAL = new Set([
  ["NA","EU"].sort().join("|"), ["NA","AS"].sort().join("|"), ["NA","OC"].sort().join("|"), ["NA","AF"].sort().join("|"), ["NA","AN"].sort().join("|"),
  ["SA","EU"].sort().join("|"), ["SA","AS"].sort().join("|"), ["SA","OC"].sort().join("|"), ["SA","AF"].sort().join("|"), ["SA","AN"].sort().join("|"),
  ["AS","OC"].sort().join("|"), ["EU","OC"].sort().join("|"), ["AF","OC"].sort().join("|"),
]);

function isHolidayFlight(f) {
  const d = new Date(f.depart);
  if (isNaN(d)) return false;
  const m = d.getMonth(), day = d.getDate();
  if ((m === 11 && (day === 24 || day === 25 || day === 31)) || (m === 0 && day === 1)) return true;
  // Thanksgiving: 4th Thursday of November
  const y = d.getFullYear();
  const nov1 = new Date(y, 10, 1);
  const firstThu = ((4 - nov1.getDay() + 7) % 7) + 1;
  return m === 10 && day === firstThu + 21;
}

// For each event type, optional supplementary text on a row
function eventExtra(ach, f, ctx) {
  if (ach.type === "max_layover_minutes") return "";
  if (ach.type === "arctic_flight") {
    const a = ctx.airports[f.from], b = ctx.airports[f.to];
    const peak = Math.max(a?.lat || 0, b?.lat || 0).toFixed(1);
    return `${peak}°N`;
  }
  if (ach.type === "micro_flight" && f._miles) return `${Math.round(f._miles)} mi`;
  if (ach.type === "has_a380" || ach.type === "has_747" || ach.type === "has_787" || ach.type === "has_md80") return f.aircraft ? `aircraft ${f.aircraft}` : "";
  return "";
}

// Walk flights chronologically; return the first flight whose running total
// crosses the achievement's req threshold.
function findThresholdFlight(ach, ctx) {
  const KM = 1.60934;
  const sorted = [...ctx.flights].sort((a,b) => (a.depart || "").localeCompare(b.depart || ""));
  let acc = 0;
  for (const f of sorted) {
    let inc = 0;
    if (ach.type === "flights_count") inc = 1;
    else if (ach.type === "distance_km") inc = (f._miles || 0) * KM;
    else if (ach.type === "distance_mi") inc = (f._miles || 0);
    else if (ach.type === "flight_hours") inc = (f._minutes || 0) / 60;
    else if (ach.type === "earth_laps") inc = (f._miles || 0) / 24901;
    else if (ach.type === "moon_trips") inc = (f._miles || 0) / 238855;
    else if (ach.type === "boeing_segments") inc = /^(7|MD-?[89])/.test(f.aircraft || "") ? 1 : 0;
    else if (ach.type === "airbus_segments") inc = /^(31|32|33|34|35|38|22|BCS|220|221|223)/.test(f.aircraft || "") ? 1 : 0;
    acc += inc;
    if (acc >= ach.req) return f;
  }
  return null;
}
function thresholdNote(ach, f, ctx) {
  if (ach.type === "flights_count") return `flight #${ach.req}`;
  if (ach.type === "distance_km")   return `crossed ${ach.req.toLocaleString()} km`;
  if (ach.type === "distance_mi")   return `crossed ${ach.req.toLocaleString()} mi`;
  if (ach.type === "flight_hours")  return `crossed ${ach.req}h`;
  if (ach.type === "earth_laps")    return `crossed lap ${ach.req}`;
  if (ach.type === "moon_trips")    return `crossed Moon distance`;
  return "";
}

// MAXOF helper: pick a record-holding instance, plus a top-N ranking list
function buildMaxOf(ach, ctx) {
  const s = ctx.stats;
  switch (ach.type) {
    case "single_flight_distance": {
      const top = [...ctx.flights].filter(f => f._miles).sort((a,b) => b._miles - a._miles).slice(0, 5);
      return {
        record: top[0] ? flightRow(top[0], ctx, { extra: `${Math.round(top[0]._miles).toLocaleString()} mi` }) : null,
        ranking: top.slice(1).map(f => flightRow(f, ctx, { extra: `${Math.round(f._miles).toLocaleString()} mi` })),
        rankingLabel: "Next longest flights",
      };
    }
    case "max_flight_minutes": {
      const top = [...ctx.flights].filter(f => f._minutes).sort((a,b) => b._minutes - a._minutes).slice(0, 5);
      return {
        record: top[0] ? flightRow(top[0], ctx, { extra: formatDuration(top[0]._minutes) }) : null,
        ranking: top.slice(1).map(f => flightRow(f, ctx, { extra: formatDuration(f._minutes) })),
        rankingLabel: "Next longest in the air",
      };
    }
    case "min_flight_minutes": {
      const top = [...ctx.flights].filter(f => f._minutes).sort((a,b) => a._minutes - b._minutes).slice(0, 5);
      return {
        record: top[0] ? flightRow(top[0], ctx, { extra: formatDuration(top[0]._minutes) }) : null,
        ranking: top.slice(1).map(f => flightRow(f, ctx, { extra: formatDuration(f._minutes) })),
        rankingLabel: "Next shortest flights",
      };
    }
    case "airline_loyalty": {
      const top = s.topAirlines.slice(0, 8);
      return {
        record: top[0] ? `<div class="ach-rank-row"><span class="logo-code">${airlineLogoTag(top[0].key, ctx)}<code>${top[0].key}</code></span><span class="ach-rank-name">${escapeHtml(airlineDisplayName(top[0].key, ctx.airlines, top[0].info?.name))}</span><span class="ach-rank-v">${top[0].value} flights</span></div>` : null,
        ranking: top.slice(1).map(r => `<div class="ach-rank-row"><span class="logo-code">${airlineLogoTag(r.key, ctx)}<code>${r.key}</code></span><span class="ach-rank-name">${escapeHtml(airlineDisplayName(r.key, ctx.airlines, r.info?.name))}</span><span class="ach-rank-v">${r.value} flights</span></div>`),
        rankingLabel: "Other top airlines",
      };
    }
    case "same_route": {
      const top = s.topRoutes.slice(0, 8);
      return {
        record: top[0] ? `<div class="ach-rank-row"><code>${top[0].key}</code><span class="ach-rank-v">${top[0].value} times</span></div>` : null,
        ranking: top.slice(1).map(r => `<div class="ach-rank-row"><code>${r.key}</code><span class="ach-rank-v">${r.value} times</span></div>`),
        rankingLabel: "Other top routes",
      };
    }
    case "flights_per_year": {
      const byYear = [...(s.yearTotals || new Map()).entries()].sort((a,b) => b[1] - a[1]).slice(0, 8);
      return {
        record: byYear[0] ? `<div class="ach-rank-row"><code>${byYear[0][0]}</code><span class="ach-rank-v">${byYear[0][1]} flights</span></div>` : null,
        ranking: byYear.slice(1).map(r => `<div class="ach-rank-row"><code>${r[0]}</code><span class="ach-rank-v">${r[1]} flights</span></div>`),
        rankingLabel: "Other top years",
      };
    }
    case "flights_per_month": {
      const byMonth = [...(s.monthly || new Map()).entries()].sort((a,b) => b[1] - a[1]).slice(0, 8);
      return {
        record: byMonth[0] ? `<div class="ach-rank-row"><code>${byMonth[0][0]}</code><span class="ach-rank-v">${byMonth[0][1]} flights</span></div>` : null,
        ranking: byMonth.slice(1).map(r => `<div class="ach-rank-row"><code>${r[0]}</code><span class="ach-rank-v">${r[1]} flights</span></div>`),
        rankingLabel: "Other top months",
      };
    }
    case "best_year_miles": {
      const milesByYear = new Map();
      for (const f of ctx.flights) {
        const d = new Date(f.depart);
        if (isNaN(d)) continue;
        milesByYear.set(d.getFullYear(), (milesByYear.get(d.getFullYear()) || 0) + (f._miles || 0));
      }
      const byYear = [...milesByYear].sort((a,b) => b[1] - a[1]).slice(0, 8);
      return {
        record: byYear[0] ? `<div class="ach-rank-row"><code>${byYear[0][0]}</code><span class="ach-rank-v">${Math.round(byYear[0][1]).toLocaleString()} mi</span></div>` : null,
        ranking: byYear.slice(1).map(r => `<div class="ach-rank-row"><code>${r[0]}</code><span class="ach-rank-v">${Math.round(r[1]).toLocaleString()} mi</span></div>`),
        rankingLabel: "Other top years",
      };
    }
    case "countries_per_year": {
      const cpy = new Map();
      for (const f of ctx.flights) {
        const d = new Date(f.depart);
        if (isNaN(d)) continue;
        const y = d.getFullYear();
        if (!cpy.has(y)) cpy.set(y, new Set());
        const aFrom = ctx.airports[f.from], aTo = ctx.airports[f.to];
        if (aFrom?.country) cpy.get(y).add(aFrom.country);
        if (aTo?.country)   cpy.get(y).add(aTo.country);
      }
      const byYear = [...cpy].map(([y, set]) => [y, set.size]).sort((a,b) => b[1] - a[1]).slice(0, 8);
      return {
        record: byYear[0] ? `<div class="ach-rank-row"><code>${byYear[0][0]}</code><span class="ach-rank-v">${byYear[0][1]} countries</span></div>` : null,
        ranking: byYear.slice(1).map(r => `<div class="ach-rank-row"><code>${r[0]}</code><span class="ach-rank-v">${r[1]} countries</span></div>`),
        rankingLabel: "Other top years",
      };
    }
    case "max_layover_minutes": {
      const lay = findMaxLayover(ctx);
      if (!lay) return { record: null };
      // Show both the arriving and the departing flight as proper rows so
      // each one is clickable into the side pane.
      return {
        record: `
          <div class="ach-layover-pair">
            <div class="ach-layover-label">
              <strong>${formatDuration(lay.minutes)}</strong> on the ground at
              <strong>${lay.prev.to}</strong> on <span class="muted">${formatDate(lay.prev.arrive)}</span>
            </div>
            <div class="ach-layover-step">
              <div class="ach-layover-arrow">arrived on</div>
              ${flightRow(lay.prev, ctx, { extra: `landed ${formatDate(lay.prev.arrive)}` })}
            </div>
            <div class="ach-layover-step">
              <div class="ach-layover-arrow">connected to</div>
              ${flightRow(lay.next, ctx, { extra: `departed ${formatDate(lay.next.depart)}` })}
            </div>
          </div>`,
      };
    }
    case "max_trip_legs": {
      const byTrip = new Map();
      for (const f of ctx.flights) {
        if (!f.trip_id) continue;
        if (!byTrip.has(f.trip_id)) byTrip.set(f.trip_id, []);
        byTrip.get(f.trip_id).push(f);
      }
      let best = null;
      for (const list of byTrip.values()) {
        if (!best || list.length > best.length) best = list;
      }
      if (!best) return { record: `<div class="muted small">Run <code>tools/fetch_tripit.py</code> to populate trip groupings.</div>` };
      best.sort((a, b) => (a.depart || "").localeCompare(b.depart || ""));
      const totalMiles = best.reduce((s, f) => s + (f._miles || 0), 0);
      const totalMin   = best.reduce((s, f) => s + (f._minutes || 0), 0);
      const startDate  = best[0]?.depart ? formatDate(best[0].depart) : "—";
      const endDate    = best[best.length - 1]?.arrive ? formatDate(best[best.length - 1].arrive) : "—";
      const name = best[0]?.trip_name || best[0]?.trip_location || `${best[0]?.from} loop`;
      return {
        record: `
          <div class="ach-trip-detail">
            <div class="ach-trip-summary">
              <strong>${escapeHtml(name)}</strong>
              <div class="muted small">${best.length} flights · ${Math.round(totalMiles).toLocaleString()} mi · ${formatDuration(totalMin)} aloft · ${startDate} → ${endDate}</div>
            </div>
            ${best.map((f, i) => `
              <div class="ach-trip-leg">
                <div class="ach-trip-leg-num">${i + 1}</div>
                ${flightRow(f, ctx, { extra: f._miles ? `${Math.round(f._miles).toLocaleString()} mi` : "" })}
              </div>`).join("")}
          </div>`,
      };
    }
    case "consecutive_months": {
      // Find the actual longest streak window in monthSet
      const monthsSeen = new Set();
      const flightsByMonth = new Map();
      for (const f of ctx.flights) {
        const d = new Date(f.depart);
        if (isNaN(d)) continue;
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthsSeen.add(ym);
        if (!flightsByMonth.has(ym)) flightsByMonth.set(ym, []);
        flightsByMonth.get(ym).push(f);
      }
      const sorted = [...monthsSeen].sort();
      let bestStart = sorted[0], bestLen = 1, curStart = sorted[0], curLen = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].split("-").map(Number);
        const next = new Date(prev[0], prev[1], 1);
        const expected = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
        if (sorted[i] === expected) {
          curLen++;
        } else {
          curStart = sorted[i];
          curLen = 1;
        }
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      }
      // Compute end month from bestStart + bestLen-1
      const [sy, sm] = bestStart.split("-").map(Number);
      const endDate = new Date(sy, sm - 1 + bestLen - 1, 1);
      const monthLabel = (ym) => {
        const [y, m] = ym.split("-").map(Number);
        return new Date(y, m - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      };
      const endYm = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`;
      // Collect all months in the streak, with their flight counts
      const streakMonths = [];
      for (let i = 0; i < bestLen; i++) {
        const d = new Date(sy, sm - 1 + i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        streakMonths.push({ ym, count: (flightsByMonth.get(ym) || []).length, label: monthLabel(ym) });
      }
      return {
        record: `
          <div class="ach-streak-detail">
            <div class="ach-streak-window">
              <strong>${monthLabel(bestStart)} → ${monthLabel(endYm)}</strong>
              <div class="muted small">${bestLen} consecutive months with at least one flight</div>
            </div>
            <div class="ach-streak-grid">
              ${streakMonths.map(m => `<div class="ach-streak-cell"><div class="m">${m.label.split(" ")[0]}</div><div class="y muted">${m.label.split(" ")[1]}</div><div class="c">${m.count}×</div></div>`).join("")}
            </div>
          </div>`,
      };
    }
    case "max_repeat_flightno": {
      const c = new Map();
      for (const f of ctx.flights) {
        if (!f.airline_code || !f.flight_number) continue;
        const k = `${f.airline_code}${f.flight_number}`;
        c.set(k, (c.get(k) || 0) + 1);
      }
      const top = [...c].sort((a,b) => b[1] - a[1]).slice(0, 6);
      return {
        record: top[0] ? `<div class="ach-rank-row"><code>${top[0][0]}</code><span class="ach-rank-v">${top[0][1]} times</span></div>` : null,
        ranking: top.slice(1).map(r => `<div class="ach-rank-row"><code>${r[0]}</code><span class="ach-rank-v">${r[1]} times</span></div>`),
        rankingLabel: "Other repeat numbers",
      };
    }
    case "max_tail_repeats": {
      const top = s.topTails || [];
      if (!top.length) return { record: `<div class="muted small">Run <code>tools/enrich_aerodatabox.py</code> to populate tail-number data.</div>` };
      return {
        record: top[0] ? `<div class="ach-rank-row"><code>${top[0].key}</code> <span class="muted small">${escapeHtml(s.tailModels?.get(top[0].key) || "")}</span><span class="ach-rank-v">${top[0].value}×</span></div>` : null,
        ranking: top.slice(1).map(r => `<div class="ach-rank-row"><code>${r.key}</code> <span class="muted small">${escapeHtml(s.tailModels?.get(r.key) || "")}</span><span class="ach-rank-v">${r.value}×</span></div>`),
        rankingLabel: "Other repeat tail numbers",
      };
    }
    default:
      return { record: null };
  }
}

function airlineLogoTag(code, ctx) {
  const url = airlineLogoUrl(code, ctx.airlines);
  if (!url) return "";
  const name = airlineDisplayName(code, ctx.airlines);
  return `<img class="airline-logo" src="${url}" alt="${escapeHtml(name)}" onerror="this.classList.add('is-missing')"/>`;
}

function findMaxLayover(ctx) {
  const byTrip = new Map();
  for (const f of ctx.flights) {
    const k = f.trip_id ?? `_${f.air_id}`;
    if (!byTrip.has(k)) byTrip.set(k, []);
    byTrip.get(k).push(f);
  }
  let best = null;
  for (const list of byTrip.values()) {
    list.sort((a,b) => (a.depart || "").localeCompare(b.depart || ""));
    for (let i = 1; i < list.length; i++) {
      const prev = list[i-1], cur = list[i];
      if (!prev.arrive || !cur.depart) continue;
      const gap = (new Date(cur.depart) - new Date(prev.arrive)) / 60000;
      if (gap > 0 && gap < 24 * 60 && (!best || gap > best.minutes)) {
        best = { prev, next: cur, minutes: gap };
      }
    }
  }
  return best;
}

function topRepeatedFlightNumber(ctx) {
  const c = new Map();
  for (const f of ctx.flights) {
    if (!f.airline_code || !f.flight_number) continue;
    const k = `${f.airline_code}${f.flight_number}`;
    c.set(k, (c.get(k) || 0) + 1);
  }
  let top = null;
  for (const [k, n] of c) if (!top || n > top.count) top = { key: k, count: n };
  return top;
}

async function openAchievementModal(ach, ctx) {
  const { openDetailModal, setModalSide, renderFlightDetailHtml } = await import("./views.js");

  // Tag each flight with a stable index so the modal-side click handler can
  // find it by data-fi. Also build a lookup map so flightRow can read fi.
  if (!ctx._flightIndex) {
    ctx._flightIndex = new Map();
    ctx.flights.forEach((f, i) => {
      f.__fi = String(i);
      ctx._flightIndex.set(f, String(i));
    });
  }

  const blocks = buildAchievementDetail(ach, ctx);
  openDetailModal(`
    <header class="ach-detail-head">
      <div class="ach-detail-icon tier-${ach.tier}">${ach.icon}</div>
      <div>
        <div class="ach-detail-cat">${ach.category} · ${ach.tier.toUpperCase()} · +${ach.points} pts</div>
        <h2 id="detail-modal-title" class="ach-detail-name">${escapeHtml(ach.name)}</h2>
        <div class="ach-detail-desc">${escapeHtml(ach.desc)}</div>
      </div>
    </header>
    ${blocks.map(b => b.html).join("")}
  `);

  // Wire click → open side pane with full flight detail.
  const body = document.getElementById("detail-modal-body");
  function openForRow(row) {
    if (!row) return;
    const fi = row.dataset.fi;
    if (!fi) return;
    const f = ctx.flights[Number(fi)];
    if (!f) return;
    setModalSide(renderFlightDetailHtml(f, ctx));
    // Visual selection state
    body.querySelectorAll(".ach-flight-row.is-active").forEach(r => r.classList.remove("is-active"));
    row.classList.add("is-active");
  }
  body.addEventListener("click", (e) => {
    const row = e.target.closest(".ach-flight-row[data-fi]");
    if (row && row.dataset.fi !== "") openForRow(row);
  });
  body.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const row = e.target.closest(".ach-flight-row[data-fi]");
    if (row && row.dataset.fi !== "") {
      e.preventDefault();
      openForRow(row);
    }
  });
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
