#!/usr/bin/env node
/**
 * Fetch regular opening hours for every entry via Google Places (New) API.
 *
 * One Text Search call per entry: "<name> <neighborhood>" biased to the metro
 * bbox. We pull only the fields we need (id, displayName, regularOpeningHours)
 * to stay in the Pro SKU group (~$32/1000). Cache forever to a JSON file
 * keyed by `<categorySlug>:<entryName>` so re-runs only fetch new entries.
 *
 * Output: src/data/hours.json
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=... node scripts/fetch-hours.js
 *   GOOGLE_PLACES_API_KEY=... node scripts/fetch-hours.js --force      # refetch everything
 *   GOOGLE_PLACES_API_KEY=... node scripts/fetch-hours.js --slug=pizza  # only one category
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');
const OUT  = path.join(SRC, 'data/hours.json');

const KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.error('GOOGLE_PLACES_API_KEY not set. Export it first.');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');
const SLUG_FILTER = (process.argv.find(a => a.startsWith('--slug=')) || '').split('=')[1] || null;
const SLEEP_MS = 250; // Stay well under quota

// Metro bbox: roughly the seven-county area
const METRO_BBOX = {
  low: { latitude: 44.70, longitude: -93.80 },
  high: { latitude: 45.30, longitude: -92.80 }
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadCache() {
  try { return JSON.parse(fs.readFileSync(OUT, 'utf8')); }
  catch (_) { return {}; }
}
function saveCache(c) {
  fs.writeFileSync(OUT, JSON.stringify(c, null, 2));
}

function key(slug, name) { return `${slug}:${name}`; }

function collectEntries() {
  const list = [];
  const dataDir = path.join(SRC, 'data');
  for (const f of fs.readdirSync(dataDir)) {
    if (!f.endsWith('.js')) continue;
    const mod = require(path.join(dataDir, f));
    if (mod.layout === 'seasonal') continue;
    if (!mod.entries) continue;
    if (SLUG_FILTER && mod.slug !== SLUG_FILTER) continue;
    for (const e of mod.entries) {
      if (!e.address || !e.name) continue;
      list.push({
        slug: mod.slug,
        name: e.name,
        address: e.address,
        neighborhood: e.neighborhood || ''
      });
    }
  }
  return list;
}

async function fetchOne(entry) {
  // Build a search query that helps Google find the right entity. If we
  // have a real street address (a number in it), include it so Places can
  // match on geography rather than guessing from the name alone. This
  // prevents matches like "St. Croix River paddling" → a Mississippi River
  // address in Minneapolis.
  const isStreetAddress = /\d/.test(entry.address);
  const cityHint = /st\.?\s*paul/i.test(entry.address) ? 'Saint Paul' : 'Minneapolis';
  const query = isStreetAddress
    ? `${entry.name}, ${entry.address}`
    : `${entry.name} ${cityHint} MN`;

  const body = {
    textQuery: query,
    locationBias: { rectangle: METRO_BBOX },
    pageSize: 1
  };

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.regularOpeningHours,places.location,places.businessStatus,places.types'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data.places || data.places.length === 0) return null;
  const p = data.places[0];
  return {
    place_id: p.id,
    matched_name: p.displayName?.text || null,
    matched_address: p.formattedAddress || null,
    location: p.location || null,
    business_status: p.businessStatus || null,
    types: p.types || [],
    hours: (p.regularOpeningHours?.periods || []).map(prd => ({
      day: prd.open?.day,
      open: pad(prd.open?.hour) + ':' + pad(prd.open?.minute),
      close: prd.close ? (pad(prd.close.hour) + ':' + pad(prd.close.minute)) : null
    })),
    fetched_at: new Date().toISOString()
  };
}
function pad(n) { return String(n ?? 0).padStart(2, '0'); }

async function main() {
  const cache = FORCE ? {} : loadCache();
  const entries = collectEntries();
  const todo = entries.filter(e => !cache[key(e.slug, e.name)]);
  console.log(`\n${entries.length} entries; ${todo.length} need hours fetched.\n`);

  let i = 0, ok = 0, miss = 0, hoursOk = 0;
  for (const e of todo) {
    i++;
    process.stdout.write(`[${String(i).padStart(3)}/${todo.length}] ${e.name.slice(0, 42).padEnd(44)} `);
    try {
      const r = await fetchOne(e);
      if (r) {
        cache[key(e.slug, e.name)] = r;
        ok++;
        if (r.hours && r.hours.length > 0) hoursOk++;
        process.stdout.write(`✓ ${r.hours?.length || 0} periods\n`);
      } else {
        cache[key(e.slug, e.name)] = { not_found: true, fetched_at: new Date().toISOString() };
        miss++;
        process.stdout.write(`× no place match\n`);
      }
    } catch (err) {
      process.stdout.write(`! ${err.message.slice(0, 80)}\n`);
    }
    if (i % 20 === 0) saveCache(cache);
    await sleep(SLEEP_MS);
  }
  saveCache(cache);
  const total = Object.values(cache).filter(v => v && v.hours && v.hours.length > 0).length;
  console.log(`\n  → ${total}/${entries.length} entries have hours (this run: ${ok} matched, ${hoursOk} with hours, ${miss} unmatched)\n`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
