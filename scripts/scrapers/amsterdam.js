/**
 * Amsterdam Bar & Hall scraper — St. Paul (6 W 6th St, Downtown).
 *
 * Amsterdam uses the rhp-events (Rock House Partners) WordPress plugin. There
 * is no public REST API — events are rendered server-side on their dedicated
 * events subdomain. We fetch the homepage once (49+ events, June through
 * November are all on a single page), parse with cheerio, and extract the
 * structured event markup the plugin emits.
 *
 * Source: https://events.amsterdambarandhall.com/
 *   Each event is a <div class="... rhpSingleEvent ..."> block containing:
 *     #eventDate           → "Thu, Jun 11" (no year — we infer it)
 *     a#eventTitle         → title + href to event permalink
 *     .eventDoorStartDate  → "Doors: 5:30 pm || Show: 6 pm"
 *     .eventAgeRestriction → "Ages 18 and up" / "All Ages" / etc.
 *     img (thumbnail)      → optional
 *
 * Month separators (<span class="rhp-events-list-separator-month">) give us
 * the month/year context so we can build full ISO dates without guessing.
 */

const cheerio = require('cheerio');
const { fetchHtml, slugify, clean } = require('./_helpers');

const SOURCE_URL = 'https://events.amsterdambarandhall.com/';
const LOOKAHEAD_DAYS = 180; // page already shows ~6 months

// Map month name → zero-padded number.
const MONTH_MAP = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12'
};

// Parse "Thu, Jun 11" + a known "June 2026" context into "2026-06-11".
function parseEventDate(dateText, monthYear) {
  // dateText: "Thu, Jun 11" or "Fri, Jun 12"
  // monthYear: { month: '06', year: '2026' }
  if (!dateText || !monthYear) return null;
  const m = dateText.match(/(\d{1,2})$/);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  return `${monthYear.year}-${monthYear.month}-${day}`;
}

// Parse "Doors: 5:30 pm || Show: 6 pm" → "18:00" (show time preferred).
function parseShowTime(timeText) {
  if (!timeText) return null;
  // Prefer Show time; fall back to Doors
  const showMatch = timeText.match(/Show[:\s]+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  const doorsMatch = timeText.match(/Doors[:\s]+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  const match = showMatch || doorsMatch;
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const min = match[2] || '00';
  const ampm = (match[3] || '').toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

// Normalize age restriction text.
function parseAge(ageText) {
  if (!ageText) return null;
  const t = ageText.toLowerCase().trim();
  if (/all ages?/i.test(t)) return 'All ages';
  const m = t.match(/(\d{1,2})\s*and\s*up/i) || t.match(/(\d{1,2})\+/);
  if (m) return `${m[1]}+`;
  if (/18/i.test(t)) return '18+';
  if (/21/i.test(t)) return '21+';
  return null;
}

async function scrape() {
  const html = await fetchHtml(SOURCE_URL);
  const $ = cheerio.load(html);

  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const cutoffDate = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000);
  const cutoffISO = cutoffDate.toISOString().slice(0, 10);

  const events = [];
  const seen = new Set();

  // Walk the event list. Month separators appear as siblings before event
  // blocks; we track the current month context as we go.
  let currentMonthYear = null;

  // The event list lives inside the Elementor widget. Walk all children of
  // the widget container in DOM order so month separators appear before their
  // events.
  const container = $('.widgetGeneralView');

  container.children().each((_, el) => {
    const $el = $(el);
    const cls = $el.attr('class') || '';

    // Month separator: <span class="rhp-events-list-separator-month ...">
    if ($el.is('span') && cls.includes('rhp-events-list-separator-month')) {
      const text = $el.text().trim(); // e.g. "June 2026"
      const mMatch = text.match(/([A-Za-z]+)\s+(\d{4})/);
      if (mMatch) {
        const monthName = mMatch[1].toLowerCase();
        const month = MONTH_MAP[monthName];
        const year = mMatch[2];
        if (month) currentMonthYear = { month, year };
      }
      return;
    }

    // Event block: <div class="... rhpSingleEvent ...">
    if (!cls.includes('rhpSingleEvent')) return;

    const dateText = clean($el.find('#eventDate').first().text());
    const date = parseEventDate(dateText, currentMonthYear);
    if (!date || date < todayISO || date > cutoffISO) return;

    const $titleLink = $el.find('a#eventTitle').first();
    const title = clean($titleLink.text());
    if (!title) return;

    const url = $titleLink.attr('href') || SOURCE_URL;
    const timeText = clean($el.find('.eventDoorStartDate').first().text());
    const time = parseShowTime(timeText);
    const ageText = clean($el.find('.eventAgeRestriction').first().text());
    const age = parseAge(ageText);

    // Subtitle: subheader if present, otherwise nothing (Amsterdam rarely
    // fills it in the list view)
    const subheaderText = clean($el.find('#evSubHead').first().text());
    const subtitle = subheaderText || null;

    // Thumbnail: rhp renders it when available
    const imgSrc = $el.find('img').first().attr('src') || null;
    const image = imgSrc && imgSrc.startsWith('http') ? imgSrc : null;

    const id = `amsterdam:${date}:${slugify(title)}`;
    if (seen.has(id)) return;
    seen.add(id);

    events.push({
      id,
      date,
      time,
      end_date: null,
      title,
      venue: 'Amsterdam Bar & Hall',
      venue_neighborhood: 'Downtown, Saint Paul',
      city: 'Saint Paul',
      category: 'music',
      subtitle,
      url,
      image,
      price: null,
      age,
      source: 'amsterdam'
    });
  });

  return events;
}

module.exports = { source: 'amsterdam', label: 'Amsterdam Bar & Hall', scrape };
