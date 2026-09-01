/**
 * David Petersen Gallery scraper (davidpetersengallery.com, Standish).
 *
 * WordPress block theme. /exhibitions/ lists every show as a columns row:
 * an h6 with the linked title, a paragraph with the artist(s), and a
 * paragraph with a numeric range "09/12/2026 – 10/25/2026". The range
 * regex tolerates their occasional missing slash ("08/082026"). Emits
 * current and upcoming shows as 'art' events.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean } = require('./_helpers');

const SOURCE_URL = 'https://davidpetersengallery.com/exhibitions/';

// "09/12/2026" (or the typo "08/082026") → ISO
function iso(mm, dd, yyyy) { return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`; }
const RANGE_RE = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[–—-]\s*(\d{1,2})\/(\d{1,2})\/?(\d{4})/;

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);
  const todayISO = new Date().toISOString().slice(0, 10);
  const events = [];

  $('.wp-block-columns').each((_, el) => {
    const $el = $(el);
    const $title = $el.find('h6 a').first();
    const title = clean($title.text());
    const url = $title.attr('href') || SOURCE_URL;
    // Raw text for the range test: clean() flattens en dashes to commas,
    // which destroys "09/12/2026 – 10/25/2026" (same gotcha as dreamsong).
    const paras = $el.find('p').map((_, p) => $(p).text().trim()).get();
    const rangeText = paras.find(t => RANGE_RE.test(t));
    if (!title || !rangeText) return;
    const m = rangeText.match(RANGE_RE);
    const start = iso(m[1], m[2], m[3]);
    const end = iso(m[4], m[5], m[6]);
    if (end < todayISO || end < start) return;
    const artist = clean(paras.find(t => t && !RANGE_RE.test(t)) || '');
    events.push({
      id: `davidpetersen:${start}:${slugify(title)}`,
      date: start,
      time: null,
      end_date: end > start ? end : null,
      title: artist && artist !== title ? `${title} by ${artist}` : title,
      venue: 'David Petersen Gallery',
      venue_neighborhood: 'Standish, Minneapolis',
      city: 'Minneapolis',
      category: 'art',
      subtitle: null,
      url,
      image: null,
      price: 'Free',
      age: 'All ages',
      source: 'davidpetersen'
    });
  });
  return events;
}

module.exports = { source: 'davidpetersen', label: 'David Petersen Gallery', scrape };
