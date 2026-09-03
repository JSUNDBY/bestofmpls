#!/usr/bin/env node
/**
 * Weak-web prospect scanner — fills the SALES-KIT "First 10" with evidence.
 *
 * Scans every guide business's ACTUAL website (never the blank `website`
 * field alone — that's unfilled-by-category, not a signal) and scores real
 * weakness: dead site, social-media-only presence, not mobile-ready,
 * plain http, parked domain. Output: growth/PITCH-LIST.md, ranked, with
 * the evidence line to use in the opener.
 *
 * Run: node scripts/weak-web-scan.js            (all categories)
 *      node scripts/weak-web-scan.js --food     (food & drink only)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'growth/PITCH-LIST.md');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const FOOD_DRINK = new Set(['restaurants', 'food-halls', 'coffee-shops', 'pastries-and-bakeries', 'sandwiches', 'burgers', 'best-pizza', 'best-brunch', 'mexican-and-tacos', 'vietnamese', 'korean', 'japanese', 'hmong-food', 'ethiopian', 'indian-restaurants', 'thai', 'chinese', 'late-night', 'ice-cream', 'cocktail-bars', 'breweries', 'best-dive-bars', 'best-patios', 'best-happy-hours', 'gluten-free']);
const FOOD_ONLY = process.argv.includes('--food');

// Big operators we will never cold-pitch; their web presence is corporate.
const SKIP_RE = /surly|first avenue|walker art|guthrie|orchestra|target|mall of america|hilton|marriott|four seasons/i;

const SOCIAL_RE = /facebook\.com|instagram\.com|linktr\.ee|linktree|squareup\.com|square\.site/i;
const PARKED_RE = /domain (is )?for sale|this domain|godaddy|hugedomains|parked|buy this domain/i;

function loadEntries() {
  const files = fs.readdirSync(path.join(SRC, 'data')).filter(f => f.endsWith('.js'));
  const out = [];
  for (const f of files) {
    let mod;
    try { mod = require(path.join(SRC, 'data', f)); } catch (_) { continue; }
    if (!mod || !mod.slug || !Array.isArray(mod.entries)) continue;
    if (FOOD_ONLY && !FOOD_DRINK.has(mod.slug)) continue;
    for (const e of mod.entries) {
      if (!e.name || SKIP_RE.test(e.name)) continue;
      out.push({ name: e.name, cat: mod.slug, catTitle: mod.title || mod.slug, neighborhood: e.neighborhood || '', website: e.website || null, food: FOOD_DRINK.has(mod.slug) });
    }
  }
  return out;
}

async function checkSite(url) {
  const signals = [];
  const contact = {};
  let score = 0;
  const isHttp = /^http:\/\//.test(url);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const t0 = Date.now();
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, redirect: 'follow', signal: ctrl.signal });
    clearTimeout(timer);
    const ms = Date.now() - t0;
    const finalUrl = res.url || url;
    if (res.status === 403 || res.status === 429) {
      // Usually a bot wall (Cloudflare etc.), not a broken site. Flag for a
      // hand check, never auto-rank it as weak.
      signals.push(`returns ${res.status} to bots — VERIFY IN A BROWSER before pitching`);
      score += 5;
      return { score, signals, contact };
    }
    if (!res.ok) { signals.push(`site returns ${res.status}`); score += 40; return { score, signals, contact }; }
    if (SOCIAL_RE.test(finalUrl)) { signals.push(`"website" is actually ${finalUrl.match(SOCIAL_RE)[0].split('.')[0]}`); score += 35; }
    const html = (await res.text()).slice(0, 200000);
    if (PARKED_RE.test(html) && html.length < 20000) { signals.push('domain appears parked'); score += 40; }
    if (!/viewport/i.test(html)) { signals.push('no mobile viewport (fails on phones)'); score += 25; }
    if (isHttp && /^http:\/\//.test(finalUrl)) { signals.push('plain http, no SSL'); score += 15; }
    if (ms > 6000) { signals.push(`slow (${(ms / 1000).toFixed(1)}s to load)`); score += 5; }
    if (html.length < 4000 && !SOCIAL_RE.test(finalUrl)) { signals.push('near-empty page'); score += 10; }
    // Contact capture for the outreach drafts (their own published contacts).
    const mail = html.match(/mailto:([^"'?\s>]+)/i);
    if (mail) contact.email = mail[1];
    const ig = html.match(/instagram\.com\/([A-Za-z0-9_.]{2,30})/);
    if (ig && !/^(p|reel|explore|accounts)$/.test(ig[1])) contact.instagram = ig[1];
  } catch (err) {
    signals.push(`site unreachable (${String(err.cause && err.cause.code || err.name).slice(0, 30)})`);
    score += 40;
  }
  return { score, signals, contact };
}

async function run() {
  const entries = loadEntries();
  console.log(`Scanning ${entries.length} businesses${FOOD_ONLY ? ' (food & drink only)' : ''}...`);
  const results = [];
  const noSite = [];
  const queue = [...entries];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const e = queue.shift();
      if (!e.website) { noSite.push(e); continue; }
      const { score, signals, contact } = await checkSite(e.website);
      if (score > 0) results.push({ ...e, score, signals, contact: contact || {} });
      process.stdout.write('.');
    }
  });
  await Promise.all(workers);
  console.log('\n');

  results.sort((a, b) => (b.food - a.food) || (b.score - a.score));
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Weak-web pitch list',
    '',
    `Generated ${today} by \`scripts/weak-web-scan.js\` — every site below was actually`,
    'fetched and scored. Higher score = weaker web presence = warmer services pitch.',
    'Food & drink ranked first. Re-run the script any time; this file is overwritten.',
    '',
    '**How to use a row:** the evidence column IS the opener. "You\'re in my guide,',
    'I noticed [evidence], here\'s what I\'d fix" — see SALES-KIT.md packages.',
    '',
    '| # | Business | Category | Neighborhood | Score | Evidence |',
    '|---|---|---|---|---|---|',
    ...results.slice(0, 40).map((r, i) =>
      `| ${i + 1} | ${r.name} | ${r.catTitle} | ${r.neighborhood.split(',')[0]} | ${r.score} | ${r.signals.join('; ')} |`),
    '',
    `## No website on file (${noSite.length})`,
    '',
    'The guide has no site for these. Some genuinely have none (hot pitch), some',
    'just were never filled in (verify with a search before contacting).',
    '',
    ...noSite.filter(e => e.food).slice(0, 30).map(e => `- ${e.name} (${e.catTitle}, ${e.neighborhood.split(',')[0]})`),
    ''
  ];
  fs.writeFileSync(OUT, lines.join('\n'));
  fs.writeFileSync(path.join(ROOT, 'growth/pitch-list.json'), JSON.stringify({ generated: today, prospects: results, no_site: noSite }, null, 1));
  console.log(`→ ${results.length} scored prospects, ${noSite.length} with no site on file`);
  console.log(`→ wrote growth/PITCH-LIST.md (top 40 shown) + growth/pitch-list.json`);
  console.log('\nTop 10:');
  results.slice(0, 10).forEach((r, i) => console.log(`  ${i + 1}. ${r.name} [${r.score}] — ${r.signals.join('; ')}`));
}

run();
