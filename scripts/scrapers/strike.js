/**
 * Strike Theater (Northeast) — improv and sketch; absorbed HUGE's Improv A
 * Go Go after HUGE closed in 2024. Squarespace, so ?format=json returns the
 * events collection with epoch-ms dates (render in Central).
 */
const { slugify, decodeEntities } = require('./_helpers');
const { toCentral } = require('./_time');

const URL = 'https://strike.theater/shows?format=json';

async function scrape() {
  const events = [];
  const seen = new Set();
  let data;
  try {
    const r = await fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0 bestofmpls-bot (contact: hello@bestofmpls.com)', 'Accept': 'application/json' } });
    if (!r.ok) return events;
    data = await r.json();
  } catch (_) { return events; }
  for (const it of (data.upcoming || [])) {
    const title = decodeEntities(String(it.title || '')).replace(/\s+/g, ' ').trim();
    const c = toCentral(Number(it.startDate));
    if (!title || !c) continue;
    const id = `strike:${c.date}:${slugify(title)}:${c.time}`;
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({
      id, date: c.date, time: c.time, end_date: null,
      title,
      venue: 'Strike Theater',
      venue_neighborhood: 'Northeast Minneapolis',
      city: 'Minneapolis',
      category: 'comedy',
      subtitle: decodeEntities(String(it.excerpt || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 200) || null,
      url: it.fullUrl ? 'https://strike.theater' + it.fullUrl : 'https://strike.theater/shows',
      image: it.assetUrl || null,
      price: null, age: null,
      source: 'strike'
    });
  }
  return events;
}

module.exports = { source: 'strike', label: 'Strike Theater', scrape };
