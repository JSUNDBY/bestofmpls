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
// Accolades are ONE input, not a crown. A small, durable credibility floor so a
// place with real honors doesn't start at zero — but a handful of real regulars
// or a couple of stories overtake it. Press and trophies don't decide the winner;
// the people who actually go do.
const SEED_WINNER = 5;     // strongest accolade in the category (e.g. Beard winner)
const SEED_RUNNER = 3;     // also-recognized
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
    if (!places[pid]) places[pid] = {
      category, score: 0, seed: 0,
      dSave: 0, dRegular: 0, dDirections: 0, dStory: 0,           // decayed (feed the score)
      nSaves: 0, nRegulars: 0, nDirections: 0, nStories: 0,        // raw counts (for display)
      voices: 0, stories: []                                        // people who weighed in + approved story texts
    };
    return places[pid];
  };

  // Cold-start seed: small, durable credibility floor. A blank winner means
  // "no hand-crown — let the signal decide" (e.g. Restaurant of the Year).
  for (const s of seed) {
    if (s.winner) ensure(`${s.slug}/${entrySlug(s.winner)}`, s.slug).seed += SEED_WINNER;
    for (const r of (s.runnersUp || [])) ensure(`${s.slug}/${entrySlug(r)}`, s.slug).seed += SEED_RUNNER;
  }

  // Live reader signals: decayed sums feed the score; raw counts feed the display.
  for (const [pid, sig] of Object.entries(signals)) {
    const p = ensure(pid, pid.split('/')[0]);
    p.dSave += decaySum(sig.saves, now);
    p.dRegular += decaySum(sig.regulars, now);
    p.dDirections += decaySum(sig.directions, now);
    p.dStory += decaySum((sig.stories || []).map(x => x.ts), now);
    p.nSaves += (sig.saves || []).length;
    p.nRegulars += (sig.regulars || []).length;
    p.nDirections += (sig.directions || []).length;
    p.nStories += (sig.stories || []).length;
    for (const st of (sig.stories || [])) if (st.text) p.stories.push(st.text);
  }

  for (const p of Object.values(places)) {
    p.score = +(p.seed + p.dSave * WEIGHTS.save + p.dRegular * WEIGHTS.regular
      + p.dDirections * WEIGHTS.directions + p.dStory * WEIGHTS.story).toFixed(2);
    // "voices" = people who actually weighed in (saves + regulars + stories).
    p.voices = p.nSaves + p.nRegulars + p.nStories;
    // drop the decayed working fields from the stored output (keep it readable)
    delete p.dSave; delete p.dRegular; delete p.dDirections; delete p.dStory;
  }

  const standings = {};
  for (const [pid, p] of Object.entries(places)) {
    (standings[p.category] = standings[p.category] || []).push({ place: pid, score: p.score, voices: p.voices });
  }
  for (const cat of Object.keys(standings)) standings[cat].sort((a, b) => b.score - a.score);

  const totalVoices = Object.values(places).reduce((n, p) => n + p.voices, 0);
  const out = {
    generated_at: new Date(now).toISOString().slice(0, 10),
    halflife_days: HALFLIFE_DAYS,
    weights: WEIGHTS,
    seed_boost: { winner: SEED_WINNER, runner: SEED_RUNNER },
    live_signals: live ? Object.keys(signals).length : 0,
    total_voices: totalVoices,
    places,
    standings
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`livingbest.json: ${Object.keys(places).length} places · ${Object.keys(standings).length} categories · ${live ? Object.keys(signals).length : 'worker offline, seed only'} live`);
  for (const cat of ['restaurants', 'best-pizza', 'breweries']) {
    if (standings[cat]) console.log(`  ${cat}: ` + standings[cat].slice(0, 3).map(x => `${x.place.split('/')[1]} (${x.score})`).join(' · '));
  }
})();
