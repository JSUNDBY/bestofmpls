#!/usr/bin/env node
/**
 * Second-pass geocoder for addresses Nominatim missed on the first try.
 *
 * Two recovery tactics, in order:
 *   1. Clean the address (strip parentheticals like "(and 777 Grand Ave)",
 *      strip ", Suite N" / ", Studio N" / venue annotations) and retry
 *      Nominatim with the cleaned string.
 *   2. US Census geocoder (free, no key, street-address oriented) with the
 *      cleaned string.
 *
 * Results are written into src/data/coords.json under the ORIGINAL address
 * string, because lookupCoords() in build.js looks up the entry's raw
 * address verbatim.
 *
 * Run: node scripts/geocode-retry.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');
const OUT  = path.join(SRC, 'data/coords.json');

const UA = 'bestofmpls.com/0.1 (contact: hello@bestofmpls.com)';
const SLEEP_MS = 1100;

// Metro sanity bounds — reject anything outside the greater Twin Cities.
const BOUNDS = { latMin: 44.6, latMax: 45.3, lngMin: -93.8, lngMax: -92.8 };
function inBounds(c) {
  return c.lat >= BOUNDS.latMin && c.lat <= BOUNDS.latMax &&
         c.lng >= BOUNDS.lngMin && c.lng <= BOUNDS.lngMax;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// "600 E Hennepin Ave, Minneapolis (and 777 Grand Ave, St. Paul)"
//   → "600 E Hennepin Ave, Minneapolis"
// "1500 Jackson St NE, Studio 144, Minneapolis"
//   → "1500 Jackson St NE, Minneapolis"
function cleanAddress(addr) {
  return addr
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/,\s*(Suite|Ste\.?|Studio|Unit|#)\s*[\w-]+/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function collectMissing(coords) {
  const dataDir = path.join(SRC, 'data');
  const missing = new Set();
  for (const f of fs.readdirSync(dataDir)) {
    if (!f.endsWith('.js')) continue;
    const mod = require(path.join(dataDir, f));
    for (const e of (mod.entries || mod.exhibitions || [])) {
      const a = e.address && e.address.trim();
      if (a && a.length > 5 && /\d/.test(a) && !coords[a]) missing.add(a);
    }
  }
  return [...missing];
}

async function nominatim(addr) {
  const q = encodeURIComponent(addr);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us&viewbox=-93.65,45.10,-92.95,44.83&bounded=1`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;
  const c = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return inBounds(c) ? c : null;
}

async function census(addr) {
  const q = encodeURIComponent(addr + ', MN');
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${q}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = await res.json();
  const m = data && data.result && data.result.addressMatches && data.result.addressMatches[0];
  if (!m || !m.coordinates) return null;
  const c = { lat: m.coordinates.y, lng: m.coordinates.x };
  return inBounds(c) ? c : null;
}

async function main() {
  const coords = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const missing = collectMissing(coords);
  console.log(`\n${missing.length} street addresses still missing coords\n`);

  let ok = 0;
  for (let i = 0; i < missing.length; i++) {
    const orig = missing[i];
    const cleaned = cleanAddress(orig);
    let c = null, how = '';

    if (cleaned !== orig) {
      c = await nominatim(cleaned);
      how = 'nominatim/cleaned';
      await sleep(SLEEP_MS);
    }
    if (!c) {
      c = await census(cleaned);
      how = 'census';
      await sleep(300);
    }

    if (c) {
      coords[orig] = { lat: c.lat, lng: c.lng };
      ok++;
      console.log(`[${i + 1}/${missing.length}] ${orig.slice(0, 55).padEnd(55)} ✓ ${c.lat.toFixed(4)}, ${c.lng.toFixed(4)} (${how})`);
    } else {
      console.log(`[${i + 1}/${missing.length}] ${orig.slice(0, 55).padEnd(55)} × still no match`);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(coords, null, 2));
  console.log(`\n  → recovered ${ok}/${missing.length}; coords.json now ${Object.keys(coords).length} addresses\n`);
}

main();
