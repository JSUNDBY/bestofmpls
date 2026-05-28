/**
 * Varsity Theater scraper.
 *
 * Dinkytown rock club, Live Nation property. Their site emits clean
 * schema.org Event JSON-LD per show — same parser path as Dakota and
 * Hook & Ladder. ~50-100 events visible on the homepage at any time.
 */

const { fetchHtml, slugify, extractJsonLdEvents, isoFromStartDate, hmFromStartDate, decodeEntities } = require('./_helpers');

const SOURCE_URL = 'https://varsitytheater.com';

async function scrape() {
  const events = [];
  const seen = new Set();
  const html = await fetchHtml(SOURCE_URL);
  const items = extractJsonLdEvents(html);

  for (const it of items) {
    const date = isoFromStartDate(it.startDate);
    const time = hmFromStartDate(it.startDate);
    const title = decodeEntities(it.name);
    if (!date || !title) continue;
    const id = `varsity:${date}:${slugify(title)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({
      id,
      date,
      time,
      end_date: isoFromStartDate(it.endDate) || null,
      title,
      venue: 'Varsity Theater',
      venue_neighborhood: 'Dinkytown, Minneapolis',
      city: 'Minneapolis',
      category: 'music',
      subtitle: decodeEntities(it.description || '').slice(0, 220) || null,
      url: it.url || SOURCE_URL,
      image: it.image || null,
      price: null,
      age: null,
      source: 'varsity'
    });
  }

  return events;
}

module.exports = { source: 'varsity', label: 'Varsity Theater', scrape };
