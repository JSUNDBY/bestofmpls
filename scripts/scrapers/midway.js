/**
 * Midway Contemporary Art scraper (midwayart.org, Sheridan NE).
 *
 * Their Tribe REST endpoint 500s, but /gallery/ ships the FULL events
 * archive (~300 records) inline as an Angular ng-init JSON blob:
 * post_title, EventStartDate/EventEndDate ("2026-03-7 12:00 am" — note
 * single-digit days), permalink, categories, artist_guest_string.
 *
 * We emit only Exhibition and Offsite records whose end date has not
 * passed, as 'art' events (they land on /now-showing/ and the gallery's
 * entry page). Talks/benefits/screenings are skipped — the gallery's own
 * program page covers those.
 */

const { fetchHtml, slugify, clean, extractJsonLdEvents } = require('./_helpers');

const SOURCE_URL = 'https://www.midwayart.org/gallery/';
const HOME_URL = 'https://www.midwayart.org/';
const KEEP_CATS = new Set(['Exhibition', 'Offsite']);

// "2026-03-7 12:00 am" → "2026-03-07"
function isoDate(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const m = html.match(/ng-init='init\((\{.*?\})\)'/s);
  if (!m) throw new Error('midway: ng-init events blob not found');
  // The blob sits inside a single-quoted HTML attribute; entities are escaped.
  const blob = m[1].replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
  const data = JSON.parse(blob);

  const todayISO = new Date().toISOString().slice(0, 10);
  const events = [];
  for (const e of data.events || []) {
    if (!(e.categories || []).some(c => KEEP_CATS.has(c))) continue;
    const start = isoDate(e.EventStartDate);
    const end = isoDate(e.EventEndDate) || start;
    if (!e.post_title || !start) continue;
    if (end < todayISO) continue;
    const offsite = (e.categories || []).includes('Offsite');
    const artist = clean((e.acf && e.acf.artist_guest_string) || '').replace(/^—$/, '');
    events.push({
      id: `midway:${start}:${slugify(e.post_title)}`,
      date: start,
      time: null,
      end_date: end > start ? end : null,
      title: artist && artist !== e.post_title ? `${e.post_title} by ${artist}` : e.post_title,
      venue: 'Midway Contemporary Art',
      venue_neighborhood: 'Sheridan, Northeast Minneapolis',
      city: 'Minneapolis',
      category: 'art',
      subtitle: offsite ? 'Offsite presentation; check the event page for location' : null,
      url: e.permalink || SOURCE_URL,
      image: e.post_thumbnail || null,
      price: 'Free',
      age: 'All ages',
      source: 'midway'
    });
  }

  // The /gallery/ archive misses homepage-promoted shows (e.g. offsite
  // presentations). Follow the homepage's /event/ links and read each
  // page's Tribe JSON-LD, skipping anything already captured above.
  try {
    const home = await fetchHtml(HOME_URL);
    const links = [...new Set([...home.matchAll(/href="(https?:\/\/(?:www\.)?midwayart\.org\/event\/[^"]+)"/g)].map(x => x[1]))];
    for (const link of links.slice(0, 6)) {
      try {
        const page = await fetchHtml(link);
        for (const ld of extractJsonLdEvents(page)) {
          const start = String(ld.startDate || '').slice(0, 10);
          const end = String(ld.endDate || '').slice(0, 10) || start;
          const title = clean(ld.name);
          if (!title || !start || end < todayISO) continue;
          const id = `midway:${start}:${slugify(title)}`;
          if (events.some(ev => ev.id === id)) continue;
          events.push({
            id, date: start < todayISO ? todayISO : start, time: null,
            end_date: end > start ? end : null,
            title,
            venue: 'Midway Contemporary Art',
            venue_neighborhood: 'Sheridan, Northeast Minneapolis',
            city: 'Minneapolis',
            category: 'art',
            subtitle: /off-?site/i.test(link) ? 'Offsite presentation; check the event page for location' : null,
            url: link, image: null, price: 'Free', age: 'All ages',
            source: 'midway'
          });
        }
      } catch (_) { /* one bad event page never kills the source */ }
    }
  } catch (_) { /* homepage fetch is best-effort */ }

  return events;
}

module.exports = { source: 'midway', label: 'Midway Contemporary Art', scrape };
