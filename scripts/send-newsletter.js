#!/usr/bin/env node
/**
 * send-newsletter.js — generate and post the weekly Best of MPLS newsletter
 * to Beehiiv. Runs every Monday at 5 UTC via GitHub Actions.
 *
 * Pulls live data from:
 *   src/data/events.json   — scraped upcoming shows (already generated)
 *   src/data/happy-hours.js — curated happy hour picks
 *   src/data/horoscope.json — weekly horoscope (already generated)
 *
 * Posts to Beehiiv API v2 as a published post. Beehiiv sends it to all
 * active subscribers automatically.
 *
 * Required env vars:
 *   BEEHIIV_API_KEY   — from Beehiiv Settings → API
 *   BEEHIIV_PUB_ID    — publication ID (pub_c1d001ef-...)
 *
 * Sponsor slot (optional):
 *   SPONSOR_NAME      — sponsor display name
 *   SPONSOR_TAGLINE   — one-line tagline shown after the name
 *   SPONSOR_URL       — link the sponsor name points to
 *
 * How to sell it: when a sponsor signs, set SPONSOR_NAME, SPONSOR_TAGLINE,
 * and SPONSOR_URL as GitHub Actions secrets/vars on this repo. The next
 * Monday send picks them up automatically. When the run ends, remove the
 * three values and the slot disappears — no code changes either way.
 */

const fs   = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '..');
const EVENTS_FILE  = path.join(ROOT, 'src/data/events.json');
const HOROSCOPE_FILE = path.join(ROOT, 'src/data/horoscope.json');
const SITE         = 'https://bestofmpls.com';

const API_KEY = process.env.BEEHIIV_API_KEY;
const PUB_ID  = process.env.BEEHIIV_PUB_ID || 'pub_c1d001ef-b72b-46b4-ab41-efad0f2f2f88';

const SPONSOR_NAME    = process.env.SPONSOR_NAME;
const SPONSOR_TAGLINE = process.env.SPONSOR_TAGLINE;
const SPONSOR_URL     = process.env.SPONSOR_URL;

// Preview mode: build the HTML and write it to a file without sending. Lets us
// see exactly what subscribers get. Run: node scripts/send-newsletter.js --preview
const PREVIEW = process.argv.includes('--preview') || process.argv.includes('--dry-run');

if (!API_KEY && !PREVIEW) {
  console.error('Missing BEEHIIV_API_KEY');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}

function fmtTime(t) {
  if (!t) return '';
  const [h, min] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return ` · ${hr}:${String(min).padStart(2, '0')}${ampm}`;
}

// Monday of the current week (ISO date string)
function thisMonday() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

// Sunday of the current week
function thisSunday() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 7);
  return d.toISOString().slice(0, 10);
}

function weekLabel() {
  const mon = thisMonday();
  const sun = thisSunday();
  const [y, m, d] = mon.split('-').map(Number);
  const [, sm, sd] = sun.split('-').map(Number);
  const monFmt = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const sunFmt = new Date(y, sm - 1, sd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `${monFmt} – ${sunFmt}`;
}

// ── Data loading ──────────────────────────────────────────────────────────────

function loadEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  const today = todayISO();
  const sunday = thisSunday();
  const inWeek = (data.events || []).filter(e => e.date >= today && e.date <= sunday);

  // Curate for a readable dispatch, not a raw dump:
  //  - collapse repeated titles (a movie with four showtimes becomes one line)
  //  - cap any single venue so one room can't take over the week
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const seenTitle = new Set();
  const perVenue = new Map();
  const out = [];
  for (const e of inWeek) {
    const t = norm(e.title);
    if (seenTitle.has(t)) continue;
    const v = norm(e.venue);
    if ((perVenue.get(v) || 0) >= 3) continue; // max 3 per venue
    seenTitle.add(t);
    perVenue.set(v, (perVenue.get(v) || 0) + 1);
    out.push(e);
    if (out.length >= 14) break;
  }
  return out;
}

