/**
 * Sisyphus Brewing — the taproom with a real comedy program. Public dojour
 * JSON API (no key). Instances carry Central offsets; prices are cents in
 * offer.option_set. The feed also has trivia and drag bingo, so keep only
 * instances tagged comedy/standup/openmic or titled Comedy. The API was
 * flaky on first contact in testing — one retry.
 */
const { slugify, decodeEntities } = require('./_helpers');
const { fmtPrice } = require('./_time');

const today = () => new Date().toISOString().slice(0, 10);
const API = () => `https://dojour.us/api/event_instances/user_feed/?username=sisyphusbrewing&date_min=${today()}+00:00&exclude_plans=true&page_size=50`;

async function getJson(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 bestofmpls-bot (contact: hello@bestofmpls.com)', 'Accept': 'application/json' } });
      if (r.ok) return await r.json();
    } catch (_) {}
  }
  return null;
}

async function scrape() {
  const events = [];
  const seen = new Set();
  let url = API();
  for (let page = 0; page < 3 && url; page++) {
    const data = await getJson(url);
    if (!data || !Array.isArray(data.results)) break;
    for (const inst of data.results) {
      const ev = inst.event || {};
      const tags = (ev.tag_set || []).map(t => String(t.name || '').toLowerCase());
      const rawTitle = decodeEntities(String(ev.title || '')).trim();
      const isComedy = tags.some(t => /comedy|standup|stand-up|open ?mic|improv/.test(t)) || /comedy|stand-?up|improv/i.test(rawTitle);
      if (!isComedy) continue;
      const m = String(inst.start_dt || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      if (!m) continue;
      const title = rawTitle.replace(/\s*\/\/\/.*$/, '').replace(/\s+/g, ' ').trim();
      const id = `sisyphus:${m[1]}:${slugify(title)}:${m[2]}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const opts = (inst.offer && inst.offer.option_set) || [];
      const cents = opts.map(o => Number(o.price)).filter(n => !isNaN(n));
      const price = cents.length ? fmtPrice(Math.min(...cents) / 100) : null;
      events.push({
        id, date: m[1], time: m[2], end_date: null,
        title,
        venue: 'Sisyphus Brewing',
        venue_neighborhood: 'North Loop, Minneapolis',
        city: 'Minneapolis',
        category: 'comedy',
        subtitle: null,
        url: ev.absolute_url || 'https://sisyphusbrewing.com/',
        image: ev.photo && ev.photo.medium_size_url ? ev.photo.medium_size_url : null,
        price, age: '21+',
        source: 'sisyphus'
      });
    }
    url = data.next || null;
  }
  return events;
}

module.exports = { source: 'sisyphus', label: 'Sisyphus Brewing comedy', scrape };
