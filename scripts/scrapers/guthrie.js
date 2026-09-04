/**
 * Guthrie Theater scraper (guthrietheater.org, Mill District).
 *
 * Their site bot-walls plain HTTP (403 to fetch/curl regardless of UA), but
 * every show page at /whats-on/{slug}/ ships schema.org Event JSON-LD for
 * EACH performance instance, timestamped in UTC. So this scraper drives a
 * real headless Chrome via puppeteer-core: read /whats-on/ for the show
 * links, visit each (a handful per season), and convert every instance to
 * a per-night 'performance' event in America/Chicago time.
 *
 * Chrome resolution: CHROME_PATH env, then the macOS app path, then the
 * Linux path GitHub Actions' ubuntu runners preinstall. No Chrome found =
 * throw, and scrape-events marks the source failed without killing the run.
 */

const { slugify, clean } = require('./_helpers');

const BASE = 'https://www.guthrietheater.org';
const LOOKAHEAD_DAYS = 120;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function findChrome() {
  const fs = require('fs');
  for (const p of CHROME_CANDIDATES) {
    try { fs.accessSync(p); return p; } catch (_) {}
  }
  throw new Error('guthrie: no Chrome binary found (set CHROME_PATH)');
}

// UTC instance timestamp → { date, time } in America/Chicago.
function centralParts(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return { date, time };
}

async function scrape() {
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.goto(`${BASE}/whats-on/`, { waitUntil: 'networkidle2', timeout: 45000 });
    const showLinks = await page.$$eval('a[href^="/whats-on/"]', (as) =>
      [...new Set(as.map((a) => a.getAttribute('href').split('#')[0]))].filter((h) => h !== '/whats-on/')
    );

    const todayISO = new Date().toISOString().slice(0, 10);
    const maxISO = new Date(Date.now() + LOOKAHEAD_DAYS * 86400000).toISOString().slice(0, 10);
    const events = [];
    const seen = new Set();

    const cdp = await page.createCDPSession();
    for (const link of showLinks.slice(0, 10)) {
      try {
        // The server only includes the Event JSON-LD on a COOKIE-LESS request
        // (with cookies from a prior page, the blocks are omitted entirely).
        // Clear cookies before each show and parse the RAW response HTML.
        await cdp.send('Network.clearBrowserCookies');
        const resp = await page.goto(BASE + link, { waitUntil: 'domcontentloaded', timeout: 45000 });
        const raw = await resp.text();
        const blocks = [...raw.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
        for (const b of blocks) {
          let parsed;
          try { parsed = JSON.parse(b); } catch (_) { continue; }
          for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
            if (item['@type'] !== 'Event' || !item.startDate) continue;
            const parts = centralParts(item.startDate);
            if (!parts || parts.date < todayISO || parts.date > maxISO) continue;
            const title = clean(item.name).replace(/\s+20\d{2}$/, '');   // 'A Christmas Carol 2026' → 'A Christmas Carol'
            if (!title) continue;
            const id = `guthrie:${parts.date}:${parts.time}:${slugify(title)}`;
            if (seen.has(id)) continue;
            seen.add(id);
            events.push({
              id,
              date: parts.date,
              time: parts.time,
              end_date: null,
              title,
              venue: 'Guthrie Theater',
              venue_neighborhood: 'Mill District, Minneapolis',
              city: 'Minneapolis',
              category: 'performance',
              subtitle: null,
              url: BASE + link,
              image: (item.image && (typeof item.image === 'string' ? item.image : item.image.url)) || null,
              price: null,
              age: null,
              source: 'guthrie',
            });
          }
        }
      } catch (_) { /* one bad show page never kills the source */ }
    }
    return events;
  } finally {
    await browser.close();
  }
}

module.exports = { source: 'guthrie', label: 'Guthrie Theater', scrape };
