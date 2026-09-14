/**
 * Rick Bronson's House of Comedy, Mall of America. The shows subdomain
 * server-renders one JSON-LD array of Event objects with Central offsets
 * already applied, prices, and age ranges. The org also runs Canadian
 * rooms in the same feed — keep only the MOA location.
 */
const { fetchHtml, slugify, decodeEntities } = require('./_helpers');
const { jsonLdBlocks } = require('./seatengine');
const { fmtPrice } = require('./_time');

const URL = 'https://shows.houseofcomedy.net/';

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
    const loc = it.location && (it.location.name || '');
    if (!/house of comedy\s*moa/i.test(loc)) continue;
    const title = decodeEntities(String(it.name || '')).replace(/\s+/g, ' ').trim();
    const m = String(it.startDate || '').match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
    if (!title || !m) continue;
    const date = m[1], time = m[2] || null;
    const id = `houseofcomedy:${date}:${slugify(title)}:${time || ''}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const offer = Array.isArray(it.offers) ? it.offers[0] : it.offers;
    const ageRange = String(it.typicalAgeRange || '');
    const age = /^18/.test(ageRange) ? '18+' : /^16/.test(ageRange) ? '16+' : /^21/.test(ageRange) ? '21+' : null;
    events.push({
      id, date, time, end_date: null,
      title,
      venue: 'House of Comedy',
      venue_neighborhood: 'Mall of America, Bloomington',
      city: 'Bloomington',
      category: 'comedy',
      subtitle: decodeEntities(String(it.description || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 200) || null,
      url: it.url || URL,
      image: typeof it.image === 'string' ? it.image : (Array.isArray(it.image) ? it.image[0] : null),
      price: offer ? fmtPrice(offer.price) : null,
      age,
      source: 'houseofcomedy'
    });
  }
  return events;
}

module.exports = { source: 'houseofcomedy', label: 'House of Comedy (MOA)', scrape };
