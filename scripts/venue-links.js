// Every venue's private photo-upload link in one sheet, so outreach is a
// paste job, not a command per venue. Writes a CSV to the Desktop posts
// folder (NEVER into the repo — the repo is public and a link lets anyone
// upload to that venue's inbox). Same token derivation as venue-link.js
// and the worker: sha256(VENUE_SECRET:cat--slug).slice(0,12).
//
//   node scripts/venue-links.js            # all places, all categories
//   node scripts/venue-links.js live-music # one category slug
//
// Columns: place, category, neighborhood, website, instagram (if the entry
// has one), upload link, paste-ready message. Open in Numbers/Sheets, add
// a "sent" column, work down the list.
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const SITE = 'https://bestofmpls.com';
const OUT = path.join(os.homedir(), 'Desktop/bestofmpls-posts/venue-upload-links.csv');

const secret = (fs.readFileSync(path.join(ROOT, '.dev.vars'), 'utf8').match(/^VENUE_SECRET=(.+)$/m) || [])[1];
if (!secret) { console.error('No VENUE_SECRET in .dev.vars'); process.exit(1); }

const entrySlug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const onlyCat = process.argv[2] || null;

// Photo-relevant categories: rooms people can shoot. Skip parks, events,
// history, and anything that isn't a business with a front door.
const SKIP = new Set(['festivals', 'history', 'departed', 'outdoors', 'hidden-gems', 'curiosities', 'skyway', 'openings', 'trails']);

const rows = [];
const seen = new Set();
for (const f of fs.readdirSync(path.join(SRC, 'data'))) {
  if (!f.endsWith('.js')) continue;
  let mod; try { mod = require(path.join(SRC, 'data', f)); } catch (_) { continue; }
  if (!mod || !mod.slug || !Array.isArray(mod.entries)) continue;
  if (SKIP.has(mod.slug)) continue;
  if (onlyCat && mod.slug !== onlyCat) continue;
  for (const e of mod.entries) {
    if (!e.name) continue;
    const slug = entrySlug(e.name);
    if (seen.has(slug)) continue; // one link per place, first category wins
    seen.add(slug);
    const place = `${mod.slug}--${slug}`;
    const token = crypto.createHash('sha256').update(`${secret}:${place}`).digest('hex').slice(0, 12);
    const url = `${SITE}/photos/?p=${place}&k=${token}`;
    const msg = `Hi — Josh from Best of MPLS (bestofmpls.com). Your page on our guide can show your own photos. Here's a private upload link for ${e.name}: ${url} — pick your best few (the room, the food, the front), takes a minute from a phone. We review everything before it goes live. Any questions, just reply.`;
    rows.push([e.name, mod.title || mod.slug, (e.neighborhood || '').split(',')[0].trim(), e.website || '', e.instagram || '', url, msg]);
  }
}

const csvCell = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
const csv = [['place', 'category', 'neighborhood', 'website', 'instagram', 'upload_link', 'message'].map(csvCell).join(',')]
  .concat(rows.map(r => r.map(csvCell).join(','))).join('\n') + '\n';
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, csv);
console.log(`${rows.length} venue upload links → ${OUT}`);
console.log('Not in the repo on purpose: a link is an upload key for that venue.');
