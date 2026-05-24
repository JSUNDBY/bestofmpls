#!/usr/bin/env node
/**
 * Fetch the actual skyway network from OpenStreetMap (via Overpass API)
 * for both downtowns and write a clean, normalized geometry file the
 * site can render as polylines.
 *
 * Why: hand-curated point-to-point arrows are not "a skyway map." The
 * cityoflakes ArcGIS data, the OSM dataset, and skywayaccess.com all
 * pull from the same upstream — OSM. Going to the source means we get
 * actual segment geometry, both downtowns, and a result that updates
 * when reality does (private buildings open/close skyway segments
 * constantly; OSM is the network of record).
 *
 * Output: src/data/skyway-segments.json
 *
 * Run: node scripts/fetch-skyway.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'src/data/skyway-segments.json');

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const UA = 'bestofmpls.com (hello@bestofmpls.com)';

// One broad query: named skyways across the metro + any indoor / covered
// elevated footways in either downtown core. The post-process step then
// classifies each result as Minneapolis, Saint Paul, or other, and drops
// false positives like "Skyway Theatre" (a music venue).
const QUERY = `
[out:json][timeout:90];
(
  way["name"~"[Ss]kyway"](44.9, -93.30, 45.00, -93.05);
  way["highway"="footway"]["layer"="1"]["indoor"="yes"](44.967, -93.286, 44.987, -93.255);
  way["highway"="footway"]["layer"="1"]["indoor"="yes"](44.94, -93.105, 44.955, -93.08);
  way["highway"="footway"]["bridge"~"yes|covered"]["covered"="yes"](44.967, -93.286, 44.987, -93.255);
  way["highway"="footway"]["bridge"~"yes|covered"]["covered"="yes"](44.94, -93.105, 44.955, -93.08);
);
out body geom;
`;

function classifyCity(tags, coords) {
  const name = String(tags.name || '');
  if (/Saint Paul|St\.?\s*Paul/i.test(name)) return 'saintpaul';
  if (/Minneapolis/i.test(name)) return 'minneapolis';
  // Fall back on geography. Mpls downtown is at ~-93.27, St Paul at ~-93.09.
  if (!coords.length) return null;
  const avgLon = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  if (avgLon > -93.15) return 'saintpaul';
  if (avgLon < -93.20) return 'minneapolis';
  return null;
}

function isReallySkyway(tags) {
  // Drop the music venue false positive.
  if (tags.name === 'Skyway Theatre') return false;
  if (tags.amenity === 'theatre' || tags.amenity === 'cinema') return false;
  // Keep anything tagged highway=footway that's indoor or covered or bridged.
  if (tags.highway !== 'footway' && !/skyway/i.test(tags.name || '')) return false;
  return true;
}

async function main() {
  console.log('Querying Overpass for skyway segments…');
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(QUERY)
  });
  if (!res.ok) {
    throw new Error(`Overpass ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
  }
  const data = await res.json();
  const elements = data.elements || [];
  console.log(`  → ${elements.length} raw ways returned`);

  const out = {
    generated_at: new Date().toISOString(),
    source: 'OpenStreetMap via Overpass API (ODbL)',
    attribution: '© OpenStreetMap contributors',
    cities: {
      minneapolis: { name: 'Minneapolis', segments: [] },
      saintpaul:   { name: 'Saint Paul',  segments: [] }
    }
  };

  let dropped = 0;
  for (const e of elements) {
    if (e.type !== 'way') continue;
    const tags = e.tags || {};
    if (!isReallySkyway(tags)) { dropped++; continue; }
    const coords = (e.geometry || []).map(p => [Number(p.lat.toFixed(6)), Number(p.lon.toFixed(6))]);
    if (coords.length < 2) { dropped++; continue; }
    const city = classifyCity(tags, coords);
    if (!city) { dropped++; continue; }
    out.cities[city].segments.push({
      id: e.id,
      coords,
      bridge: !!tags.bridge,
      indoor: tags.indoor === 'yes',
      name: tags.name || null
    });
  }

  // Sort segments by length descending so the longer corridors render last
  // (on top) in the polyline layer for a cleaner read.
  for (const c of Object.values(out.cities)) {
    c.segments.sort((a, b) => a.coords.length - b.coords.length);
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  const m = out.cities.minneapolis.segments.length;
  const s = out.cities.saintpaul.segments.length;
  console.log(`  → kept ${m + s} segments (${m} Mpls, ${s} St Paul), dropped ${dropped}`);
  console.log(`  → wrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
