#!/usr/bin/env node
/**
 * Geocode every entry's address via Nominatim (OpenStreetMap, free).
 *
 * Output: src/data/coords.json — { "address string": { lat, lng } }
 *
 * Cache forever; only requests addresses we haven't seen. Nominatim's TOS
 * requires no more than 1 req/sec and a real User-Agent identifying the
 * application, both of which we comply with.
 *
 * Run: node scripts/geocode.js [--force]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');
const OUT  = path.join(SRC, 'data/coords.json');

const UA = 'bestofmpls.com/0.1 (contact: hello@bestofmpls.com)';
const SLEEP_MS = 1100;
const FORCE = process.argv.includes('--force');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadCache() {
  try { return JSON.parse(fs.readFileSync(OUT, 'utf8')); }
  catch (_) { return {}; }
}

function saveCache(cache) {
  fs.writeFileSync(OUT, JSON.stringify(cache, null, 2));
}

function collectAddresses() {
  const seen = new Set();
  const dataDir = path.join(SRC, 'data');
  for (const f of fs.readdirSync(dataDir)) {
    if (!f.endsWith('.js')) continue;
    const mod = require(path.join(dataDir, f));
    let entries = mod.entries || mod.exhibitions || [];
    if (!Array.isArray(entries)) entries = [];
    for (const e of entries) {
      if (e.address && typeof e.address === 'string' && e.address.length > 5) {
        seen.add(e.address.trim());
      }
    }
  }
  return [...seen];
}

async function geocodeOne(addr) {
  const q = encodeURIComponent(addr);
  // Restrict to Minnesota-ish bbox to avoid mis-matches in other states.
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us&viewbox=-93.65,45.10,-92.95,44.83&bounded=1`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
  if (!res.ok) {
    if (res.status === 429) {
      console.warn(`    rate-limited, sleeping 30s`);
      await sleep(30000);
      return null;
    }
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    // Fallback: try without viewbox restriction.
    const fallback = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us`,
      { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
    const fdata = await fallback.json();
    if (!Array.isArray(fdata) || fdata.length === 0) return null;
    return { lat: parseFloat(fdata[0].lat), lng: parseFloat(fdata[0].lon), display: fdata[0].display_name };
  }
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
}

async function main() {
  const cache = FORCE ? {} : loadCache();
  const addresses = collectAddresses();
  const todo = addresses.filter(a => !cache[a]);
  console.log(`\n${addresses.length} addresses; ${todo.length} need geocoding.\n`);
  let i = 0, ok = 0, miss = 0;
  for (const addr of todo) {
    i++;
    process.stdout.write(`[${String(i).padStart(3)}/${todo.length}] ${addr.slice(0, 60).padEnd(62)} `);
    try {
      const r = await geocodeOne(addr);
      if (r) {
        cache[addr] = { lat: r.lat, lng: r.lng };
        ok++;
        process.stdout.write(`✓ ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}\n`);
      } else {
        cache[addr] = null;
        miss++;
        process.stdout.write(`× no match\n`);
      }
    } catch (e) {
      process.stdout.write(`! ${e.message}\n`);
    }
    // Save every 10 to survive crashes.
    if (i % 10 === 0) saveCache(cache);
    await sleep(SLEEP_MS);
  }
  saveCache(cache);
  const have = Object.values(cache).filter(v => v && v.lat).length;
  console.log(`\n  → ${have}/${addresses.length} addresses have coords (this run: ${ok} ok, ${miss} miss)\n`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
