// The photo shot list: every directory entry that has no photo, ranked by
// impact and grouped by neighborhood so one walk covers a whole cluster.
// Output: docs/PHOTO-SHOTLIST.md, with the exact filename each shot must be
// saved as (drop it in public/img/places/ and the next build attaches it —
// entry hero, og:image, schema).
//
//   node scripts/photo-shotlist.js
//
// Impact score: guide pick +3, Best of MPLS winner +3, top-3 in its
// category +2, marquee category +1. Ties break alphabetically.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PHOTO_DIR = path.join(ROOT, 'public/img/places');

const entrySlug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

let photoFiles = [];
try { photoFiles = fs.readdirSync(PHOTO_DIR); } catch (_) {}
const hasPhoto = (cat, slug) => photoFiles.some(f => f.endsWith(`--${slug}.jpg`) || f.endsWith(`--${slug}.jpeg`) || f.endsWith(`--${slug}.webp`) || f.endsWith(`--${slug}.png`));

// Categories where a photo moves the needle most (food, drink, rooms).
const MARQUEE_CATS = new Set(['restaurants', 'cocktail-bars', 'coffee-shops', 'breweries', 'live-music', 'best-patios', 'best-brunch', 'pastries-and-bakeries', 'independent-shops', 'museums-and-galleries']);

// Guide picks get priority — they're the pages we send people to.
const guides = require(path.join(SRC, 'data/guides.js'));
const guidePicks = new Set();
for (const g of guides) for (const p of g.picks || []) guidePicks.add(entrySlug(p.name));

// Best of MPLS winners (best-of data lives in build.js; approximate via
// featured flag + first entry per category, which is the same pool).
const all = [];
const seenPlace = new Map();
for (const f of fs.readdirSync(path.join(SRC, 'data'))) {
  if (!f.endsWith('.js')) continue;
  let mod;
  try { mod = require(path.join(SRC, 'data', f)); } catch (_) { continue; }
  if (!mod || !mod.slug || !Array.isArray(mod.entries)) continue;
  mod.entries.forEach((e, idx) => {
    if (!e.name) return;
    const slug = entrySlug(e.name);
    if (hasPhoto(mod.slug, slug)) return;
    // One photo serves a place across every category it appears in.
    if (seenPlace.has(slug)) { seenPlace.get(slug).score += 1; return; }
    let score = 0;
    if (guidePicks.has(slug)) score += 3;
    if (e.featured || idx === 0) score += 3;
    else if (idx < 3) score += 2;
    if (MARQUEE_CATS.has(mod.slug)) score += 1;
    const rec = {
      name: e.name,
      cat: mod.slug,
      catTitle: mod.title,
      hood: (e.neighborhood || 'Unknown').split(',')[0].trim(),
      address: e.address || '',
      file: `${mod.slug}--${slug}.jpg`,
      score,
    };
    seenPlace.set(slug, rec);
    all.push(rec);
  });
}

// Group by neighborhood, order hoods by total score, entries by score.
const hoods = new Map();
for (const p of all) {
  if (!hoods.has(p.hood)) hoods.set(p.hood, []);
  hoods.get(p.hood).push(p);
}
const ordered = [...hoods.entries()]
  .map(([hood, places]) => ({ hood, places: places.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)), total: places.reduce((n, p) => n + p.score, 0) }))
  .sort((a, b) => b.total - a.total);

const shot = all.length;
const done = (() => {
  try { return fs.readdirSync(PHOTO_DIR).filter(f => /\.(jpe?g|webp|png)$/.test(f)).length; } catch (_) { return 0; }
})();

let md = `# Photo shot list\n\nGenerated ${new Date().toISOString().slice(0, 10)} · **${shot} places need a photo** · ${done} shot so far.\n\nHow it works: shoot the place, save the file with EXACTLY the name shown into \`public/img/places/\`, commit. Next build attaches it to the entry page (hero + og:image + schema). Vertical or landscape both fine; the page fits it.\n\nNeighborhoods are ordered by impact — start at the top, and one walk covers a cluster.\n`;
for (const { hood, places } of ordered) {
  md += `\n## ${hood} (${places.length})\n\n`;
  for (const p of places.slice(0, 25)) {
    md += `- [ ] **${p.name}** (${p.catTitle}${p.score >= 3 ? ' · high impact' : ''})${p.address ? ` — ${p.address}` : ''}\n      \`${p.file}\`\n`;
  }
}
fs.writeFileSync(path.join(ROOT, 'docs/PHOTO-SHOTLIST.md'), md);
console.log(`${shot} places need photos across ${ordered.length} neighborhoods → docs/PHOTO-SHOTLIST.md`);
console.log('Top neighborhoods:', ordered.slice(0, 5).map(o => `${o.hood} (${o.places.length})`).join(', '));
