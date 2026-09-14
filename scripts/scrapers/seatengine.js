/**
 * SeatEngine shared parser (Acme Comedy Co, Laugh Camp). The list page
 * carries one JSON-LD block: a Place whose non-standard `Events` array holds
 * every upcoming show. Top-level @type is Place, so the generic
 * extractJsonLdEvents helper returns nothing here — parse it directly.
 * startDate is a UTC instant (7pm = T00:00Z next day): convert to Central.
 */
const { fetchHtml, slugify, decodeEntities } = require('./_helpers');
const { toCentral } = require('./_time');

function jsonLdBlocks(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse(m[1].trim())); } catch (_) {}
  }
  return out;
}

function makeSeatEngineScraper({ source, label, listUrl, base, venue, neighborhood, city, denyTitle = null, age = '18+' }) {
  async function scrape() {
    const events = [];
    const seen = new Set();
    let html;
    try { html = await fetchHtml(listUrl); } catch (_) { return events; }
    const blocks = jsonLdBlocks(html);
    const items = [];
    const walk = node => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(walk);
      if (Array.isArray(node.Events)) items.push(...node.Events);
      if (Array.isArray(node.events)) items.push(...node.events);
      for (const k of Object.keys(node)) if (k !== 'Events' && k !== 'events' && typeof node[k] === 'object') walk(node[k]);
    };
    walk(blocks);
    for (const it of items) {
      const title = decodeEntities(String(it.name || '')).replace(/\s+/g, ' ').trim();
      if (!title || (denyTitle && denyTitle.test(title))) continue;
      const c = toCentral(it.startDate);
      if (!c) continue;
      const id = `${source}:${c.date}:${slugify(title)}:${c.time}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const url = it.url ? (it.url.startsWith('http') ? it.url : base + it.url) : listUrl;
      const desc = decodeEntities(String(it.description || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 200);
      events.push({
        id, date: c.date, time: c.time, end_date: null,
        title, venue, venue_neighborhood: neighborhood, city,
        category: 'comedy',
        subtitle: desc || null,
        url,
        image: typeof it.image === 'string' ? it.image : (Array.isArray(it.image) ? it.image[0] : null),
        price: null, age,
        source
      });
    }
    return events;
  }
  return { source, label, scrape };
}

module.exports = { makeSeatEngineScraper, jsonLdBlocks };
