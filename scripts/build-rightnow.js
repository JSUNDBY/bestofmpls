#!/usr/bin/env node
/**
 * Right Now — generate the live data file the homepage uses.
 *
 * Three things, fetched + computed at build time:
 *   1. Current weather for downtown Mpls (Open-Meteo, free, no key)
 *   2. Sunrise + sunset for today (computed locally, no API)
 *   3. Civic countdowns to the next handful of named anchor events
 *
 * Output: src/data/rightnow.json
 *
 * Used by:
 *   - homepage hero copy that swaps on patio days vs brutal cold
 *   - /tonight/ page
 *   - "Right Now" strip on homepage
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'src/data/rightnow.json');

// Downtown Mpls lat/lng — close enough for both cities.
const LAT = 44.9778;
const LNG = -93.2650;
const TZ  = 'America/Chicago';

// "Now" anchored to Central time. The build server is in UTC, which means
// after 7 PM Central each evening the calendar would otherwise tick forward
// to the next day. We want all "today" math to match what the metro thinks
// today is, not what the build server thinks.
function centralNow() {
  // Construct a Date whose y/m/d/h fields represent Central wall clock.
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}
function centralDateString(d = centralNow()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ===== Sunrise / sunset (NOAA algorithm, simplified) =====
function pad2(n) { return String(n).padStart(2, '0'); }
function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function sunTimes(date, lat, lng) {
  // Reference: NOAA solar calculator, simplified for one-day accuracy.
  const J1970 = 2440587.5;
  const J2000 = 2451545;
  const dayMs = 86400000;
  const e = toRad(23.4397); // obliquity of the earth

  const J = date.valueOf() / dayMs - 0.5 + J1970;
  const n = Math.round(J - J2000 - 0.0009 - lng / 360);
  const Js = J2000 + 0.0009 + lng / 360 + n;
  const M = toRad((357.5291 + 0.98560028 * (Js - J2000)) % 360);
  const C = toRad(1.9148 * Math.sin(M) + 0.02 * Math.sin(2*M) + 0.0003 * Math.sin(3*M));
  const lambda = M + C + toRad(180 + 102.9372);
  const Jtransit = Js + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2*lambda);
  const dec = Math.asin(Math.sin(lambda) * Math.sin(e));
  const phi = toRad(lat);
  const cosH = (Math.sin(toRad(-0.83)) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  const H = toDeg(Math.acos(cosH)) / 360;
  const Jrise = Jtransit - H;
  const Jset = Jtransit + H;

  const riseMs = (Jrise - J1970 + 0.5) * dayMs;
  const setMs  = (Jset  - J1970 + 0.5) * dayMs;
  return { rise: new Date(riseMs), set: new Date(setMs), transit: new Date((Jtransit - J1970 + 0.5) * dayMs) };
}

function fmtTime(d) {
  // Format as h:MM AM/PM in Central time.
  const opts = { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true };
  return d.toLocaleTimeString('en-US', opts);
}
function hm24(d) {
  const opts = { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false };
  return d.toLocaleTimeString('en-US', opts);
}

// ===== Weather (National Weather Service, api.weather.gov) =====
// Twin Cities sit on NWS gridpoint MPX/108,72 (downtown Mpls lat/lng).
// KMSP is the canonical observation station for current conditions.
// NWS forecast periods come in Fahrenheit, observations in Celsius.
// NWS requires an identifying User-Agent on every request.
const NWS_UA = 'bestofmpls.com (hello@bestofmpls.com)';
const NWS_FORECAST = 'https://api.weather.gov/gridpoints/MPX/108,72/forecast';
const NWS_OBS = 'https://api.weather.gov/stations/KMSP/observations/latest';

function cToF(c) { return c == null ? null : (c * 9 / 5) + 32; }

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': NWS_UA, 'Accept': 'application/geo+json' } });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

async function fetchWeather() {
  try {
    const [forecast, obs] = await Promise.all([
      fetchJson(NWS_FORECAST),
      fetchJson(NWS_OBS).catch(e => { console.warn(`  obs fetch failed: ${e.message}`); return null; })
    ]);
    return { forecast, obs };
  } catch (e) {
    console.warn(`  weather fetch failed: ${e.message}`);
    return null;
  }
}

// Map NWS shortForecast text → short display label + mood signals.
// shortForecast strings are stable and human-readable, so substring matching
// is reliable.
function moodFromText(text) {
  const t = String(text || '').toLowerCase();
  const snow   = /snow|flurr|blizzard|sleet|wintry/.test(t);
  const rain   = /rain|shower|drizzl|thunder/.test(t);
  const fog    = /\bfog\b|haze|mist/.test(t);
  const sunny  = /sunny|clear/.test(t) && !/mostly cloudy|partly cloudy/.test(t);
  const cloudy = /cloud|overcast/.test(t);
  return { snow, rain, fog, sunny, cloudy };
}

function describeNws(text) {
  // NWS shortForecast is already presentable ("Mostly Sunny", "Light Snow",
  // "Chance Showers And Thunderstorms"). Title-case if needed.
  if (!text) return 'Clear';
  return text.replace(/\b\w/g, ch => ch.toUpperCase());
}

function classifyWeather(weather) {
  if (!weather || !weather.forecast) {
    return { is_patio: false, is_brutal: false, summary: 'Twin Cities, today' };
  }
  const periods = weather.forecast.properties?.periods || [];
  if (!periods.length) return { is_patio: false, is_brutal: false, summary: 'Twin Cities, today' };

  // Today's daytime period (the first daytime entry in the list) gives us
  // the high and the dominant condition. If the first period is night (we're
  // running after sunset), the period's temperature is tonight's low and the
  // next daytime period is tomorrow's day, so we still use [0] as "today".
  const dayPeriod = periods.find(p => p.isDaytime) || periods[0];
  const nightPeriod = periods.find(p => !p.isDaytime) || periods[0];

  // Daytime period.temperature is the high (in F). Night period is the low.
  const tempMax = dayPeriod.isDaytime ? dayPeriod.temperature : null;
  const condition = describeNws(dayPeriod.shortForecast);
  const popDay  = dayPeriod.probabilityOfPrecipitation?.value ?? 0;

  // Current temp + feels-like from KMSP observation.
  const obsProps = weather.obs?.properties || null;
  const obsTempF = cToF(obsProps?.temperature?.value);
  const windChillF = cToF(obsProps?.windChill?.value);
  const heatIdxF = cToF(obsProps?.heatIndex?.value);
  const obsText = obsProps?.textDescription || null;

  const tempNow = obsTempF ?? periods[0].temperature;
  const feelsLike = windChillF ?? heatIdxF ?? tempNow;

  // Combine forecast text + current observation text for mood detection.
  const mood1 = moodFromText(dayPeriod.shortForecast);
  const mood2 = moodFromText(obsText);
  const is_snowing = mood1.snow || mood2.snow;
  const is_rainy   = !is_snowing && (mood1.rain || mood2.rain);
  const dryAndSunny = (mood1.sunny || (!mood1.cloudy && !mood1.fog)) && popDay < 30;

  // Patio day: high ≥ 65, low precip chance, generally clear.
  const is_patio = (tempMax ?? tempNow) >= 65 && dryAndSunny && !is_rainy && !is_snowing;
  // Brutal cold: feels-like ≤ -5°F.
  const is_brutal = feelsLike <= -5;

  let summary = `${Math.round(tempNow)}°F · ${condition}`;
  let mode = 'normal';
  if (is_patio)        { mode = 'patio';  summary = `${Math.round(tempMax)}°F high · patio weather`; }
  else if (is_brutal)  { mode = 'brutal'; summary = `${Math.round(tempNow)}°F · stay close to home`; }
  else if (is_snowing) { mode = 'snow';   summary = `${Math.round(tempNow)}°F · snowing`; }
  else if (is_rainy)   { mode = 'rain';   summary = `${Math.round(tempNow)}°F · rain in the forecast`; }

  return {
    temp_now: Math.round(tempNow),
    temp_max: tempMax != null ? Math.round(tempMax) : null,
    feels_like: Math.round(feelsLike),
    condition,
    is_patio, is_brutal, is_snowing, is_rainy,
    mood: mode, summary,
    source: 'nws'
  };
}

// ===== Civic countdowns =====
// Anchor dates for the next 12 months. Each rule is evaluated for the
// reference year; if the resulting date is in the past relative to today
// (Central time), we roll forward by one year.
function buildCountdowns(now = centralNow()) {
  const Y = now.getFullYear();

  // Helper: Nth occurrence of a day-of-week in a given month (1-indexed n).
  // dow: 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  function nthDowOf(year, monthIdx, dow, n) {
    const d = new Date(year, monthIdx, 1);
    while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + (n - 1) * 7);
    return d;
  }
  // Last occurrence of a day-of-week in a given month.
  function lastDowOf(year, monthIdx, dow) {
    const d = new Date(year, monthIdx + 1, 0);
    while (d.getDay() !== dow) d.setDate(d.getDate() - 1);
    return d;
  }
  // MN State Fair: 12 days ending Labor Day → start is 11 days before Labor.
  function stateFairStart(year) {
    const labor = nthDowOf(year, 8, 1, 1); // 1st Monday of September
    const start = new Date(labor);
    start.setDate(start.getDate() - 11);
    return start;
  }

  // forYear lets us evaluate a rule against either this year or next, so
  // the year-boundary roll is exact (e.g. The Great Northern in January).
  const events = [
    { name: 'Saint Paul Winter Carnival',  dateRule: y => new Date(y, 0, 22),         blurb: 'The oldest winter festival in the country opens.' },
    { name: 'The Great Northern',          dateRule: y => new Date(y, 0, 22),         blurb: 'A ten-day cultural festival celebrating winter and climate.' },
    { name: 'Loppet Festival',             dateRule: y => new Date(y, 1, 7),          blurb: 'Cross-country ski weekend at Theodore Wirth Park.' },
    { name: 'May Day Parade in Powderhorn',dateRule: y => nthDowOf(y, 4, 0, 1),       blurb: "In the Heart of the Beast's annual procession through Powderhorn, on the first Sunday in May." },
    { name: 'Art-A-Whirl',                 dateRule: y => nthDowOf(y, 4, 5, 3),       blurb: 'Northeast Minneapolis opens nearly every artist studio at once, on the third weekend in May.' },
    { name: 'Twin Cities Pride',           dateRule: y => lastDowOf(y, 5, 6),         blurb: 'One of the largest Pride festivals in the country, last full weekend of June.' },
    { name: 'Aquatennial',                 dateRule: y => new Date(y, 6, 16),         blurb: "Minneapolis's eleven-day midsummer festival." },
    { name: 'Minnesota State Fair',        dateRule: y => stateFairStart(y),          blurb: 'Twelve days ending Labor Day. The largest state fair by daily attendance.' },
    { name: 'Twin Cities Marathon',        dateRule: y => nthDowOf(y, 9, 0, 1),       blurb: 'Twenty-six miles from downtown Minneapolis to the State Capitol.' },
    { name: 'Twin Cities Book Festival',   dateRule: y => nthDowOf(y, 9, 6, 3),       blurb: "The metro's largest free book festival, at the State Fairgrounds." },
    { name: 'First frost (typical)',       dateRule: y => new Date(y, 9, 5),          blurb: 'When the metro typically sees its first overnight frost.' },
    { name: 'First snow (typical)',        dateRule: y => new Date(y, 10, 1),         blurb: 'When the metro typically sees its first measurable snowfall.' }
  ];

  // Cutoff = midnight Central this morning, so any event happening today
  // (with hours math truncated) shows as "0 days" and gets filtered out.
  const cutoff = new Date(Y, now.getMonth(), now.getDate());

  const upcoming = events.map(ev => {
    let d = ev.dateRule(Y);
    if (d < cutoff) d = ev.dateRule(Y + 1);
    const days = Math.round((d - cutoff) / 86400000);
    return { name: ev.name, date: `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`, days, blurb: ev.blurb };
  })
  .filter(e => e.days > 0)
  .sort((a, b) => a.days - b.days)
  .slice(0, 6);

  return upcoming;
}

// ===== Sunset companion picks =====
const SUNSET_PICKS = [
  { name: 'Stone Arch Bridge', neighborhood: 'Mill District, Minneapolis', why: 'Skyline behind, falls below, the canonical Minneapolis sunset.' },
  { name: 'Bde Maka Ska east shore', neighborhood: 'Southwest Minneapolis', why: 'Long views west across the lake, no obstructions.' },
  { name: 'The Saint Paul Cathedral steps', neighborhood: 'Cathedral Hill, St. Paul', why: 'The downtown Mpls skyline is twenty miles west and the light walks across the river valley.' },
  { name: 'Indian Mounds Park', neighborhood: 'Dayton\'s Bluff, St. Paul', why: 'Bluff overlook above the Mississippi. Quiet. Historical. The light is long.' },
  { name: 'Sea Salt patio at Minnehaha Falls', neighborhood: 'South Minneapolis', why: 'Falls behind, sun setting through the trees over the river gorge. Summer only.' },
  { name: 'Hidden Falls boat launch', neighborhood: 'Highland, St. Paul', why: 'River-level. The whole sky reflects.' },
  { name: 'Foshay Tower observation deck', neighborhood: 'Downtown Minneapolis', why: 'Thirty-second floor, open air, the entire grid lit up below.' }
];

async function main() {
  const now = new Date();
  const central = centralNow();
  const sun = sunTimes(now, LAT, LNG);
  const weather = await fetchWeather();
  const climate = classifyWeather(weather);
  const countdowns = buildCountdowns(central);

  // Pick a sunset companion deterministically by Central date, so the page
  // changes at midnight Central, not at midnight UTC.
  const doy = Math.floor((central - new Date(central.getFullYear(), 0, 0)) / 86400000);
  const sunset_pick = SUNSET_PICKS[doy % SUNSET_PICKS.length];

  const out = {
    generated_at: new Date().toISOString(),
    today: centralDateString(central),
    sun: {
      rise: fmtTime(sun.rise),
      set: fmtTime(sun.set),
      rise_24: hm24(sun.rise),
      set_24: hm24(sun.set),
      daylight_min: Math.round((sun.set - sun.rise) / 60000)
    },
    weather: climate,
    countdowns,
    sunset_pick,
    sunset_picks: SUNSET_PICKS
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`  → wrote rightnow.json (sunset ${out.sun.set} · ${climate.summary} · ${countdowns.length} countdowns)`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
