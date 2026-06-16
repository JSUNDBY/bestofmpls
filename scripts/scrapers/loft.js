/**
 * The Loft Literary Center scraper — Minneapolis (1011 Washington Ave S,
 * Mill District / Open Book building).
 *
 * loft.org is Drupal 10. The /upcoming-events view renders one
 * `.product.event.overview` block per event (a Drupal Commerce "event"
 * product). The page's JSON-LD only describes the org, not the events, so we
 * parse the HTML with cheerio.
 *
 * Per block:
 *   - .field.date-range > time[datetime]  -> ISO date (the date portion is
 *       reliable; the "Z" suffix is cosmetic). Visible text = "Saturday, June
 *       20, 2026".
 *   - the second .date-range (Time) span text -> "3pm-7pm" / "12:30pm-1:30pm",
 *       from which we take the start time.
 *   - .field.title text -> title
 *   - the single <a href="/events/..."> in the block -> event URL
 *
 * Pagination: ?page=1, ?page=2, ... (page 0 is the default view). Only a
 * handful of pages ever exist; we walk until a page yields no event blocks.
 *
 * Everything here is a reading / craft talk / literary program, so category
 * is always 'lecture' per the Lectures-page routing requirement.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean, isoFromStartDate, decodeEntities } = require('./_helpers');

const BASE = 'https://loft.org/upcoming-events';
const MAX_PAGES = 6; // safety cap; real count is ~1-2

// Parse a leading clock time out of "3pm-7pm", "12:30pm-1:30pm", "7 p.m.",
// "10am" -> "HH:MM" 24h, or null if unparseable.
function parseStartTime(s) {
  if (!s) return null;
  const txt = String(s).toLowerCase().replace(/\./g, ''); // "p.m." -> "pm"
  const m = txt.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3];
  if (mer === 'pm' && h !== 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

async function scrape() {
  const events = [];
  const seen = new Set();
  const today = new Date().toISOString().slice(0, 10);

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = page === 0 ? BASE : `${BASE}?page=${page}`;
    let html;
    try { html = await fetchHtml(url); } catch (_) { break; }

    const $ = cheerio.load(html);
    const blocks = $('.product.event.overview');
    if (blocks.length === 0) break;

    blocks.each((_, el) => {
      const $b = $(el);

      // Date: first .field.date-range holds the <time datetime>.
      const dt = $b.find('.field.date-range time[datetime]').first().attr('datetime');
      const date = isoFromStartDate(dt);
      if (!date || date < today) return; // future only

      // Time: the Time block is the .fieldupe-...date-range with a <span>.
      const timeText = clean($b.find('[class*="commerce-product-event-field-date-range"] span').first().text())
        || clean($b.find('.date-range span[datetime]').first().text());
      const time = parseStartTime(timeText);

      const title = decodeEntities(clean($b.find('.field.title').first().text()));
      if (!title) return;

      const href = $b.find('a[href^="/events/"]').first().attr('href');
      const eventUrl = href ? `https://loft.org${href}` : url;

      const subtitle = decodeEntities(clean($b.find('.field.teaser').first().text())).slice(0, 220) || null;

      const id = `loft:${date}:${slugify(title)}`;
      if (seen.has(id)) return;
      seen.add(id);

      events.push({
        id,
        date,
        time,
        end_date: null,
        title,
        venue: 'The Loft Literary Center',
        venue_neighborhood: 'Mill District, Minneapolis',
        city: 'Minneapolis',
        category: 'lecture',
        subtitle,
        url: eventUrl,
        image: null,
        price: null,
        age: null,
        source: 'loft'
      });
    });
  }

  return events;
}

module.exports = { source: 'loft', label: 'The Loft Literary Center', scrape };
