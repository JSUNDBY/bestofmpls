/**
 * Hennepin County Library events scraper (hclib.org).
 *
 * HCLib runs its event calendar on BiblioCommons. The public web calendar
 * (https://hclib.bibliocommons.com/events) is a client-side app that pulls
 * from an unauthenticated BiblioCommons gateway JSON API:
 *
 *   https://gateway.bibliocommons.com/v2/libraries/hclib/events?limit=100&page=N
 *
 * Response shape (normalized "entities" graph):
 *   {
 *     events: { items: ["<eventId>", ...], pagination: { count, pages, page, limit } },
 *     entities: {
 *       events:    { "<id>": { id, definition: { start, end, title, description,
 *                              featuredImageId, branchLocationId, audienceIds[],
 *                              typeIds[], isCancelled }, ... } },
 *       locations: { "<branchCode>": { name, address: { number, street, city } } },
 *       images:    { "<id>": { url } },
 *       eventTypes:{ "<id>": { name } }
 *     }
 *   }
 *
 * Notes that shaped this scraper:
 * - The gateway ignores facet query params (audiences=, eventTypes=, startDate=),
 *   and items are NOT date-ordered, so we walk pages and filter client-side.
 * - "start"/"end" are local wall-clock (America/Chicago) with no zone suffix,
 *   e.g. "2026-08-01T13:00" — we slice date/time straight off.
 * - Most adult programming is recurring drop-in service (Tech Help, Medicare
 *   counseling, chess/knitting clubs, job-search help). We keep only genuine
 *   talks/lectures/classes/author events and drop the service noise, so this
 *   feeds the Lectures page cleanly. category is always 'lecture'.
 */

const { slugify } = require('./_helpers');

const GATEWAY = 'https://gateway.bibliocommons.com/v2/libraries/hclib/events';
const PAGE_LIMIT = 100;
const MAX_PAGES = 8;          // cap requests; ~800 events scanned per run
const LOOKAHEAD_DAYS = 90;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 bestofmpls-bot (contact: hello@bestofmpls.com)';

// Adult + Senior audience ids.
const ADULT_AUDIENCE_IDS = new Set([
  '56d5cf3d131f61c52b000011', // Seniors
  '56d5cf3d131f61c52b000012'  // Adults
]);

// Event-type ids that are inherently talk/lecture/discussion-shaped.
const LECTURE_TYPE_IDS = new Set([
  '56f9a0fd414af7d259046962', // Celebrations and Cultural Heritage
  '66bc0b4e6982fdb26f8ad3a7', // Book Clubs
  '5761844c43fbe8441a054111'  // Academic Success
  // "Current Events, Lectures, Discussions" and "Writing" ids are matched by
  // name below, since their ids only surface on pages that contain them.
]);

// Type names that qualify as lectures/talks regardless of id.
const LECTURE_TYPE_NAME = /(lecture|discussion|current events|writing|book club|author)/i;

// Title keywords that mark a genuine talk/class even if the type is generic.
const TITLE_INCLUDE = /(author|lecture|talk|reading|panel|discussion|presentation|workshop|class|seminar|history|poetry|writing|writers|memoir|book launch|speaker|conversation with|meet the)/i;

// Title keywords for recurring drop-in service events we never want as lectures.
const TITLE_EXCLUDE = /(tech help|computer help|drop-?in|medicare|counseling|consultation|job search|job club|resume|chess|knitting|crochet|tutoring|coffee and conversation|story\s?time|playgroup|baby|toddler|preschool|craft hour|open lab|one-on-one|1:1|notary|legal clinic|expungement|tax help|citizenship|english conversation|social hour|spanish club)/i;

function buildPageUrl(page) {
  return `${GATEWAY}?limit=${PAGE_LIMIT}&page=${page}`;
}

async function fetchPage(page) {
  const res = await fetch(buildPageUrl(page), {
    headers: { 'Accept': 'application/json', 'User-Agent': UA }
  });
  if (!res.ok) throw new Error(`${res.status} from ${buildPageUrl(page)}`);
  return await res.json();
}

