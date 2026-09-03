#!/usr/bin/env node
/**
 * Outreach draft generator — turns growth/pitch-list.json into one ready-
 * to-send draft per prospect in growth/outbox/. Josh reads, personalizes a
 * line, and sends. NOTHING here sends anything — that's the standing rule
 * (automate drafting, never the send).
 *
 * Run after a scan: node scripts/weak-web-scan.js && node scripts/outreach-drafts.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IN = path.join(ROOT, 'growth/pitch-list.json');
const OUTBOX = path.join(ROOT, 'growth/outbox');
const SITE = 'https://bestofmpls.com';

const TOP_N = 12;
const MIN_SCORE = 15;

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/&/g, ' and ').replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Evidence → the plain-English line that goes in the email.
function evidenceLine(signals) {
  const s = signals.join(' ');
  if (/unreachable|ENOTFOUND/.test(s)) return 'your website is not loading at all right now';
  if (/returns 404|returns 5/.test(s)) return 'your website link is broken';
  if (/parked/.test(s)) return 'your domain appears to be parked';
  if (/actually (facebook|instagram)/.test(s)) return 'your only web presence is a social page, which Google barely shows';
  if (/no mobile viewport/.test(s)) return 'your website does not display properly on phones, where most people will find you';
  if (/plain http/.test(s)) return 'your site is on plain http, so browsers mark it "not secure"';
  if (/slow/.test(s)) return 'your website takes a long time to load';
  return 'your web presence could be working harder for you';
}

function draft(p) {
  const entryUrl = `${SITE}/${p.cat}/${slugify(p.name)}/`;
  const ev = evidenceLine(p.signals);
  const contact = [p.contact && p.contact.email ? `Email: ${p.contact.email}` : null,
    p.contact && p.contact.instagram ? `Instagram: @${p.contact.instagram}` : null,
    p.website ? `Site: ${p.website}` : null].filter(Boolean).join('\n');
  return `# ${p.name}
${p.catTitle} · ${p.neighborhood}
Score ${p.score} — ${p.signals.join('; ')}
${contact || 'No contact found on their site — check Instagram or walk in.'}

STATUS: DRAFT — personalize the [bracket] before sending. Never send as-is.

---

Subject: Your listing on Best of MPLS, plus one thing I noticed

Hi, I'm Josh. I run bestofmpls.com, an independent guide to the Twin
Cities. ${p.name} is in the guide as a real editorial pick, not a paid
one: ${entryUrl}

Two things, take either or neither:

1. I noticed ${ev}. I build clean, fast sites for local restaurants,
   $1,500-2,500, done in about a week, photos included. The proof is the
   guide itself; I built all 640 pages of it.

2. If you'd rather just be seen more: a featured spot at the top of your
   category is $49/month for the first five founding partners, locked
   for 12 months, clearly labeled as paid.

Either way, your listing stays. It was never for sale.
[PERSONAL LINE — something true about their place.]
Worth a ten-minute call?

Josh Sundby
bestofmpls.com
`;
}

const data = JSON.parse(fs.readFileSync(IN, 'utf8'));
const picks = data.prospects
  .filter(p => p.food && p.score >= MIN_SCORE && !p.signals.some(sg => /VERIFY IN A BROWSER/.test(sg)))
  .slice(0, TOP_N);

fs.mkdirSync(OUTBOX, { recursive: true });
for (const p of picks) fs.writeFileSync(path.join(OUTBOX, `${slugify(p.name)}.md`), draft(p));
console.log(`→ ${picks.length} drafts in growth/outbox/ (from scan of ${data.generated})`);
picks.forEach(p => console.log(`  - ${p.name} [${p.score}]${p.contact && (p.contact.email || p.contact.instagram) ? ' ✉' : ''}`));
