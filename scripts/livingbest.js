#!/usr/bin/env node
/**
 * livingbest.js — The Living Best of MPLS scoring core (engine, phase 1).
 *
 * Reads reader signals from the worker (GET /signals), merges a cold-start seed
 * (verified accolade picks so day one isn't empty), applies TIME-DECAY so the
 * read reflects right now, and writes src/data/livingbest.json: a score per
 * place plus draft standings per category.
 *
 * The score is pure signal — never hand-tuned per business, and the paid
 * `featured` flag never touches it. Editorial control happens around this
 * (eligibility, hide, editor's notes), never inside the math.
 *
 * Run: node scripts/livingbest.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SEED_FILE = path.join(ROOT, 'src/data/livingbest-seed.json');
const OUT_FILE = path.join(ROOT, 'src/data/livingbest.json');
const WORKER = 'https://bestofmpls-poll.j-sundby.workers.dev';

// Must match build.js entrySlug so place ids line up with entry URLs + buttons.
function entrySlug(name) {
  return String(name || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Scoring knobs (documented so they're easy to tune; the model is transparent).
const WEIGHTS = { save: 1, regular: 3, directions: 1, story: 5 }; // loyalty + meaning weigh most
const SEED_WINNER = 20;    // durable accolade baseline (James Beard, etc.)
const SEED_RUNNER = 8;
const HALFLIFE_DAYS = 90;  // recent actions weigh more — this is what makes it "now"
const MS_DAY = 86400000;
const LN2 = Math.log(2);

function decaySum(tsList, now) {
  let s = 0;
  for (const ts of (tsList || [])) {
    const ageDays = Math.max(0, (now - ts) / MS_DAY);
    s += Math.exp(-LN2 * ageDays / HALFLIFE_DAYS);
  }
  return s;
}

async function fetchSignals() {
  try {
    const res = await fetch(WORKER + '/signals', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { places: {}, live: false };
    const j = await res.json();
    return { places: j.places || {}, live: true };
  } catch (_) { return { places: {}, live: false }; }
}

(async () => {
  const now = Date.now();
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const { places: signals, live } = await fetchSignals();

  const places = {};
  const ensure = (pid, category) => {
    if (!places[pid]) places[pid] = { category, score: 0, seed: 0, saves: 0, regulars: 0, directions: 0, stories: 0 };
    return places[pid];
  };

  // Cold-start seed: durable accolade baseline (never decays — real honors last).
  for (const s of seed) {
    ensure(`${s.slug}/${entrySlug(s.winner)}`, s.slug).seed += SEED_WINNER;
    for (const r of (s.runnersUp || [])) ensure(`${s.slug}/${entrySlug(r)}`, s.slug).seed += SEED_RUNNER;
  }

  // Live reader signals, time-decayed.
  for (const [pid, sig] of Object.entries(signals)) {
    const p = ensure(pid, pid.split('/')[0]);
    p.saves += decaySum(sig.saves, now);
    p.regulars += decaySum(sig.regulars, now);
    p.directions += decaySum(sig.directions, now);
    p.stories += decaySum((sig.stories || []).map(x => x.ts), now);
  }

  for (const p of Object.values(places)) {
    p.score = +(p.seed + p.saves * WEIGHTS.save + p.regulars * WEIGHTS.regular
      + p.directions * WEIGHTS.directions + p.stories * WEIGHTS.story).toFixed(2);
    p.saves = +p.saves.toFixed(2); p.regulars = +p.regulars.toFixed(2);
    p.directions = +p.directions.toFixed(2); p.stories = +p.stories.toFixed(2);
  }

  const standings = {};
  for (const [pid, p] of Object.entries(places)) {
    (standings[p.category] = standings[p.category] || []).push({ place: pid, score: p.score });
  }
  for (const cat of Object.keys(standings)) standings[cat].sort((a, b) => b.score - a.score);

  const out = {
    generated_at: new Date(now).toISOString().slice(0, 10),
    halflife_days: HALFLIFE_DAYS,
    weights: WEIGHTS,
    seed_boost: { winner: SEED_WINNER, runner: SEED_RUNNER },
    live_signals: live ? Object.keys(signals).length : 0,
    places,
    standings
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`livingbest.json: ${Object.keys(places).length} places · ${Object.keys(standings).length} categories · ${live ? Object.keys(signals).length : 'worker offline, seed only'} live`);
  for (const cat of ['restaurants', 'best-pizza', 'breweries']) {
    if (standings[cat]) console.log(`  ${cat}: ` + standings[cat].slice(0, 3).map(x => `${x.place.split('/')[1]} (${x.score})`).join(' · '));
  }
})();
