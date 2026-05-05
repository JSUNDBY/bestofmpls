/**
 * Trylon Cinema scraper.
 *
 * The Trylon site is WordPress with the "My Calendar" plugin. The plugin
 * exposes a clean REST endpoint at /wp-json/my-calendar/v1/events that
 * returns every showtime in a date-keyed JSON map. Way better than
 * scraping the AJAX-rendered calendar page.
 *
 * One event per (film, showtime) pair, since each My Calendar "occurrence"
 * is its own row.
 */

const { slugify, clean, pad2 } = require('./_helpers');

function isoDate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

async function scrape() {
  const events = [];
  const start = new Date();
  const end = new Date(); end.setDate(end.getDate() + 60);
  const url = `https://www.trylon.org/wp-json/my-calendar/v1/events?from=${isoDate(start)}&to=${isoDate(end)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'bestofmpls.com/0.1 (contact: hello@bestofmpls.com)',
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();

  // Response is { 'YYYY-MM-DD': [eventOccurrence...] }
  for (const [dateKey, occurrences] of Object.entries(data)) {
    if (!Array.isArray(occurrences)) continue;
    for (const occ of occurrences) {
      const title = clean(occ.event_title);
      if (!title) continue;
      // occur_begin is "YYYY-MM-DD HH:MM:SS" in venue local time.
      const begin = occ.occur_begin || '';
      const date = (begin.split(' ')[0] || dateKey).slice(0, 10);
      const time = (begin.split(' ')[1] || '').slice(0, 5);
      // Strip HTML from event_desc and clip to a sensible subtitle length.
      const desc = clean((occ.event_desc || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).slice(0, 220);
      const url = occ.event_link || null;
      const image = occ.event_image || null;
      const cat = (occ.category_name || '').toLowerCase();

      events.push({
        id: `trylon:${date}:${time || '0000'}:${slugify(title)}`,
        date,
        time: time || null,
        end_date: null,
        title,
        venue: 'Trylon Cinema',
        venue_neighborhood: 'Longfellow, Minneapolis',
        city: 'Minneapolis',
        category: 'film',
        subtitle: desc || (cat ? `${occ.category_name} series` : null),
        url,
        image,
        price: null,
        age: null,
        source: 'trylon'
      });
    }
  }

  return events;
}

module.exports = { source: 'trylon', label: 'Trylon Cinema', scrape };
