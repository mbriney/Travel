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

  // ── META ──────────────────────────────────────────────────────────────
  { code: "WRIGHT_STUFF",       name: "The Wright Stuff",      desc: "Unlock at least one achievement in every category",     category: "special",  icon: "✈️", tier: "diamond",  req: 1,    type: "wright_stuff",      points: 500 },
];

// ---------------------------------------------------------------------------
// Evaluator — given flights + airports + stats, compute progress for each type
// ---------------------------------------------------------------------------

const MI_TO_KM = 1.60934;
const ARCTIC_LAT = 66.5;

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

    // Geographic curiosities (existing + extensions)
    if (aFrom && aTo && aFrom.lat != null && aTo.lat != null) {
      if (Math.sign(aFrom.lat) !== Math.sign(aTo.lat) && aFrom.lat !== 0 && aTo.lat !== 0) equatorCrossing = 1;
      if (aFrom.lat >= ARCTIC_LAT || aTo.lat >= ARCTIC_LAT) arcticFlight = 1;
      // Date Line crossings: Pacific-basin pair where lons sit on opposite sides of ~±90°
      const lo1 = aFrom.lon, lo2 = aTo.lon;
      if (lo1 < -90 && lo2 > 90) idlWest++;       // e.g. LAX → SYD
      else if (lo1 > 90 && lo2 < -90) idlEast++;  // e.g. SYD → LAX
    }

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

async function openAchievementModal(ach, ctx) {
  const { openDetailModal } = await import("./views.js");
  const unlockingFlight = ach.unlocked ? findUnlockingFlight(ach, ctx) : null;
  const items = listContributingItems(ach, ctx, 60);

  const earnedSection = (() => {
    if (!ach.unlocked) return "";
    if (unlockingFlight) {
      const logoUrl = airlineLogoUrl(unlockingFlight.airline_code, ctx.airlines);
      const airlineName = airlineDisplayName(unlockingFlight.airline_code, ctx.airlines, unlockingFlight.airline);
      const logo = logoUrl
        ? `<img class="airline-logo" src="${logoUrl}" alt="${escapeHtml(airlineName)}" onerror="this.classList.add('is-missing')"/>`
        : "";
      return `
        <div class="ach-earned">
          <div class="lbl">Unlocked by this flight</div>
          <div class="earned-flight">
            <div class="earned-left">
              ${logo}
              <div class="earned-text">
                <span class="route">${unlockingFlight.from} → ${unlockingFlight.to}</span>
                <span class="muted">${escapeHtml(airlineName)} · ${escapeHtml([unlockingFlight.airline_code, unlockingFlight.flight_number].filter(Boolean).join(" "))}</span>
              </div>
            </div>
            <span class="muted earned-date">${formatDate(unlockingFlight.depart)}</span>
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
