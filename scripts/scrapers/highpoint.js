/**
 * Highpoint Center for Printmaking scraper (highpointprintmaking.org, Lake St).
 *
 * Squarespace summary blocks: each show is a .summary-item with a title link
 * and an excerpt that contains a date range, usually without years
 * ("May 29 - July 18") — parseDateRange infers the year from today.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean, parseDateRange } = require('./_helpers');

const BASE = 'https://www.highpointprintmaking.org';
const SOURCE_URL = `${BASE}/exhibits-current-upcoming`;

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);
  const events = [];

  $('.summary-item').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('.summary-title a, a.summary-title-link').first();
    const title = clean($a.text() || $el.find('.summary-title').text());
    const href = $a.attr('href');
    // Dates live in the Squarespace event metadata time element, with years
    // ("May 29, 2026 – July 18, 2026"). Raw text: clean() flattens dashes.
    const rangeText = $el.find('time.summary-metadata-item--date').first().text().trim();
    const range = parseDateRange(rangeText);
    if (!title || !range) return;
    events.push({
      id: `highpoint:${range.start}:${slugify(title)}`,
      date: range.start,
      time: null,
      end_date: range.end,
      title,
      venue: 'Highpoint Center for Printmaking',
      venue_neighborhood: 'Lyn-Lake, Minneapolis',
      city: 'Minneapolis',
      category: 'art',
      subtitle: `On view ${clean(rangeText)}`,
      url: href ? (href.startsWith('http') ? href : `${BASE}${href}`) : SOURCE_URL,
      image: null,
      price: null,
      age: 'All ages',
      source: 'highpoint'
    });
  });
  return events;
}

module.exports = { source: 'highpoint', label: 'Highpoint Printmaking', scrape };
