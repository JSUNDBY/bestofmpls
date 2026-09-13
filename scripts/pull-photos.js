// Pull the Shot Hunt crew's photos from the worker's KV inbox into
// public/img/places/, ready for review + commit. Skips files that already
// exist locally (so a re-run never overwrites a curated photo). KV records
// stay put — the existing-file check makes pulls idempotent.
//
//   node scripts/pull-photos.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'public/img/places');
const WORKER = 'https://bestofmpls-poll.j-sundby.workers.dev';

const adminKey = (fs.readFileSync(path.join(ROOT, '.dev.vars'), 'utf8').match(/^ADMIN_KEY=(.+)$/m) || [])[1];
if (!adminKey) { console.error('No ADMIN_KEY in .dev.vars'); process.exit(1); }

// The credits ledger: per filename, who shot it, when, the rights grant,
// and how far from the target the device reported being at upload. Commits
// with the photos — the permanent permission record, and the source of the
// "Photo: name" line on entry pages.
const CREDITS_PATH = path.join(ROOT, 'src/data/photo-credits.json');

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  let credits = {};
  try { credits = JSON.parse(fs.readFileSync(CREDITS_PATH, 'utf8')); } catch (_) {}
  const H = { 'X-Admin-Key': adminKey };
  const { keys, error } = await fetch(`${WORKER}/admin/photos`, { headers: H }).then(r => r.json());
  if (error) { console.error('worker:', error); process.exit(1); }
  if (!keys.length) { console.log('No photos waiting.'); return; }
  let pulled = 0, skipped = 0;
  for (const key of keys) {
    const rec = await fetch(`${WORKER}/admin/photo?key=${encodeURIComponent(key)}`, { headers: H }).then(r => r.json());
    if (!rec.filename || !rec.image) continue;
    const dest = path.join(DEST, rec.filename);
    if (fs.existsSync(dest)) { skipped++; continue; }
    const b64 = rec.image.replace(/^data:image\/jpeg;base64,/, '');
    fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
    const isVenue = rec.source === 'venue';
    credits[rec.filename] = {
      credit: rec.contributor || 'anonymous',
      source: isVenue ? 'venue' : 'crew',
      consent: rec.consent === true || rec.rights === true,
      ts: rec.ts,
      dist_m: rec.dist_m != null ? rec.dist_m : null,
    };
    if (isVenue && rec.contact) credits[rec.filename].contact = rec.contact;
    if (isVenue) {
      console.log(`  ✓ ${rec.filename}  (VENUE — ${rec.contributor}${rec.role ? ', ' + rec.role : ''}${rec.contact ? ', ' + rec.contact : ''}, rights affirmed)`);
    } else {
      const distNote = rec.dist_m != null ? `, ${rec.dist_m}m from target` : ', no location';
      console.log(`  ✓ ${rec.filename}  (by ${rec.contributor}${rec.consent === true ? ', grant on file' : ', NO GRANT — old client, get permission before shipping'}${distNote})`);
    }
    pulled++;
  }
  if (pulled) fs.writeFileSync(CREDITS_PATH, JSON.stringify(credits, null, 1) + '\n');
  console.log(`\n${pulled} pulled, ${skipped} already local. Review them in public/img/places/, then commit — next build attaches everything (credits land automatically).`);
})();
