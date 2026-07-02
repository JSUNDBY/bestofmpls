/**
 * Minnesota Orchestra scraper.
 *
 * The calendar page is a Vue app fed by a public JSON API:
 *   https://www.minnesotaorchestra.org/api/event-feed/{mos}
 * where {mos} is a months-of-schedule window exposed as AppConfig.default_mos
 * in the calendar page source. We read it from the page (fallback 7) and map
 * the feed's performances: perf_date is a full ISO datetime with the Central
 * offset, facility_title is the venue (Orchestra Hall, plus the outdoor
 * Symphony-for-the-Cities sites in summer).
 */

const { slugify, clean } = require('./_helpers');

const CAL_URL = 'https://www.minnesotaorchestra.org/tickets/calendar/calendar';
const FEED_URL = mos => `https://www.minnesotaorchestra.org/api/event-feed/${mos}`;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 bestofmpls-bot (contact: hello@bestofmpls.com)';

function stripHtml(s) {
  return clean(String(s || '').replace(/<[^>]*>/g, ' '));
}

async function scrape() {
  let mos = 7;
  try {
    const res = await fetch(CAL_URL, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/default_mos:\s*(\d+)/);
      if (m) mos = parseInt(m[1], 10);
    }
  } catch (_) { /* fallback stays */ }

  const res = await fetch(FEED_URL(mos), { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for event feed`);
  const feed = await res.json();
  if (!Array.isArray(feed)) throw new Error('event feed is not an array');

  const events = [];
  for (const p of feed) {
    if (!p || !p.perf_date || !p.title) continue;
    // perf_date like 2026-07-07T20:00:00-05:00 — already Central-offset.
    const m = String(p.perf_date).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (!m) continue;
    const [, date, time] = m;
    const venue = clean(p.facility_title || 'Orchestra Hall');
    const isOrchHall = /orchestra hall/i.test(venue);
    const prefix = clean(p.prefix || '');
    const desc = stripHtml(p.description).slice(0, 220);
    const pageUrl = p.event_page_url
      ? (String(p.event_page_url).startsWith('http') ? p.event_page_url : `https://www.minnesotaorchestra.org${p.event_page_url}`)
      : (p.perf_book_url || null);

    events.push({
      id: `mnorch:${p.perf_no || `${date}:${slugify(p.title)}`}`,
      date,
      time,
      end_date: null,
      title: clean(p.title),
      venue,
      venue_neighborhood: isOrchHall ? 'Downtown Minneapolis' : null,
      city: isOrchHall ? 'Minneapolis' : null,
      category: 'music',
      subtitle: [prefix, desc].filter(Boolean).join(' · ') || null,
      url: pageUrl,
      image: p.image && String(p.image).startsWith('http') ? p.image : null,
      price: null,
      age: 'All ages',
      source: 'mnorch'
    });
  }
  return events;
}

module.exports = { source: 'mnorch', label: 'Minnesota Orchestra', scrape };
