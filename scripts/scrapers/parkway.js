/**
 * The Parkway Theater scraper.
 *
 * Squarespace eventlist module, same shape as the Cedar scraper. Each event
 * is an <article class="eventlist-event--upcoming"> with a stable structure:
 *
 *   .eventlist-title-link  → name + URL
 *   time.event-date[datetime] → ISO date
 *   time.event-time-localized-start → 12-hour start
 *   .eventlist-cats → optional category (Film, Music, Comedy)
 *
 * The Parkway runs both films and live music. We tag each event with the
 * best-fit category based on its Squarespace category labels.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean } = require('./_helpers');

const SOURCE_URL = 'https://theparkwaytheater.com/all-events';

function timeFromText(t) {
  const m = (t || '').match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] || '00';
  if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min.padEnd(2, '0')}`;
}

function categoryFromLabels(labels) {
  const text = labels.join(' ').toLowerCase();
  if (text.includes('film') || text.includes('movie') || text.includes('cinema')) return 'film';
  if (text.includes('music') || text.includes('concert')) return 'music';
  if (text.includes('comedy')) return 'performance';
  return 'performance';
}

async function scrape() {
  const events = [];
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);

  $('article.eventlist-event--upcoming').each((_, el) => {
    const $el = $(el);
    const title = clean($el.find('.eventlist-title-link').first().text());
    const href  = $el.find('.eventlist-title-link').first().attr('href');
    const url   = href && href.startsWith('http') ? href : `https://theparkwaytheater.com${href || ''}`;
    const dateEl = $el.find('time.event-date').first();
    const iso   = dateEl.attr('datetime');
    const startTime = $el.find('time.event-time-localized-start').first().text().trim();
    const excerpt = clean($el.find('.eventlist-excerpt').first().text()).slice(0, 220);
    const cats = [];
    $el.find('.eventlist-cats a').each((_, c) => cats.push(clean($(c).text())));
    const img = $el.find('img').first().attr('src');

    if (!title || !iso) return;

    const time = timeFromText(startTime);

    events.push({
      id: `parkway:${iso}:${slugify(title)}`,
      date: iso,
      time,
      end_date: null,
      title,
      venue: 'The Parkway Theater',
      venue_neighborhood: 'Standish, Minneapolis',
      city: 'Minneapolis',
      category: categoryFromLabels(cats),
      subtitle: excerpt || null,
      url,
      image: img && img.startsWith('http') ? img : null,
      price: null,
      age: null,
      source: 'parkway'
    });
  });

  return events;
}

module.exports = { source: 'parkway', label: 'The Parkway Theater', scrape };
