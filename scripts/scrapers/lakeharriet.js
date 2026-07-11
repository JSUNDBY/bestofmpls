/**
 * Lake Harriet Bandshell scraper.
 *
 * The Minneapolis Park Board runs The Events Calendar (Tribe) on WordPress,
 * which exposes a clean JSON REST API. Every bandshell concert lives under one
 * venue id (37250, "Lake Harriet Bandshell"), so we page the API filtered to
 * that venue from today forward. These are the free Music in the Parks shows:
 * concerts most nights of the summer, all ages, no cover.
 */

const { clean, pad2 } = require('./_helpers');

const API = 'https://www.minneapolisparks.org/wp-json/tribe/events/v1/events';
const VENUE = 37250;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function todayCentral() {
  // Cheap Central-date string without pulling in tz libs; the API wants a
  // start_date floor and being off by a few hours at the boundary is harmless.
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

async function scrape() {
  const events = [];
  const start = `${todayCentral()} 00:00:00`;
  let page = 1;
  const MAX_PAGES = 4;
  while (page <= MAX_PAGES) {
    const url = `${API}?per_page=50&page=${page}&start_date=${encodeURIComponent(start)}&venue=${VENUE}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!res.ok) {
      if (page === 1) throw new Error(`${res.status} ${res.statusText} for Lake Harriet feed`);
      break; // a later page 400s when it runs past the end; that's the stop
    }
    const data = await res.json();
    const batch = data.events || [];
    for (const e of batch) {
      const m = String(e.start_date || '').match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
      if (!m) continue;
      const [, date, time] = m;
      const title = clean(e.title);
      if (!title) continue;
      const isMovie = /\bmovie|\bfilm\b|screening/i.test(title);
      events.push({
        id: `lakeharriet:${date}:${time}`,
        date,
        time,
        end_date: null,
        title,
        venue: 'Lake Harriet Bandshell',
        venue_neighborhood: 'Lake Harriet, Minneapolis',
        city: 'Minneapolis',
        category: isMovie ? 'film' : 'music',
        subtitle: 'Free Music in the Parks concert at the Lake Harriet Bandshell.',
        url: e.url || 'https://www.minneapolisparks.org/event-calendar/',
        image: (e.image && e.image.url) ? e.image.url : null,
        price: 'Free',
        age: 'All ages',
        source: 'lakeharriet'
      });
    }
    if (batch.length < 50) break;
    page++;
  }
  return events;
}

module.exports = { source: 'lakeharriet', label: 'Lake Harriet Bandshell', scrape };
