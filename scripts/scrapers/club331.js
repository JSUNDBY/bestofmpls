/**
 * The 331 Club scraper.
 *
 * Northeast Minneapolis dive with live music nearly every night. The site is
 * a single HTML page that lists each night as a card containing a month+day
 * stamp and a block of <a> links naming the artists and times.
 *
 * The format is messy — multiple acts per night, times sprinkled inline, no
 * year. We collapse each night into one event whose title is the first
 * named act and whose subtitle lists the rest. Date inferred from the
 * month/day (next future occurrence) since the site doesn't render a year.
 */

const { fetchHtml, slugify, clean, inferIsoDate, decodeEntities } = require('./_helpers');

const SOURCE_URL = 'https://www.331club.com/';

function extractActsAndTimes(html) {
  // Pull every <a>...</a> as a candidate act name; pull times like "9:30pm".
  const acts = [];
  const aMatches = html.matchAll(/<a [^>]*>([^<]+)<\/a>/g);
  for (const m of aMatches) {
    const text = decodeEntities(m[1]).trim();
    if (!text) continue;
    if (/^331/i.test(text)) continue; // self-link
    if (/^\s*$/.test(text)) continue;
    if (text.length > 80) continue;
    acts.push(text);
  }
  const times = [];
  const tMatches = html.matchAll(/(\d{1,2}(?::\d{2})?)\s*(am|pm)/gi);
  for (const m of tMatches) {
    times.push(`${m[1]}${m[2].toLowerCase()}`);
  }
  return { acts, times };
}

async function scrape() {
  const events = [];
  const html = await fetchHtml(SOURCE_URL);

  // Each event card on the page pairs a date stamp with a content block.
  const pairs = [...html.matchAll(/<div class="event[^"]*">\s*<div class="event-date">\s*<span class="month">([^<]+)<\/span>\s*<span class="date">([^<]+)<\/span>[\s\S]*?<div class="event-content">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g)];

  const now = new Date();
  for (const [, monthRaw, dayRaw, contentHtml] of pairs) {
    const iso = inferIsoDate(monthRaw, dayRaw, now);
    if (!iso) continue;

    const { acts, times } = extractActsAndTimes(contentHtml);
    if (acts.length === 0) continue;

    const title = acts[0];
    const rest = acts.slice(1);
    let subtitle = '';
    if (rest.length > 0) {
      subtitle = `With ${rest.slice(0, 4).join(', ')}${rest.length > 4 ? ` + ${rest.length - 4} more` : ''}`;
    }
    if (times.length > 0) {
      subtitle = subtitle ? `${subtitle} · ${times.slice(0, 3).join(', ')}` : `Sets at ${times.slice(0, 3).join(', ')}`;
    }

    // Pick the earliest time as the event time when present.
    let time = null;
    for (const t of times) {
      const m = t.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
      if (!m) continue;
      let hr = parseInt(m[1], 10);
      const min = m[2] || '00';
      const ampm = m[3].toLowerCase();
      if (ampm === 'pm' && hr < 12) hr += 12;
      if (ampm === 'am' && hr === 12) hr = 0;
      const candidate = `${String(hr).padStart(2, '0')}:${min}`;
      if (!time || candidate < time) time = candidate;
    }

    events.push({
      id: `331:${iso}:${slugify(title)}`,
      date: iso,
      time,
      end_date: null,
      title: clean(title),
      venue: 'The 331 Club',
      venue_neighborhood: 'Northeast Minneapolis',
      city: 'Minneapolis',
      category: 'music',
      subtitle: subtitle.slice(0, 220) || null,
      url: SOURCE_URL,
      image: null,
      price: null,
      age: '21+',
      source: '331'
    });
  }

  return events;
}

module.exports = { source: '331', label: 'The 331 Club', scrape };
