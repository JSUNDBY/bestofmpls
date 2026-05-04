/**
 * First Avenue scraper.
 *
 * One page covers a constellation of venues that the company runs or books:
 * Mainroom, 7th St Entry, Fine Line, Turf Club, Palace Theatre, Fitzgerald
 * Theater, Depot Tavern, plus State and Orpheum when they syndicate.
 *
 * The page is server-rendered WordPress. Each show is wrapped in a div with
 * class "show_list_item" containing:
 *   .month / .day / .ordinal  → date
 *   .venue_name               → venue
 *   h4 a                      → title (and ticket URL on event detail page)
 *   h5                        → "with <em>opener</em>" line
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, inferIsoDate, clean } = require('./_helpers');

const VENUE_NEIGHBORHOOD = {
  'first avenue':                ['Downtown Minneapolis', 'Minneapolis'],
  'mainroom':                    ['Downtown Minneapolis', 'Minneapolis'],
  '7th st entry':                ['Downtown Minneapolis', 'Minneapolis'],
  'fine line':                   ['Warehouse District, Minneapolis', 'Minneapolis'],
  'fine line music cafe':        ['Warehouse District, Minneapolis', 'Minneapolis'],
  'turf club':                   ['Hamline-Midway, St. Paul', 'St. Paul'],
  'palace theatre':              ['Downtown St. Paul', 'St. Paul'],
  'fitzgerald theater':          ['Downtown St. Paul', 'St. Paul'],
  'the fitzgerald theater':      ['Downtown St. Paul', 'St. Paul'],
  'depot tavern':                ['Downtown Minneapolis', 'Minneapolis'],
  'state theatre':               ['Downtown Minneapolis', 'Minneapolis'],
  'orpheum theatre':             ['Downtown Minneapolis', 'Minneapolis'],
  'amsterdam bar & hall':        ['Downtown St. Paul', 'St. Paul'],
  'amsterdam bar and hall':      ['Downtown St. Paul', 'St. Paul']
};

async function scrape() {
  const events = [];
  // The page paginates by month query strings. Pull current and next two.
  const now = new Date();
  for (let offset = 0; offset < 3; offset++) {
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const y = target.getFullYear();
    const url = offset === 0
      ? 'https://first-avenue.com/shows/'
      : `https://first-avenue.com/shows/?event_month=${y}-${m}`;

    let html;
    try { html = await fetchHtml(url); }
    catch (e) { console.warn(`  first-avenue page ${url}: ${e.message}`); continue; }

    const $ = cheerio.load(html);
    $('.show_list_item').each((_, el) => {
      const $el = $(el);
      // Pull any date_container (page renders multiple for responsive layout —
      // they all carry the same data, so we use the first).
      const $date = $el.find('.date_container').first();
      const month = $date.find('.month').first().text();
      const day   = $date.find('.day').first().text();
      const venue = clean($el.find('.venue_name').first().text());
      const $title = $el.find('h4 a').first();
      const title  = clean($title.text());
      const url    = $title.attr('href');
      const opener = clean($el.find('h5').first().text()
        .replace(/^with\s+/i, ''));
      const img = $el.find('.gig_poster_container .photo').first().attr('style');
      const imgUrl = img ? (img.match(/url\(([^)]+)\)/) || [])[1] : null;

      if (!title || !venue || !day || !month) return;

      const iso = inferIsoDate(month, day);
      if (!iso) return;

      const venueKey = venue.toLowerCase().replace(/^the\s+/, '');
      const [neigh, city] = VENUE_NEIGHBORHOOD[venueKey] || [null, 'Twin Cities'];

      events.push({
        id: `first-avenue:${iso}:${slugify(venue)}:${slugify(title)}`,
        date: iso,
        time: null,
        end_date: null,
        title,
        venue,
        venue_neighborhood: neigh,
        city,
        category: 'music',
        subtitle: opener || null,
        url: url || null,
        image: imgUrl ? imgUrl.replace(/[\?#].*$/, '') : null,
        price: null,
        age: null,
        source: 'first-avenue'
      });
    });
  }
  return events;
}

module.exports = { source: 'first-avenue', label: 'First Avenue & affiliates', scrape };
