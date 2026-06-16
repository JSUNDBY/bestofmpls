#!/usr/bin/env node
/**
 * process-votes.js — pull reader poll votes from the Worker and surface the
 * NEW ones to add, deduped against what is already on the site.
 *
 * The site's data files are the source of truth for "already added": if a
 * voted place already exists in its category file, it is skipped. A small
 * skip-ledger (src/data/votes-skip.json) holds places we deliberately did NOT
 * add (closed, off-brand, unverifiable) so they stop reappearing as pending.
 *
 * Usage:
 *   node scripts/process-votes.js              # list pending votes (JSON)
 *   node scripts/process-votes.js --skip "burgers::some-place-norm" [...]
 *                                              # mark a place as handled-but-skipped
 *
 * Auth: reads ADMIN_KEY from env, or from worker/.admin-key (gitignored).
 *
 * The verify-and-add step is intentionally NOT automated — each pending place
 * is web-verified (open? real address?) and written in the site voice before
 * it ships. This script just gathers and dedupes the queue.
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const DATA_DIR  = path.join(ROOT, 'src/data');
const SKIP_FILE = path.join(DATA_DIR, 'votes-skip.json');
const WORKER    = 'https://bestofmpls-poll.j-sundby.workers.dev/admin/recent';

function adminKey() {
  if (process.env.ADMIN_KEY) return process.env.ADMIN_KEY.trim();
  try { return fs.readFileSync(path.join(ROOT, 'worker/.admin-key'), 'utf8').trim(); }
  catch (_) { return ''; }
}

// Same normalization the Worker uses, so vote place_norm and our entry names
// collapse the same way.
function normalizePlace(s) {
  return String(s || '').toLowerCase()
    .replace(/[''`’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// slug -> Set of normalized entry names already on the site
function existingByCategory() {
  const map = {};
  for (const f of fs.readdirSync(DATA_DIR)) {
    if (!f.endsWith('.js')) continue;
    let mod; try { mod = require(path.join(DATA_DIR, f)); } catch (_) { continue; }
    if (!mod || !mod.slug || !Array.isArray(mod.entries)) continue;
    map[mod.slug] = new Set(mod.entries.map(e => normalizePlace(e.name)));
  }
  return map;
}

function loadSkip() {
  try { return new Set(JSON.parse(fs.readFileSync(SKIP_FILE, 'utf8'))); }
  catch (_) { return new Set(); }
}
function saveSkip(set) {
  fs.writeFileSync(SKIP_FILE, JSON.stringify([...set].sort(), null, 2) + '\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--skip') {
    const skip = loadSkip();
    args.slice(1).forEach(k => skip.add(k));
    saveSkip(skip);
    console.log(`Skip-ledger now holds ${skip.size} entries.`);
    return;
  }

  const key = adminKey();
  if (!key) { console.error('No ADMIN_KEY (env or worker/.admin-key). Cannot fetch votes.'); process.exit(1); }

  const res = await fetch(WORKER, { headers: { 'X-Admin-Key': key } });
  if (!res.ok) { console.error(`Worker ${res.status}: ${await res.text()}`); process.exit(1); }
  const data = await res.json();
  const votes = (data.submissions || []).filter(s => s.kind === 'vote');

  const existing = existingByCategory();
  const skip = loadSkip();

  // Group votes by category::place_norm, counting repeats (popularity signal).
  const pending = {};
  for (const v of votes) {
    const cat  = v.category;
    // Recompute from the raw place with our normalizer (which strips curly
    // apostrophes); the Worker's stored place_norm does not, so trusting it
    // would miss matches like "Lion’s Tap" → entry "Lion’s Tap".
    const norm = normalizePlace(v.place);
    const id   = `${cat}::${norm}`;
    if (existing[cat] && existing[cat].has(norm)) continue;   // already on the site
    if (skip.has(id)) continue;                                // deliberately skipped
    if (!pending[id]) pending[id] = { id, category: cat, place: v.place, votes: 0, whys: [], latest_ts: 0 };
    pending[id].votes += 1;
    if (v.why) pending[id].whys.push(v.why);
    pending[id].latest_ts = Math.max(pending[id].latest_ts, v.ts || 0);
  }

  const list = Object.values(pending).sort((a, b) => b.votes - a.votes || b.latest_ts - a.latest_ts);
  console.log(JSON.stringify({ pending_count: list.length, pending: list }, null, 2));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
