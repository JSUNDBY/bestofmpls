/**
 * The Cedar Cultural Center scraper.
 *
 * Squarespace eventlist module. Each event is an <article> with class
 * eventlist-event--upcoming. The structured time element gives us a clean
 * datetime attribute we can trust.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean } = require('./_helpers');

const SOURCE_URL = 'https://www.thecedar.org/events';

async function scrape() {
  const events = [];
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);

  $('article.eventlist-event--upcoming').each((_, el) => {
    const $el = $(el);
    const title = clean($el.find('.eventlist-title-link').first().text());
    const href  = $el.find('.eventlist-title-link').first().attr('href');
    const url   = href && href.startsWith('http') ? href : `https://www.thecedar.org${href || ''}`;
    const dateEl = $el.find('time.event-date').first();
    const iso   = dateEl.attr('datetime');
    const dateText = clean(dateEl.text());
    const startTime = $el.find('time.event-time-localized-start').first().text().trim();
    const excerpt = clean($el.find('.eventlist-excerpt').first().text()).slice(0, 220);
    const img = $el.find('img').first().attr('src');

    if (!title || !iso) return;

    // Convert "8:00 PM" to 24h
    let time = null;
    const tm = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (tm) {
      let hr = parseInt(tm[1], 10);
      const min = tm[2];
      const ampm = tm[3].toUpperCase();
      if (ampm === 'PM' && hr < 12) hr += 12;
      if (ampm === 'AM' && hr === 12) hr = 0;
      time = `${String(hr).padStart(2, '0')}:${min}`;
    }

    events.push({
      id: `cedar:${iso}:${slugify(title)}`,
      date: iso,
      time,
      end_date: null,
      title,
      venue: 'The Cedar Cultural Center',
      venue_neighborhood: 'West Bank, Minneapolis',
      city: 'Minneapolis',
      category: 'music',
      subtitle: excerpt || null,
      url,
      image: img && img.startsWith('http') ? img : null,
      price: null,
      age: 'All ages',
      source: 'cedar'
    });
  });

  return events;
}

module.exports = { source: 'cedar', label: 'The Cedar Cultural Center', scrape };
