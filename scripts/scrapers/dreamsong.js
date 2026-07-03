/**
 * Dreamsong gallery scraper (dreamsong.art, Northeast Minneapolis).
 *
 * The exhibitions page renders each show as an <article> whose header carries
 * an h1 title (with the artist in a nested subtitle span) and a sibling
 * <p class="subtitle-md"> date range like "May 26 – Jul 11, 2026". Emits one
 * 'art' event per show with date = opening, end_date = close.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean, parseDateRange } = require('./_helpers');

const SOURCE_URL = 'https://dreamsong.art/exhibitions';

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);
  const events = [];

  $('article').each((_, el) => {
    const $el = $(el);
    const $h = $el.find('h1').first();
    if (!$h.length) return;
    const artist = clean($h.find('.subtitle-md').text()).replace(/^by\s+/i, '');
    const title = clean($h.clone().children().remove().end().text());
    // Raw text for the range: clean() flattens en dashes to commas, which
    // destroys "May 26 – Jul 11"; parseDateRange normalizes dashes itself.
    const rangeText = $el.find('p.subtitle-md').first().text().trim();
    const range = parseDateRange(rangeText);
    if (!title || !range) return;
    events.push({
      id: `dreamsong:${range.start}:${slugify(title)}`,
      date: range.start,
      time: null,
      end_date: range.end,
      title: artist ? `${title} by ${artist}` : title,
      venue: 'Dreamsong',
      venue_neighborhood: 'Northeast Minneapolis',
      city: 'Minneapolis',
      category: 'art',
      subtitle: `On view through ${clean(rangeText.split(/[-–—]/).pop())}`,
      url: SOURCE_URL,
      image: null,
      price: null,
      age: 'All ages',
      source: 'dreamsong'
    });
  });
  return events;
}

module.exports = { source: 'dreamsong', label: 'Dreamsong', scrape };
