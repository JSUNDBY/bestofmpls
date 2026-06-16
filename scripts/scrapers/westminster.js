/**
 * Westminster Town Hall Forum scraper — Minneapolis (1200 Marquette Ave,
 * Downtown). The flagship free civic forum; programs are Thursdays at noon.
 *
 * The site is WordPress (Salient theme). There is no custom event post type
 * and no JSON-LD, but each season page renders its lineup as a series of
 * three-column rows. The middle column carries the speaker name (<h2>) and
 * the right column has a `.speaker-info` block with:
 *   <h4>April 16, 2026</h4>
 *   <h2 id="forumname">Ethics Still Matter: A 45th Anniversary Celebration</h2>
 * plus a "DOORS 11 AM / FREE" <h4> and a "MORE INFO" button linking the event.
 *
 * We discover the current/upcoming season page(s) from the homepage nav
 * (e.g. /home/2026-season-spring/), then parse every `.speaker-info` block.
 * Program time is fixed at noon; the doors time and speaker go into subtitle.
 * Only future-dated forums are returned.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, parseDateString, clean, decodeEntities, pad2 } = require('./_helpers');

const HOME = 'https://westminsterforum.org/';

function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

// Find season-page URLs linked from the homepage (current + upcoming seasons).
async function findSeasonPages() {
  const urls = new Set();
  try {
    const html = await fetchHtml(HOME);
    const $ = cheerio.load(html);
    $('a[href*="/home/"]').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (/\/home\/\d{4}-season-(spring|fall|summer|winter)\/?$/i.test(href)) {
        urls.add(href.startsWith('http') ? href : new URL(href, HOME).toString());
      }
    });
  } catch (_) { /* fall through to year guesses below */ }

  // Belt-and-suspenders: also guess this year's and next year's seasons so a
  // nav change doesn't silently drop the feed.
  const yr = new Date().getFullYear();
  for (const y of [yr, yr + 1]) {
    for (const s of ['spring', 'fall']) {
      urls.add(`${HOME}home/${y}-season-${s}/`);
    }
  }
  return [...urls];
}

function parseSeason(html, source, todayISO) {
  const $ = cheerio.load(html);
  const events = [];

  $('.speaker-info').each((_, el) => {
    const $info = $(el);
    const dateText = $info.find('h4').first().text().trim();
    const title = decodeEntities($info.find('h2#forumname').text() || '').trim();
    const date = parseDateString(dateText);
    if (!date || !title) return;
    if (date < todayISO) return; // past forum

    const $col = $info.closest('.wpb_column');
    let url = $col.find('a.nectar-button').attr('href') || null;
    if (url && !url.startsWith('http')) url = new URL(url, HOME).toString();

    // Doors line lives in a separate h4 in the same column.
    let doors = null;
    $col.find('h4').each((__, h) => {
      const t = clean($(h).text());
      if (t && t !== dateText && /DOORS/i.test(t)) {
        const m = t.match(/DOORS\s*([0-9]{1,2}(?::\d{2})?\s*[AP]M)/i);
        if (m) doors = m[1].toUpperCase().replace(/\s+/g, ' ');
      }
    });

    // Speaker name (and bio image) are in the preceding column.
    const $speakerCol = $col.prevAll('.speaker-col').first();
    const speaker = clean($speakerCol.find('h2').first().text());
    const image = $col.closest('[class*="row"]').find('img').first().attr('src') || null;

    const subtitleParts = [];
    if (speaker) subtitleParts.push(speaker);
    if (doors) subtitleParts.push(`Doors ${doors}`);
    const subtitle = subtitleParts.join(' • ') || null;

    events.push({
      id: `westminster:${date}:${slugify(title)}`,
      date,
      time: '12:00', // Forum programs are Thursdays at noon
      end_date: null,
      title,
      venue: 'Westminster Town Hall Forum',
      venue_neighborhood: 'Downtown Minneapolis',
      city: 'Minneapolis',
      category: 'lecture',
      subtitle,
      url: url || HOME,
      image,
      price: 'Free',
      age: 'All ages',
      source
    });
  });

  return events;
}

async function scrape() {
  const source = 'westminster';
  const todayISO = todayIso();
  const pages = await findSeasonPages();

  const events = [];
  const seen = new Set();

  for (const url of pages) {
    let html;
    try { html = await fetchHtml(url); } catch (_) { continue; }
    for (const ev of parseSeason(html, source, todayISO)) {
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);
      events.push(ev);
    }
  }

  return events;
}

module.exports = { source: 'westminster', label: 'Westminster Town Hall Forum', scrape };
