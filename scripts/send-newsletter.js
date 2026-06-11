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
 */

const fs   = require('fs');
const path = require('path');

const ROOT         = path.resolve(__dirname, '..');
const EVENTS_FILE  = path.join(ROOT, 'src/data/events.json');
const HOROSCOPE_FILE = path.join(ROOT, 'src/data/horoscope.json');
const SITE         = 'https://bestofmpls.com';

const API_KEY = process.env.BEEHIIV_API_KEY;
const PUB_ID  = process.env.BEEHIIV_PUB_ID || 'pub_c1d001ef-b72b-46b4-ab41-efad0f2f2f88';

if (!API_KEY) {
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
  return (data.events || [])
    .filter(e => e.date >= today && e.date <= sunday)
    .slice(0, 12); // cap at 12 so the email isn't a wall of text
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

function eventsHtml(events) {
  if (!events.length) return '<p>Quiet week on the calendar — check <a href="' + SITE + '/calendar/">the full calendar</a> for anything that came in after this sent.</p>';

  // Group by date
  const byDate = new Map();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  }

  let html = '';
  for (const [date, shows] of byDate) {
    html += `<p><strong>${fmtDate(date)}</strong></p><ul>`;
    for (const s of shows) {
      const link = s.url ? `<a href="${s.url}">${s.title}</a>` : s.title;
      const venue = s.venue ? ` <span style="color:#888">at ${s.venue}</span>` : '';
      const time = fmtTime(s.time);
      const price = s.price ? ` · ${s.price}` : '';
      html += `<li>${link}${venue}${time}${price}</li>`;
    }
    html += '</ul>';
  }
  return html;
}

function happyHourHtml(pick) {
  if (!pick) return '';
  return `
    <p><strong>${pick.name}</strong> — ${pick.neighborhood}</p>
    <p>${pick.description}</p>
    ${pick.hours ? `<p style="color:#888">${pick.hours}</p>` : ''}
    <p><a href="${SITE}/best-happy-hours/">See all happy hours →</a></p>
  `;
}

function horoscopeHtml(horoscope) {
  if (!horoscope) return '';
  const picks = (horoscope.horoscopes || []).slice(0, 3);
  if (!picks.length) return '';
  let html = `<p>${horoscope.intro || ''}</p>`;
  for (const h of picks) {
    html += `<p><strong>${h.symbol} ${h.sign}</strong> — ${h.text}</p>`;
  }
  html += `<p><a href="${SITE}/horoscope/">Read all twelve signs →</a></p>`;
  return html;
}

function buildHtml(events, happyHour, horoscope) {
  const label = weekLabel();
  return `
<h1>Best of MPLS</h1>
<p style="color:#888">Week of ${label}</p>

<hr>

<h2>This week on the calendar</h2>
${eventsHtml(events)}
<p><a href="${SITE}/calendar/">Full calendar →</a></p>

<hr>

<h2>Happy hour pick</h2>
${happyHourHtml(happyHour)}

<hr>

<h2>Weekly horoscope</h2>
${horoscopeHtml(horoscope)}

<hr>

<p style="color:#888; font-size:13px;">
  You're getting this because you signed up at <a href="${SITE}">bestofmpls.com</a>.
  The full guide is always there — neighborhoods, shows, food, and more.
</p>
  `.trim();
}

function buildSubject() {
  const mon = thisMonday();
  const [y, m, d] = mon.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `Best of MPLS — Week of ${label}`;
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
