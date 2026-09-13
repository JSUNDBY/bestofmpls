// Contact discovery for the venue CRM. For every directory place with a
// website, fetch the homepage (and /contact if linked) and pull public
// contact points: mailto: addresses and the Instagram handle. Writes
// src/data/venue-contacts.json (committed — it's public business info,
// no tokens). Idempotent: places already resolved are skipped unless
// --refresh. Polite: 6 at a time, 10s timeout, one retry, no JS.
//
//   node scripts/venue-contacts.js            # fill in what's missing
//   node scripts/venue-contacts.js --refresh  # redo everything
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(SRC, 'data/venue-contacts.json');
const REFRESH = process.argv.includes('--refresh');

const entrySlug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const SKIP = new Set(['festivals', 'history', 'departed', 'outdoors', 'hidden-gems', 'curiosities', 'skyway', 'openings', 'trails']);

let existing = {};
try { existing = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (_) {}

const places = [];
const seen = new Set();
for (const f of fs.readdirSync(path.join(SRC, 'data'))) {
  if (!f.endsWith('.js')) continue;
  let mod; try { mod = require(path.join(SRC, 'data', f)); } catch (_) { continue; }
  if (!mod || !mod.slug || !Array.isArray(mod.entries) || SKIP.has(mod.slug)) continue;
  for (const e of mod.entries) {
    if (!e.name) continue;
    const slug = entrySlug(e.name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    places.push({ place: `${mod.slug}--${slug}`, name: e.name, website: e.website || '', instagram: e.instagram || '' });
  }
}

const JUNK_MAIL = /(example\.com|sentry|wixpress|squarespace|shopify|godaddy|\.png$|\.jpg$|noreply|no-reply|donotreply|^user@|^email@|^name@|^your@|^you@|^test@|@domain\.|@email\.|@yourdomain|@mysite|@website|placeholder|@site\.com)/i;
const pickEmail = html => {
  const m = [...html.matchAll(/mailto:([^"'?\s<>]+)/gi)].map(x => x[1].toLowerCase()).filter(x => /^[^@]+@[^@]+\.[a-z]{2,}$/.test(x) && !JUNK_MAIL.test(x));
  if (m.length) return [...new Set(m)].slice(0, 3);
  // Plain-text addresses as a fallback, same filters.
  const t = [...html.matchAll(/\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/gi)].map(x => x[1].toLowerCase()).filter(x => !JUNK_MAIL.test(x));
  return [...new Set(t)].slice(0, 3);
};
const pickInstagram = html => {
  const m = html.match(/instagram\.com\/([A-Za-z0-9_.]{2,30})\/?["'\s?#]/);
  const h = m && m[1];
  if (!h || /^(p|explore|reel|reels|accounts|stories|share)$/i.test(h)) return '';
  return '@' + h;
};

async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; bestofmpls-contacts/1.0; +https://bestofmpls.com/about/)', accept: 'text/html' } });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    if (!/html/.test(ct)) return null;
    return (await r.text()).slice(0, 600000);
  } catch (_) { return null; } finally { clearTimeout(t); }
}

async function resolve(p) {
  const rec = { name: p.name, website: p.website, emails: [], instagram: p.instagram || '', checked: new Date().toISOString().slice(0, 10) };
  if (!p.website) { rec.status = 'no-website'; return rec; }
  let base; try { base = new URL(p.website.startsWith('http') ? p.website : 'https://' + p.website); } catch (_) { rec.status = 'bad-url'; return rec; }
  const home = await get(base.href) || await get(base.href);
  if (!home) { rec.status = 'unreachable'; return rec; }
  rec.emails = pickEmail(home);
  if (!rec.instagram) rec.instagram = pickInstagram(home);
  if (!rec.emails.length) {
    // Follow the first contact-ish link, same host only.
    const link = home.match(/href="([^"]*(contact|about|info)[^"]*)"/i);
    if (link) {
      try {
        const u = new URL(link[1], base.href);
        if (u.host === base.host) { const c = await get(u.href); if (c) { rec.emails = pickEmail(c); if (!rec.instagram) rec.instagram = pickInstagram(c); } }
      } catch (_) {}
    }
  }
  rec.status = rec.emails.length ? 'email' : (rec.instagram ? 'instagram-only' : 'none-found');
  return rec;
}

(async () => {
  const todo = places.filter(p => REFRESH || !existing[p.place]);
  console.log(`${places.length} places, ${todo.length} to check`);
  let i = 0, done = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (i < todo.length) {
      const p = todo[i++];
      existing[p.place] = await resolve(p);
      done++;
      if (done % 25 === 0) { fs.writeFileSync(OUT, JSON.stringify(existing, null, 1) + '\n'); console.log(`  ${done}/${todo.length}`); }
    }
  });
  await Promise.all(workers);
  fs.writeFileSync(OUT, JSON.stringify(existing, null, 1) + '\n');
  const tally = {};
  for (const r of Object.values(existing)) tally[r.status] = (tally[r.status] || 0) + 1;
  console.log('done:', tally);
})();
