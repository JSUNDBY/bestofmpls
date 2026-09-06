/**
 * Mystic Lake scraper (mysticlake.com/shows-and-events, Prior Lake).
 *
 * Covers the Mystic Amphitheater (the outdoor stage) AND the indoor Mystic
 * Showroom — the listing mixes both, and the room only appears on each
 * show's detail page, so we fetch those (server-rendered, plain fetch).
 * Listing cards carry title + "Weekday, MM/DD" with NO year → inferred as
 * the next occurrence. Detail pages carry the room name and an "8 PM"-style
 * time (first time on the page; usually the show, occasionally doors).
 */

const { fetchHtml, slugify, clean, decodeEntities } = require('./_helpers');

const BASE = 'https://mysticlake.com';
const LIST_URL = `${BASE}/shows-and-events`;
const MAX_SHOWS = 40;

function inferISO(mm, dd, now = new Date()) {
  for (const y of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
    const iso = `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const diff = (Date.parse(iso) - now.getTime()) / 86400000;
    if (diff >= -2 && diff <= 320) return iso;
  }
  return null;
}

async function scrape() {
  const html = await fetchHtml(LIST_URL);
  const todayISO = new Date().toISOString().slice(0, 10);
  const events = [];
  const seen = new Set();

  // Each card: event-title anchor, then the weekday MM/DD nearby.
  const chunks = html.split('cmp-promos-events__event-title').slice(1);
  const cards = [];
  for (const chunk of chunks.slice(0, MAX_SHOWS)) {
    const a = chunk.match(/<a href="(\/shows-and-events\/[^"]+)"[^>]*>([^<]+)<\/a>/);
    const d = chunk.slice(0, 800).match(/[A-Z][a-z]+day,?\s*(\d{1,2})\/(\d{1,2})/);
    if (!a || !d) continue;
    const date = inferISO(+d[1], +d[2]);
    if (!date || date < todayISO) continue;
    cards.push({ href: a[1], title: decodeEntities(a[2]).replace(/\s+/g, ' ').trim(), date });   // keep their en dashes; clean() would flatten them to commas
  }

  for (const c of cards) {
    try {
      const page = await fetchHtml(BASE + c.href);
      const room = (page.match(/Mystic (Amphitheater|Showroom|Event Center)/) || [])[0] || 'Mystic Lake';
      const tm = page.match(/\b(\d{1,2})(?::(\d{2}))?\s*(PM|AM|p\.m\.|a\.m\.)\b/i);
      let time = null;
      if (tm) {
        let h = +tm[1] % 12;
        if (/^p/i.test(tm[3])) h += 12;
        time = `${String(h).padStart(2, '0')}:${tm[2] || '00'}`;
      }
      const comedy = /comedy|comedian/i.test(page.slice(0, 40000));
      const id = `mysticlake:${c.date}:${slugify(c.title)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      events.push({
        id,
        date: c.date,
        time,
        end_date: null,
        title: c.title,
        venue: room,
        venue_neighborhood: 'Mystic Lake, Prior Lake',
        city: 'Prior Lake',
        category: comedy ? 'performance' : 'music',
        subtitle: null,
        url: BASE + c.href,
        image: null,
        price: null,
        age: null,
        source: 'mysticlake'
      });
      await new Promise(r => setTimeout(r, 250));
    } catch (_) { /* one bad detail page never kills the source */ }
  }
  return events;
}

module.exports = { source: 'mysticlake', label: 'Mystic Lake (Amphitheater + Showroom)', scrape };
