#!/usr/bin/env node
/**
 * Run all scrapers and write src/data/events.json.
 *
 * Each scraper module exports { source, label, scrape() }. We run them in
 * parallel, swallow individual failures so one bad source does not poison
 * the run, then dedupe by id and sort by date+time.
 *
 * Output: src/data/events.json
 *   {
 *     generated_at: '2026-05-03T18:00:00Z',
 *     sources: [{source, label, count, ok, error?}],
 *     events: [...]
 *   }
 *
 * Usage:
 *   node scripts/scrape-events.js
 *   node scripts/scrape-events.js --only first-avenue,cedar
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'src/data/events.json');

const SCRAPERS = [
  require('./scrapers/first-avenue.js'),
  require('./scrapers/cedar.js'),
  require('./scrapers/walker.js'),
  require('./scrapers/riverview.js'),
  require('./scrapers/parkway.js'),
  require('./scrapers/trylon.js'),
  require('./scrapers/dakota.js'),
  require('./scrapers/hook.js'),
  require('./scrapers/berlin.js'),
  require('./scrapers/club331.js')
];

function parseArgs() {
  const args = process.argv.slice(2);
  const only = args.find(a => a.startsWith('--only='));
  return {
    only: only ? only.split('=')[1].split(',').map(s => s.trim()) : null
  };
}

async function runOne(scr) {
  const t0 = Date.now();
  try {
    const events = await scr.scrape();
    const ms = Date.now() - t0;
    console.log(`  ✓ ${scr.label.padEnd(34)} ${String(events.length).padStart(4)} events  (${ms}ms)`);
    return { source: scr.source, label: scr.label, count: events.length, ok: true, events };
  } catch (e) {
    const ms = Date.now() - t0;
    console.warn(`  ✗ ${scr.label.padEnd(34)} FAILED            (${ms}ms): ${e.message}`);
    return { source: scr.source, label: scr.label, count: 0, ok: false, error: e.message, events: [] };
  }
}

async function main() {
  const { only } = parseArgs();
  const scrapers = only ? SCRAPERS.filter(s => only.includes(s.source)) : SCRAPERS;

  console.log(`\nScraping ${scrapers.length} source${scrapers.length === 1 ? '' : 's'}...\n`);

  const results = await Promise.all(scrapers.map(runOne));

  // Merge, dedupe by id, sort by date then time then title.
  const byId = new Map();
  for (const r of results) {
    for (const ev of r.events) {
      if (!ev.id) continue;
      if (!byId.has(ev.id)) byId.set(ev.id, ev);
    }
  }
  const events = [...byId.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const at = a.time || '99:99', bt = b.time || '99:99';
    if (at !== bt) return at < bt ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  // Filter out anything older than yesterday.
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 1);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const fresh = events.filter(e => e.date >= cutoffIso);

  const output = {
    generated_at: new Date().toISOString(),
    sources: results.map(({ events, ...rest }) => rest),
    events: fresh
  };

  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`\n  → wrote ${fresh.length} events to src/data/events.json (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)\n`);

  // Sanity: warn loudly if everything failed.
  const ok = results.filter(r => r.ok).length;
  if (ok === 0) {
    console.error('All scrapers failed. Not exiting nonzero so build can still proceed with stale data.');
  }
}

if (require.main === module) main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
