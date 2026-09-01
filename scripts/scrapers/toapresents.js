/**
 * TOA Presents scraper (theorangeadvisory.com/toa-presents, Northeast).
 *
 * Hand-edited Squarespace page. The current/next show appears as a pair of
 * adjacent headings inside one text block, e.g.:
 *   <h1>Opening Thursday, October 1</h1><h2>Kim Benson: New Paintings</h2>
 * or, while a show runs, an "on view through {date}" phrasing. Dates carry
 * no year, so the year is inferred as the next occurrence within about
 * eight months. If the page shows nothing parseable, we emit nothing —
 * never a guess.
 *
 * An opening with no published close date is emitted with end_date: null,
 * which keeps it OFF /now-showing/ (that page requires a real range) but
 * shows it as "Opens {date}" on the gallery's own entry page.
 */

const { fetchHtml, slugify, clean } = require('./_helpers');

const SOURCE_URL = 'https://www.theorangeadvisory.com/toa-presents';
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

// "October 1" → the next occurrence of that date within -1..+8 months.
function inferISO(monthName, day, now = new Date()) {
  const mo = MONTHS[String(monthName).toLowerCase()];
  if (!mo) return null;
  for (const y of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
    const iso = `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const diffDays = (Date.parse(iso) - now.getTime()) / 86400000;
    if (diffDays >= -45 && diffDays <= 245) return iso;
  }
  return null;
}

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const events = [];
  const todayISO = new Date().toISOString().slice(0, 10);

  // Scan every heading in order; a date-phrase heading pairs with the NEXT
  // heading as the show title.
  const hs = [...html.matchAll(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/gs)]
    .map(m => clean(m[1].replace(/<[^>]+>/g, ' ')))
    .filter(Boolean);
  for (let i = 0; i < hs.length - 1; i++) {
    const line1 = hs[i], line2 = hs[i + 1];

    let start = null, end = null, title = null;
    let m = line1.match(/opening\s+(?:\w+day,?\s+)?([A-Za-z]+)\s+(\d{1,2})/i);
    if (m) { start = inferISO(m[1], +m[2]); title = line2; }
    if (!start) {
      m = line1.match(/on view through\s+(?:\w+day,?\s+)?([A-Za-z]+)\s+(\d{1,2})/i);
      if (m) { end = inferISO(m[1], +m[2]); title = line2; start = todayISO <= (end || '') ? todayISO : null; }
    }
    if (!title || (!start && !end)) continue;
    if (end && end < todayISO) continue;
    events.push({
      id: `toapresents:${start || end}:${slugify(title)}`,
      date: start || todayISO,
      time: null,
      end_date: end,
      title,
      venue: 'TOA Presents',
      venue_neighborhood: 'Northeast Minneapolis',
      city: 'Minneapolis',
      category: 'art',
      subtitle: 'Entrance at the back of the Carter-Day building',
      url: SOURCE_URL,
      image: null,
      price: 'Free',
      age: 'All ages',
      source: 'toapresents'
    });
  }
  return events;
}

module.exports = { source: 'toapresents', label: 'TOA Presents', scrape };
