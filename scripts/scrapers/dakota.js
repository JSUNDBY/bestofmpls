/**
 * Dakota Jazz Club & Restaurant scraper.
 *
 * Dakota's WordPress event archive emits clean schema.org Event JSON-LD per
 * show, one or many entries per page. Pagination via /events/page/2/ etc;
 * we walk a few pages so we get the next month or two of shows.
 */

const { fetchHtml, slugify, extractJsonLdEvents, isoFromStartDate, hmFromStartDate, decodeEntities } = require('./_helpers');

const PAGES = [
  'https://dakotacooks.com/events/',
  'https://dakotacooks.com/events/page/2/',
  'https://dakotacooks.com/events/page/3/'
];

async function scrape() {
  const events = [];
  const seen = new Set();

  for (const url of PAGES) {
    let html;
    try { html = await fetchHtml(url); } catch (_) { continue; }
    const items = extractJsonLdEvents(html);
    for (const it of items) {
      const date = isoFromStartDate(it.startDate);
      const time = hmFromStartDate(it.startDate);
      const title = decodeEntities(it.name);
      const eventUrl = it.url || url;
      if (!date || !title) continue;
      const id = `dakota:${date}:${slugify(title)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      events.push({
        id,
        date,
        time,
        end_date: isoFromStartDate(it.endDate) || null,
        title,
        venue: 'Dakota Jazz Club',
        venue_neighborhood: 'Downtown Minneapolis',
        city: 'Minneapolis',
        category: 'music',
        subtitle: decodeEntities(it.description || '').slice(0, 220) || null,
        url: eventUrl,
        image: it.image || null,
        price: null,
        age: 'All ages',
        source: 'dakota'
      });
    }
  }

  return events;
}

module.exports = { source: 'dakota', label: 'Dakota Jazz Club', scrape };
