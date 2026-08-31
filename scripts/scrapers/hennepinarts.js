/**
 * Hennepin Arts scraper — the Orpheum, State, and Pantages theatres on
 * Hennepin Avenue (formerly Hennepin Theatre Trust; site rebranded to
 * hennepinarts.org). Touring Broadway, big-room concerts, comedy, speakers.
 *
 * Their events page is a Nuxt SPA whose listing is served by Algolia. The
 * application id + search-only API key below are the site's own PUBLIC
 * frontend config, shipped in the page HTML to every visitor
 * (window.__NUXT__.config.public.algolia) — not a private credential. The
 * index is `events_production`; records carry name/venue/genre/slug/
 * startDate/endDate (+ midnight-local timestamps) and an image, but NO
 * show time and NO price, so those stay null.
 *
 * Multi-day runs (a Broadway week) come back as ONE record with a date
 * range. Runs of 14 nights or fewer are expanded to per-night events so
 * the calendar's day stream sees them (collapseRuns re-collapses them for
 * display); longer runs emit opening night only, with end_date set, so we
 * never fabricate a monthlong nightly schedule.
 *
 * Overlap note: some Orpheum/State shows also syndicate through the
 * First Avenue calendar. dedupeNonFilms keys on title::venue::date, so
 * exact-title matches collapse; differing billing ("Ray LaMontagne" vs
 * "Ray LaMontagne - Trouble 20th Anniversary Tour") can still double-list.
 */

const { slugify, decodeEntities } = require('./_helpers');

const APP_ID = '82420Y68O3';
const API_KEY = 'fcac13e357903ba15f299fc0c18545f2'; // public search-only key from the site's own HTML
const INDEX = 'events_production';
const LOOKAHEAD_DAYS = 180;
const MAX_EXPAND_NIGHTS = 14;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 bestofmpls-bot (contact: hello@bestofmpls.com)';

// Genre → site category. Only actual concerts land in 'music' (and thus on
// /live-music/tonight/); everything else on these stages is 'performance'.
function categoryFor(genre) {
  return /concert/i.test(genre || '') ? 'music' : 'performance';
}

function isoAddDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

async function queryPage(page, minTs) {
  const res = await fetch(`https://${APP_ID}-dsn.algolia.net/1/indexes/${INDEX}/query`, {
    method: 'POST',
    headers: {
      'x-algolia-application-id': APP_ID,
      'x-algolia-api-key': API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': UA
    },
    body: JSON.stringify({
      query: '',
      hitsPerPage: 100,
      page,
      numericFilters: [`endDateTimestamp>=${minTs}`]
    })
  });
  if (!res.ok) throw new Error(`${res.status} from Algolia ${INDEX} page ${page}`);
  return await res.json();
}

async function scrape() {
  // Records timestamp midnight local; go back a day so today's shows survive
  // the filter regardless of timezone math.
  const minTs = Math.floor(Date.now() / 1000) - 86400;
  const todayISO = new Date().toISOString().slice(0, 10);
  const maxISO = isoAddDays(todayISO, LOOKAHEAD_DAYS);

  const events = [];
  const seen = new Set();
  let page = 0;
  while (true) {
    const data = await queryPage(page, minTs);
    for (const hit of data.hits || []) {
      const title = decodeEntities(hit.name);
      const start = hit.startDate, end = hit.endDate || hit.startDate;
      if (!title || !start || !hit.venue) continue;
      if (start > maxISO) continue;

      // Expand short runs to per-night rows; long runs keep the range.
      const runNights = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
      const nights = (runNights > 1 && runNights <= MAX_EXPAND_NIGHTS)
        ? Array.from({ length: runNights }, (_, i) => isoAddDays(start, i)).filter(d => d >= todayISO)
        : [start < todayISO ? todayISO : start];   // already-running long run anchors to today, not its past opening
      const endDateField = (runNights > MAX_EXPAND_NIGHTS && end > start) ? end : null;

      for (const date of nights) {
        if (date > maxISO) continue;
        const id = `hennepinarts:${date}:${slugify(title)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        events.push({
          id,
          date,
          time: null,                       // the index carries dates only
          end_date: endDateField,
          title,
          venue: hit.venue,                 // 'Orpheum Theatre' / 'State Theatre' / 'Pantages Theatre'
          venue_neighborhood: 'Downtown Minneapolis',
          city: 'Minneapolis',
          category: categoryFor(hit.genre),
          subtitle: hit.genre && !/concert/i.test(hit.genre) ? decodeEntities(hit.genre) : null,
          url: hit.slug ? `https://hennepinarts.org/events/${hit.slug}` : null,
          image: hit.image ? (hit.image.startsWith('//') ? 'https:' + hit.image : hit.image) : null,
          price: null,
          age: null,
          source: 'hennepinarts'
        });
      }
    }
    if (page >= (data.nbPages || 1) - 1) break;
    page++;
  }
  return events;
}

module.exports = { source: 'hennepinarts', label: 'Hennepin Arts (Orpheum/State/Pantages)', scrape };
