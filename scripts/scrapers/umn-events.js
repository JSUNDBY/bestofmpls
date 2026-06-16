/**
 * University of Minnesota Twin Cities events scraper — public lectures only.
 *
 * NOTE: The campus calendar is NOT Localist/Concept3D as commonly assumed — it
 * runs LiveWhale Calendar at events.tc.umn.edu (events.umn.edu does not
 * resolve; calendar.umn.edu is behind SSO). LiveWhale exposes a clean public
 * JSON feed at:
 *
 *   https://events.tc.umn.edu/live/json/events?max=1000
 *
 * It returns the next ~3 months of ALL campus events (1000-item cap), each with
 * title, date_iso (start, with real time), date_time, location_title, cost,
 * description, thumbnail, group_title, event_types and tags.
 *
 * IMPORTANT: This feed carries every campus event (exhibitions, student life,
 * recreation, etc.), far beyond lectures. The LiveWhale event_types are broad
 * TOPIC buckets ("Arts, Culture...", "Academics, Research...") — there is no
 * "Lecture/Talk" format type to filter on. So we filter by matching public-talk
 * keywords in the event title (lecture, talk, colloquium, forum, seminar,
 * keynote, symposium, panel, public lecture, poetry/author reading). This is
 * deliberately tight: quality over quantity, no fabricated events.
 *
 * Many campus events are multi-day exhibitions that repeat one feed row per day;
 * we dedupe by title so a single lecture isn't listed many times.
 */

const { slugify, isoFromStartDate, hmFromStartDate, decodeEntities } = require('./_helpers');

const FEED = 'https://events.tc.umn.edu/live/json/events?max=1000';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 bestofmpls-bot (contact: hello@bestofmpls.com)';

// Public-talk keywords, matched against the event title. "reading" is only
// matched in "poetry reading" / "author reading" / "reading by" forms because
// bare "reading" produces false positives (e.g. "Summer Reading Bingo").
const LECTURE_RX = /\b(lecture|colloquium|keynote|symposium|distinguished speaker|guest speaker)\b|\btalk\b|\bforum\b|\bseminar\b|\bpanel\b|\bpoetry reading\b|\bauthor reading\b|\breading by\b/i;

function isLecture(ev) {
  return LECTURE_RX.test(ev.title || '');
}

// LiveWhale cost is a free-text string like "Free", "$10", or null.
function priceStr(cost) {
  const c = (cost || '').trim();
  return c || null;
}

async function fetchFeed() {
  const res = await fetch(FEED, { headers: { 'Accept': 'application/json', 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${FEED}`);
  return await res.json();
}

async function scrape() {
  let data;
  try {
    data = await fetchFeed();
  } catch (_) {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const todayISO = new Date().toISOString().slice(0, 10);
  const events = [];
  const seen = new Set();

  for (const ev of data) {
    if (!isLecture(ev)) continue;

    const date = isoFromStartDate(ev.date_iso);
    if (!date || date < todayISO) continue; // future-dated only

    const title = decodeEntities(ev.title || '');
    if (!title) continue;

    // All-day events have a T00:00:00 timestamp and no real start time.
    const time = ev.is_all_day ? null : hmFromStartDate(ev.date_iso);

    const id = `umn-events:${date}:${slugify(title)}`;
    if (seen.has(id)) continue; // dedupe repeated multi-day rows
    seen.add(id);

    // Prefer the specific room/building name from the event; fall back to the
    // hosting department, then the university.
    const venue = (ev.location_title || ev.group_title || 'University of Minnesota').trim();

    events.push({
      id,
      date,
      time,
      end_date: isoFromStartDate(ev.date2_iso) || null,
      title,
      venue,
      venue_neighborhood: 'University of Minnesota, Minneapolis',
      city: 'Minneapolis',
      category: 'lecture',
      subtitle: ev.group_title ? `Hosted by ${decodeEntities(ev.group_title)}` : null,
      url: ev.url || null,
      image: ev.thumbnail || null,
      price: priceStr(ev.cost),
      age: null,
      source: 'umn-events'
    });
  }

  return events;
}

module.exports = { source: 'umn-events', label: 'University of Minnesota', scrape };