// "Arvonne Fraser" + address → "Minneapolis" style neighborhood/city.
function venueParts(loc) {
  if (!loc) return { neighborhood: 'Minneapolis', city: 'Minneapolis' };
  const addr = loc.address || {};
  const city = String(addr.city || 'Minneapolis').replace(/,\s*$/, '').trim() || 'Minneapolis';
  // Use the branch name as the neighborhood-ish label (e.g. "Arvonne Fraser,
  // Minneapolis"). Avoid "Plymouth, Plymouth" when branch name == city.
  const neighborhood = loc.name && loc.name !== city ? `${loc.name}, ${city}` : city;
  return { neighborhood, city };
}

function qualifies(df, typeNamesForEvent) {
  const aud = new Set(df.audienceIds || []);
  const isAdult = [...aud].some(id => ADULT_AUDIENCE_IDS.has(id));
  if (!isAdult) return false;

  const title = df.title || '';
  if (TITLE_EXCLUDE.test(title)) return false;

  const typeIds = df.typeIds || [];
  const byTypeId = typeIds.some(id => LECTURE_TYPE_IDS.has(id));
  const byTypeName = typeNamesForEvent.some(n => LECTURE_TYPE_NAME.test(n));
  const byTitle = TITLE_INCLUDE.test(title);

  return byTypeId || byTypeName || byTitle;
}

async function scrape() {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const cutoffISO = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000)
    .toISOString().slice(0, 10);

  const events = [];
  const seen = new Set();

  let pages = MAX_PAGES;
  for (let page = 1; page <= pages; page++) {
    let data;
    try { data = await fetchPage(page); } catch (_) { break; }

    const items = (data.events && data.events.items) || [];
    if (!items.length) break;

    const ents = (data.entities && data.entities.events) || {};
    const locs = (data.entities && data.entities.locations) || {};
    const imgs = (data.entities && data.entities.images) || {};
    const types = (data.entities && data.entities.eventTypes) || {};

    const pagination = (data.events && data.events.pagination) || {};
    if (pagination.pages && pagination.pages < pages) pages = pagination.pages;

    for (const id of items) {
      const ev = ents[id];
      if (!ev || !ev.definition) continue;
      const df = ev.definition;
      if (df.isCancelled) continue;

      const start = df.start || '';
      const date = start.slice(0, 10);
      if (!date || date < todayISO || date > cutoffISO) continue;

      const tm = start.match(/T(\d{2}):(\d{2})/);
      const time = tm ? `${tm[1]}:${tm[2]}` : null;
      const endDate = df.end ? df.end.slice(0, 10) : null;

      const typeNames = (df.typeIds || []).map(t => (types[t] && types[t].name) || '');
      if (!qualifies(df, typeNames)) continue;

      const title = String(df.title || '').replace(/\s+/g, ' ').trim();
      if (!title) continue;

      const eid = `hclib:${date}:${slugify(title)}`;
      if (seen.has(eid)) continue;
      seen.add(eid);

      const loc = locs[df.branchLocationId];
      const { neighborhood, city } = venueParts(loc);
      const venue = loc && loc.name
        ? `Hennepin County Library, ${loc.name}`
        : 'Hennepin County Library';

      const img = df.featuredImageId && imgs[df.featuredImageId]
        ? imgs[df.featuredImageId].url
        : null;

      let subtitle = null;
      if (df.description) {
        subtitle = String(df.description)
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
          .replace(/&#8217;|&rsquo;/g, "'").replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ').trim().slice(0, 220) || null;
      }

      events.push({
        id: eid,
        date,
        time,
        end_date: endDate && endDate !== date ? endDate : null,
        title,
        venue,
        venue_neighborhood: neighborhood,
        city,
        category: 'lecture',
        subtitle,
        url: `https://hclib.bibliocommons.com/events/show/${ev.id || id}`,
        image: img,
        price: 'Free',
        age: 'Adults',
        source: 'hclib'
      });
    }
  }

  return events;
}

module.exports = { source: 'hclib', label: 'Hennepin County Library', scrape };
