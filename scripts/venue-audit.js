#!/usr/bin/env node
/**
 * Venue coverage audit — which music/entertainment venues have schedules in
 * the feed, which are listed in the guide but silent, and which metro-major
 * venues are missing entirely. Writes docs/VENUE-AUDIT.md.
 *
 * Run: node scripts/venue-audit.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const events = require(path.join(SRC, 'data/events.json')).events || [];
const today = new Date().toISOString().slice(0, 10);
const upcoming = events.filter((e) => e.date >= today);

// Scraped-venue name → directory entry name (mirror of build.js resolveVenues).
const ALIAS = {
  'First Avenue': 'First Avenue & 7th St Entry',
  '7th St Entry': 'First Avenue & 7th St Entry',
  'Turf Club': 'First Avenue & 7th St Entry',
  'Fine Line': 'The Fine Line Music Cafe',
  'The Cedar Cultural Center': 'Cedar Cultural Center',
  'Dakota Jazz Club': 'Dakota Jazz Club & Restaurant',
  'The Hook and Ladder Theater & Lounge': 'The Hook and Ladder Theater',
};

function countFor(name) {
  return upcoming.filter((e) => e.venue === name || ALIAS[e.venue] === name).length;
}

// Directory venues (live music + theaters + cinemas)
const cats = ['live-music', 'theaters', 'arts-buildings', 'cinemas'];
const FILES = { 'live-music': 'live-music.js', theaters: 'theaters.js', 'arts-buildings': 'arts-buildings.js', cinemas: 'cinemas.js' };
const rows = [];
for (const [cat, file] of Object.entries(FILES)) {
  let mod;
  try { mod = require(path.join(SRC, 'data', file)); } catch (_) { continue; }
  for (const e of mod.entries) rows.push({ name: e.name, cat: mod.title || cat, n: countFor(e.name) });
}

// Metro-major venues NOT in the guide directory at all — the outside list.
// (Names here are only used to grep the feed and to name the gap; nothing
// is published from this list without the usual verification.)
const OUTSIDE = [
  'The Fillmore Minneapolis', 'Uptown Theater', 'Xcel Energy Center',
  'Target Center', 'US Bank Stadium', 'The Cabooze', 'Green Room',
  'Uptown VFW', "Mortimer's", "Palmer's Bar", 'Myth Live',
  'Mystic Lake', 'Treasure Island', "O'Gara's", 'Hook & Ladder',
  'Surly Festival Field', 'The Loft at Barfly', 'Granada Theater',
];

const venuesInFeed = [...new Set(upcoming.map((e) => e.venue))].sort();

const covered = rows.filter((r) => r.n > 0).sort((a, b) => b.n - a.n);
const silent = rows.filter((r) => r.n === 0);
const outside = OUTSIDE.map((name) => ({ name, n: upcoming.filter((e) => (e.venue || '').toLowerCase().includes(name.toLowerCase().split(' ')[1] || name.toLowerCase())).length }));

const lines = [
  '# Venue coverage audit',
  '',
  `Generated ${today} by \`scripts/venue-audit.js\` from the current events feed`,
  `(${upcoming.length} upcoming events across ${venuesInFeed.length} feed venues).`,
  'Re-run any time; this file is overwritten.',
  '',
  `## Covered — directory venues with schedules (${covered.length})`,
  '',
  '| Venue | Guide category | Upcoming events |',
  '|---|---|---|',
  ...covered.map((r) => `| ${r.name} | ${r.cat} | ${r.n} |`),
  '',
  `## In the guide but SILENT — no events in the feed (${silent.length})`,
  '',
  'These are listed as places, but readers see no schedule. Each is either',
  'scrapeable (a gap to close), genuinely between shows, or not a calendar',
  'venue at all (galleries handled via /now-showing/, cinemas via showtimes).',
  '',
  ...silent.map((r) => `- ${r.name} (${r.cat})`),
  '',
  '## Not in the guide at all — metro majors to consider',
  '',
  ...OUTSIDE.map((name) => `- ${name}`),
  '',
  '## Every venue currently in the feed',
  '',
  ...venuesInFeed.map((v) => `- ${v} (${upcoming.filter((e) => e.venue === v).length})`),
  '',
];
fs.writeFileSync(path.join(ROOT, 'docs/VENUE-AUDIT.md'), lines.join('\n'));
console.log(`covered: ${covered.length} | silent in guide: ${silent.length} | feed venues: ${venuesInFeed.length}`);
console.log('\nSILENT directory venues:');
silent.forEach((r) => console.log('  -', r.name, `(${r.cat})`));
