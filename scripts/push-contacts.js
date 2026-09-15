// Push the locally harvested venue contacts to the worker's KV, where the
// CRM reads them admin-authed. They are deliberately NOT in the repo and
// NOT in the public roster: an aggregated contact list on the open web is
// a spam gift and a bad look.
//
//   node scripts/venue-contacts.js   # harvest/refresh locally
//   node scripts/push-contacts.js    # send them to the worker
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKER = 'https://bestofmpls-poll.j-sundby.workers.dev';
const SRC = path.join(ROOT, 'src/data/venue-contacts.json');

const adminKey = (fs.readFileSync(path.join(ROOT, '.dev.vars'), 'utf8').match(/^ADMIN_KEY=(.+)$/m) || [])[1];
if (!adminKey) { console.error('No ADMIN_KEY in .dev.vars'); process.exit(1); }
if (!fs.existsSync(SRC)) { console.error('No local contacts. Run: node scripts/venue-contacts.js'); process.exit(1); }

const all = JSON.parse(fs.readFileSync(SRC, 'utf8'));
// Only what the CRM needs; drop crawl bookkeeping.
const contacts = {};
for (const [place, r] of Object.entries(all)) {
  if (!r) continue;
  const rec = {};
  if (r.emails && r.emails.length) rec.emails = r.emails;
  if (r.instagram) rec.instagram = r.instagram;
  if (r.website) rec.website = r.website;
  if (Object.keys(rec).length) contacts[place] = rec;
}

(async () => {
  const res = await fetch(`${WORKER}/admin/contacts`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts }),
  }).then(r => r.json());
  if (res.error) { console.error('worker:', res.error); process.exit(1); }
  console.log(`${res.count} venues with contacts pushed to the worker (private).`);
})();
