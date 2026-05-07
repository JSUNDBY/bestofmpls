#!/usr/bin/env node
/**
 * Audit the directory for closures and bad geolocations.
 *
 * Reports:
 *   1. Entries where Places returned business_status = CLOSED_PERMANENTLY
 *      or CLOSED_TEMPORARILY. These are likely-closed places we should
 *      remove and add to /departed/.
 *   2. Entries where Places' matched_address city differs from the city
 *      we wrote in our entry's address. Strong signal Places matched the
 *      wrong storefront.
 *   3. Entries where Places' lat/lng disagrees with Nominatim's lat/lng
 *      for the entry's address by more than 1 mile. Same signal — wrong
 *      match.
 *   4. Entries where Places never matched at all (no place_id, no coords).
 *
 * Usage: node scripts/audit.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');

const hours  = loadJson(path.join(SRC, 'data/hours.json'))  || {};
const coords = loadJson(path.join(SRC, 'data/coords.json')) || {};

function loadJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}

// Haversine distance in miles
function distMi(a, b) {
  const R = 3958.8;
  const toR = d => d * Math.PI / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const aa = Math.sin(dLat/2)**2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(aa));
}

// Pull a city token out of a free-text address. Used to compare what we
// wrote against what Places matched.
function cityOf(addr) {
  if (!addr) return null;
  const s = String(addr).toLowerCase();
  if (/saint paul|st\.?\s*paul/.test(s)) return 'st-paul';
  if (/minneapolis/.test(s)) return 'minneapolis';
  if (/edina/.test(s)) return 'edina';
  if (/wayzata/.test(s)) return 'wayzata';
  if (/bloomington/.test(s)) return 'bloomington';
  if (/golden valley/.test(s)) return 'golden-valley';
  if (/columbia heights/.test(s)) return 'columbia-heights';
  if (/excelsior/.test(s)) return 'excelsior';
  if (/stillwater/.test(s)) return 'stillwater';
  if (/taylors falls/.test(s)) return 'taylors-falls';
  if (/st\.?\s*louis park/.test(s)) return 'st-louis-park';
  if (/minnetonka/.test(s)) return 'minnetonka';
  if (/roseville/.test(s)) return 'roseville';
  return null;
}

const issues = {
  closed: [],
  cityMismatch: [],
  coordMismatch: [],
  noPlacesMatch: [],
  vagueAddress: []
};

const dataDir = path.join(SRC, 'data');
let total = 0;
for (const f of fs.readdirSync(dataDir)) {
  if (!f.endsWith('.js')) continue;
  let mod;
  try { mod = require(path.join(dataDir, f)); } catch (_) { continue; }
  if (!mod || mod.layout === 'seasonal' || !mod.entries) continue;

  for (const e of mod.entries) {
    if (!e.name || !e.address) continue;
    total++;
    const key = `${mod.slug}:${e.name}`;
    const h = hours[key];
    const entryCity = cityOf(e.address);
    const hasNumber = /\d/.test(e.address);

    // Vague address (no street number) — more likely to misgeocode.
    if (!hasNumber && !/park|garden|river|lake|conservatory|stadium|fairgrounds/i.test(e.address)) {
      issues.vagueAddress.push({ slug: mod.slug, name: e.name, address: e.address });
    }

    if (!h || !h.place_id) {
      issues.noPlacesMatch.push({ slug: mod.slug, name: e.name, address: e.address });
      continue;
    }

    if (h.business_status && h.business_status !== 'OPERATIONAL') {
      issues.closed.push({ slug: mod.slug, name: e.name, address: e.address, status: h.business_status });
    }

    const matchedCity = cityOf(h.matched_address);
    if (entryCity && matchedCity && entryCity !== matchedCity) {
      issues.cityMismatch.push({
        slug: mod.slug, name: e.name,
        entry_address: e.address,
        matched_address: h.matched_address,
        entry_city: entryCity, matched_city: matchedCity
      });
    }

    // Coord-mismatch check: compare Places location vs Nominatim coord
    // for the entry's address. Both must exist for this to be meaningful.
    const nom = coords[String(e.address).trim()];
    if (h.location && nom && nom.lat) {
      const d = distMi(
        { lat: h.location.latitude,  lng: h.location.longitude },
        { lat: nom.lat,              lng: nom.lng }
      );
      if (d > 1.5) {
        issues.coordMismatch.push({
          slug: mod.slug, name: e.name,
          entry_address: e.address,
          places_address: h.matched_address,
          dist_mi: Number(d.toFixed(2))
        });
      }
    }
  }
}

console.log(`\nAudited ${total} entries across ${Object.keys(hours).length} hours records.\n`);

function section(title, list) {
  console.log(`\n=== ${title} (${list.length}) ===\n`);
  list.forEach((x, i) => console.log(`  ${i+1}. ${JSON.stringify(x)}`));
}

section('CLOSED PER PLACES', issues.closed);
section('CITY MISMATCH (Places matched wrong city)', issues.cityMismatch);
section('COORD MISMATCH (Places vs Nominatim disagree by >1.5mi)', issues.coordMismatch);
section('NO PLACES MATCH (entry never resolved)', issues.noPlacesMatch);
section('VAGUE ADDRESS (no street number, not a park)', issues.vagueAddress);

console.log(`\nSummary: ${issues.closed.length} closed, ${issues.cityMismatch.length} city mismatches, ${issues.coordMismatch.length} coord mismatches, ${issues.noPlacesMatch.length} unmatched, ${issues.vagueAddress.length} vague.\n`);
