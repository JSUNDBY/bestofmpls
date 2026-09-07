/**
 * Big-room concerts via Ticketmaster Discovery API — Target Center,
 * U.S. Bank Stadium, Grand Casino Arena, and anything else arena-scale the
 * DMA feed carries. This is the LCD-Soundsystem-at-the-X problem: the
 * arenas' own sites are bot-walled JS shells, but every show sells through
 * Ticketmaster, and Discovery gives dates, times, AND the ticket URL.
 *
 * Gated on TM_API_KEY (free at developer.ticketmaster.com; set as a GitHub
 * Actions secret + locally). No key = zero events, no error — the source
 * simply stays dark until the key exists.
 */

const { slugify, clean } = require('./_helpers');

const KEY = process.env.TM_API_KEY;
const DMA_ID = 336;   // Minneapolis-St. Paul
const VENUES = new Map([
  ['Target Center', { nb: 'Downtown Minneapolis', city: 'Minneapolis' }],
  ['U.S. Bank Stadium', { nb: 'Downtown Minneapolis', city: 'Minneapolis' }],
  ['Grand Casino Arena', { nb: 'Downtown St. Paul', city: 'St. Paul' }],
  ['Xcel Energy Center', { nb: 'Downtown St. Paul', city: 'St. Paul' }],   // stale TM data safety
  ['The Armory', { nb: 'Downtown Minneapolis', city: 'Minneapolis' }],
  ['Roy Wilkins Auditorium', { nb: 'Downtown St. Paul', city: 'St. Paul' }],
]);
const LOOKAHEAD_DAYS = 180;

async function scrape() {
  if (!KEY) return [];
  const todayISO = new Date().toISOString().slice(0, 10);
  const maxISO = new Date(Date.now() + LOOKAHEAD_DAYS * 86400000).toISOString().slice(0, 10);
  const events = [];
  const seen = new Set();

  for (const seg of ['Music', 'Arts & Theatre']) {
    let page = 0;
    while (page < 4) {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${KEY}&dmaId=${DMA_ID}&segmentName=${encodeURIComponent(seg)}&size=100&page=${page}&sort=date,asc&startDateTime=${todayISO}T00:00:00Z`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const list = (data._embedded || {}).events || [];
      for (const e of list) {
        const v = ((e._embedded || {}).venues || [])[0];
        if (!v || !VENUES.has(v.name)) continue;      // arenas only; clubs come from their own scrapers
        const meta = VENUES.get(v.name === 'Xcel Energy Center' ? 'Grand Casino Arena' : v.name) || VENUES.get(v.name);
        const start = (e.dates || {}).start || {};
        const date = start.localDate;
        if (!date || date < todayISO || date > maxISO) continue;
        const title = clean(e.name);
        if (!title || /parking|tour package|vip package/i.test(title)) continue;
        const id = `ticketmaster:${date}:${slugify(title)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        events.push({
          id,
          date,
          time: start.localTime ? start.localTime.slice(0, 5) : null,
          end_date: null,
          title,
          venue: v.name === 'Xcel Energy Center' ? 'Grand Casino Arena' : v.name,
          venue_neighborhood: meta.nb,
          city: meta.city,
          category: seg === 'Music' ? 'music' : 'performance',
          subtitle: null,
          url: e.url || null,
          image: null,
          price: null,
          age: null,
          source: 'ticketmaster'
        });
      }
      if (page >= (data.page ? data.page.totalPages - 1 : 0)) break;
      page++;
      await new Promise(r => setTimeout(r, 250));   // TM rate limit: 5/sec
    }
  }
  return events;
}

module.exports = { source: 'ticketmaster', label: 'Arena shows (Ticketmaster)', scrape };
