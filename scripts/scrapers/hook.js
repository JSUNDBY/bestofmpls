/**
 * The Hook and Ladder Theater & Lounge scraper.
 *
 * Longfellow venue (Minnehaha Ave). WordPress site emits clean schema.org
 * Event JSON-LD per show. The Hook hosts multiple stages — main stage,
 * Mission Room, Zen Arcade — so we keep the JSON-LD `location.name` when
 * present and fall back to a generic "The Hook and Ladder" label.
 */

const { fetchHtml, slugify, extractJsonLdEvents, isoFromStartDate, hmFromStartDate, decodeEntities } = require('./_helpers');

const PAGES = [
  'https://thehookmpls.com/events/',
  'https://thehookmpls.com/events/list/page/2/',
  'https://thehookmpls.com/events/list/page/3/'
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
      if (!date || !title) continue;
      const id = `hook:${date}:${slugify(title)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      // Hook has multiple stages (Mission Room, Zen Arcade, Under the Canopy)
      // but we collapse them under one "The Hook and Ladder" venue so the
      // calendar's venue filter stays clean. Stage stays in the subtitle.
      const stage = it.location?.name && !/the hook and ladder/i.test(it.location.name)
        ? decodeEntities(it.location.name)
        : null;
      const desc = decodeEntities(it.description || '').slice(0, 200);
      const subtitle = [stage, desc].filter(Boolean).join(' · ') || null;
      events.push({
        id,
        date,
        time,
        end_date: isoFromStartDate(it.endDate) || null,
        title,
        venue: 'The Hook and Ladder',
        venue_neighborhood: 'Longfellow, Minneapolis',
        city: 'Minneapolis',
        category: 'music',
        subtitle,
        url: it.url || url,
        image: it.image || null,
        price: null,
        age: null,
        source: 'hook'
      });
    }
  }

  return events;
}

module.exports = { source: 'hook', label: 'The Hook and Ladder', scrape };