function loadHoroscope() {
  if (!fs.existsSync(HOROSCOPE_FILE)) return null;
  return JSON.parse(fs.readFileSync(HOROSCOPE_FILE, 'utf8'));
}

function loadHappyHours() {
  const hh = require(path.join(ROOT, 'src/data/happy-hours.js'));
  const entries = hh.entries || [];
  // Pick one at random-ish using day of year as seed
  const d = new Date();
  const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return entries[doy % entries.length];
}

// ── HTML generation ───────────────────────────────────────────────────────────
//
// Email-safe by construction: table-based layout, all styles inline, a 600px
// container, web-safe font stacks, and bulletproof buttons. No flexbox/grid,
// no <style> reliance (many clients strip <head>). Brand palette below.

const C = {
  ink:     '#1A1712',   // near-black, warm
  soft:    '#6E6557',   // muted body
  faint:   '#9A9486',   // captions
  clay:    '#C8200F',   // accent
  paper:   '#EDE7DC',   // outer canvas (warm off-white)
  card:    '#FFFFFF',   // content card
  rule:    '#E4DCCD',   // hairlines
  wash:    '#F6F1E8',   // highlighted block bg
};
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

// A section label + title header used across the email.
function sectionHead(eyebrow, title) {
  return `
  <tr><td style="padding:34px 32px 0 32px;">
    <div style="font:700 11px/1 ${FONT};letter-spacing:0.14em;text-transform:uppercase;color:${C.clay};">${eyebrow}</div>
    <div style="font:700 23px/1.2 ${FONT};letter-spacing:-0.01em;color:${C.ink};margin-top:7px;">${title}</div>
  </td></tr>`;
}

// Bulletproof, table-based CTA button.
function button(label, href) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 2px;">
    <tr><td bgcolor="${C.clay}" style="border-radius:7px;">
      <a href="${href}" style="display:inline-block;padding:13px 22px;font:700 14px/1 ${FONT};letter-spacing:0.01em;color:#ffffff;text-decoration:none;border-radius:7px;">${label}</a>
    </td></tr>
  </table>`;
}

function divider() {
  return `<tr><td style="padding:30px 32px 0 32px;"><div style="border-top:1px solid ${C.rule};font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
}

function eventsHtml(events) {
  if (!events.length) {
    return `<tr><td style="padding:14px 32px 0 32px;font:400 16px/1.6 ${FONT};color:${C.soft};">
      Quiet week on the calendar. The <a href="${SITE}/calendar/" style="color:${C.clay};text-decoration:none;font-weight:600;">full calendar</a> has anything that came in after this sent.
    </td></tr>`;
  }
  const byDate = new Map();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  }
  let rows = '';
  for (const [date, shows] of byDate) {
    rows += `<tr><td style="padding:20px 32px 0 32px;">
      <div style="font:700 12px/1 ${FONT};letter-spacing:0.08em;text-transform:uppercase;color:${C.faint};padding-bottom:4px;border-bottom:2px solid ${C.ink};display:inline-block;">${fmtDate(date)}</div>
    </td></tr>`;
    for (const s of shows) {
      const title = s.url
        ? `<a href="${s.url}" style="color:${C.ink};text-decoration:none;">${s.title}</a>`
        : s.title;
      const meta = [s.venue, (s.time ? fmtTime(s.time).replace(/^ · /, '') : ''), s.price]
        .filter(Boolean).join('  ·  ');
      rows += `<tr><td style="padding:12px 32px 0 32px;">
        <div style="font:600 16px/1.35 ${FONT};color:${C.ink};">${title}</div>
        ${meta ? `<div style="font:400 14px/1.4 ${FONT};color:${C.soft};margin-top:2px;">${meta}</div>` : ''}
      </td></tr>`;
    }
  }
  rows += `<tr><td style="padding:22px 32px 0 32px;">${button('See the full calendar', SITE + '/calendar/')}</td></tr>`;
  return rows;
}

