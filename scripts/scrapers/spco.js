/**
 * Saint Paul Chamber Orchestra scraper.
 *
 * The upcoming-events listing (content.thespco.org/events/upcoming/) gives one
 * article per program with a date RANGE; each program's detail page carries
 * schema.org MusicEvent microdata per performance: an exact ISO startDate and
 * the venue (Ordway Concert Hall, Ted Mann, neighborhood churches...). We
 * fetch the listing, then each detail page (sequentially, politely) and emit
 * one event per performance.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean } = require('./_helpers');

const BASE = 'https://content.thespco.org';
const LIST_URL = `${BASE}/events/upcoming/`;
const MAX_PROGRAMS = 25;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function scrape() {
  const listHtml = await fetchHtml(LIST_URL);
  const $ = cheerio.load(listHtml);

  const programs = [];
  $('article.posts__post').each((_, el) => {
    const a = cheerio.load(el)('h2.posts__post__title a.url').first();
    const href = a.attr('href');
    const title = clean(a.text());
    if (!href || !title) return;
    const excerpt = clean(cheerio.load(el)('.posts__post__excerpt').first().text()).slice(0, 220);
    programs.push({ title, excerpt, url: href.startsWith('http') ? href : `${BASE}${href}` });
  });

  const events = [];
  for (const prog of programs.slice(0, MAX_PROGRAMS)) {
    try {
      const html = await fetchHtml(prog.url);
      const $$ = cheerio.load(html);
      const img = $$('.main-image img').first().attr('src') || null;
      $$('[itemtype="http://schema.org/MusicEvent"]').each((_, day) => {
        const $day = $$(day);
        const iso = $day.find('time[itemprop="startDate"]').first().attr('datetime');
        if (!iso) return;
        const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
        if (!m) return;
        const [, date, time] = m;
        const venue = clean($day.find('strong.venue').first().text()) || 'Ordway Concert Hall';
        const loc = clean($day.find('span.location').first().text());
        const stPaul = /st\.?\s*paul/i.test(loc) || /ordway/i.test(venue);
        events.push({
          id: `spco:${date}:${time}:${slugify(prog.title)}`,
          date,
          time,
          end_date: null,
          title: prog.title,
          venue,
          venue_neighborhood: loc || null,
          city: stPaul ? 'St. Paul' : 'Minneapolis',
          category: 'music',
          subtitle: prog.excerpt || 'The Saint Paul Chamber Orchestra',
          url: prog.url,
          image: img && String(img).startsWith('http') ? img : null,
          price: null,
          age: 'All ages',
          source: 'spco'
        });
      });
      await sleep(250);
    } catch (_) { /* one bad program page must not sink the run */ }
  }
  return events;
}

module.exports = { source: 'spco', label: 'Saint Paul Chamber Orchestra', scrape };
