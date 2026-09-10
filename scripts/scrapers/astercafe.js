/**
 * Aster Cafe scraper — v2 (2026-09-09; was a stub).
 *
 * The music calendar at /live-music-calendar renders through an
 * eventscalendar.co embed (project proj_dzeQWtchNp7PwkZtu12W8) whose API is
 * obfuscated in the embed bundle. So we do it the honest way: headless
 * Chrome loads the page, we sniff the widget's own network responses, and
 * pull events out of whichever JSON payload carries date+title shaped
 * items. Resilient to their endpoint moving as long as the widget works.
 */

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  process.env.CHROME_PATH,
].filter(Boolean);

function findChrome() {
  const fs = require('fs');
  for (const p of CHROME_CANDIDATES) {
    try { fs.accessSync(p); return p; } catch (_) {}
  }
  throw new Error('astercafe: no Chrome binary found (set CHROME_PATH)');
}

const PAGE = 'https://astercafe.com/live-music-calendar';

// Recursively hunt a parsed JSON payload for an array of event-shaped
// objects (something with a title-ish and a date-ish field).
function findEventArrays(node, out = []) {
  if (Array.isArray(node)) {
    const shaped = node.filter(x => x && typeof x === 'object'
      && (x.title || x.name || x.summary)
      && (x.start || x.startDate || x.start_date || x.date || x.startsAt || x.start_at || x.when));
    if (shaped.length >= 2) out.push(shaped);
    node.forEach(n => findEventArrays(n, out));
  } else if (node && typeof node === 'object') {
    Object.values(node).forEach(v => findEventArrays(v, out));
  }
  return out;
}

function centralParts(raw) {
  const d = new Date(raw);
  if (isNaN(d)) {
    const m = String(raw || '').match(/^(\d{4}-\d{2}-\d{2})[T ]?(\d{2}:\d{2})?/);
    return m ? { date: m[1], time: m[2] || null } : null;
  }
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const get = t => parts.find(p => p.type === t).value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}` };
}

async function scrape() {
  const { slugify, decodeEntities } = require('./_helpers');
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'new' });
  const payloads = [];
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36');
    page.on('response', async (res) => {
      try {
        const ct = res.headers()['content-type'] || '';
        if (!/json/.test(ct)) return;
        const body = await res.json().catch(() => null);
        if (body) payloads.push(body);
      } catch (_) {}
    });
    await page.goto(PAGE, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));
  } finally {
    await browser.close();
  }

  const arrays = [];
  for (const p of payloads) findEventArrays(p, arrays);
  // Largest event-shaped array wins.
  arrays.sort((a, b) => b.length - a.length);
  const items = arrays[0] || [];

  const events = [];
  const seen = new Set();
  for (const it of items) {
    let title = decodeEntities(String(it.title || it.name || it.summary || '').trim());
    // Their titles carry a "... $15" tail; that is a price, not a name.
    let price = null;
    const pm = title.match(/\s*\.\.\.\s*(\$\d+(?:[–-]\$?\d+)?|free)\s*$/i);
    if (pm) { price = /free/i.test(pm[1]) ? 'Free' : pm[1]; title = title.slice(0, pm.index).trim(); }
    else { title = title.replace(/\s*\.\.\.\s*$/, '').trim(); }
    const rawStart = it.start || it.startDate || it.start_date || it.date || it.startsAt || it.start_at || it.when;
    const parts = centralParts(typeof rawStart === 'object' ? (rawStart.dateTime || rawStart.date) : rawStart);
    if (!title || !parts) continue;
    if (parts.date < new Date().toISOString().slice(0, 10)) continue;
    const id = `astercafe:${parts.date}:${slugify(title)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({
      id,
      date: parts.date,
      time: parts.time === '00:00' ? null : parts.time,
      end_date: null,
      title,
      venue: 'Aster Cafe',
      venue_neighborhood: 'St. Anthony Main, Minneapolis',
      city: 'Minneapolis',
      category: 'music',
      subtitle: null,
      url: PAGE,
      image: null,
      price, age: null,
      source: 'astercafe'
    });
  }
  return events;
}

module.exports = { source: 'astercafe', label: 'Aster Cafe', scrape };
