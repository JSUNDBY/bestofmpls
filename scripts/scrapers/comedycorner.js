/**
 * Comedy Corner Underground (Seven Corners). The homepage carries JSON-LD
 * arrays of ComedyEvent with UTC instants and stageti.me ticket links.
 * Two blocks overlap, so dedupe on url+date.
 */
const { fetchHtml, slugify, decodeEntities } = require('./_helpers');
const { jsonLdBlocks } = require('./seatengine');
const { toCentral, fmtPrice } = require('./_time');

const URL = 'https://www.comedycornerunderground.com/';

async function scrape() {
  const events = [];
  const seen = new Set();
  let html;
  try { html = await fetchHtml(URL); } catch (_) { return events; }
  const items = [];
  for (const b of jsonLdBlocks(html)) {
    const arr = Array.isArray(b) ? b : (b && b['@graph']) || [b];
    for (const it of arr) if (it && /Event/.test(String(it['@type']))) items.push(it);
  }
  for (const it of items) {
    const title = decodeEntities(String(it.name || '')).replace(/\s+/g, ' ').trim();
    const c = toCentral(it.startDate);
    if (!title || !c) continue;
    const key = `${it.url || title}:${c.date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const offer = Array.isArray(it.offers) ? it.offers[0] : it.offers;
    events.push({
      id: `comedycorner:${c.date}:${slugify(title)}:${c.time}`,
      date: c.date, time: c.time, end_date: null,
      title,
      venue: 'Comedy Corner Underground',
      venue_neighborhood: 'Seven Corners, Minneapolis',
      city: 'Minneapolis',
      category: 'comedy',
      subtitle: decodeEntities(String(it.description || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 200) || null,
      url: it.url || URL,
      image: typeof it.image === 'string' ? it.image : (Array.isArray(it.image) ? it.image[0] : null),
      price: offer ? fmtPrice(offer.price) : null,
      age: null,
      source: 'comedycorner'
    });
  }
  return events;
}

module.exports = { source: 'comedycorner', label: 'Comedy Corner Underground', scrape };
