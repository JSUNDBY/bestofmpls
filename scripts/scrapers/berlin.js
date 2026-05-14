/**
 * Berlin scraper.
 *
 * Downtown Minneapolis listening-room / queer-friendly performance space.
 * Squarespace eventlist module, same shape as the Cedar Cultural Center
 * scraper — one <article class="eventlist-event--upcoming"> per show with
 * a structured <time datetime> we can trust.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean } = require('./_helpers');

const SOURCE_URL = 'https://berlinmpls.com/calendar';

async function scrape() {
  const events = [];
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);

  $('article.eventlist-event--upcoming').each((_, el) => {
    const $el = $(el);
    const title = clean($el.find('.eventlist-title-link').first().text());
    const href  = $el.find('.eventlist-title-link').first().attr('href');
    const url   = href && href.startsWith('http') ? href : `https://berlinmpls.com${href || ''}`;
    const dateEl = $el.find('time.event-date').first();
    const iso   = dateEl.attr('datetime');
    const startTime = $el.find('time.event-time-localized-start').first().text().trim()
                   || $el.find('.event-time-localized').first().text().trim();
    const excerpt = clean($el.find('.eventlist-excerpt').first().text()).slice(0, 220);
    const img = $el.find('img').first().attr('src');

    if (!title || !iso) return;

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
      id: `berlin:${iso}:${slugify(title)}`,
      date: iso,
      time,
      end_date: null,
      title,
      venue: 'Berlin',
      venue_neighborhood: 'Downtown Minneapolis',
      city: 'Minneapolis',
      category: 'music',
      subtitle: excerpt || null,
      url,
      image: img && img.startsWith('http') ? img : null,
      price: null,
      age: '21+',
      source: 'berlin'
    });
  });

  return events;
}

module.exports = { source: 'berlin', label: 'Berlin', scrape };
