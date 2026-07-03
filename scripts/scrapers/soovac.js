/**
 * SooVAC scraper (Soo Visual Arts Center, soovac.org, Lyn-Lake).
 *
 * Wix page, so no stable classes; the reliable signal is the text pattern the
 * gallery uses for every show: an h2 title ("Indulgences by James Ostrander")
 * followed within the same block by "Exhibitions run July 25 - August 30,
 * 2026". We walk h2s and read the "Exhibitions run" line that follows.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean, parseDateRange } = require('./_helpers');

const SOURCE_URL = 'https://www.soovac.org/exhibitions';

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);
  const events = [];
  const seen = new Set();

  $('h2').each((_, el) => {
    const title = clean($(el).text());
    if (!title || title.length < 3 || /upcoming|current|past|exhibitions?$|ongoing programming/i.test(title)) return;
    // Raw sibling text for the run line (clean() flattens dashes).
    const ctx = ($(el).parent().parent().text() || '').replace(/\s+/g, ' ');
    const m = ctx.match(/Exhibitions? runs?\s+([^.]*?\d{4})/i);
    if (!m) return;
    const range = parseDateRange(m[1]);
    if (!range) return;
    const key = `${range.start}:${slugify(title)}`;
    if (seen.has(key)) return;
    seen.add(key);
    events.push({
      id: `soovac:${key}`,
      date: range.start,
      time: null,
      end_date: range.end,
      title,
      venue: 'SooVAC',
      venue_neighborhood: 'Lyn-Lake, Minneapolis',
      city: 'Minneapolis',
      category: 'art',
      subtitle: `On view ${clean(m[1])}`,
      url: SOURCE_URL,
      image: null,
      price: null,
      age: 'All ages',
      source: 'soovac'
    });
  });
  return events;
}

module.exports = { source: 'soovac', label: 'SooVAC', scrape };
