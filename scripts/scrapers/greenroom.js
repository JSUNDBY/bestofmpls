/**
 * Green Room scraper — Uptown Minneapolis (2923 Girard Ave S).
 *
 * Live-music club (hip-hop, DJ nights, rock, open mics) in the old Cowboy
 * Slim's space. The Squarespace site embeds a VenuePilot calendar widget;
 * VenuePilot exposes a public, auth-free GraphQL API that returns clean
 * structured events for the venue's account (id 1147, found in the widget
 * config at greenroommn.com/events):
 *
 *   POST https://www.venuepilot.co/graphql
 *   query { publicEvents(accountIds: [1147], startDate: "YYYY-MM-DD")
 *           { name date startTime doorTime priceMin priceMax ticketsUrl
 *             description venue { name } } }
 *
 * Dates and times come back in the venue's local time; prices are floats
 * (null when unannounced). ticketsUrl points at VenuePilot's checkout.
 */

const { slugify, decodeEntities } = require('./_helpers');

const API = 'https://www.venuepilot.co/graphql';
const ACCOUNT_ID = 1147;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 bestofmpls-bot (contact: hello@bestofmpls.com)';

const QUERY = `query {
  publicEvents(accountIds: [${ACCOUNT_ID}], startDate: "%START%") {
    name date startTime priceMin priceMax ticketsUrl description
    venue { name }
  }
}`;

function priceStr(min, max) {
  if (min == null && max == null) return null;
  const lo = Math.round(min ?? max);
  const hi = Math.round(max ?? min);
  if (lo === 0 && hi === 0) return 'Free';
  return lo === hi ? `$${lo}` : `$${lo}–$${hi}`;
}

function subtitle(description) {
  const text = decodeEntities(String(description || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 200) : null;
}

async function scrape() {
  const startISO = new Date().toISOString().slice(0, 10);
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ query: QUERY.replace('%START%', startISO) }),
  });
  if (!res.ok) throw new Error(`${res.status} from VenuePilot`);
  const data = await res.json();
  if (data.errors) throw new Error('VenuePilot GraphQL: ' + JSON.stringify(data.errors).slice(0, 200));

  const events = [];
  const seen = new Set();
  for (const ev of data.data.publicEvents || []) {
    const title = decodeEntities(ev.name || '').trim();
    const date = ev.date;
    if (!title || !date) continue;
    // The account can include other rooms; keep only the Green Room's.
    if (ev.venue && ev.venue.name && !/green room/i.test(ev.venue.name)) continue;

    const id = `greenroom:${date}:${slugify(title)}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const time = ev.startTime ? String(ev.startTime).slice(0, 5) : null;
    events.push({
      id,
      date,
      time,
      end_date: null,
      title,
      venue: 'Green Room',
      venue_neighborhood: 'Uptown, Minneapolis',
      city: 'Minneapolis',
      category: 'music',
      subtitle: subtitle(ev.description),
      url: ev.ticketsUrl || 'https://www.greenroommn.com/events',
      image: null,
      price: priceStr(ev.priceMin, ev.priceMax),
      age: null,
      source: 'greenroom',
    });
  }
  return events;
}

module.exports = { source: 'greenroom', label: 'Green Room', scrape };
