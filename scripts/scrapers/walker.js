/**
 * Walker Art Center scraper.
 *
 * The /calendar page renders one .c-calendar-date block per date with a
 * heading and one or more .c-calendar-instance children. Each instance has
 * a clean datetime attribute on its <time> tag.
 *
 * The page paginates by ?date=YYYY-MM-DD&end=YYYY-MM-DD. We request a
 * generous window of ~60 days from today.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean, pad2 } = require('./_helpers');

function isoDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function categorizeWalker(typeText) {
  const t = (typeText || '').toLowerCase();
  if (t.includes('film') || t.includes('screen')) return 'film';
  if (t.includes('lecture') || t.includes('talk')) return 'lecture';
  if (t.includes('performance') || t.includes('dance') || t.includes('music')) return 'performance';
  if (t.includes('exhibition')) return 'art';
  return 'art';
}

async function scrape() {
  const events = [];
  const start = new Date();
  const end = new Date(); end.setDate(end.getDate() + 60);
  const url = `https://walkerart.org/calendar?date=${isoDate(start)}&end=${isoDate(end)}`;

  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  $('.c-calendar-date').each((_, dateBlock) => {
    const $b = $(dateBlock);
    $b.find('.c-calendar-instance').each((_, inst) => {
      const $i = $(inst);
      const titleEl = $i.find('.c-calendar-instance__title').first();
      const title = clean(titleEl.text());
      const url   = $i.find('.c-calendar-instance__link').first().attr('href');
      const type  = clean($i.find('.c-calendar-instance__type').first().text());
      const timeEl = $i.find('time').first();
      const dt = timeEl.attr('datetime');
      if (!title || !dt) return;
      const isoDt = String(dt);
      const date = isoDt.slice(0, 10);
      let time = null;
      const tm = isoDt.match(/T(\d{2}):(\d{2})/);
      if (tm) time = `${tm[1]}:${tm[2]}`;
      events.push({
        id: `walker:${date}:${slugify(title)}`,
        date,
        time,
        end_date: null,
        title,
        venue: 'Walker Art Center',
        venue_neighborhood: 'Lowry Hill, Minneapolis',
        city: 'Minneapolis',
        category: categorizeWalker(type),
        subtitle: type || null,
        url: url || null,
        image: null,
        price: null,
        age: null,
        source: 'walker'
      });
    });
  });

  return events;
}

module.exports = { source: 'walker', label: 'Walker Art Center', scrape };
