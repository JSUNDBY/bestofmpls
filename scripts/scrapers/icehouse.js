/**
 * Icehouse scraper — Minneapolis (2528 Nicollet Ave S, Whittier).
 *
 * Icehouse uses the Turntable Tickets platform. Their SPA loads data from a
 * public REST API with no auth required. We hit /api/performance/ with a
 * large page_size, walk pages, filter for upcoming shows (today → +90 days),
 * and convert UTC datetimes to America/Chicago (the venue's timezone).
 *
 * API: https://icehouse.turntabletickets.com/api/performance/?page_size=200
 *   { count, pageSize, results: [{ id, datetime, show: { id, name, description, image, price_per_person } }] }
 *
 * Show ticket URL: https://icehouse.turntabletickets.com/p/{perf.id}/
 *   NOTE: the /shows/{show.id}/ route 404s on a cold load (no SPA rewrite on
 *   that path). The /p/{performance.id}/ route serves the app shell (200) and
 *   resolves to the show, so that is the shareable deep link.
 */

const { slugify } = require('./_helpers');

const API_BASE = 'https://icehouse.turntabletickets.com/api/performance/';
const PAGE_SIZE = 200;
const LOOKAHEAD_DAYS = 90;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 bestofmpls-bot (contact: hello@bestofmpls.com)';

// Convert a UTC ISO string to { date: 'YYYY-MM-DD', time: 'HH:MM' } in
// America/Chicago. Uses Intl.DateTimeFormat (Node 18+ built-in) so DST is
// handled correctly without any external library.
function toChicago(utcIso) {
  const d = new Date(utcIso);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`
  };
}

// Price range string like "$15–$25" or "$20" from price_per_person array.
function priceStr(prices) {
  if (!prices || !prices.length) return null;
  const nums = prices.map(p => Math.floor(parseFloat(p))).filter(n => !isNaN(n));
  if (!nums.length) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max ? `$${min}` : `$${min}–$${max}`;
}

// First plain-text line of the description, stripped of HTML tags and
// boilerplate like "6PM DOORS // 8PM SHOW START // $20 ADVANCE...".
function subtitle(description) {
  if (!description) return null;
  // The API returns HTML. Replace block boundaries with newlines first so
  // sentences don't run together, then strip all remaining tags.
  const text = description
    .replace(/<\/p>|<br\s*\/?>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  // Skip all-caps door/price/time header lines.
  const body = lines.find(l => !/^[A-Z0-9 $+•,\-|/@()[\]:\.\/\\%!]{10,}$/.test(l));
  return body ? body.slice(0, 200) : null;
}

async function fetchPage(page) {
  const url = `${API_BASE}?page_size=${PAGE_SIZE}&page=${page}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': UA }
  });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return await res.json();
}

async function scrape() {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000);

  const events = [];
  const seen = new Set();

  // Walk pages. Items are ordered oldest-first; once we're past the cutoff
  // we can stop. With ~700 total performances and page_size=200 that's ≤4
  // requests total.
  let page = 1;
  while (true) {
    const data = await fetchPage(page);
    const results = data.results || [];
    if (!results.length) break;

    let allPast = true;
    let allFuture = false;

    for (const perf of results) {
      const { date, time } = toChicago(perf.datetime);
      if (date < todayISO) continue; // past

      const perfDate = new Date(perf.datetime);
      if (perfDate > cutoff) {
        allFuture = true;
        continue; // beyond lookahead window
      }

      allPast = false;
      const show = perf.show;
      const title = (show.name || '').replace(/\s+/g, ' ').trim();
      if (!title || !date) continue;

      const id = `icehouse:${date}:${slugify(title)}`;
      if (seen.has(id)) continue;
      seen.add(id);

      events.push({
        id,
        date,
        time,
        end_date: null,
        title,
        venue: 'Icehouse',
        venue_neighborhood: 'Whittier, Minneapolis',
        city: 'Minneapolis',
        category: 'music',
        subtitle: subtitle(show.description),
        url: `https://icehouse.turntabletickets.com/p/${perf.id}/?utm_source=bestofmpls.com&utm_medium=referral`,
        image: show.image || null,
        price: priceStr(show.price_per_person),
        age: null,
        source: 'icehouse'
      });
    }

    // If the last result is past the cutoff, no point fetching further pages.
    const lastDate = new Date(results[results.length - 1].datetime);
    if (lastDate > cutoff) break;

    const totalPages = Math.ceil(data.count / PAGE_SIZE);
    if (page >= totalPages) break;
    page++;
  }

  return events;
}

module.exports = { source: 'icehouse', label: 'Icehouse', scrape };
