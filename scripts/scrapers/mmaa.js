/**
 * Minnesota Museum of American Art scraper (the M, mmaa.org, downtown St. Paul).
 *
 * WordPress/Enfold "now on view" slides: h3 > a carries title + url, and the
 * slide's excerpt div holds the full date range with years
 * ("September 18, 2025–August 16, 2026"; long-running installs end in a bare
 * year, which parseDateRange maps to Dec 31).
 */

const cheerio = require('cheerio');
const { slugify, clean, parseDateRange } = require('./_helpers');

const SOURCE_URL = 'https://mmaa.org/now-on-view/';
// The M's WAF is fingerprint-fussy: it rejects node's fetch entirely and
// serves a challenge page to curl claiming a full Chrome UA (inconsistent
// fingerprint). A plain generic UA over curl gets the real page. One polite
// request per run.
const UA = 'Mozilla/5.0 (Macintosh)';

async function scrape() {
  // Their WAF fingerprints node's fetch (403, or a 200 challenge page with no
  // content), while plain curl with a browser UA passes. Just use curl.
  const { execFileSync } = require('child_process');
  const html = execFileSync('curl', ['-sL', '-m', '20', '-A', UA, SOURCE_URL], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (!html || html.length < 5000) throw new Error(`curl got ${html ? html.length : 0} bytes for ${SOURCE_URL}`);
  const $ = cheerio.load(html);
  const events = [];
  const seen = new Set();

  $('h3 a').each((_, el) => {
    const $a = $(el);
    const title = clean($a.text());
    const href = $a.attr('href');
    if (!title || !href || !/mmaa\.org/.test(href)) return;
    // Raw text for the range: clean() flattens the en dash the M uses.
    const excerpt = ($a.closest('header').siblings().text() || $a.closest('article, .slide-entry, div').text() || '').trim();
    const range = parseDateRange(excerpt);
    if (!range) return;
    const key = `${range.start}:${slugify(title)}`;
    if (seen.has(key)) return;
    seen.add(key);
    events.push({
      id: `mmaa:${key}`,
      date: range.start,
      time: null,
      end_date: range.end,
      title,
      venue: 'The M (Minnesota Museum of American Art)',
      venue_neighborhood: 'Downtown St. Paul',
      city: 'St. Paul',
      category: 'art',
      subtitle: null,
      url: href,
      image: null,
      price: null,
      age: 'All ages',
      source: 'mmaa'
    });
  });
  return events;
}

module.exports = { source: 'mmaa', label: 'The M (MMAA)', scrape };
