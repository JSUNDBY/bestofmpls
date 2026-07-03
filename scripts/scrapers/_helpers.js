/**
 * Shared helpers for venue scrapers.
 *
 * Every scraper exports a single async function that returns an array of
 * normalized event objects shaped like:
 *
 *   {
 *     id: 'first-avenue:2026-05-01:cloud-nothings',  // stable across runs
 *     date: '2026-05-01',                            // ISO date
 *     time: '20:00' | null,                           // 24h optional
 *     end_date: '2026-05-01' | null,                  // for date ranges
 *     title: 'Cloud Nothings',
 *     venue: 'Turf Club',
 *     venue_neighborhood: 'Hamline-Midway, St. Paul',
 *     city: 'St. Paul' | 'Minneapolis',
 *     category: 'music' | 'art' | 'theater' | 'film' | 'lecture' | 'community',
 *     subtitle: 'with Censer' | null,
 *     url: 'https://...',
 *     image: 'https://...' | null,
 *     price: '$25' | null,
 *     age: '18+' | '21+' | 'All ages' | null,
 *     source: 'first-avenue'
 *   }
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 bestofmpls-bot (contact: hello@bestofmpls.com)';

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
    redirect: 'follow'
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return await res.text();
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

function pad2(n) { return String(n).padStart(2, '0'); }

// "May 1" + reference now → ISO date. If the month/day already passed this
// year, roll forward to next year.
function inferIsoDate(monthStr, dayStr, now = new Date()) {
  const m = MONTHS[String(monthStr || '').trim().toLowerCase()];
  const d = parseInt(dayStr, 10);
  if (!m || !d) return null;
  const thisYear = now.getFullYear();
  let year = thisYear;
  const candidate = new Date(year, m - 1, d);
  // If candidate is more than 14 days in the past, assume next year.
  const diff = (candidate - now) / 86400000;
  if (diff < -14) year = thisYear + 1;
  return `${year}-${pad2(m)}-${pad2(d)}`;
}

// Take a string like "Sat, May 9, 2026" or "May 9" and return ISO.
function parseDateString(s, now = new Date()) {
  if (!s) return null;
  s = s.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
  // try Date.parse first
  const t = Date.parse(s);
  if (!isNaN(t)) {
    const d = new Date(t);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  // try "Mon May 4" style
  const match = s.match(/([A-Za-z]+)\s+(\d{1,2})/);
  if (match) return inferIsoDate(match[1], match[2], now);
  return null;
}

function clean(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/—|–/g, ',')
    .trim();
}

// Extract schema.org Event entries from a page's JSON-LD script blocks.
// Returns an array of raw event objects with at least name, startDate, url.
// Many WordPress and small-venue sites emit clean JSON-LD per event — this
// is the cheapest reliable parsing path for them.
function extractJsonLdEvents(html) {
  const out = [];
  const scripts = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of scripts) {
    let raw = m[1].trim();
    // Some pages wrap multiple objects in array; some emit one per script.
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (_) {
      // Some sites add stray HTML-entity escapes or trailing commas. Try a
      // best-effort fix and re-parse.
      raw = raw.replace(/,\s*([}\]])/g, '$1');
      try { parsed = JSON.parse(raw); } catch (_) { continue; }
    }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const type = item['@type'];
      const types = Array.isArray(type) ? type : [type];
      if (!types.some(t => /Event/i.test(String(t || '')))) continue;
      out.push(item);
    }
  }
  return out;
}

// Pull "2026-05-15" off a startDate string regardless of timezone suffix.
function isoFromStartDate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}
// Pull "20:00" off an ISO datetime like "2026-05-15T19:30:00-05:00".
function hmFromStartDate(s) {
  if (!s) return null;
  const m = String(s).match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

// Decode the HTML entities that JSON-LD sometimes leaves in description /
// name strings (&quot;, &amp;, &lt; …). Strip leftover HTML tags too. Cheap
// regex-only decoder — fine for venue blurbs.
function decodeEntities(s) {
  if (!s) return s;
  return String(s)
    .replace(/&lt;[^&]*?&gt;/g, ' ')
    // Numeric entities first (&#038; → &, &#x27; → '), so the named-entity and
    // tag-strip passes below see already-decoded characters.
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\n/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse an exhibition-style date RANGE into { start, end } ISO dates.
// Handles the formats the gallery sites actually use:
//   "May 26 – Jul 11, 2026"            (year only at the end)
//   "July 25 - August 30, 2026"
//   "September 18, 2025–August 16, 2026"
//   "October 17, 2024–2030"            (end is a bare year → Dec 31)
//   "May 29 - July 18"                 (no years → inferred, end rolls a year
//                                       forward if it lands before the start)
function parseDateRange(text, now = new Date()) {
  const t = String(text || '').replace(/–|—/g, '-').replace(/\s+/g, ' ');
  const m = t.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s*(\d{4})?\s*-\s*(?:([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s*(\d{4})?|(\d{4})(?!\d)|(\d{1,2})(?!\d),?\s*(\d{4})?)/);
  if (!m) return null;
  const [, m1, d1, y1, m2, d2, y2, bareYear, dOnly, yAfterDOnly] = m;
  const mo1 = MONTHS[m1.toLowerCase()];
  if (!mo1) return null;
  let start, end;
  if (bareYear) {
    // "October 17, 2024–2030"
    const sy = y1 ? +y1 : now.getFullYear();
    start = `${sy}-${pad2(mo1)}-${pad2(+d1)}`;
    end = `${+bareYear}-12-31`;
  } else if (dOnly) {
    // "May 29 - 31" (same month)
    const sy = y1 ? +y1 : (+yAfterDOnly || now.getFullYear());
    start = `${sy}-${pad2(mo1)}-${pad2(+d1)}`;
    end = `${+yAfterDOnly || sy}-${pad2(mo1)}-${pad2(+dOnly)}`;
  } else {
    const mo2 = MONTHS[(m2 || '').toLowerCase()];
    if (!mo2) return null;
    const endYear = y2 ? +y2 : (y1 ? +y1 : now.getFullYear());
    const startYear = y1 ? +y1 : (mo1 > mo2 ? endYear - 1 : endYear);
    start = `${startYear}-${pad2(mo1)}-${pad2(+d1)}`;
    let ey = endYear;
    if (!y2 && !y1 && `${ey}-${pad2(mo2)}-${pad2(+d2)}` < start) ey += 1;
    end = `${ey}-${pad2(mo2)}-${pad2(+d2)}`;
  }
  return start <= end ? { start, end } : null;
}

module.exports = {
  fetchHtml, slugify, inferIsoDate, parseDateString, clean, pad2, MONTHS,
  extractJsonLdEvents, isoFromStartDate, hmFromStartDate, decodeEntities,
  parseDateRange
};
