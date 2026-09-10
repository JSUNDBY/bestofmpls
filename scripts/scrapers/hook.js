/**
 * The Hook and Ladder Theater & Lounge scraper — v2 (2026-09-09).
 *
 * The site rebuilt on Opendate (ticketing platform) in 2026 and the listing
 * pages stopped emitting JSON-LD, which killed v1 silently ("ok but zero"
 * since July). The individual show pages at /shows/<slug> still carry clean
 * schema.org MusicEvent JSON-LD, so: fetch /events/, harvest the unique
 * /shows/ permalinks embedded in the Opendate payload, then fetch each show
 * page (capped) and read its JSON-LD.
 */

const { fetchHtml, slugify, extractJsonLdEvents, decodeEntities } = require('./_helpers');

const LIST_URL = 'https://thehookmpls.com/events/';
const MAX_SHOWS = 40;

async function scrape() {
  const events = [];
  const seen = new Set();

  let listHtml;
  try { listHtml = await fetchHtml(LIST_URL); } catch (_) { return events; }

  const links = [...new Set(
    (listHtml.match(/https:\/\/thehookmpls\.com\/shows\/[a-z0-9-]+/g) || [])
  )].slice(0, MAX_SHOWS);

  for (const link of links) {
    let html;
    try { html = await fetchHtml(link); } catch (_) { continue; }
    for (const it of extractJsonLdEvents(html)) {
      // Opendate emits UTC instants (...T00:00:00.000Z = 7pm CDT the night
      // before) — convert to Central or every show lands on the wrong day.
      const dt = new Date(it.startDate);
      if (isNaN(dt)) continue;
      const central = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(dt);
      const get = t => central.find(p => p.type === t).value;
      const date = `${get('year')}-${get('month')}-${get('day')}`;
      const time = `${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}`;
      const title = decodeEntities(it.name);
      if (!date || !title) continue;
      const id = `hook:${date}:${slugify(title)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const stage = it.location?.name && !/the hook and ladder/i.test(it.location.name)
        ? decodeEntities(it.location.name)
        : null;
      const desc = decodeEntities(it.description || '').slice(0, 200);
      events.push({
        id, date, time,
        end_date: null,
        title,
        venue: 'The Hook and Ladder',
        venue_neighborhood: 'Longfellow, Minneapolis',
        city: 'Minneapolis',
        category: 'music',
        subtitle: [stage, desc].filter(Boolean).join(' · ') || null,
        url: link,
        image: typeof it.image === 'string' ? it.image : (Array.isArray(it.image) ? it.image[0] : null),
        price: null, age: null,
        source: 'hook'
      });
    }
  }
  return events;
}

module.exports = { source: 'hook', label: 'The Hook and Ladder', scrape };