function happyHourHtml(pick) {
  if (!pick) return '';
  return `<tr><td style="padding:14px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.wash};border:1px solid ${C.rule};border-radius:10px;">
      <tr><td style="padding:20px 22px;">
        <div style="font:700 18px/1.3 ${FONT};color:${C.ink};">${pick.name}</div>
        ${pick.neighborhood ? `<div style="font:600 12px/1 ${FONT};letter-spacing:0.06em;text-transform:uppercase;color:${C.clay};margin-top:5px;">${pick.neighborhood}</div>` : ''}
        ${pick.description ? `<div style="font:400 15px/1.55 ${FONT};color:${C.soft};margin-top:10px;">${pick.description}</div>` : ''}
        ${pick.hours ? `<div style="font:400 13px/1.4 ${FONT};color:${C.faint};margin-top:8px;">${pick.hours}</div>` : ''}
      </td></tr>
    </table>
    <div style="padding-top:14px;"><a href="${SITE}/best-happy-hours/" style="font:700 14px/1 ${FONT};color:${C.clay};text-decoration:none;">See all happy hours &rarr;</a></div>
  </td></tr>`;
}

function horoscopeHtml(horoscope) {
  if (!horoscope) return '';
  const picks = (horoscope.horoscopes || []).slice(0, 3);
  if (!picks.length) return '';
  let rows = '';
  if (horoscope.intro) {
    rows += `<tr><td style="padding:12px 32px 0 32px;font:400 15px/1.6 ${FONT};color:${C.soft};font-style:italic;">${horoscope.intro}</td></tr>`;
  }
  for (const h of picks) {
    rows += `<tr><td style="padding:16px 32px 0 32px;">
      <div style="font:700 16px/1.3 ${FONT};color:${C.ink};">${h.symbol ? h.symbol + ' ' : ''}${h.sign}</div>
      <div style="font:400 15px/1.55 ${FONT};color:${C.soft};margin-top:3px;">${h.text}</div>
    </td></tr>`;
  }
  rows += `<tr><td style="padding:18px 32px 0 32px;"><a href="${SITE}/horoscope/" style="font:700 14px/1 ${FONT};color:${C.clay};text-decoration:none;">Read all twelve signs &rarr;</a></td></tr>`;
  return rows;
}

function sponsorHtml() {
  if (!SPONSOR_NAME) return '';
  const name = SPONSOR_URL
    ? `<a href="${SPONSOR_URL}" style="color:${C.ink};text-decoration:underline;">${SPONSOR_NAME}</a>`
    : SPONSOR_NAME;
  const tagline = SPONSOR_TAGLINE ? `, ${SPONSOR_TAGLINE}` : '';
  return `<tr><td style="padding:16px 32px 0 32px;">
    <div style="font:400 13px/1.5 ${FONT};color:${C.faint};background:${C.wash};border:1px solid ${C.rule};border-radius:8px;padding:11px 14px;">
      This week is presented by ${name}${tagline}
    </div>
  </td></tr>`;
}

