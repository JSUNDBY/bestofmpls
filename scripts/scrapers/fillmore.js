/**
 * The Fillmore Minneapolis scraper (fillmoreminneapolis.com, North Loop).
 *
 * Live Nation's 1,800-cap room by Target Field. The /shows page ships one
 * schema.org MusicEvent JSON-LD block per show (local-offset timestamps,
 * Ticketmaster URLs, images) and serves plain HTTP — the easy kind.
 */

const { fetchHtml, extractJsonLdEvents, isoFromStartDate, hmFromStartDate, slugify, clean, decodeEntities } = require('./_helpers');

const SOURCE_URL = 'https://www.fillmoreminneapolis.com/shows';
const LOOKAHEAD_DAYS = 120;

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const todayISO = new Date().toISOString().slice(0, 10);
  const maxISO = new Date(Date.now() + LOOKAHEAD_DAYS * 86400000).toISOString().slice(0, 10);
  const events = [];
  const seen = new Set();

  for (const ld of extractJsonLdEvents(html)) {
    const date = isoFromStartDate(ld.startDate);
    const title = decodeEntities(clean(ld.name));
    if (!date || !title || date < todayISO || date > maxISO) continue;
    const id = `fillmore:${date}:${slugify(title)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({
      id,
      date,
      time: hmFromStartDate(ld.startDate),
      end_date: null,
      title,
      venue: 'The Fillmore Minneapolis',
      venue_neighborhood: 'North Loop, Minneapolis',
      city: 'Minneapolis',
      category: 'music',
      subtitle: null,
      url: ld.url || SOURCE_URL,
      image: (ld.image && (typeof ld.image === 'string' ? ld.image : ld.image.url)) || null,
      price: null,
      age: null,
      source: 'fillmore',
    });
  }
  return events;
}

module.exports = { source: 'fillmore', label: 'The Fillmore Minneapolis', scrape };
