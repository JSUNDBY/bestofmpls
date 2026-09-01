/**
 * Weinstein Hammons Gallery scraper (weinsteinhammons.com, South Mpls).
 *
 * Hand-edited Squarespace page at /exhibitions-2: the show title sits in
 * a .summary-collection-title span and the run is a lone heading reading
 * "on view through saturday, august 22nd". No start date and no year are
 * published, so: year is inferred (next occurrence within a sane window),
 * date is set to today (the site renders it as "Through {end}"), and if
 * the through-date has already passed we emit NOTHING — the gallery is
 * between shows and the page is stale, not us.
 */

const { fetchHtml, slugify, clean } = require('./_helpers');

const SOURCE_URL = 'https://www.weinsteinhammons.com/exhibitions-2';
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

function inferISO(monthName, day, now = new Date()) {
  const mo = MONTHS[String(monthName).toLowerCase()];
  if (!mo) return null;
  for (const y of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
    const iso = `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const diffDays = (Date.parse(iso) - now.getTime()) / 86400000;
    if (diffDays >= -60 && diffDays <= 245) return iso;
  }
  return null;
}

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const todayISO = new Date().toISOString().slice(0, 10);

  const through = html.match(/on view through\s+(?:\w+day,?\s+)?([A-Za-z]+)\s+(\d{1,2})/i);
  const titleM = html.match(/summary-collection-title[^>]*>(.*?)</s);
  if (!through || !titleM) return [];
  const end = inferISO(through[1], +through[2]);
  const title = clean(titleM[1]);
  if (!end || !title || end < todayISO) return [];   // stale page or between shows

  return [{
    id: `weinsteinhammons:${end}:${slugify(title)}`,
    date: todayISO,
    time: null,
    end_date: end,
    title,
    venue: 'Weinstein Hammons Gallery',
    venue_neighborhood: 'South Minneapolis',
    city: 'Minneapolis',
    category: 'art',
    subtitle: null,
    url: SOURCE_URL,
    image: null,
    price: 'Free',
    age: 'All ages',
    source: 'weinsteinhammons'
  }];
}

module.exports = { source: 'weinsteinhammons', label: 'Weinstein Hammons Gallery', scrape };