function buildHtml(events, happyHour, horoscope) {
  const label = weekLabel();
  const count = events.length;
  const preheader = count
    ? `${count} things to do in the Twin Cities this week, plus a happy hour pick and your horoscope.`
    : `Your weekly Twin Cities dispatch.`;

  // Body-content HTML only. Beehiiv wraps this in the publication's own email
  // template (logo header + legal/unsubscribe footer), so we don't ship a full
  // <html> document or our own outer background, and we keep the unsubscribe to
  // Beehiiv. A 100%/600px table keeps it crisp inside their content area.
  return `
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#ffffff;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};">
  <tr><td align="center" style="padding:0;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;text-align:left;">

      <!-- Masthead -->
      <tr><td style="padding:6px 32px 0 32px;">
        <div style="font:800 25px/1 ${FONT};letter-spacing:-0.02em;color:${C.ink};">bestofmpls<span style="color:${C.clay};">.</span></div>
        <div style="font:600 12px/1.4 ${FONT};letter-spacing:0.04em;text-transform:uppercase;color:${C.faint};margin-top:8px;">Week of ${label}</div>
        <div style="font:400 15px/1.5 ${FONT};color:${C.soft};margin-top:10px;">Everything worth doing in Minneapolis and St. Paul this week, in one place.</div>
      </td></tr>
      ${sponsorHtml()}

      ${sectionHead('On the calendar', 'This week, by the day')}
      ${eventsHtml(events)}

      ${divider()}
      ${sectionHead('Where to post up', 'Happy hour pick')}
      ${happyHourHtml(happyHour)}

      ${divider()}
      ${sectionHead('For the metro', 'Your weekly horoscope')}
      ${horoscopeHtml(horoscope)}

      ${divider()}
      <!-- Sign-off (Beehiiv adds the legal footer + unsubscribe below this) -->
      <tr><td style="padding:24px 32px 8px 32px;">
        <div style="font:400 13px/1.6 ${FONT};color:${C.faint};">
          The full guide is always there: neighborhoods, shows, food, and more, at <a href="${SITE}" style="color:${C.soft};text-decoration:underline;">bestofmpls.com</a>.
        </div>
        <div style="font:700 15px/1 ${FONT};color:${C.ink};margin-top:14px;">bestofmpls<span style="color:${C.clay};">.</span></div>
      </td></tr>

    </table>
  </td></tr>
</table>`;
}

function buildSubject() {
  const mon = thisMonday();
  const [y, m, d] = mon.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `Best of MPLS · ${label}: what's on this week`;
}

// ── Beehiiv API ───────────────────────────────────────────────────────────────

async function alreadySentThisWeek(subject) {
  const url = `https://api.beehiiv.com/v2/publications/${PUB_ID}/posts`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) return false; // if the check fails, let the post attempt proceed
  const data = await res.json();
  const posts = data.data || [];
  return posts.some(p => p.subject === subject);
}

async function postToBeehiiv(subject, html) {
  const url = `https://api.beehiiv.com/v2/publications/${PUB_ID}/posts`;
  const body = {
    subject,
    content: { html },
    status: 'confirmed',   // confirmed = send immediately to all subscribers
    send_at: null,         // null = send now
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Beehiiv API error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nGenerating weekly newsletter...\n');

  const events    = loadEvents();
  const happyHour = loadHappyHours();
  const horoscope = loadHoroscope();

  console.log(`  Events this week:   ${events.length}`);
  console.log(`  Happy hour pick:    ${happyHour ? happyHour.name : 'none'}`);
  console.log(`  Horoscope:          ${horoscope ? horoscope.week : 'none'}`);

  const subject = buildSubject();
  const html    = buildHtml(events, happyHour, horoscope);

  console.log(`\n  Subject: ${subject}`);
  console.log(`  HTML length: ${html.length} chars\n`);

  if (PREVIEW) {
    const out = path.join(ROOT, 'growth/newsletter-preview.html');
    fs.mkdirSync(path.join(ROOT, 'growth'), { recursive: true });
    // Wrap the body-only HTML in a minimal page so it's viewable standalone,
    // roughly simulating how an email client frames it (the actual Beehiiv send
    // gets the body HTML, not this wrapper).
    const wrapped = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#EDE7DC;padding:28px 14px;">
<div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E4DCCD;border-radius:14px;overflow:hidden;padding:24px 0;">${html}</div>
</body></html>`;
    fs.writeFileSync(out, wrapped);
    console.log(`  ✓ Preview written to ${out} (not sent)\n`);
    return;
  }

  if (await alreadySentThisWeek(subject)) {
    console.log('Already sent this week — skipping');
    return;
  }

  const result = await postToBeehiiv(subject, html);
  console.log(`  ✓ Posted to Beehiiv — post ID: ${result.data?.id || JSON.stringify(result)}\n`);
}

if (require.main === module) main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
