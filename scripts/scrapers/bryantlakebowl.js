/**
 * Bryant Lake Bowl Theater scraper — v2 (2026-09-09; was a stub).
 *
 * Squarespace 7.0. The ?format=json trick returns an empty items[] for
 * this events collection, but the /theater page server-renders a full
 * Squarespace eventlist: <article class="eventlist-event"> blocks with
 * .eventlist-title-link and <time class="event-date"|"event-time-
 * localized-start"> elements. So: parse the HTML directly.
 */

const { fetchHtml, slugify, decodeEntities } = require('./_helpers');

const PAGE = 'https://www.bryantlakebowl.com/theater';

function to24h(t) {
  const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (/pm/i.test(m[3]) && h < 12) h += 12;
  if (/am/i.test(m[3]) && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

async function scrape() {
  const events = [];
  const seen = new Set();
  let html;
  try { html = await fetchHtml(PAGE); } catch (_) { return events; }

  const articles = html.match(/<article[^>]*eventlist-event[^>]*>[\s\S]*?<\/article>/g) || [];
  for (const a of articles) {
    if (/eventlist-event--past/.test(a)) continue;
    const t = a.match(/eventlist-title-link[^>]*>([^<]+)</);
    const href = a.match(/href="(\/theater\/[^"]+)"/);
    const date = a.match(/class="event-date"[^>]*datetime="(\d{4}-\d{2}-\d{2})"/);
    const start = a.match(/event-time-localized-start[^>]*>([^<]+)</);
    if (!t || !date) continue;
    const title = decodeEntities(t[1].trim());
    const id = `bryantlakebowl:${date[1]}:${slugify(title)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({
      id,
      date: date[1],
      time: start ? to24h(start[1]) : null,
      end_date: null,
      title,
      venue: 'Bryant Lake Bowl Theater',
      venue_neighborhood: 'Lyn-Lake, Minneapolis',
      city: 'Minneapolis',
      category: 'performance',
      subtitle: null,
      url: href ? `https://www.bryantlakebowl.com${href[1]}` : PAGE,
      image: null,
      price: null, age: null,
      source: 'bryantlakebowl'
    });
  }
  return events;
}

module.exports = { source: 'bryantlakebowl', label: 'Bryant Lake Bowl Theater', scrape };
