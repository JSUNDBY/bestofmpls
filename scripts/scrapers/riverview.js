/**
 * Riverview Theater scraper.
 *
 * Riverview uses Veezi as its ticketing platform. The public showtimes page
 * lives at ticketing.useast.veezi.com with their site token. The HTML is
 * server-rendered with stable structure:
 *
 *   <div class="date">
 *     <h3 class="date-title">Tuesday 5, May</h3>
 *     <div class="film">
 *       <h3 class="title">The Devil Wears Prada 2</h3>
 *       <ul class="session-times">
 *         <li><a href="...purchase/7586..."><time>12:30 PM</time></a></li>
 *
 * One Veezi entry per (film, showtime) pair, since each session is its own
 * event on a calendar. Dates lack a year, so we infer it (current year, roll
 * forward if the date already passed).
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, inferIsoDate, clean } = require('./_helpers');

const SOURCE_URL = 'https://ticketing.useast.veezi.com/sessions/?siteToken=3taz3vkks7e11yj7r5dft9pq30';

// Date-title format from Veezi: "Tuesday 5, May" — extract month + day.
function parseVeeziDate(s) {
  const m = (s || '').match(/(\d+)\s*,\s*([A-Za-z]+)/);
  if (!m) return null;
  return inferIsoDate(m[2], m[1]);
}

// "12:30 PM" → "12:30"
function parseTime12(t) {
  const m = (t || '').trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

async function scrape() {
  const events = [];
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);

  $('.date').each((_, dateBlock) => {
    const $b = $(dateBlock);
    const dateStr = $b.find('.date-title').first().text();
    const iso = parseVeeziDate(dateStr);
    if (!iso) return;

    $b.find('.film').each((_, filmEl) => {
      const $f = $(filmEl);
      const title = clean($f.find('.title').first().text());
      const poster = $f.find('img.poster').attr('src');
      // Veezi nests session-times in a date-container per film. Use whichever
      // matches the surrounding date.
      $f.find('.session-times li a').each((_, a) => {
        const $a = $(a);
        const time = parseTime12($a.find('time').first().text());
        const url = $a.attr('href');
        if (!title || !time) return;
        events.push({
          id: `riverview:${iso}:${time}:${slugify(title)}`,
          date: iso,
          time,
          end_date: null,
          title,
          venue: 'Riverview Theater',
          venue_neighborhood: 'Standish-Ericsson, Minneapolis',
          city: 'Minneapolis',
          category: 'film',
          subtitle: null,
          url: url || null,
          image: poster ? (poster.startsWith('http') ? poster : `https://ticketing.useast.veezi.com${poster}`) : null,
          price: null,
          age: null,
          source: 'riverview'
        });
      });
    });
  });

  return events;
}

module.exports = { source: 'riverview', label: 'Riverview Theater', scrape };
