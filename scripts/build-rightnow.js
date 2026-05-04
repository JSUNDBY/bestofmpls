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

// ===== Weather (Open-Meteo, free, no key) =====
async function fetchWeather() {
  // Current + today's max + precipitation + cloud cover
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}` +
    `&current=temperature_2m,apparent_temperature,precipitation,cloud_cover,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America/Chicago`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status}`);
    const d = await r.json();
    return d;
  } catch (e) {
    console.warn(`  weather fetch failed: ${e.message}`);
    return null;
  }
}

// WMO weather codes → short labels we can display
function describeWmo(code) {
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2) return 'Mostly clear';
  if (code === 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzling';
  if (code >= 61 && code <= 67) return 'Raining';
  if (code >= 71 && code <= 77) return 'Snowing';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorms';
  return 'Mixed';
}

function classifyWeather(weather) {
  if (!weather || !weather.current) return { is_patio: false, is_brutal: false, summary: 'Twin Cities, today' };
  const c = weather.current;
  const d = weather.daily;
  const tempMax = d?.temperature_2m_max?.[0] ?? c.temperature_2m;
  const tempNow = c.temperature_2m;
  const precip  = d?.precipitation_sum?.[0] ?? 0;
  const clouds  = c.cloud_cover ?? 100;
  const code    = c.weather_code ?? 0;

  // Patio day: today's high >= 65, low precip, sun out
  const is_patio = tempMax >= 65 && precip < 0.05 && clouds < 70;
  // Brutal cold: feels-like under -5
  const is_brutal = (c.apparent_temperature ?? tempNow) <= -5;
  // Snow day: any snow code
  const is_snowing = code >= 71 && code <= 77;
  // Real rain
  const is_rainy = (code >= 61 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95);

  let summary = `${Math.round(tempNow)}°F · ${describeWmo(code)}`;
  let mood = 'normal';
  if (is_patio) { mood = 'patio'; summary = `${Math.round(tempMax)}°F high · patio weather`; }
  else if (is_brutal) { mood = 'brutal'; summary = `${Math.round(tempNow)}°F · stay close to home`; }
  else if (is_snowing) { mood = 'snow'; summary = `${Math.round(tempNow)}°F · snowing`; }
  else if (is_rainy) { mood = 'rain'; summary = `${Math.round(tempNow)}°F · rain in the forecast`; }

  return {
    temp_now: Math.round(tempNow),
    temp_max: Math.round(tempMax),
    feels_like: Math.round(c.apparent_temperature ?? tempNow),
    condition: describeWmo(code),
    is_patio, is_brutal, is_snowing, is_rainy,
    mood, summary
  };
}

// ===== Civic countdowns =====
// Anchor dates for the next 12 months. Each year auto-rolls so adding the
// first-Sunday-in-May May Day correctly handles the year boundary.
function buildCountdowns(now = new Date()) {
  const Y = now.getFullYear();
  const events = [
    // Annual fixed-date anchors
    { name: 'Saint Paul Winter Carnival', dateRule: () => new Date(Y, 0, 25), blurb: 'The oldest winter festival in the country opens.' },
    { name: 'Loppet Festival', dateRule: () => new Date(Y, 1, 7), blurb: 'Cross-country ski weekend at Theodore Wirth Park.' },
    { name: 'May Day Parade in Powderhorn', dateRule: () => new Date(Y, 4, 1), blurb: "In the Heart of the Beast's annual procession through Powderhorn." },
    { name: 'Art-A-Whirl', dateRule: () => firstFullWeekendIn(Y, 4, 'fri'), blurb: 'Northeast Minneapolis opens nearly every artist studio at once.' },
    { name: 'Twin Cities Pride', dateRule: () => lastFullWeekendIn(Y, 5, 'sat'), blurb: 'One of the largest Pride festivals in the country.' },
    { name: 'Aquatennial', dateRule: () => new Date(Y, 6, 16), blurb: "Minneapolis's eleven-day midsummer festival." },
    { name: 'Minnesota State Fair', dateRule: () => stateFairStart(Y), blurb: 'Twelve days ending Labor Day. The largest state fair by daily attendance.' },
    { name: 'Twin Cities Marathon', dateRule: () => firstSundayInOctober(Y), blurb: 'Twenty-six miles from downtown Minneapolis to the State Capitol.' },
    { name: 'Twin Cities Book Festival', dateRule: () => new Date(Y, 9, 18), blurb: "The metro's largest free book festival, at the State Fairgrounds." },
    { name: 'The Great Northern', dateRule: () => new Date(Y + (now.getMonth() < 1 ? 0 : 1), 0, 22), blurb: 'A ten-day cultural festival celebrating winter and climate.' },
    { name: 'First frost (typical)', dateRule: () => new Date(Y, 9, 5), blurb: 'When the metro typically sees its first overnight frost.' },
    { name: 'First snow (typical)', dateRule: () => new Date(Y, 10, 1), blurb: 'When the metro typically sees its first measurable snowfall.' }
  ];

  const upcoming = events.map(ev => {
    let d = ev.dateRule();
    // If past, roll one year forward
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (d < cutoff) d = ev.dateRule.length === 0
      ? new Date(d.getFullYear() + 1, d.getMonth(), d.getDate())
      : ev.dateRule();
    const days = Math.round((d - cutoff) / 86400000);
    return { name: ev.name, date: `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`, days, blurb: ev.blurb };
  })
  .filter(e => e.days > 0)
  .sort((a, b) => a.days - b.days)
  .slice(0, 6);

  return upcoming;
}

// Helper: first full weekend (Friday) in month
function firstFullWeekendIn(year, monthIdx, dayName) {
  const d = new Date(year, monthIdx, 1);
  const targetDow = dayName === 'fri' ? 5 : 6;
  while (d.getDay() !== targetDow) d.setDate(d.getDate() + 1);
  // Use second Friday for May to land on the canonical Art-A-Whirl weekend
  if (monthIdx === 4) d.setDate(d.getDate() + 7);
  return d;
}
function lastFullWeekendIn(year, monthIdx, dayName) {
  const last = new Date(year, monthIdx + 1, 0);
  const targetDow = dayName === 'fri' ? 5 : 6;
  while (last.getDay() !== targetDow) last.setDate(last.getDate() - 1);
  return last;
}
function firstSundayInOctober(year) {
  const d = new Date(year, 9, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  return d;
}
// MN State Fair starts Thursday, twelve days before Labor Day.
function stateFairStart(year) {
  // Labor Day = first Monday of September
  const labor = new Date(year, 8, 1);
  while (labor.getDay() !== 1) labor.setDate(labor.getDate() + 1);
  // Twelve-day fair ends Labor Day; start is 11 days earlier (Thursday)
  const start = new Date(labor);
  start.setDate(start.getDate() - 11);
  return start;
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
  const sun = sunTimes(now, LAT, LNG);
  const weather = await fetchWeather();
  const climate = classifyWeather(weather);
  const countdowns = buildCountdowns(now);

  // Pick a sunset companion deterministically by date, so the page changes daily.
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const sunset_pick = SUNSET_PICKS[doy % SUNSET_PICKS.length];

  const out = {
    generated_at: new Date().toISOString(),
    today: now.toISOString().slice(0, 10),
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
