// The monthly venue receipt — the promise /partner/ makes in public:
// "every partner gets a monthly count of what we sent them."
// Reads the worker's click counters and writes one plain-text receipt per
// venue to growth/receipts/<month>/. Josh reads them, then sends. This
// script NEVER emails anyone: nothing reaches a human without his word.
//
//   node scripts/receipts.js            # last full month
//   node scripts/receipts.js 2026-10    # a specific month
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKER = 'https://bestofmpls-poll.j-sundby.workers.dev';
const adminKey = (fs.readFileSync(path.join(ROOT, '.dev.vars'), 'utf8').match(/^ADMIN_KEY=(.+)$/m) || [])[1];
if (!adminKey) { console.error('No ADMIN_KEY in .dev.vars'); process.exit(1); }

const arg = process.argv[2];
const now = new Date();
const month = arg || `${now.getFullYear()}-${String(now.getMonth() || 12).padStart(2, '0')}`;
const [y, m] = month.split('-').map(Number);
const from = `${month}-01`;
const to = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
const monthName = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const featured = (() => { try { return require(path.join(ROOT, 'src/data/featured-venues.js')); } catch (_) { return {}; } })();
const nameOf = place => {
  const [cat, ...rest] = place.split('--');
  const slug = rest.join('--');
  try {
    const mod = require(path.join(ROOT, 'src/data', `${cat.replace(/^best-/, '')}.js`));
    const hit = (mod.entries || []).find(e => e.name && e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') === slug);
    if (hit) return hit.name;
  } catch (_) {}
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

(async () => {
  const res = await fetch(`${WORKER}/admin/clicks?from=${from}&to=${to}`, { headers: { 'X-Admin-Key': adminKey } }).then(r => r.json());
  if (res.error) { console.error('worker:', res.error); process.exit(1); }
  const places = res.places || {};
  const outDir = path.join(ROOT, 'growth/receipts', month);
  fs.mkdirSync(outDir, { recursive: true });

  // Every featured partner gets a receipt, even a quiet one. An honest zero
  // beats a missing month.
  const all = new Set([...Object.keys(places), ...Object.keys(featured)]);
  if (!all.size) { console.log('No partners and no clicks yet — nothing to write.'); return; }

  for (const place of all) {
    const c = places[place] || { tickets: 0, reserve: 0, menu: 0, site: 0, total: 0 };
    const name = nameOf(place);
    const lines = [];
    lines.push(`${name} — what Best of MPLS sent you in ${monthName}`, '');
    if (c.total === 0) {
      lines.push('No outbound clicks recorded this month. That is an honest zero, not a');
      lines.push('missing number — the counter ran the whole month.', '');
    } else {
      const n = v => `${String(v).padStart(4)} click${v === 1 ? ' ' : 's'}`;
      if (c.tickets) lines.push(`  ${n(c.tickets)} to your tickets`);
      if (c.reserve) lines.push(`  ${n(c.reserve)} to reserve a table`);
      if (c.menu) lines.push(`  ${n(c.menu)} to your menu`);
      if (c.site) lines.push(`  ${n(c.site)} to your site`);
      lines.push('', `  ${c.total} total, from your page on the guide, the Tonight board, and the Monday email.`, '');
    }
    lines.push('Counted once per person per hour, bots filtered. We count what we send you,');
    lines.push('not impressions — if the number is not worth the price, you should know first.', '');
    lines.push(`https://bestofmpls.com/${place.split('--')[0]}/${place.split('--').slice(1).join('--')}/`, '');
    lines.push('Josh · hello@bestofmpls.com');
    fs.writeFileSync(path.join(outDir, `${place}.txt`), lines.join('\n') + '\n');
    console.log(`${name.padEnd(28)} ${String(c.total).padStart(5)} click${c.total === 1 ? '' : 's'}`);
  }
  console.log(`\n${all.size} receipts → growth/receipts/${month}/`);
  console.log('Read them, then send. This script never emails anyone.');
})();
