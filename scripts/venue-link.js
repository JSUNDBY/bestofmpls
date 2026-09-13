// Mint a venue's private photo-upload link + a paste-ready message.
// Tokens are HMAC-ish: sha256(VENUE_SECRET:cat--slug).slice(0,12), the same
// derivation the worker checks — no per-venue setup, links work forever
// (rotate VENUE_SECRET to kill them all).
//
//   node scripts/venue-link.js "Matt's Bar"
//   node scripts/venue-link.js burgers--matts-bar
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const SITE = 'https://bestofmpls.com';

const secret = (fs.readFileSync(path.join(ROOT, '.dev.vars'), 'utf8').match(/^VENUE_SECRET=(.+)$/m) || [])[1];
if (!secret) { console.error('No VENUE_SECRET in .dev.vars'); process.exit(1); }

const entrySlug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const arg = process.argv.slice(2).join(' ').trim();
if (!arg) { console.error('Usage: node scripts/venue-link.js "<place name>" (or cat--slug)'); process.exit(1); }

// Resolve a name to cat--slug by scanning the data modules; a literal
// cat--slug passes straight through.
let place = null, displayName = arg;
if (/^[a-z0-9-]+--[a-z0-9-]+$/.test(arg)) {
  place = arg;
} else {
  const want = entrySlug(arg);
  outer:
  for (const f of fs.readdirSync(path.join(SRC, 'data'))) {
    if (!f.endsWith('.js')) continue;
    let mod; try { mod = require(path.join(SRC, 'data', f)); } catch (_) { continue; }
    if (!mod || !mod.slug || !Array.isArray(mod.entries)) continue;
    for (const e of mod.entries) {
      if (e.name && entrySlug(e.name) === want) { place = `${mod.slug}--${want}`; displayName = e.name; break outer; }
    }
  }
}
if (!place) { console.error(`No entry found for "${arg}". Pass cat--slug directly if the place isn't in the directory yet.`); process.exit(1); }

const token = crypto.createHash('sha256').update(`${secret}:${place}`).digest('hex').slice(0, 12);
const url = `${SITE}/photos/?p=${place}&k=${token}`;

console.log(`\n${displayName}\n${url}\n`);
console.log(`--- paste-ready (email or DM) ---\n`);
console.log(`Hi — Josh from Best of MPLS (bestofmpls.com). Your page on our guide can show your own photos. Here's a private upload link for ${displayName}:\n\n${url}\n\nPick your best few — the room, the food, the front. Takes about a minute from a phone. We review everything before it goes live. Any questions, just reply.\n`);
