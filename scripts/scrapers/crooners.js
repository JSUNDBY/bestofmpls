/**
 * Crooners Supper Club scraper — (6161 Hwy 65 NE, on the Minneapolis edge of
 * Fridley). The Twin Cities' premier jazz/cabaret listening room, with four
 * stages: the Dunsmore Jazz Room, the Main Stage Showroom, Maggie's Piano
 * Lounge, and the seasonal Belvedere tent.
 *
 * Runs WordPress with The Events Calendar (Tribe) plugin and exposes the same
 * public, auth-free REST API as White Squirrel:
 *
 *   https://www.croonersmn.com/wp-json/tribe/events/v1/events
 *     ?per_page=50&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *   → { total, total_pages, events: [{ title, start_date, url, cost, image,
 *        description, venue: { venue, city } }] }
 *
 * The venue's reported city is "Minneapolis"; we pass that through. The room
 * name (venue.venue) is folded into venue_neighborhood so listings show which
 * stage a show is on. start_date is already local time — no tz math needed.
 */

const { slugify, decodeEntities } = require('./_helpers');

const API_BASE = 'https://www.croonersmn.com/wp-json/tribe/events/v1/events';
const PER_PAGE = 50;
const LOOKAHEAD_DAYS = 90;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 bestofmpls-bot (contact: hello@bestofmpls.com)';

function pad2(n) { return String(n).padStart(2, '0'); }

function splitLocal(startDate) {
  const m = String(startDate || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return { date: null, time: null };
  return { date: m[1], time: `${m[2]}:${m[3]}` };
}

function priceStr(cost) {
  if (!cost) return null;
  if (/free/i.test(cost)) return 'Free';
  const nums = String(cost).match(/\d+(?:\.\d+)?/g);
  if (!nums || !nums.length) return null;
  const ints = nums.map(n => Math.round(parseFloat(n)));
  const min = Math.min(...ints), max = Math.max(...ints);
  return min === max ? `$${min}` : `$${min}–$${max}`;
}

function subtitle(description) {
  const text = decodeEntities(description);
  if (!text) return null;
  return text.slice(0, 200);
}

async function fetchPage(page, startISO, endISO) {
  const url = `${API_BASE}?per_page=${PER_PAGE}&page=${page}&start_date=${startISO}&end_date=${endISO}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': UA } });
  if (res.status === 404) return { events: [], total_pages: 0 };
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return await res.json();
}

async function scrape() {
  const now = new Date();
  const startISO = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000);
  const endISO = `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}`;

  const events = [];
  const seen = new Set();

  let page = 1;
  while (true) {
    const data = await fetchPage(page, startISO, endISO);
    const results = data.events || [];
    if (!results.length) break;

    for (const ev of results) {
      const { date, time } = splitLocal(ev.start_date);
      const title = decodeEntities(ev.title);
      if (!title || !date) continue;

      const room = ev.venue && typeof ev.venue === 'object' ? decodeEntities(ev.venue.venue) : null;
      const neighborhood = room || 'Crooners';

      const id = `crooners:${date}:${slugify(title)}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const img = ev.image && (typeof ev.image === 'string' ? ev.image : ev.image.url) || null;

      events.push({
        id,
        date,
        time,
        end_date: null,
        title,
        venue: 'Crooners Supper Club',
        venue_neighborhood: neighborhood,
        city: 'Minneapolis',
        category: 'music',
        subtitle: subtitle(ev.description),
        url: ev.url || null,
        image: img,
        price: priceStr(ev.cost),
        age: null,
        source: 'crooners'
      });
    }

    const totalPages = data.total_pages || 1;
    if (page >= totalPages) break;
    page++;
  }

  return events;
}

module.exports = { source: 'crooners', label: 'Crooners Supper Club', scrape };
