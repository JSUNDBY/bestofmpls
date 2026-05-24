#!/usr/bin/env node
/**
 * bestofmpls static site generator
 *
 * Reads src/data/*.js and src/styles.css.
 * Writes dist/index.html, dist/{slug}/index.html for each category,
 * dist/about/index.html, dist/sitemap.xml, dist/robots.txt, dist/404.html.
 *
 * Run via: npm run build
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT  = path.resolve(__dirname, '..');
const SRC   = path.join(ROOT, 'src');
const DIST  = path.join(ROOT, 'dist');
const SITE  = 'https://bestofmpls.com';
// Anchor "today" to Central time so the masthead and date-seeded picks
// don't tick forward at 7 PM Central when UTC rolls past midnight.
const TODAY = new Date().toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric',
  timeZone: 'America/Chicago'
});
const TODAY_ISO = (function(){
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date()); // YYYY-MM-DD in Central time
})();

// Custom SVG icons for the twelve zodiac signs. Replaces the Unicode
// astrological glyphs (♈♉♊...) which render as colored emojis on most
// systems. These are simple line-art glyphs that inherit currentColor
// from CSS so they pick up the page's clay accent.
const ZODIAC_SVG = {
  Aries:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v12"/><path d="M5 11C4 7 7 5 9.5 5c1 0 2 .5 2.5 2 .5-1.5 1.5-2 2.5-2 2.5 0 5.5 2 4.5 6"/></svg>',
  Taurus:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="5"/><path d="M5 7c1.5 3 4 4.5 7 3 3 1.5 5.5 0 7-3"/></svg>',
  Gemini:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5h10M7 19h10M9.5 5v14M14.5 5v14"/></svg>',
  Cancer:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="9" r="2" fill="currentColor"/><path d="M10 9c4-1 8 0 9 4"/><circle cx="16" cy="15" r="2" fill="currentColor"/><path d="M14 15c-4 1-8 0-9-4"/></svg>',
  Leo:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="14" r="4"/><path d="M9 10c0-3 2-5 5-5 4 0 6 4 4 8 0 0-1 2-3 1"/></svg>',
  Virgo:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19V8c0-2 1-2 2-2s2 0 2 2v11"/><path d="M9 19V8c0-2 1-2 2-2s2 0 2 2v11"/><path d="M13 8c0-2 1-2 2-2s2 0 2 2v8c0 4 4 4 4 0"/></svg>',
  Libra:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16"/><path d="M4 14h6c0-3 1-5 2-5s2 2 2 5h6"/></svg>',
  Scorpio:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19V8c0-2 1-2 2-2s2 0 2 2v11"/><path d="M7 19V8c0-2 1-2 2-2s2 0 2 2v11"/><path d="M11 8c0-2 1-2 2-2s2 0 2 2v6c0 3 2 4 4 4l-2-2m2 2l-2 2"/></svg>',
  Sagittarius: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5"/><path d="M19 11V5h-6"/><path d="M9 13l4 4M11 11h4v4"/></svg>',
  Capricorn:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8l5 11 4-12 3 12c0 0 1-3 3-3s4 1 4 4-3 4-5 2"/></svg>',
  Aquarius:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l3-2 3 2 3-2 3 2 3-2 3 2"/><path d="M3 16l3-2 3 2 3-2 3 2 3-2 3 2"/></svg>',
  Pisces:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5C3 8 3 16 6 19"/><path d="M18 5c3 3 3 11 0 14"/><path d="M5 12h14"/></svg>'
};
function zodiacSvg(name) { return ZODIAC_SVG[name] || ''; }

// Cloudflare Worker that accepts reader poll submissions. Set this once the
// worker is deployed (see worker/README.md). When empty, the form renders
// in a safe "coming soon" state instead of trying to submit.
const POLL_WORKER_URL = 'https://bestofmpls-poll.j-sundby.workers.dev';

// OpenTable affiliate ref. Once approved through OpenTable's Impact
// (impact.com) affiliate program, set this to your unique ref ID. Every
// entry with `reservation:` pointing at opentable.com gets the ?ref=
// param appended at build time. Empty = no tracking, links still work.
// Resy/Tock have no public affiliate program — those URLs pass through
// untouched.
const OPENTABLE_AFFILIATE_REF = '';
function reservationUrl(url) {
  if (!url) return url;
  if (!/opentable\.com/i.test(url)) return url;
  if (!OPENTABLE_AFFILIATE_REF) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}ref=${encodeURIComponent(OPENTABLE_AFFILIATE_REF)}`;
}
function reservationPlatform(url) {
  if (!url) return null;
  if (/opentable\.com/i.test(url)) return 'OpenTable';
  if (/resy\.com/i.test(url)) return 'Resy';
  if (/exploretock|\btock\.com/i.test(url)) return 'Tock';
  if (/yelp\.com.*reservations/i.test(url)) return 'Yelp';
  return 'Book a table';
}
// Warm season runs April through September. Cold-flavored content (snow-day,
// big-cold-night mystery, etc.) is hidden during these months and quietly
// returns each October.
const CURRENT_MONTH = parseInt(TODAY_ISO.slice(5, 7), 10);
const IS_WARM_SEASON = CURRENT_MONTH >= 4 && CURRENT_MONTH <= 9;

// One-line editorial pull-quote for the homepage interruption block. Picks
// from weather mood first (patio / brutal / snow / rain), then falls back
// to a month-aware seasonal line. The line changes the page's emotional
// register without re-doing the layout — one moment of editorial voice
// between the data strip and the tools grid.
function seasonalLine(rn) {
  if (rn && rn.weather) {
    const m = rn.weather.mood;
    if (m === 'patio')  return 'The patios are open. The light stays past eight. The metro is outside this week.';
    if (m === 'brutal') return 'Outside is short. Inside is long. The slow rooms know what to do with a day like this.';
    if (m === 'snow')   return 'Snow on the ground. Warm rooms, hot dishes, slow drinks. Nowhere to be.';
    if (m === 'rain')   return 'Steady rain in the forecast. The candle-lit tables and basement bars open early tonight.';
  }
  const mo = CURRENT_MONTH;
  if (mo === 5 || mo === 6)  return 'Late spring. The river is moving again. The patios are filling at four.';
  if (mo === 7 || mo === 8)  return 'Midsummer in the metro. The patios spill onto sidewalks. The State Fair is closer than you think.';
  if (mo === 9)              return 'September. Sweater weather creeps in. The patios start to fold by the end of the month.';
  if (mo === 10)             return 'October. The light goes early. The good interior rooms wake back up.';
  if (mo === 11 || mo === 12) return 'Cold, quiet months. The slow rooms are the move. The metro becomes interior.';
  if (mo === 1 || mo === 2)  return 'Deep winter. Short days, long nights, warm rooms. The metro knows how to do this.';
  if (mo === 3 || mo === 4)  return 'Mud season, then thaw. The light comes back. The metro starts to remember itself.';
  return 'Two cities, a river, four real seasons. Made for the metro by the people who live here.';
}

// TONIGHT concierge — the emotional center of the homepage. Per MANIFESTO,
// the site should answer "what should I do tonight?" before it indexes
// anything. Returns 3-5 short, opinionated one-liners with destinations,
// composed from real-time data (weather mood, tonight's scraped events,
// active neighborhoods) and editorial fallbacks.
//
// Each pick is { kind, line, href? } — the "line" reads as a sentence
// from a friend, not a card title. The block sits right under the
// right-now panel and dominates the upper half of the cover.
function tonightConcierge(rn, eventsAll) {
  const picks = [];
  const today = (rn && rn.today) || TODAY_ISO;
  const events = dedupeNonFilms((eventsAll || []).filter(e => !isFilmEvent(e) && e.date === today));
  const mood = rn && rn.weather ? rn.weather.mood : null;
  const tempMax = rn && rn.weather ? rn.weather.temp_max : null;

  // 1) Weather-driven opener — sets the emotional register.
  if (mood === 'patio' || (tempMax && tempMax >= 65)) {
    picks.push({
      kind: 'WEATHER',
      line: `Patios are open${tempMax ? ` and it is ${tempMax}°F` : ''}. Start with Bauhaus, Indeed, or Sociable Cider in Northeast — all walkable, all outside.`,
      href: '/best-patios/'
    });
  } else if (mood === 'brutal') {
    picks.push({
      kind: 'WEATHER',
      line: `It is cold enough to stay close to home. The slow rooms — Marvel-era cocktail dens, candle-lit dining rooms, warm bakeries — are doing their best work.`,
      href: '/take-them-to/#snow-day'
    });
  } else if (mood === 'snow') {
    picks.push({
      kind: 'WEATHER',
      line: `Snow on the ground. The warm rooms, hot dishes, and slow drinks are the move. Nowhere to be.`,
      href: '/take-them-to/#snow-day'
    });
  } else if (mood === 'rain') {
    picks.push({
      kind: 'WEATHER',
      line: `Steady rain in the forecast. Candle-lit tables, basement bars, second-run cinemas — early dinners that turn into long nights.`,
      href: '/take-them-to/#rainy-night'
    });
  } else {
    picks.push({
      kind: 'WEATHER',
      line: `A regular night in the metro. The good interior rooms are open and the neighborhoods are quiet enough to walk.`,
      href: '/take-them-to/'
    });
  }

  // 2) Anchor event tonight — pick the most editorially interesting.
  // Heuristic: prefer events with time set, prefer non-Walker (because
  // Walker tends to be the obvious choice; we want to surface variety).
  if (events.length > 0) {
    const ranked = events.slice().sort((a, b) => {
      // Time present > time absent
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      return 0;
    });
    const featured = ranked[0];
    const t = featured.time ? (function(){
      const [h, m] = featured.time.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = h % 12 === 0 ? 12 : h % 12;
      return `${hr}:${String(m).padStart(2,'0')} ${ampm}`;
    })() : 'tonight';
    picks.push({
      kind: 'SHOW',
      line: `${featured.title} at ${featured.venue}${featured.venue_neighborhood ? ` (${featured.venue_neighborhood.split(',')[0]})` : ''}, ${t}.`,
      href: featured.url || '/tonight/'
    });
  }

  // 3) Where the city is alive tonight — neighborhood density signal.
  if (events.length >= 3) {
    const byNeigh = {};
    for (const e of events) {
      if (!e.venue_neighborhood) continue;
      const n = e.venue_neighborhood.split(',')[0].trim();
      byNeigh[n] = (byNeigh[n] || 0) + 1;
    }
    const sorted = Object.entries(byNeigh).sort((a, b) => b[1] - a[1]);
    if (sorted.length && sorted[0][1] >= 2) {
      const [neigh, count] = sorted[0];
      picks.push({
        kind: 'WHERE',
        line: `${neigh} is the most active neighborhood tonight — ${count} ${count === 1 ? 'show' : 'shows'} in walking distance of each other.`,
        href: '/calendar/'
      });
    }
  }

  // 4) Quiet-confidence fallback — always present.
  const dow = (function(){
    const [y, m, d] = today.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  })();
  if (dow === 5 || dow === 6) {
    picks.push({
      kind: 'FALLBACK',
      line: `If you want a long table and a clear head tomorrow, the early-evening bar seats at Spoon and Stable, Bar La Grassa, and Hai Hai are the move.`,
      href: '/best-happy-hours/'
    });
  } else if (dow === 0) {
    picks.push({
      kind: 'FALLBACK',
      line: `Sunday in the metro is for slow brunch, a long walk along the river, and the kind of dinner that happens at home. The good bakeries open at seven.`,
      href: '/pastries-and-bakeries/'
    });
  } else {
    picks.push({
      kind: 'FALLBACK',
      line: `A weeknight here rewards the regulars. A bar seat at a kitchen you trust beats a reservation you had to chase. Take Them To has the situational picks.`,
      href: '/take-them-to/'
    });
  }

  return picks.slice(0, 4);
}

// City-state badges for the right-now panel. Returns 2-4 short ALL-CAPS
// tags that describe what kind of day this is in the metro right now:
// PATIO SEASON, LATE SUNSET, BASEBALL HOMESTAND, FAIR WEEK, etc.
// Reads as the city's current operational status, not a feature list.
function cityStateBadges(rn) {
  const out = [];
  const mo = CURRENT_MONTH;
  const day = parseInt(TODAY_ISO.slice(8, 10), 10);

  // Weather mood
  if (rn && rn.weather) {
    if (rn.weather.is_patio)    out.push('PATIO WEATHER');
    else if (rn.weather.is_brutal) out.push('STAY-IN COLD');
    else if (rn.weather.is_snowing) out.push('SNOW DAY');
    else if (rn.weather.is_rainy)   out.push('RAINY NIGHT');
  }

  // Daylight
  if (rn && rn.sun && rn.sun.daylight_min) {
    if (rn.sun.daylight_min > 870) out.push('LATE SUNSET');
    else if (rn.sun.daylight_min < 570) out.push('SHORT DAYS');
  }

  // Season
  if (mo === 5 || mo === 6) out.push('PATIO SEASON');
  if (mo === 7 || mo === 8) out.push('MIDSUMMER');
  if (mo === 9) out.push('LATE SUMMER');
  if (mo === 10) out.push('PEAK COLOR');
  if (mo === 11 || mo === 12 || mo === 1 || mo === 2) out.push('WINTER');
  if (mo === 3 || mo === 4) out.push('THAW SEASON');

  // Baseball — Twins typically play April through September
  if (mo >= 4 && mo <= 9) out.push('TWINS SEASON');

  // State Fair — last 12 days of August into Labor Day
  if (mo === 8 && day >= 21) out.push('FAIR WEEK');
  if (mo === 9 && day <= 4)  out.push('FAIR WEEK');

  // Holiday-adjacent civic moments
  if (mo === 5 && day >= 12 && day <= 18) out.push('ART-A-WHIRL WEEK');
  if (mo === 7 && day >= 14 && day <= 24) out.push('AQUATENNIAL');

  // Dedupe and cap at 4
  return [...new Set(out)].slice(0, 4);
}

// Featured events — single-event homepage takeover + dedicated landing page.
const featuredEvts = require(path.join(SRC, 'data/featured-events.js'));

// Calendar dedup helpers.
//
// The scraped events list contains one entry per showtime, so a film with
// four daily showtimes that runs for ten days shows up forty times. That
// floods the calendar and makes it look like nothing is playing except one
// movie. The dedup splits films into a "Now Playing" rail (one row per
// film+venue with a date range) and leaves the date-by-date stream for the
// time-bound stuff (concerts, talks, openings).
function isFilmEvent(e) { return e.category === 'film'; }

function collapseFilms(events) {
  // Returns { films: [{title, venue, venue_neighborhood, url, image, first_date,
  // last_date, day_count}], nonFilms: [...] }.
  const films = events.filter(isFilmEvent);
  const nonFilms = events.filter(e => !isFilmEvent(e));
  const byFilm = new Map();
  for (const f of films) {
    const key = `${f.title}::${f.venue}`;
    if (!byFilm.has(key)) {
      byFilm.set(key, {
        title: f.title, venue: f.venue,
        venue_neighborhood: f.venue_neighborhood,
        url: f.url, image: f.image, source: f.source,
        first_date: f.date, last_date: f.date,
        dates: new Set([f.date])
      });
    } else {
      const g = byFilm.get(key);
      if (f.date < g.first_date) g.first_date = f.date;
      if (f.date > g.last_date) g.last_date = f.date;
      g.dates.add(f.date);
    }
  }
  const filmRows = [...byFilm.values()].map(g => ({
    ...g, day_count: g.dates.size, dates: undefined
  })).sort((a, b) => a.first_date.localeCompare(b.first_date));
  return { films: filmRows, nonFilms };
}

// Dedup non-film events too: a concert occasionally has two showtimes
// listed the same night, and we don't need to render both. Keys on
// (title, venue, date) and keeps the earliest time.
function dedupeNonFilms(events) {
  const seen = new Map();
  for (const e of events) {
    const key = `${e.title}::${e.venue}::${e.date}`;
    const existing = seen.get(key);
    if (!existing || (e.time && (!existing.time || e.time < existing.time))) {
      seen.set(key, e);
    }
  }
  return [...seen.values()];
}

// Collapse multi-night runs of the same (title, venue) into a single entry
// with a date range, anchored to the first night. Solves "Rosy Simas appears
// four times this week on every page" — a dance piece that runs Wed→Sat is
// one thing, not four. Used by the homepage live picks and the per-venue
// pages; the main /calendar/ date stream keeps per-night rows so a reader
// scanning a specific day still sees what's on that day.
function collapseRuns(events) {
  const sorted = [...events].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const byKey = new Map();
  for (const e of sorted) {
    const key = `${e.title}::${e.venue}`;
    if (!byKey.has(key)) {
      byKey.set(key, { ...e, run_start: e.date, run_end: e.date, run_dates: [e.date] });
    } else {
      const g = byKey.get(key);
      if (e.date > g.run_end) g.run_end = e.date;
      if (e.date < g.run_start) g.run_start = e.date;
      if (!g.run_dates.includes(e.date)) g.run_dates.push(e.date);
    }
  }
  return [...byKey.values()].sort((a, b) => (a.run_start + (a.time || '')).localeCompare(b.run_start + (b.time || '')));
}

// Currently active featured event — the first one whose run-up window starts
// before today and whose `ends` is on or after today. Null when nothing is
// inside its window, which means the homepage banner just doesn't render.
function resolveActiveFeaturedEvent() {
  const list = (featuredEvts && featuredEvts.events) || [];
  const today = TODAY_ISO;
  // Subtract window_before_days from `starts` to get the window-open date.
  function shiftIso(iso, days) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
  }
  for (const ev of list) {
    const openAt = shiftIso(ev.starts, -(ev.window_before_days || 7));
    if (today >= openAt && today <= ev.ends) return ev;
  }
  return null;
}
const ACTIVE_FEATURE = resolveActiveFeaturedEvent();

// Days-until label for the active feature ("Tomorrow", "In 2 days", "Today",
// "Happening now", "Final day"). Returns a plain string.
function featureDaysLabel(ev) {
  if (!ev) return '';
  const today = TODAY_ISO;
  if (today >= ev.starts && today <= ev.ends) {
    if (today === ev.ends) return 'Final day';
    if (today === ev.starts) return 'Opens today';
    return 'Happening now';
  }
  // Days until starts.
  const [sy, sm, sd] = ev.starts.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const a = Date.UTC(sy, sm - 1, sd);
  const b = Date.UTC(ty, tm - 1, td);
  const days = Math.round((a - b) / 86400000);
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

// ---------- Load all category data ----------
const museums      = require(path.join(SRC, 'data/museums.js'));
const liveMusic    = require(path.join(SRC, 'data/live-music.js'));
const theaters     = require(path.join(SRC, 'data/theaters.js'));
const coffee       = require(path.join(SRC, 'data/coffee.js'));
const sandwiches   = require(path.join(SRC, 'data/sandwiches.js'));
const pizza        = require(path.join(SRC, 'data/pizza.js'));
const brunch       = require(path.join(SRC, 'data/brunch.js'));
const diveBars     = require(path.join(SRC, 'data/dive-bars.js'));
const patios       = require(path.join(SRC, 'data/patios.js'));
const happyHours   = require(path.join(SRC, 'data/happy-hours.js'));
const mexican      = require(path.join(SRC, 'data/mexican.js'));
const bakeries     = require(path.join(SRC, 'data/bakeries.js'));
const hmong        = require(path.join(SRC, 'data/hmong.js'));
const ethiopian    = require(path.join(SRC, 'data/ethiopian.js'));
const indian       = require(path.join(SRC, 'data/indian.js'));
const thai         = require(path.join(SRC, 'data/thai.js'));
const chinese      = require(path.join(SRC, 'data/chinese.js'));
const sports       = require(path.join(SRC, 'data/sports.js'));
const curiosities  = require(path.join(SRC, 'data/curiosities.js'));
const burgers      = require(path.join(SRC, 'data/burgers.js'));
const cocktailBars = require(path.join(SRC, 'data/cocktail-bars.js'));
const breweries    = require(path.join(SRC, 'data/breweries.js'));
const cinemas      = require(path.join(SRC, 'data/cinemas.js'));
const lgbtq        = require(path.join(SRC, 'data/lgbtq.js'));
const wellness     = require(path.join(SRC, 'data/wellness.js'));
const dispensaries = require(path.join(SRC, 'data/dispensaries.js'));
const restaurants  = require(path.join(SRC, 'data/restaurants.js'));
const foodHalls    = require(path.join(SRC, 'data/food-halls.js'));
const vietnamese   = require(path.join(SRC, 'data/vietnamese.js'));
const korean       = require(path.join(SRC, 'data/korean.js'));
const japanese     = require(path.join(SRC, 'data/japanese.js'));
const iceCream     = require(path.join(SRC, 'data/ice-cream.js'));
const lateNight    = require(path.join(SRC, 'data/late-night.js'));
const itineraries  = require(path.join(SRC, 'data/itineraries.js'));
const exhibitions  = require(path.join(SRC, 'data/exhibitions.js'));

// Scraped events + daily horoscope. Both are generated by separate scripts
// (scripts/scrape-events.js and scripts/build-horoscope.js) and treated as
// optional — if absent or stale, the build still succeeds with empty data.
function loadJsonOptional(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (_) { return null; }
}
const eventsData    = loadJsonOptional(path.join(SRC, 'data/events.json')) || { generated_at: null, sources: [], events: [] };
const horoscopeData = loadJsonOptional(path.join(SRC, 'data/horoscope.json')) || { date: null, intro: '', horoscopes: [] };
const todayData     = loadJsonOptional(path.join(SRC, 'data/today.json')) || null;
const coordsData    = loadJsonOptional(path.join(SRC, 'data/coords.json')) || {};
const rightnowData  = loadJsonOptional(path.join(SRC, 'data/rightnow.json')) || null;
const hoursData     = loadJsonOptional(path.join(SRC, 'data/hours.json')) || {};

// Resolve the best lat/lng for an entry. Preference order:
//   1. Google Places location from hours.json (precise — pinned to the
//      actual storefront)
//   2. Nominatim geocode in coords.json, but only if the entry has a real
//      street address (digit somewhere). Neighborhood-only addresses like
//      "Northeast Minneapolis" geocode to a centroid that ends up shared
//      with every other entry that lazy-addressed the same neighborhood,
//      so we refuse to plot those.
//   3. null — entry will not appear on the map. Better than a wrong pin.
function lookupCoords(slug, entry) {
  const hLook = hoursData[`${slug}:${entry.name}`];
  const placesCoord = (hLook && hLook.location && typeof hLook.location.latitude === 'number')
    ? { lat: hLook.location.latitude, lng: hLook.location.longitude }
    : null;

  // Nominatim coord for the entry's address (only if it has a digit, so
  // we are not geocoding a neighborhood centroid).
  let nominatimCoord = null;
  if (entry.address && /\d/.test(entry.address)) {
    const c = coordsData[entry.address.trim()];
    if (c && typeof c.lat === 'number') nominatimCoord = { lat: c.lat, lng: c.lng };
  }

  // When both exist and they disagree by more than 1.5mi, trust the
  // address-based Nominatim coord. We wrote the address; Places sometimes
  // matches a chain's other location or a same-named storefront elsewhere.
  if (placesCoord && nominatimCoord) {
    const R = 3958.8, toR = d => d * Math.PI / 180;
    const dLat = toR(nominatimCoord.lat - placesCoord.lat);
    const dLng = toR(nominatimCoord.lng - placesCoord.lng);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toR(placesCoord.lat)) * Math.cos(toR(nominatimCoord.lat)) *
              Math.sin(dLng/2)**2;
    const dist = 2 * R * Math.asin(Math.sqrt(a));
    if (dist > 1.5) {
      return { ...nominatimCoord, source: 'nominatim-override' };
    }
  }

  if (placesCoord) return { ...placesCoord, source: 'places' };
  if (nominatimCoord) return { ...nominatimCoord, source: 'nominatim' };
  return null;
}
const shops        = require(path.join(SRC, 'data/shops.js'));
const mensClothing = require(path.join(SRC, 'data/mens-clothing.js'));
const womensClothing = require(path.join(SRC, 'data/womens-clothing.js'));
const hotels       = require(path.join(SRC, 'data/hotels.js'));
const outdoors     = require(path.join(SRC, 'data/outdoors.js'));
const hiddenGems   = require(path.join(SRC, 'data/hidden-gems.js'));
const festivals    = require(path.join(SRC, 'data/festivals.js'));
const closures     = require(path.join(SRC, 'data/closures.js'));
const situations   = require(path.join(SRC, 'data/situations.js'));
const skyway       = require(path.join(SRC, 'data/skyway.js'));
const history      = require(path.join(SRC, 'data/history.js'));
const mystery      = require(path.join(SRC, 'data/mystery.js'));

// Editorial clusters drive the homepage layout. With 28 categories, the
// homepage now reads like a real city magazine: Culture, Eat, Drink, Shop,
// Stay & Do, plus the dark calendar feature for Festivals.
const clusters = [
  {
    eyebrow: 'See & Experience',
    title: 'Culture',
    deck: 'The institutions, stages, screens, and rooms that make this a city worth living in.',
    categories: [museums, liveMusic, theaters, cinemas, lgbtq, sports]
  },
  {
    eyebrow: 'Eat',
    title: 'Where to eat',
    deck: 'A real food town in fifteen directions at once. Restaurants worth a reservation, sushi, banh mi, tacos, sandwiches, late-night slices, ice cream by the lake, and the burger Minneapolis invented.',
    categories: [restaurants, foodHalls, coffee, bakeries, sandwiches, burgers, pizza, brunch, mexican, vietnamese, korean, japanese, hmong, ethiopian, indian, thai, chinese, iceCream, lateNight]
  },
  {
    eyebrow: 'Drink',
    title: 'Where to drink',
    deck: 'Cocktail bars, breweries, neighborhood bars, summer patios, and the happy hours we plan around.',
    categories: [cocktailBars, breweries, diveBars, patios, happyHours]
  },
  {
    eyebrow: 'Shop',
    title: 'Where to spend money',
    deck: 'The independent shops where the buying has a point of view and the people who run them are usually behind the counter.',
    categories: [shops, mensClothing, womensClothing, dispensaries]
  },
  {
    eyebrow: 'Stay & Do',
    title: 'For visitors',
    deck: 'Where to sleep, what to do with a day, and the places people who live here take guests when they arrive.',
    categories: [hotels, outdoors, wellness, hiddenGems, curiosities]
  }
];

const categories = [
  // Culture
  museums, liveMusic, theaters, cinemas, lgbtq, sports,
  // Eat
  restaurants, foodHalls, coffee, bakeries, sandwiches, burgers, pizza, brunch,
  mexican, vietnamese, korean, japanese, hmong, ethiopian, indian, thai, chinese, iceCream, lateNight,
  // Drink
  cocktailBars, breweries, diveBars, patios, happyHours,
  // Shop
  shops, mensClothing, womensClothing, dispensaries,
  // Stay & Do
  hotels, outdoors, wellness, hiddenGems, curiosities,
  // Calendar
  festivals
];

// ---------- Helpers ----------
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Convert an entry name into a URL-safe slug. Handles accents (Khâluna),
// apostrophes (Cossetta's), ampersands (Hen & Hatchet), etc.
// Neighborhood code system — the signature repeatable graphic behavior.
// Every neighborhood string ("Northeast Minneapolis", "Cathedral Hill,
// St. Paul") collapses to a short transit-station-style code rendered in
// Plex Mono. NE for Northeast, NL for North Loop, STP for downtown St Paul,
// etc. Shown alongside the full neighborhood name everywhere a place is
// listed — entries, calendar rows, venue pages, this-weekend. Becomes the
// civic visual signature the way Søhne lockups are for the NYT.
const NEIGHBORHOOD_CODES = {
  // Minneapolis
  'Northeast Minneapolis':          'NE',
  'North Loop, Minneapolis':        'NL',
  'Downtown Minneapolis':           'DT',
  'Downtown East, Minneapolis':     'DTE',
  'Warehouse District, Minneapolis':'WD',
  'Mill District, Minneapolis':     'ML',
  'Lowry Hill, Minneapolis':        'LH',
  'Uptown, Minneapolis':            'UP',
  'Lyn-Lake, Minneapolis':          'LL',
  'Whittier, Minneapolis':          'WH',
  'Eat Street, Minneapolis':        'ES',
  'Kingfield, Minneapolis':         'KF',
  'Powderhorn, Minneapolis':        'PW',
  'Phillips, Minneapolis':          'PH',
  'Seward, Minneapolis':            'SW',
  'Longfellow, Minneapolis':        'LF',
  'West Bank, Minneapolis':         'WB',
  'Cedar-Riverside, Minneapolis':   'CR',
  'Como, Minneapolis':              'CO',
  'Bryn Mawr, Minneapolis':         'BM',
  'Holland, Northeast Minneapolis': 'NE',
  'Southwest Minneapolis':          'SWM',
  'South Minneapolis':              'SM',
  // Saint Paul
  'Downtown St. Paul':              'STP',
  'Lowertown, St. Paul':            'LT',
  'Cathedral Hill, St. Paul':       'CH',
  'Summit Avenue, St. Paul':        'SA',
  'West End, St. Paul':             'WE',
  'West Side, St. Paul':            'WS',
  'Highland, St. Paul':             'HG',
  'Hamline-Midway, St. Paul':       'MW',
  'Midway, St. Paul':               'MW',
  'Macalester-Groveland, St. Paul': 'MG',
  "Dayton's Bluff, St. Paul":       'DB',
  'Como, St. Paul':                 'COS',
  'Capitol Hill, St. Paul':         'CAP',
  // Suburbs / outliers
  'Eagan':                          'EGN',
  'Bloomington':                    'BMG',
  'Excelsior':                      'EXC',
  'St. Louis Park':                 'SLP',
  'Edina':                          'EDN',
  'Hopkins':                        'HOP',
  'Northeast Minneapolis Arts Association': 'NE',
  'University of Minnesota campus': 'UMN',
  'Stadium Village, Minneapolis':   'SV',
  'Como, St. Paul (zoo)':           'COS',
  'Twin Cities':                    'TC',
  'Northeast Minneapolis':          'NE',
  'Northrup King Building, NE Minneapolis': 'NE'
};
function neighborhoodCode(neigh) {
  if (!neigh) return null;
  // Direct hit
  if (NEIGHBORHOOD_CODES[neigh]) return NEIGHBORHOOD_CODES[neigh];
  // Fallback: try to match on the leading segment before any comma.
  const lead = neigh.split(',')[0].trim();
  for (const [key, code] of Object.entries(NEIGHBORHOOD_CODES)) {
    if (key.startsWith(lead) || lead === key.split(',')[0].trim()) return code;
  }
  // Last-resort: first two letters of the first significant word.
  const word = lead.replace(/^(the|a|an)\s+/i, '');
  return word.slice(0, 2).toUpperCase();
}
function nhoodTag(neigh) {
  if (!neigh) return '';
  const code = neighborhoodCode(neigh);
  if (!code) return '';
  return `<span class="nhood-tag" title="${esc(neigh)}"><span class="nhood-tag-code">${esc(code)}</span><span class="nhood-tag-name">${esc(neigh)}</span></span>`;
}

function entrySlug(name) {
  return String(name || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')   // strip accents
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ---------- Neighborhood normalization ----------
// Free-text neighborhood strings on entries get normalized to a canonical slug.
// Each canonical neighborhood becomes a /neighborhoods/{slug}/ aggregator page
// pulling every entry across all categories that lives there.
const NEIGHBORHOODS = [
  { slug: 'northeast-minneapolis', name: 'Northeast Minneapolis', short: 'Northeast', match: /(northeast|^ne |northrup king|columbia heights|st\.? anthony main|riverfront, northeast|mississippi riverfront)/i, intro: 'Old breweries turned taprooms, working artist studios, the densest concentration of independent restaurants and music venues in the metro. The most-talked-about Twin Cities neighborhood of the last decade and the easiest to spend a whole weekend in.' },
  { slug: 'north-loop', name: 'North Loop, Minneapolis', short: 'North Loop', match: /(north loop|warehouse district|mill district)/i, intro: 'Warehouse-conversion restaurants, the city\'s densest run of designer-menswear shops, two destination breweries, and a riverfront that connects to the Stone Arch Bridge. The polished face of downtown Minneapolis.' },
  { slug: 'downtown-minneapolis', name: 'Downtown Minneapolis', short: 'Downtown Mpls', match: /(downtown minneapolis|hennepin theatre|loring park|nicollet mall|lyn-lake)/i, intro: 'Hennepin Avenue theaters, the Foshay, the IDS Center, the Walker just to the west. A downtown still finding its shape, with some of the best music venues and hotels in the metro.' },
  { slug: 'uptown-lyn-lake', name: 'Uptown & Lyn-Lake', short: 'Uptown / Lyn-Lake', match: /(lyn-lake|uptown|kingfield)/i, intro: 'The CC Club, Bryant Lake Bowl, Mortimer\'s, Khâluna, and a stretch of Lyndale Avenue that still anchors a lot of Minneapolis nightlife. Less polished than it was, more interesting in some ways.' },
  { slug: 'whittier-eat-street', name: 'Whittier & Eat Street', short: 'Eat Street / Whittier', match: /(whittier|eat street|nicollet ave)/i, intro: 'The corridor of Nicollet Avenue south of downtown known as Eat Street, dense with restaurants from a dozen cuisines, plus the Black Forest Inn, the new Eat Street Crossing food hall, and Luna & The Bear.' },
  { slug: 'linden-hills', name: 'Linden Hills, Minneapolis', short: 'Linden Hills', match: /(linden hills|armatage|field, minneapolis)/i, intro: 'A Southwest Minneapolis neighborhood with a tight Main-Street feel: Wild Rumpus, Birchbark Books, Sebastian Joe\'s, Saint Genevieve, Tilia, Martina. Walk the whole thing in 20 minutes and find a reason to come back.' },
  { slug: 'south-minneapolis', name: 'South Minneapolis', short: 'South Mpls', match: /(longfellow|seward|powderhorn|standish|south minneapolis|cedar avenue, minneapolis|lake street, minneapolis)/i, intro: 'Lake Street, Powderhorn Park, the Mississippi gorge, the Juicy Lucy origin bars on Cedar. The neighborhoods that cover the largest and most diverse stretch of the city.' },
  { slug: 'southwest-minneapolis', name: 'Southwest Minneapolis', short: 'Southwest Mpls', match: /(bde maka ska|lake harriet|kenwood|southwest minneapolis)/i, intro: 'The Chain of Lakes neighborhoods. Bde Maka Ska, Lake of the Isles, Lake Harriet. Beach, bike paths, the Como-Harriet Streetcar, and one of the best Saturday-afternoon walks in any American city.' },
  { slug: 'downtown-st-paul', name: 'Downtown St. Paul', short: 'Downtown St. Paul', match: /(downtown st\.? paul|lowertown|landmark center)/i, intro: 'Lowertown\'s warehouse district, the Saint Paul Hotel, Mickey\'s Diner, Mears Park, the Palace Theatre. A downtown that still feels lived-in.' },
  { slug: 'cathedral-hill', name: 'Cathedral Hill, St. Paul', short: 'Cathedral Hill', match: /(cathedral hill)/i, intro: 'The St. Paul neighborhood under the cathedral. Idun, Hyacinth, Nina\'s Coffee Cafe, all on Selby and Western. A favorite if you want to feel like you took a small vacation without leaving the metro.' },
  { slug: 'west-seventh', name: 'West Seventh, St. Paul', short: 'West Seventh', match: /(west seventh|west 7th|w 7th|west end, st\.? paul|west end)/i, intro: 'St. Paul\'s long West Seventh corridor. Cossetta\'s, Cafe Astoria, Mucci\'s, plus the historic Schmidt Brewery complex.' },
  { slug: 'macalester-groveland', name: 'Macalester-Groveland & Highland, St. Paul', short: 'Mac-Groveland', match: /(macalester|highland park|grand avenue|grand ave|randolph)/i, intro: 'St. Paul\'s walkable south-of-Summit neighborhoods. The Nook, Quixotic Coffee, Boludo, and the kind of streets that make people seriously consider moving across the river.' },
  { slug: 'como-st-paul', name: 'Como & Midway, St. Paul', short: 'Como / Midway', match: /(como, st\.? paul|como park|midway, st\.? paul|hamline|snelling avenue|university avenue, st\.? paul|vandalia)/i, intro: 'A long stretch of St. Paul running from the Como Conservatory through the Midway. Fasika Ethiopian, the Turf Club, the Half Time Rec, Ax-Man Surplus, Lake Monster Brewing.' },
  { slug: 'west-side-st-paul', name: 'West Side, St. Paul', short: 'West Side', match: /(west side, st\.? paul|west side$)/i, intro: 'The St. Paul Latino-anchored neighborhood across the river from downtown. El Burrito Mercado, Boca Chica, Panaderia La Nopalera. The most tightly-knit immigrant-built neighborhood in either city.' },
  { slug: 'st-paul-other', name: 'St. Paul (other neighborhoods)', short: 'St. Paul', match: /(st\.? paul|saint paul|payne|east side)/i, intro: 'The rest of St. Paul, including the East Side, Payne-Phalen, and other neighborhoods that did not slot neatly elsewhere on this site.' },
  { slug: 'west-metro', name: 'West Metro (Edina, Wayzata, Excelsior)', short: 'West Metro', match: /(edina|wayzata|excelsior|spring park|minnetonka|st\.? louis park|robbinsdale|hopkins|brooklyn park|eden prairie|plymouth)/i, intro: 'The west-metro suburbs ringing Lake Minnetonka. Cumin, Hello Pizza, the Hotel Landing, Bawarchi Biryanis. Worth the drive when you want a different pace.' }
];

function normalizeNeighborhood(n) {
  if (!n) return null;
  const s = String(n).toLowerCase();
  for (const nb of NEIGHBORHOODS) {
    if (nb.match.test(s)) return nb.slug;
  }
  return null;
}

// Build a neighborhood → entries map after categories are loaded.
function buildNeighborhoodIndex() {
  const index = {};
  for (const nb of NEIGHBORHOODS) index[nb.slug] = { ...nb, entries: [] };
  for (const c of categories) {
    if (c.layout === 'seasonal') continue; // skip festivals
    for (const e of c.entries) {
      const slug = normalizeNeighborhood(e.neighborhood);
      if (slug && index[slug]) index[slug].entries.push({ category: c, entry: e });
    }
  }
  // Sort by entry count desc so the densest neighborhoods lead the index page
  return Object.values(index)
    .filter(nb => nb.entries.length > 0)
    .sort((a, b) => b.entries.length - a.entries.length);
}

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const writeFile = (rel, content) => {
  const out = path.join(DIST, rel);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, content);
  console.log(`  → ${rel}`);
};

// ---------- Components ----------
function head({ title, description, slug, theme }) {
  const url = `${SITE}/${slug || ''}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · bestofmpls</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">

<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)} · bestofmpls">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="bestofmpls">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="bestofmpls. An independent guide to Minneapolis & Saint Paul.">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} · bestofmpls">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/og-image.png">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&family=Source+Sans+3:wght@400;600&family=Archivo:wght@500;600;700&family=Archivo+Narrow:wght@600;700&display=swap">
<link rel="stylesheet" href="/style.css?v=34">
<script>
// Set color mode before paint to avoid flash. Reads localStorage first,
// falls back to light mode (the new editorial default). mode-ready class
// added after first frame so smooth transition only kicks in for user toggles.
(function(){
  var stored = localStorage.getItem('bom-mode');
  var mode = stored || 'light';
  document.documentElement.setAttribute('data-mode', mode);
  requestAnimationFrame(function(){
    document.documentElement.classList.add('mode-ready');
  });
})();
</script>

<!-- Google Analytics 4 (GA4) — bestofmpls.com property G-K6JECLPV8W -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-K6JECLPV8W"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-K6JECLPV8W');
</script>
</head>
<body${theme ? ` data-theme="${theme}"` : ''}>`;
}

function header({ activeSlug } = {}) {
  // Primary nav — seven obvious items. Per MANIFESTO: do not reinvent
  // navigation. Tonight first (that's the question most readers arrive
  // with), then the broad collections, then the tools. Everything else
  // lives in the Menu overlay (data-menu-open). Same overlay is reused
  // for the mobile hamburger.
  const primaryNav = [
    { href: '/tonight/',     label: 'Tonight',       slug: 'tonight' },
    { href: '/#eat',         label: 'Eat',           slug: 'eat' },
    { href: '/#drink',       label: 'Drink',         slug: 'drink' },
    { href: '/live-music/',  label: 'Music',         slug: 'live-music' },
    { href: '/neighborhoods/', label: 'Neighborhoods', slug: 'neighborhoods' },
    { href: '/calendar/',    label: 'Calendar',      slug: 'calendar' },
    { href: '/map/',         label: 'Map',           slug: 'map' }
  ];

  // Menu overlay groups. Cluster names mirror the homepage IA so the
  // overlay reads as a real table of contents.
  const menuGroups = [
    {
      label: 'Right Now',
      items: [
        { href: '/tonight/',   label: 'Tonight',        deck: 'Sunset, weather, what is coming up' },
        { href: '/calendar/',  label: 'Calendar',       deck: 'Live shows, openings, screenings' },
        { href: '/now-showing/', label: 'Now Showing',  deck: 'Current art exhibitions' },
        { href: '/horoscope/', label: 'Horoscope',      deck: 'Twelve signs, daily' },
        { href: '/mystery/',   label: 'Mystery Itinerary', deck: 'Sealed-envelope nights' }
      ]
    },
    {
      label: 'Find',
      items: [
        { href: '/map/',       label: 'The Map',        deck: 'Every place, plotted' },
        { href: '/near/',      label: 'Near You',       deck: 'Walking radius search' },
        { href: '/quiz/',      label: 'Quiz',           deck: 'Where to be tonight' },
        { href: '/skyway/',    label: 'Skyway',         deck: 'Downtown indoor router' },
        { href: '/surprise/',  label: 'Surprise me',    deck: 'A random pick' },
        { href: '/search/',    label: 'Search',         deck: 'Across every entry' }
      ]
    },
    {
      label: 'Plan',
      items: [
        { href: '/take-them-to/', label: 'Take Them To', deck: 'For specific people, specific nights' },
        { href: '/visit/',     label: 'First Time?',    deck: 'A weekend in the metro' },
        { href: '/neighborhoods/', label: 'Neighborhoods', deck: 'Sixteen guides, by area' },
        { href: '/festivals/', label: 'Festivals',      deck: 'The annual calendar' }
      ]
    },
    {
      label: 'Eat & Drink',
      items: [
        { href: '/restaurants/', label: 'Restaurants', deck: 'The flagship list' },
        { href: '/coffee-shops/', label: 'Coffee', deck: 'Where the metro caffeinates' },
        { href: '/best-pizza/', label: 'Pizza', deck: 'Lola, Black Sheep, and the wood-fired wave' },
        { href: '/cocktail-bars/', label: 'Cocktail Bars', deck: 'Where the bartender has an opinion' },
        { href: '/breweries/', label: 'Breweries', deck: 'Patios, taprooms, sour rooms' },
        { href: '/best-dive-bars/', label: 'Dive Bars', deck: 'Booth, beer, no fuss' }
      ]
    },
    {
      label: 'Memory',
      items: [
        { href: '/departed/',  label: 'Departed',       deck: 'Places we lost' },
        { href: '/glossary/',  label: "Loon's Nest",    deck: 'A small Twin Cities glossary' }
      ]
    }
  ];

  return `<header class="site-header">
  <div class="wrap">
    <div class="masthead">
      <div class="masthead-date">${esc(TODAY)}</div>
      <div class="masthead-controls">
        <span class="masthead-tagline">Made for the metro.</span>
        <button class="mode-toggle" type="button" aria-label="Toggle light or dark mode" data-mode-toggle>
          <span class="mode-toggle-dot"></span>
          <span class="mode-toggle-label">Dark</span>
        </button>
      </div>
    </div>
    <a href="/" class="logo">bestofmpls<span class="dot">.</span></a>
  </div>
  <nav class="primary-nav">
    <div class="wrap">
      <div class="primary-nav-inner">
        ${primaryNav.map(n => `<a href="${n.href}"${activeSlug && n.slug === activeSlug ? ' class="active"' : ''}>${esc(n.label)}</a>`).join('')}
        <button class="nav-menu-trigger" type="button" data-menu-open aria-label="Open menu">Menu <span aria-hidden="true">→</span></button>
      </div>
    </div>
  </nav>
</header>
<!-- Overlay rendered as sibling of <header> so its z-index escapes the
     header's stacking context. When nested inside <header>, the overlay's
     position:fixed was scoped to the header's stack and page content under
     it bled through. -->
<div class="nav-overlay" data-menu-overlay aria-hidden="true">
  <div class="nav-overlay-inner">
    <div class="nav-overlay-head">
      <a href="/" class="nav-overlay-logo">bestofmpls<span class="dot">.</span></a>
      <button class="nav-overlay-close" type="button" data-menu-close aria-label="Close menu">Close <span aria-hidden="true">×</span></button>
    </div>
    <div class="nav-overlay-grid">
      ${menuGroups.map(g => `
        <section class="nav-group">
          <h3 class="nav-group-label">${esc(g.label)}</h3>
          <ul class="nav-group-list">
            ${g.items.map(it => `
              <li>
                <a href="${it.href}">
                  <span class="nav-item-label">${esc(it.label)}</span>
                  ${it.deck ? `<span class="nav-item-deck">${esc(it.deck)}</span>` : ''}
                </a>
              </li>`).join('')}
          </ul>
        </section>`).join('')}
    </div>
    <div class="nav-overlay-foot">
      <a href="/contribute/">Send us a tip →</a>
      <a href="/about/">About</a>
      <a href="mailto:hello@bestofmpls.com">hello@bestofmpls.com</a>
    </div>
  </div>
</div>`;
}

// Prominent inline newsletter capture. Used on the homepage above the
// site footer and at the bottom of every category page. Honest about
// launch state — we're collecting a list, the first dispatch lands when
// it lands.
function newsletterCapture({ context = 'home' } = {}) {
  const decks = {
    home:     'A monthly note from the metro. New places, what to do this weekend, what just closed. The list is starting; the first dispatch goes out this summer.',
    category: 'Want the short list a month before everyone else? Drop your email. First dispatch lands this summer.',
    event:    'More guides like this one. Drop your email and you will hear when the next dispatch lands.'
  };
  return `
    <section class="newsletter-capture" aria-label="Newsletter signup">
      <div class="wrap newsletter-inner">
        <div class="newsletter-copy">
          <p class="newsletter-eyebrow">The list · launching this summer</p>
          <h2 class="newsletter-title">Field notes from the metro.</h2>
          <p class="newsletter-deck">${esc(decks[context] || decks.home)}</p>
        </div>
        <div class="newsletter-form-block">
          <form class="newsletter-form" data-newsletter-form>
            <input type="email" name="email" placeholder="you@example.com" required aria-label="Email address" maxlength="200">
            <input type="text" name="hp" tabindex="-1" autocomplete="off" class="newsletter-hp" aria-hidden="true">
            <button type="submit">Join the list</button>
          </form>
          <div class="newsletter-status" data-newsletter-status></div>
          <p class="newsletter-fine">No spam. Unsubscribe in one click. One email a month at most.</p>
        </div>
      </div>
    </section>`;
}

function footer() {
  // Daily-refresh stuff lives in its own short row up top so the cluster grid
  // below can stay focused on the static category lists.
  const dailyLinks = [
    { href: '/tonight/', label: 'Tonight' },
    { href: '/calendar/', label: 'Calendar' },
    { href: '/map/', label: 'Map' },
    { href: '/near/', label: 'Near You' },
    { href: '/quiz/', label: 'Quiz' },
    { href: '/skyway/', label: 'Skyway' },
    { href: '/mystery/', label: 'Mystery Itinerary' },
    { href: '/take-them-to/', label: 'Take Them To' },
    { href: '/now-showing/', label: 'Now Showing' },
    { href: '/horoscope/', label: 'Horoscope' },
    { href: '/surprise/', label: 'Surprise me' },
    { href: '/departed/', label: 'Departed' },
    { href: '/festivals/', label: 'Festivals' },
    { href: '/visit/', label: 'First Time?' },
    { href: '/neighborhoods/', label: 'Neighborhoods' },
    { href: '/glossary/', label: "Loon's Nest" }
  ];

  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand-block">
        <div class="footer-brand">bestofmpls<span class="dot">.</span></div>
        <p class="footer-tag">A guide to the museums, music, food, and small good things of Minneapolis and Saint Paul. Made for the metro by the people who live here.</p>
      </div>
      <div class="footer-newsletter">
        <p class="footer-list-title">The list (coming soon)</p>
        <form class="footer-newsletter-form" data-newsletter-form>
          <input type="email" name="email" placeholder="you@example.com" required aria-label="Email address" maxlength="200">
          <input type="text" name="hp" tabindex="-1" autocomplete="off" class="poll-hp" aria-hidden="true">
          <button type="submit">Join</button>
        </form>
        <div class="footer-newsletter-status" data-newsletter-status></div>
      </div>
    </div>

    <div class="footer-daily">
      <span class="footer-daily-label">Daily ·</span>
      <nav class="footer-daily-nav">
        ${dailyLinks.map(l => `<a href="${l.href}">${esc(l.label)}</a>`).join('')}
      </nav>
    </div>

    <div class="footer-clusters">
      ${clusters.map(cluster => `
        <div class="footer-cluster">
          <p class="footer-list-title">${esc(cluster.eyebrow)}</p>
          <ul class="footer-list">
            ${cluster.categories.map(c => `<li><a href="/${c.slug}/">${esc(c.title)}</a></li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>

    <div class="colophon">
      <div class="colophon-links">
        <a href="/about/">About</a>
        <a href="/contribute/">Send a tip</a>
        <a href="mailto:hello@bestofmpls.com">Contact</a>
        <a href="/search/">Search</a>
      </div>
      <div class="colophon-meta">
        <span>© ${new Date().getFullYear()} bestofmpls.</span>
        <span>Made in Minneapolis.</span>
      </div>
    </div>
  </div>
</footer>

<nav class="mobile-dock" aria-label="Primary mobile navigation">
  <a class="mobile-dock-item" href="/tonight/"><span class="mobile-dock-icon" aria-hidden="true">☾</span><span class="mobile-dock-label">Tonight</span></a>
  <a class="mobile-dock-item" href="/calendar/"><span class="mobile-dock-icon" aria-hidden="true">▭</span><span class="mobile-dock-label">Calendar</span></a>
  <a class="mobile-dock-item" href="/map/"><span class="mobile-dock-icon" aria-hidden="true">◉</span><span class="mobile-dock-label">Map</span></a>
  <a class="mobile-dock-item" href="/near/"><span class="mobile-dock-icon" aria-hidden="true">◎</span><span class="mobile-dock-label">Near</span></a>
  <button class="mobile-dock-item" type="button" data-menu-open><span class="mobile-dock-icon" aria-hidden="true">≡</span><span class="mobile-dock-label">Menu</span></button>
</nav>

<script>
// Live sunset countdown — runs once a minute on any page that exposes a
// data-sunset attribute (right-now strip OR concierge block). Reads
// data-sunset="HH:MM" off whichever element has it and rewrites every
// data-sunset-countdown span on the page with a humanized "in 2h 14m"
// string anchored to the user's current Central time.
(function(){
  var src = document.querySelector('[data-sunset]');
  if (!src) return;
  var raw = src.getAttribute('data-sunset') || '';
  // Accept either "8:08 PM" or "20:08" (24h preferred).
  var hours, minutes;
  var m24 = raw.match(/^(\\d{1,2}):(\\d{2})$/);
  var m12 = raw.match(/^(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);
  if (m24) { hours = parseInt(m24[1], 10); minutes = parseInt(m24[2], 10); }
  else if (m12) {
    hours = parseInt(m12[1], 10);
    minutes = parseInt(m12[2], 10);
    if (m12[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (m12[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
  } else { return; }
  var target = document.querySelectorAll('[data-sunset-countdown]');
  function centralNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  }
  function update() {
    var now = centralNow();
    var sunset = new Date(now);
    sunset.setHours(hours, minutes, 0, 0);
    var diffMin = Math.round((sunset - now) / 60000);
    var label;
    if (diffMin > 60) {
      var h = Math.floor(diffMin / 60), mm = diffMin % 60;
      label = 'In ' + h + 'h ' + mm + 'm';
    } else if (diffMin > 1) {
      label = 'In ' + diffMin + ' min';
    } else if (diffMin > -10) {
      label = 'Setting now';
    } else if (diffMin > -120) {
      label = Math.abs(diffMin) + ' min past sunset';
    } else {
      // Sun is down for the night — show tomorrow's anticipation
      label = 'Tomorrow ' + raw;
    }
    target.forEach(function(el){ el.textContent = label; });
  }
  update();
  setInterval(update, 60000);
})();

// Newsletter signup: every [data-newsletter-form] on the page POSTs to the
// worker's /newsletter endpoint. Multiple blocks (footer mini + inline
// prominent) share this handler. Status node is the form's own data-status
// attribute or the sibling [data-newsletter-status] below it.
(function(){
  var endpoint = ${JSON.stringify(POLL_WORKER_URL ? POLL_WORKER_URL + '/newsletter' : '')};
  if (!endpoint) return;
  var forms = document.querySelectorAll('[data-newsletter-form]');
  forms.forEach(function(form){
    var status = form.parentElement.querySelector('[data-newsletter-status]')
              || form.nextElementSibling
              || null;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var fd = new FormData(form);
      var btn = form.querySelector('button[type="submit"]');
      if (status) { status.textContent = 'Sending...'; status.removeAttribute('data-state'); }
      if (btn) btn.disabled = true;
      try {
        var res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: fd.get('email'), hp: fd.get('hp') })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'try again later');
        form.style.display = 'none';
        if (status) { status.textContent = "You're on the list. The first dispatch lands this summer."; status.setAttribute('data-state', 'ok'); }
      } catch (err) {
        if (status) { status.textContent = err.message || 'Try again in a moment.'; status.setAttribute('data-state', 'err'); }
        if (btn) btn.disabled = false;
      }
    });
  });
})();

// Mode toggle: flip data-mode on <html>, persist to localStorage, update label.
(function(){
  var btn = document.querySelector('[data-mode-toggle]');
  if (!btn) return;
  var label = btn.querySelector('.mode-toggle-label');
  function syncLabel(){
    var mode = document.documentElement.getAttribute('data-mode');
    if (label) label.textContent = mode === 'dark' ? 'Light' : 'Dark';
  }
  syncLabel();
  btn.addEventListener('click', function(){
    var current = document.documentElement.getAttribute('data-mode');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-mode', next);
    localStorage.setItem('bom-mode', next);
    syncLabel();
  });
})();

// Menu overlay: click "Menu →" in the primary bar to open a full-screen
// table-of-contents overlay. Same overlay handles the mobile small-screen
// case (the primary bar collapses below 720px).
(function(){
  var openers = document.querySelectorAll('[data-menu-open]');
  var closers = document.querySelectorAll('[data-menu-close]');
  var overlay = document.querySelector('[data-menu-overlay]');
  if (!overlay) return;
  function open(){
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
  }
  function close(){
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }
  openers.forEach(function(b){ b.addEventListener('click', open); });
  closers.forEach(function(b){ b.addEventListener('click', close); });
  // Close on Escape, or when an overlay link is clicked (so mid-nav clicks don't trap).
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
  overlay.addEventListener('click', function(e){
    if (e.target.tagName === 'A') close();
  });
})();

// Open Now: read [data-hours] on every entry article, compute open/closed in
// the user's local time, badge each one, and let an "Open right now" filter
// hide the closed entries on category pages.
(function(){
  var now = new Date();
  // The hours data uses days where 0 = Sunday (Google convention).
  var dow = now.getDay();
  var nowMin = now.getHours() * 60 + now.getMinutes();

  function isOpen(periods) {
    for (var i = 0; i < periods.length; i++) {
      var p = periods[i];
      if (p.day !== dow) continue;
      var openMin = parseTime(p.open);
      var closeMin = p.close ? parseTime(p.close) : 1440;
      // Handle close-after-midnight (closeMin will appear < openMin)
      if (closeMin <= openMin) closeMin += 1440;
      if (nowMin >= openMin && nowMin < closeMin) return true;
      // If we are between midnight and close from yesterday's late hours
      if (i === 0 && p.day === ((dow + 6) % 7)) {} // not used; kept for clarity
    }
    // Also check yesterday for places open past midnight
    var yest = (dow + 6) % 7;
    for (var j = 0; j < periods.length; j++) {
      var q = periods[j];
      if (q.day !== yest || !q.close) continue;
      var oM = parseTime(q.open);
      var cM = parseTime(q.close);
      if (cM <= oM) {
        // closes after midnight; the rolled-over period extends into today
        if (nowMin < cM) return true;
      }
    }
    return false;
  }
  function parseTime(s) {
    var p = s.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function nextOpen(periods) {
    // Find the soonest upcoming open time within the next 7 days.
    for (var d = 0; d < 8; d++) {
      var checkDow = (dow + d) % 7;
      var earliest = null;
      for (var i = 0; i < periods.length; i++) {
        var p = periods[i];
        if (p.day !== checkDow) continue;
        var openMin = parseTime(p.open);
        if (d === 0 && openMin <= nowMin) continue;
        if (earliest === null || openMin < earliest) earliest = openMin;
      }
      if (earliest !== null) {
        var labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        var hr = Math.floor(earliest / 60);
        var min = earliest % 60;
        var ampm = hr >= 12 ? 'PM' : 'AM';
        var hr12 = hr % 12 === 0 ? 12 : hr % 12;
        var when = d === 0 ? 'today' : (d === 1 ? 'tomorrow' : labels[checkDow]);
        return when + ' ' + hr12 + (min ? ':' + (min < 10 ? '0' : '') + min : '') + ' ' + ampm;
      }
    }
    return null;
  }

  document.querySelectorAll('[data-hours]').forEach(function(el){
    try {
      var periods = JSON.parse(el.getAttribute('data-hours'));
      var open = isOpen(periods);
      el.classList.toggle('is-open-now', open);
      el.classList.toggle('is-closed-now', !open);
      var slot = el.querySelector('[data-entry-status]');
      if (slot) {
        if (open) {
          slot.innerHTML = '<span class="status-pip is-open"></span>Open now';
        } else {
          var nx = nextOpen(periods);
          slot.innerHTML = '<span class="status-pip is-closed"></span>Closed' + (nx ? ' · opens ' + nx : '');
        }
      }
    } catch (e) {}
  });

  // Open Now filter on category pages
  document.querySelectorAll('.opennow-bar [data-opennow]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var mode = btn.dataset.opennow;
      document.querySelectorAll('.opennow-bar [data-opennow]').forEach(function(b){
        b.classList.toggle('is-on', b.dataset.opennow === mode);
      });
      document.querySelectorAll('.entry').forEach(function(en){
        if (mode === 'all') { en.style.display = ''; return; }
        // mode === 'open': hide entries that don't have hours OR are closed
        if (en.classList.contains('is-open-now')) en.style.display = '';
        else en.style.display = 'none';
      });
    });
  });
})();

// Scroll-fade for cards and entries via IntersectionObserver. Lightweight.
(function(){
  if (!('IntersectionObserver' in window)) return;
  var targets = document.querySelectorAll('.cat-card, .entry, .festival-entry, .calendar-feature-item');
  targets.forEach(function(el){ el.classList.add('fade-in'); });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in-view');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  targets.forEach(function(el){ io.observe(el); });
})();
</script>
</body>
</html>`;
}

// ---------- Pages ----------
function renderHome() {
  const title = 'bestofmpls. Minneapolis & Saint Paul.';
  const description = 'A locally written guide to the museums, music, theaters, coffee shops, sandwiches, restaurants, bars, hotels, and festivals of Minneapolis and Saint Paul.';

  // Cluster sections: each cluster gets its own editorial header + grid of cards
  const clusterAnchors = ['culture', 'eat', 'drink', 'shop', 'visit'];
  const clusterSections = clusters.map((cluster, idx) => {
    const gridClass = cluster.categories.length <= 2 ? 'cluster-grid cluster-grid--2' : 'cluster-grid';
    return `
    <section class="cluster" id="${clusterAnchors[idx]}">
      <div class="wrap cluster-head">
        <div class="cluster-eyebrow">${esc(cluster.eyebrow)}</div>
        <h2 class="cluster-title">${esc(cluster.title)}</h2>
        <p class="cluster-deck">${esc(cluster.deck)}</p>
      </div>
      <div class="${gridClass}">
        ${cluster.categories.map(c => `
          <a class="cat-card" href="/${c.slug}/">
            <div class="cat-card-eyebrow">${c.entries.length} picks</div>
            <h3 class="cat-card-title">${esc(c.title)}</h3>
            <p class="cat-card-deck">${esc(c.subtitle)}</p>
            <span class="cat-card-arrow">Read the list →</span>
          </a>
        `).join('')}
      </div>
    </section>`;
  }).join('');

  // Featured calendar strip — surface the NEXT 4 upcoming festivals based on
  // today's Central date. Avoids showing Winter Carnival in May. festivals.js
  // stores `month` as a human string ("Mid-May", "Late June", "May 1"); we
  // parse it into an approximate calendar position, roll to next year if
  // already past, and take the soonest four.
  function festivalApproxDate(monthStr, refIso) {
    const s = String(monthStr || '').toLowerCase();
    const monthMap = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    // First month name we find anchors the date.
    let mIdx = -1;
    for (const [name, idx] of Object.entries(monthMap)) {
      if (s.includes(name)) { mIdx = idx; break; }
    }
    if (mIdx < 0) return null;
    // Day-of-month guess from the qualifier ("late" = 25, "mid" = 15, "early" = 5).
    let day = 15;
    if (/early/.test(s))  day = 5;
    if (/mid/.test(s))    day = 15;
    if (/late/.test(s))   day = 25;
    // Explicit day number wins ("May 1", "May 15").
    const dayMatch = s.match(/\b(\d{1,2})\b/);
    if (dayMatch) day = Math.min(28, parseInt(dayMatch[1], 10));
    const [refY] = refIso.split('-').map(Number);
    let d = new Date(refY, mIdx, day);
    const ref = new Date(refIso + 'T00:00:00');
    // If already past, roll to next year.
    if (d < ref) d = new Date(refY + 1, mIdx, day);
    return d;
  }
  const calendarPicks = festivals.entries
    .map(e => ({ e, when: festivalApproxDate(e.month, TODAY_ISO) }))
    .filter(x => x.when)
    .sort((a, b) => a.when - b.when)
    .slice(0, 4)
    .map(x => x.e);

  // Live events strip — show next 6 distinct shows. Films excluded. Multi-
  // night runs (e.g. a four-night dance piece) collapse to one entry so the
  // strip is six different things, not the same show four times.
  const liveEventPicks = collapseRuns(
    dedupeNonFilms((eventsData.events || []).filter(e => !isFilmEvent(e) && e.date >= TODAY_ISO))
  ).slice(0, 6);
  function fmtShortDay(iso) {
    if (!iso) return '';
    const [y,m,d] = iso.split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Today's horoscope teaser — pick 3 signs deterministically by date so the
  // teaser changes daily without showing the same sign on the cover twice.
  const todayKey = (horoscopeData.date || TODAY_ISO).split('-').reduce((a,c) => a + parseInt(c,10), 0);
  const horoscopePicks = (horoscopeData.horoscopes || [])
    .map((h, i) => ({ h, i }))
    .filter(({ i }) => (i + todayKey) % 4 === 0)
    .slice(0, 3)
    .map(x => x.h);

  // Smart cover: when the weather pushes a clear mood (patio day, brutal cold,
  // big snow), swap the deck + CTA so the front page reflects the day. Default
  // copy returns whenever the day is just an ordinary day in the metro.
  const r = rightnowData;
  let coverDeck = 'Where to eat, drink, see, hear, sleep, and spend a Saturday in two of the best small cities in America. Made for the metro by the people who live here.';
  let coverCta  = { href: '/visit/', label: 'First time visiting? Start here' };
  let coverIssue = 'Volume 01 · Spring 2026';

  if (r && r.weather) {
    if (r.weather.mood === 'patio') {
      coverDeck = `${r.weather.temp_max}°F today. The patios are open and the city is outside. Here is where the metro spends a day like this.`;
      coverCta = { href: '/take-them-to/#patio-day', label: 'Take it to a patio →' };
      coverIssue = `Today · ${r.weather.summary}`;
    } else if (r.weather.mood === 'brutal') {
      coverDeck = `${r.weather.temp_now}°F outside. A short list of the warm, slow rooms the metro relies on for a day like this.`;
      coverCta = { href: '/take-them-to/#snow-day', label: 'Take it indoors →' };
      coverIssue = `Today · ${r.weather.summary}`;
    } else if (r.weather.mood === 'snow') {
      coverDeck = `Snow on the ground. A short list of the warm rooms, hot dishes, and slow drinks for a day like this.`;
      coverCta = { href: '/take-them-to/#snow-day', label: 'Take it slow →' };
      coverIssue = `Today · ${r.weather.summary}`;
    } else if (r.weather.mood === 'rain') {
      coverDeck = `Steady rain in the forecast. A short list of the candle-lit tables, basement bars, and second-run cinemas for a day like this.`;
      coverCta = { href: '/take-them-to/#rainy-night', label: 'Take it inside →' };
      coverIssue = `Today · ${r.weather.summary}`;
    }
  }

  return head({ title, description, slug: '', theme: 'default' }) +
    header({ activeSlug: '' }) +
    `<section class="cover" data-mood="${r ? r.weather.mood : 'normal'}">
      <figure class="cover-photo">
        <img src="/img/skyline-cover.jpg" alt="Minneapolis skyline at twilight, with the Stone Arch Bridge area in the foreground" loading="eager" fetchpriority="high">
      </figure>
      <div class="wrap cover-wrap">
        <div class="cover-issue">${esc(coverIssue)}</div>
        <h1 class="cover-headline">Minneapolis<br><em>&amp;</em> Saint Paul.</h1>
        <p class="cover-deck">${esc(coverDeck)}</p>
        <div class="cover-actions">
          <a class="cover-cta" href="${coverCta.href}">${esc(coverCta.label)}</a>
          <div class="cover-meta">
            <span>${categories.length} categories</span>
            <span>${categories.reduce((sum, c) => sum + c.entries.length, 0)} places</span>
            ${r ? `<span>Sunset ${esc(r.sun.set)}</span>` : `<span>Updated weekly</span>`}
          </div>
        </div>
      </div>
    </section>
    ${ACTIVE_FEATURE ? `
    <section class="feature-banner" data-feature="${esc(ACTIVE_FEATURE.slug)}">
      <a class="feature-banner-inner wrap" href="/${esc(ACTIVE_FEATURE.slug)}/">
        <div class="feature-banner-eyebrow">
          <span class="feature-banner-pulse" aria-hidden="true"></span>
          <span>${esc(featureDaysLabel(ACTIVE_FEATURE))} · ${esc(ACTIVE_FEATURE.eyebrow)}</span>
        </div>
        <h2 class="feature-banner-title">${esc(ACTIVE_FEATURE.name)}</h2>
        <p class="feature-banner-deck">${esc(ACTIVE_FEATURE.teaser)}</p>
        <div class="feature-banner-meta">
          <span>${esc(ACTIVE_FEATURE.dates_display)}</span>
          <span class="feature-banner-cta">${esc(ACTIVE_FEATURE.cta_label)}</span>
        </div>
      </a>
    </section>` : ''}
    ${r ? `
    <section class="rightnow-strip" data-sunset="${esc(r.sun.set_24 || r.sun.set)}">
      <div class="wrap">
        ${(function(){
          const badges = cityStateBadges(r);
          return badges.length ? `<div class="rightnow-badges">${badges.map(b => `<span class="rightnow-badge">${esc(b)}</span>`).join('')}</div>` : '';
        })()}
        <div class="rightnow-inner">
          <div class="rightnow-item">
            <div class="rightnow-label">Sunset</div>
            <div class="rightnow-value">${esc(r.sun.set)}</div>
            <span class="rightnow-link" data-sunset-countdown>${esc(r.sun.set)} CT</span>
          </div>
          <div class="rightnow-item rightnow-item--temp">
            <div class="rightnow-label">Right now</div>
            <div class="rightnow-temp"><span class="rightnow-temp-num">${r.weather.temp_now}</span><span class="rightnow-temp-unit">°F</span></div>
            <span class="rightnow-link">${esc(r.weather.condition)}</span>
          </div>
          ${r.countdowns.slice(0, 3).map(c => `
          <div class="rightnow-item">
            <div class="rightnow-label">In ${c.days} day${c.days === 1 ? '' : 's'}</div>
            <div class="rightnow-value rightnow-value-event">${esc(c.name)}</div>
            <a class="rightnow-link" href="/tonight/">More countdowns →</a>
          </div>`).join('')}
        </div>
      </div>
    </section>` : ''}
    <section class="concierge" aria-label="Tonight in the metro" data-sunset="${rightnowData ? esc(rightnowData.sun.set_24 || rightnowData.sun.set) : ''}">
      <div class="wrap concierge-inner">
        <header class="concierge-head">
          <span class="concierge-eyebrow">Tonight</span>
          <h2 class="concierge-headline">${esc((function(){ const [y,m,d] = TODAY_ISO.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); })()).toUpperCase()}</h2>
          <p class="concierge-deck">${esc(seasonalLine(rightnowData))}</p>
          ${rightnowData ? `
          <div class="concierge-context">
            <span class="concierge-context-item"><span class="concierge-context-num">${rightnowData.weather.temp_now}°</span> <span class="concierge-context-label">${esc(rightnowData.weather.condition)}</span></span>
            <span class="concierge-context-item"><span class="concierge-context-num">${esc(rightnowData.sun.set)}</span> <span class="concierge-context-label"><span data-sunset-countdown>sunset</span></span></span>
            ${cityStateBadges(rightnowData).slice(0, 2).map(b => `<span class="concierge-context-badge">${esc(b)}</span>`).join('')}
          </div>` : ''}
        </header>
        <ol class="concierge-picks">
          ${tonightConcierge(rightnowData, eventsData.events).map(p => `
            <li class="concierge-pick">
              <span class="concierge-pick-kind">${esc(p.kind)}</span>
              <p class="concierge-pick-line">${p.href ? `<a href="${esc(p.href)}">${esc(p.line)}</a>` : esc(p.line)}</p>
            </li>`).join('')}
        </ol>
        <a class="concierge-more" href="/tonight/">See all of tonight →</a>
      </div>
    </section>
    ${clusterSections}
    <section class="more-tools" aria-label="More tools">
      <div class="wrap">
        <div class="more-tools-head">
          <span class="more-tools-eyebrow">More · Index</span>
          <span class="more-tools-stamp">Optional exploration</span>
        </div>
        <ul class="more-tools-list">
          <li><a href="/take-them-to/"><span class="mtools-code">X</span> Take Them To <em>${(IS_WARM_SEASON ? situations.situations.filter(s => s.slug !== 'snow-day') : situations.situations).length} situations</em></a></li>
          <li><a href="/near/"><span class="mtools-code">N</span> Near You <em>walking radius</em></a></li>
          <li><a href="/this-weekend/"><span class="mtools-code">W</span> This Weekend <em>Fri · Sat · Sun</em></a></li>
          <li><a href="/now-showing/"><span class="mtools-code">A</span> Now Showing <em>${exhibitions.exhibitions.length} exhibitions</em></a></li>
          <li><a href="/festivals/"><span class="mtools-code">F</span> Festivals <em>the year in order</em></a></li>
          <li><a href="/visit/"><span class="mtools-code">V</span> First Time? <em>a weekend in the metro</em></a></li>
          <li><a href="/skyway/"><span class="mtools-code">S</span> Skyway <em>${skyway.nodes.length} downtown nodes</em></a></li>
          <li><a href="/quiz/"><span class="mtools-code">Q</span> Quiz <em>where to be tonight</em></a></li>
          <li><a href="/horoscope/"><span class="mtools-code">H</span> Horoscope <em>for the metro</em></a></li>
          <li><a href="/surprise/"><span class="mtools-code">R</span> Surprise <em>a random pick</em></a></li>
          <li><a href="/mystery/"><span class="mtools-code">Y</span> Mystery <em>sealed-envelope nights</em></a></li>
          <li><a href="/departed/"><span class="mtools-code">D</span> Departed <em>places we lost</em></a></li>
          <li><a href="/glossary/"><span class="mtools-code">G</span> Loon’s Nest <em>a small glossary</em></a></li>
        </ul>
      </div>
    </section>
    ${liveEventPicks.length ? `
    <section class="live-feature" id="live-events">
      <div class="wrap live-feature-inner">
        <div class="live-feature-text">
          <div class="cluster-eyebrow">This week, by the day</div>
          <h2 class="cluster-title">The Calendar</h2>
          <p class="cluster-deck">Live music, art openings, lectures, and screenings, refreshed daily from the venues themselves.</p>
          <a class="cat-card-arrow" href="/calendar/">See the full calendar →</a>
        </div>
        <ul class="live-feature-list">
          ${liveEventPicks.map(e => `
            <li class="live-feature-item">
              <div class="live-feature-day">${esc(fmtShortDay(e.date))}</div>
              <div class="live-feature-body">
                <div class="live-feature-name">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</div>
                <div class="live-feature-meta">${esc(e.venue)} ${e.venue_neighborhood ? nhoodTag(e.venue_neighborhood) : ''}</div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    </section>` : ''}
    ${horoscopePicks.length ? `
    <section class="horoscope-feature" id="horoscope-tease">
      <div class="wrap horoscope-feature-inner">
        <div class="horoscope-feature-text">
          <div class="cluster-eyebrow">For the metro, today</div>
          <h2 class="cluster-title">A reading for the day</h2>
          <p class="cluster-deck">A grounded daily horoscope. Mood pieces, more than predictions. Written for people who live here.</p>
          <a class="cat-card-arrow" href="/horoscope/">Read all twelve →</a>
        </div>
        <div class="horoscope-feature-cards">
          ${horoscopePicks.map(h => `
            <a class="horoscope-feature-card" href="/horoscope/#${esc(h.slug)}">
              <span class="horoscope-feature-symbol">${zodiacSvg(h.sign)}</span>
              <span class="horoscope-feature-sign">${esc(h.sign)}</span>
              <p class="horoscope-feature-snippet">${esc(h.text.split('. ').slice(0,2).join('. ') + (h.text.split('. ').length > 2 ? '.' : ''))}</p>
            </a>
          `).join('')}
        </div>
      </div>
    </section>` : ''}
    <section class="calendar-feature" id="calendar">
      <div class="wrap calendar-feature-inner">
        <div class="calendar-feature-text">
          <div class="cluster-eyebrow">On the Calendar</div>
          <h2 class="cluster-title">${esc(festivals.title)}</h2>
          <p class="cluster-deck">${esc(festivals.subtitle)}</p>
          <a class="cat-card-arrow" href="/festivals/">See the year ahead →</a>
        </div>
        <div class="calendar-feature-list">
          ${calendarPicks.map(e => `
            <div class="calendar-feature-item">
              <div class="calendar-feature-month">${esc(e.month)}</div>
              <div class="calendar-feature-name">${esc(e.name)}</div>
              <div class="calendar-feature-style">${esc(e.style)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>` +
    newsletterCapture({ context: 'home' }) +
    footer();
}

function renderCategory(c) {
  // Festivals page gets a special seasonal render
  if (c.layout === 'seasonal') return renderSeasonalCategory(c);

  const description = c.subtitle;
  const entries = c.entries.map((e, i) => {
    // Only the first entry gets the Editor's Pick featured treatment.
    // The rest are unranked list entries (no number, no star).
    const isFeatured = i === 0;
    const featured = isFeatured ? ' entry--featured' : ' entry--unranked';
    const meta = [];
    if (e.neighborhood) meta.push(nhoodTag(e.neighborhood));
    if (e.style) meta.push(`<span class="entry-meta-style">${esc(e.style)}</span>`);
    // Build the entry-footer utility row.
    // Each item is its own block: address (clickable to maps), website,
    // price, hours, capacity. Address gets a "directions" suffix.
    const footerBits = [];
    if (e.address) {
      // Skip linking generic city-only addresses; link real street addresses to Google Maps
      const isStreetAddress = /\d/.test(e.address);
      if (isStreetAddress) {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`;
        footerBits.push(`<a class="entry-meta-link" href="${esc(mapsUrl)}" target="_blank" rel="noopener" title="Open in Google Maps">${esc(e.address)} <span class="entry-meta-link-icon">↗</span></a>`);
      } else {
        footerBits.push(`<span>${esc(e.address)}</span>`);
      }
    }
    if (e.website) {
      const cleanUrl = e.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
      footerBits.push(`<a class="entry-meta-link entry-meta-link--website" href="${esc(e.website)}" target="_blank" rel="noopener">${esc(cleanUrl)} <span class="entry-meta-link-icon">↗</span></a>`);
    }
    if (e.reservation) {
      const platform = reservationPlatform(e.reservation);
      footerBits.push(`<a class="entry-reserve" href="${esc(reservationUrl(e.reservation))}" target="_blank" rel="noopener sponsored">Reserve a table on ${esc(platform)} <span class="entry-meta-link-icon">↗</span></a>`);
    }
    if (e.price) footerBits.push(`<span class="entry-footer-price">${esc(e.price)}</span>`);
    if (e.hours) footerBits.push(`<span>${esc(e.hours)}</span>`);
    if (e.capacity) footerBits.push(`<span>Capacity ${esc(e.capacity)}</span>`);
    // Curiosities and other reservation-required entries can declare an
    // `access` field with how to actually get in (tour, ticket, etc).
    if (e.access) footerBits.push(`<span class="entry-footer-access"><strong>How to visit:</strong> ${esc(e.access)}</span>`);
    const rankBlock = isFeatured ? `<div class="entry-rank">★</div>` : '';
    const pickBadge = isFeatured ? '<span class="entry-meta-pick">Editor’s pick</span>' : '';
    // Look up hours for this entry. If we have them, embed as a data attribute
    // so the inline script at footer can compute open/closed in the user's
    // timezone on page load.
    const hoursLookup = hoursData[`${c.slug}:${e.name}`];
    const hoursAttr = hoursLookup && hoursLookup.hours && hoursLookup.hours.length > 0
      ? ` data-hours='${JSON.stringify(hoursLookup.hours).replace(/'/g, '&#39;')}'`
      : '';
    const detailSlug = entrySlug(e.name);
    const detailUrl = `/${c.slug}/${detailSlug}/`;
    return `<article class="entry${featured}" id="${esc(detailSlug)}"${hoursAttr}>
      ${rankBlock}
      <div class="entry-body">
        <div class="entry-meta">${meta.join('')}${pickBadge}<span class="entry-status" data-entry-status></span></div>
        <h2 class="entry-name"><a href="${detailUrl}">${esc(e.name)}</a></h2>
        <p class="entry-description">${esc(e.description)}</p>
        <div class="entry-footer">${footerBits.join('')}</div>
        <a class="entry-readmore" href="${detailUrl}">Read full entry →</a>
      </div>
    </article>`;
  }).join('');

  // Pick the most-specific schema.org type for the category
  const SCHEMA_TYPE_BY_SLUG = {
    'restaurants':            'Restaurant',
    'best-pizza':             'Restaurant',
    'best-brunch':            'Restaurant',
    'best-happy-hours':       'Restaurant',
    'sandwiches':             'Restaurant',
    'burgers':                'Restaurant',
    'mexican-and-tacos':      'Restaurant',
    'vietnamese':             'Restaurant',
    'korean':                 'Restaurant',
    'japanese':               'Restaurant',
    'hmong-food':             'Restaurant',
    'ethiopian':              'Restaurant',
    'indian-restaurants':     'Restaurant',
    'late-night':             'Restaurant',
    'food-halls':             'Restaurant',
    'best-dive-bars':         'BarOrPub',
    'cocktail-bars':          'BarOrPub',
    'best-patios':            'BarOrPub',
    'breweries':              'Brewery',
    'coffee-shops':           'CafeOrCoffeeShop',
    'pastries-and-bakeries':  'Bakery',
    'ice-cream':              'IceCreamShop',
    'live-music':             'MusicVenue',
    'theaters':               'TheaterEvent',
    'arthouse-cinemas':       'MovieTheater',
    'museums-and-galleries':  'Museum',
    'lgbtq-nightlife':        'BarOrPub',
    'wellness-and-spas':      'HealthAndBeautyBusiness',
    'cannabis-dispensaries':  'Store',
    'independent-shops':      'Store',
    'mens-clothing':          'ClothingStore',
    'womens-clothing':        'ClothingStore',
    'boutique-hotels':        'Hotel',
    'outdoors':               'TouristAttraction',
    'hidden-gems':            'TouristAttraction'
  };
  const itemType = SCHEMA_TYPE_BY_SLUG[c.slug] || 'LocalBusiness';

  // ItemList wraps individual LocalBusiness entries.
  // Each entry gets its own schema with name, address, website, price.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: c.title,
    description: c.subtitle,
    numberOfItems: c.entries.length,
    itemListElement: c.entries.map((e, i) => {
      const item = {
        '@type': itemType,
        name: e.name,
        url: e.website || `${SITE}/${c.slug}/#${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      };
      if (e.address) {
        item.address = {
          '@type': 'PostalAddress',
          streetAddress: e.address,
          addressLocality: /st\.? paul/i.test(e.address) ? 'Saint Paul' : 'Minneapolis',
          addressRegion: 'MN',
          addressCountry: 'US'
        };
      }
      if (e.price) item.priceRange = e.price;
      if (e.description) item.description = e.description;
      return { '@type': 'ListItem', position: i + 1, item };
    })
  };

  // External link callout (e.g. Dispensaries → twincitycannabis.com)
  const externalCallout = c.external_link ? `
    <section class="external-callout">
      <div class="external-callout-inner">
        <p class="external-callout-text">For the comprehensive list with live pricing and daily deals, visit our sister site.</p>
        <a class="external-callout-link" href="${esc(c.external_link.href)}" target="_blank" rel="noopener">${esc(c.external_link.label)} →</a>
      </div>
    </section>` : '';

  // Verification banner for newer categories where we want community fact-checks
  const verifyBanner = c.needs_verification ? `
    <div class="verify-banner">
      <div class="verify-banner-inner">
        <span><strong>Help us get this list right.</strong> This is a newer category. If we missed a place, got an address wrong, or named a chef who has moved on, please tell us.</span>
        <a href="/contribute/">Send us a tip →</a>
      </div>
    </div>` : '';

  // Show the "Open Now" toggle only when at least 3 entries on this page
  // have hours data. Otherwise the toggle would be misleading.
  const entriesWithHours = c.entries.filter(e => {
    const h = hoursData[`${c.slug}:${e.name}`];
    return h && h.hours && h.hours.length > 0;
  }).length;
  const openNowToggle = entriesWithHours >= 3 ? `
    <div class="opennow-bar">
      <div class="wrap opennow-bar-inner">
        <span class="cal-filter-label">Filter:</span>
        <button class="cal-chip cal-chip-all is-on" data-opennow="all" type="button">All ${c.entries.length}</button>
        <button class="cal-chip" data-opennow="open" type="button"><span class="opennow-dot"></span> Open right now</button>
        <span class="opennow-note">Hours from Google for ${entriesWithHours} of ${c.entries.length}.</span>
      </div>
    </div>` : '';

  return head({ title: `${c.title} in the Twin Cities`, description, slug: c.slug, theme: c.hero_color }) +
    header({ activeSlug: c.slug }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">${c.entries.length} picks</div>
        <h1 class="section-title">${esc(c.title)} <em>in the Twin Cities</em></h1>
        <p class="section-deck">${esc(c.intro)}</p>
      </div>
    </section>
    ${verifyBanner}
    ${externalCallout}
    ${openNowToggle}
    <section class="entry-list">
      ${entries}
    </section>
    ${renderPollForm(c)}
    <script type="application/ld+json">${JSON.stringify(schema)}</script>` +
    newsletterCapture({ context: 'category' }) +
    footer();
}

// Reader poll form: shown at the bottom of every category page. Submits to
// the Cloudflare Worker if POLL_WORKER_URL is set, otherwise renders in a
// "coming soon" state so the page never breaks.
function renderPollForm(c) {
  const enabled = !!POLL_WORKER_URL;
  const workerUrl = POLL_WORKER_URL || '';

  return `
    <section class="poll-section" data-poll-category="${esc(c.slug)}">
      <div class="wrap poll-inner">
        <div class="poll-eyebrow">Help us build this list</div>
        <h2 class="poll-headline">What is your favorite ${esc(pollNoun(c))} in the Twin Cities?</h2>
        <p class="poll-deck">If we missed your spot, tell us. Your pick joins a running tally of reader recommendations. We read every submission and work the strongest ones into the list. We do not publish your name or email.</p>
        ${enabled ? `
        <form class="poll-form" data-poll-form>
          <div class="poll-row poll-row-place">
            <label for="poll-place">Place</label>
            <input type="text" id="poll-place" name="place" placeholder="The exact name of the spot" required maxlength="120" autocomplete="off">
          </div>
          <div class="poll-row poll-row-why">
            <label for="poll-why">Why <span class="poll-optional">(optional)</span></label>
            <textarea id="poll-why" name="why" placeholder="One sentence is plenty. The thing about it that makes you keep going back." maxlength="600" rows="3"></textarea>
          </div>
          <div class="poll-row poll-row-email">
            <label for="poll-email">Email <span class="poll-optional">(optional, only used if we have a follow-up)</span></label>
            <input type="email" id="poll-email" name="email" placeholder="you@example.com" maxlength="200" autocomplete="email">
          </div>
          <input type="text" name="hp" tabindex="-1" autocomplete="off" class="poll-hp" aria-hidden="true">
          <div class="poll-actions">
            <button class="cover-cta poll-submit" type="submit">Send my pick →</button>
            <span class="poll-status" data-poll-status></span>
          </div>
        </form>
        <div class="poll-thanks" data-poll-thanks hidden>
          <h3 class="poll-thanks-title">Thanks. Your pick is in.</h3>
          <p class="poll-thanks-body" data-poll-thanks-body></p>
          <button class="poll-thanks-again" type="button" data-poll-again>Send another →</button>
        </div>
        ` : `
        <div class="poll-disabled">
          <p>The reader poll is being wired up this week. Until then, send your picks to <a href="mailto:hello@bestofmpls.com">hello@bestofmpls.com</a> or <a href="/contribute/">use the tip form</a>.</p>
        </div>
        `}
      </div>
    </section>
    ${enabled ? `
    <script>
      (function(){
        var section = document.querySelector('[data-poll-category="${esc(c.slug)}"]');
        if (!section) return;
        var form = section.querySelector('[data-poll-form]');
        var status = section.querySelector('[data-poll-status]');
        var thanks = section.querySelector('[data-poll-thanks]');
        var thanksBody = section.querySelector('[data-poll-thanks-body]');
        var againBtn = section.querySelector('[data-poll-again]');
        var endpoint = ${JSON.stringify(workerUrl + '/vote')};

        if (!form) return;

        form.addEventListener('submit', async function(e){
          e.preventDefault();
          var fd = new FormData(form);
          var body = {
            category: ${JSON.stringify(c.slug)},
            place: fd.get('place'),
            why: fd.get('why'),
            email: fd.get('email'),
            hp: fd.get('hp')
          };
          status.textContent = 'Sending...';
          form.querySelector('button[type="submit"]').disabled = true;
          try {
            var res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.error || 'something broke');
            // Success
            form.style.display = 'none';
            thanksBody.textContent = data.total_for_place > 1
              ? data.place + ' has been recommended ' + data.total_for_place + ' times. We are listening.'
              : data.place + ' has been added to the running tally for this category.';
            thanks.hidden = false;
          } catch (err) {
            status.textContent = err.message || 'Something went wrong, try again in a moment.';
            form.querySelector('button[type="submit"]').disabled = false;
          }
        });

        if (againBtn) againBtn.addEventListener('click', function(){
          form.reset();
          form.style.display = '';
          thanks.hidden = true;
          status.textContent = '';
          form.querySelector('button[type="submit"]').disabled = false;
          form.querySelector('input[name="place"]').focus();
        });
      })();
    </script>` : ''}`;
}

// Map a category title to the noun phrase used in the poll headline.
// Hand-tuned to keep the copy reading like English.
const POLL_NOUNS = {
  'museums-and-galleries':  'museum or gallery',
  'live-music':             'live music venue',
  'theaters':               'theater',
  'arthouse-cinemas':       'arthouse cinema',
  'lgbtq-nightlife':        'LGBTQ+ bar',
  'sports':                 'sports venue or team',
  'restaurants':            'restaurant',
  'food-halls':             'food hall',
  'coffee-shops':           'coffee shop',
  'pastries-and-bakeries':  'bakery',
  'sandwiches':             'sandwich shop',
  'burgers':                'burger',
  'best-pizza':             'pizza',
  'best-brunch':            'brunch spot',
  'mexican-and-tacos':      'Mexican or taco spot',
  'vietnamese':             'Vietnamese spot',
  'korean':                 'Korean spot',
  'japanese':               'Japanese spot',
  'hmong-food':             'Hmong spot',
  'ethiopian':              'Ethiopian spot',
  'indian-restaurants':     'Indian restaurant',
  'thai':                   'Thai spot',
  'chinese':                'Chinese spot',
  'ice-cream':              'ice cream',
  'late-night':             'late-night spot',
  'cocktail-bars':          'cocktail bar',
  'breweries':              'brewery',
  'best-dive-bars':         'dive bar',
  'best-patios':            'patio',
  'best-happy-hours':       'happy hour',
  'independent-shops':      'shop',
  'mens-clothing':          "men's shop",
  'womens-clothing':        "women's shop",
  'cannabis-dispensaries':  'dispensary',
  'boutique-hotels':        'hotel',
  'outdoors':               'outdoor spot',
  'wellness-and-spas':      'wellness spot',
  'hidden-gems':            'hidden gem',
  'curiosities':            'strange or secret place'
};
function pollNoun(c) {
  if (POLL_NOUNS[c.slug]) return POLL_NOUNS[c.slug];
  // Fallback: lowercase + crude singularization
  return String(c.title || 'spot').toLowerCase().replace(/^best\s+/, '').replace(/s\b/, '');
}

// ---------- Per-entry detail pages ----------
// Each directory entry gets its own page at /{category-slug}/{entry-slug}/.
// This expands the indexable surface area from ~70 category pages to ~350
// detail pages, each one targeting a specific long-tail search ("owamni
// minneapolis", "spoon and stable hours", etc.). Full schema.org markup,
// breadcrumb, related entries, single-pin map.
function renderEntry(c, e, allCategories) {
  const slug = entrySlug(e.name);
  const url  = `${SITE}/${c.slug}/${slug}/`;
  const hoursLookup = hoursData[`${c.slug}:${e.name}`];
  const coords = lookupCoords(c.slug, e);

  // Schema type per category
  const SCHEMA_TYPE = {
    'restaurants': 'Restaurant', 'best-pizza': 'Restaurant', 'best-brunch': 'Restaurant',
    'best-happy-hours': 'BarOrPub', 'sandwiches': 'Restaurant', 'burgers': 'Restaurant',
    'mexican-and-tacos': 'Restaurant', 'vietnamese': 'Restaurant', 'korean': 'Restaurant',
    'japanese': 'Restaurant', 'hmong-food': 'Restaurant', 'ethiopian': 'Restaurant',
    'indian-restaurants': 'Restaurant', 'thai': 'Restaurant', 'chinese': 'Restaurant',
    'late-night': 'Restaurant', 'food-halls': 'Restaurant',
    'best-dive-bars': 'BarOrPub', 'cocktail-bars': 'BarOrPub', 'best-patios': 'BarOrPub',
    'breweries': 'Brewery',
    'coffee-shops': 'CafeOrCoffeeShop', 'pastries-and-bakeries': 'Bakery',
    'ice-cream': 'IceCreamShop', 'live-music': 'MusicVenue', 'theaters': 'PerformingArtsTheater',
    'arthouse-cinemas': 'MovieTheater', 'museums-and-galleries': 'Museum',
    'cannabis-dispensaries': 'Store', 'boutique-hotels': 'Hotel',
    'wellness-and-spas': 'HealthAndBeautyBusiness',
    'mens-clothing': 'ClothingStore', 'womens-clothing': 'ClothingStore',
    'independent-shops': 'Store',
    'lgbtq-nightlife': 'NightClub',
    'sports': 'StadiumOrArena',
    'outdoors': 'TouristAttraction', 'hidden-gems': 'TouristAttraction',
    'curiosities': 'TouristAttraction'
  };
  const schemaType = SCHEMA_TYPE[c.slug] || 'LocalBusiness';

  // Build the schema object
  const schema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: e.name,
    description: e.description,
    url
  };
  if (e.website) schema.sameAs = e.website;
  if (e.address) {
    const isStreet = /\d/.test(e.address);
    schema.address = isStreet
      ? { '@type': 'PostalAddress', streetAddress: e.address.split(',')[0], addressLocality: /St\.?\s*Paul/i.test(e.address) ? 'Saint Paul' : 'Minneapolis', addressRegion: 'MN', addressCountry: 'US' }
      : { '@type': 'PostalAddress', addressLocality: e.address, addressRegion: 'MN', addressCountry: 'US' };
  }
  if (coords) schema.geo = { '@type': 'GeoCoordinates', latitude: coords.lat, longitude: coords.lng };
  if (e.price) schema.priceRange = e.price;
  if (hoursLookup && hoursLookup.hours && hoursLookup.hours.length) {
    const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    schema.openingHoursSpecification = hoursLookup.hours.map(p => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_NAMES[p.day],
      opens: p.open,
      closes: p.close || '23:59'
    }));
  }

  // Breadcrumb schema for the trail
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'bestofmpls', item: SITE },
      { '@type': 'ListItem', position: 2, name: c.title, item: `${SITE}/${c.slug}/` },
      { '@type': 'ListItem', position: 3, name: e.name, item: url }
    ]
  };

  // Related entries: same category, same neighborhood (or first 4 from category)
  const neighborhoodNormSelf = normalizeNeighborhood(e.neighborhood);
  const sameCat = c.entries.filter(other => other.name !== e.name);
  const sameNeighborhood = neighborhoodNormSelf
    ? sameCat.filter(o => normalizeNeighborhood(o.neighborhood) === neighborhoodNormSelf)
    : [];
  const related = (sameNeighborhood.length >= 2 ? sameNeighborhood : sameCat).slice(0, 4);

  // Open Now: re-use the existing client-side logic by emitting a data attr.
  const hoursAttr = (hoursLookup && hoursLookup.hours && hoursLookup.hours.length > 0)
    ? ` data-hours='${JSON.stringify(hoursLookup.hours).replace(/'/g, '&#39;')}'`
    : '';

  // Address presentation: link to Google Maps when it has a street number.
  const addressBlock = (() => {
    if (!e.address) return '';
    const isStreet = /\d/.test(e.address);
    if (isStreet) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`;
      return `<a class="entry-detail-address" href="${esc(mapsUrl)}" target="_blank" rel="noopener">${esc(e.address)} <span class="entry-meta-link-icon">↗</span></a>`;
    }
    return `<span class="entry-detail-address">${esc(e.address)}</span>`;
  })();

  // Website link
  const websiteBlock = e.website
    ? `<a class="entry-detail-website" href="${esc(e.website)}" target="_blank" rel="noopener">${esc(e.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))} <span class="entry-meta-link-icon">↗</span></a>`
    : '';

  // Reservation button (OpenTable, Resy, Tock). OpenTable URLs pick up the
  // affiliate ref param when OPENTABLE_AFFILIATE_REF is configured.
  const reservationBlock = e.reservation
    ? `<a class="entry-detail-reserve" href="${esc(reservationUrl(e.reservation))}" target="_blank" rel="noopener sponsored">Reserve a table on ${esc(reservationPlatform(e.reservation))} <span class="entry-meta-link-icon">↗</span></a>`
    : '';

  // Mini-map (Leaflet) if we have coords
  const miniMap = coords ? `
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <div id="entry-mini-map" class="entry-detail-map"></div>
    <script>
      (function(){
        var map = L.map('entry-mini-map', { scrollWheelZoom: false, zoomControl: false, dragging: false }).setView([${coords.lat}, ${coords.lng}], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 19
        }).addTo(map);
        L.marker([${coords.lat}, ${coords.lng}], {
          icon: L.divIcon({ className: 'bom-marker', html: '<span style="background:#E11900"></span>', iconSize: [16, 16], iconAnchor: [8, 8] })
        }).addTo(map);
      })();
    </script>` : '';

  const description = `${e.name} — ${e.style || c.title.toLowerCase()} in ${e.neighborhood || 'the Twin Cities'}. ${e.description ? e.description.slice(0, 110) : ''}`.trim();

  return head({ title: `${e.name} · ${c.title}`, description, slug: `${c.slug}/${slug}`, theme: c.hero_color }) +
    header({ activeSlug: c.slug }) +
    `<nav class="breadcrumb wrap">
       <a href="/">bestofmpls</a>
       <span aria-hidden="true">›</span>
       <a href="/${c.slug}/">${esc(c.title)}</a>
       <span aria-hidden="true">›</span>
       <span aria-current="page">${esc(e.name)}</span>
     </nav>

     <article class="entry-detail wrap"${hoursAttr} id="${esc(slug)}">
       <header class="entry-detail-head">
         <div class="entry-detail-eyebrow">
           ${e.neighborhood ? `<span>${esc(e.neighborhood)}</span>` : ''}
           ${e.style ? `<span class="entry-detail-style">${esc(e.style)}</span>` : ''}
           <span class="entry-status" data-entry-status></span>
         </div>
         <h1 class="entry-detail-name">${esc(e.name)}</h1>
       </header>

       <section class="entry-detail-body">
         <p class="entry-detail-description">${esc(e.description)}</p>
       </section>

       <section class="entry-detail-meta">
         ${addressBlock}
         ${websiteBlock}
         ${reservationBlock}
         ${e.price ? `<span class="entry-detail-price">${esc(e.price)}</span>` : ''}
         ${e.access ? `<div class="entry-detail-access"><strong>How to visit:</strong> ${esc(e.access)}</div>` : ''}
       </section>

       ${miniMap}

       ${related.length ? `
       <section class="entry-detail-related">
         <h2 class="entry-detail-related-title">${sameNeighborhood.length >= 2 ? `More in ${esc(e.neighborhood)}` : `More ${esc(c.title.toLowerCase())}`}</h2>
         <ul class="entry-detail-related-list">
           ${related.map(r => `
             <li>
               <a href="/${c.slug}/${entrySlug(r.name)}/">
                 <span class="entry-detail-related-name">${esc(r.name)}</span>
                 ${r.neighborhood ? `<span class="entry-detail-related-neigh">${esc(r.neighborhood)}</span>` : ''}
               </a>
             </li>`).join('')}
         </ul>
         <a href="/${c.slug}/" class="entry-detail-back">See the full ${esc(c.title.toLowerCase())} list →</a>
       </section>` : ''}
     </article>

     <script type="application/ld+json">${JSON.stringify(schema)}</script>
     <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>` +
    footer();
}

function renderSeasonalCategory(c) {
  // Festivals page: group entries by season. Order seasons starting from
  // the current one so the next thing happening is always at the top.
  // Today's month (1-12) maps to a season; we rotate the season list to
  // start from there.
  const allSeasons = ['Winter', 'Spring', 'Summer', 'Late Summer', 'Fall'];
  // Month → season rough mapping
  const m = new Date().getMonth() + 1; // 1-12
  let currentSeason;
  if (m === 12 || m <= 2) currentSeason = 'Winter';
  else if (m <= 5) currentSeason = 'Spring';
  else if (m <= 7) currentSeason = 'Summer';
  else if (m === 8) currentSeason = 'Late Summer';
  else currentSeason = 'Fall';
  const startIdx = allSeasons.indexOf(currentSeason);
  const seasonOrder = [...allSeasons.slice(startIdx), ...allSeasons.slice(0, startIdx)];

  const grouped = {};
  for (const e of c.entries) {
    const key = e.season || 'Year-round';
    grouped[key] = grouped[key] || [];
    grouped[key].push(e);
  }
  const orderedKeys = [...seasonOrder.filter(k => grouped[k]), ...Object.keys(grouped).filter(k => !seasonOrder.includes(k))];

  // Coming Up: pull the first 3 events from the current/next season block
  const upcoming = [];
  for (const k of orderedKeys) {
    if (upcoming.length >= 3) break;
    for (const e of grouped[k]) {
      upcoming.push(e);
      if (upcoming.length >= 3) break;
    }
  }

  const upcomingStrip = upcoming.length ? `
    <section class="upcoming-strip">
      <div class="wrap upcoming-strip-inner">
        <div class="upcoming-strip-label">Coming up next</div>
        <div class="upcoming-strip-grid">
          ${upcoming.map(e => `
            <div class="upcoming-strip-item">
              <div class="upcoming-strip-month">${esc(e.month)}</div>
              <div class="upcoming-strip-name">${esc(e.name)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>` : '';

  const seasons = orderedKeys.map(season => {
    const items = grouped[season].map((e, i) => `
      <article class="festival-entry">
        <div class="festival-when">
          <div class="festival-month">${esc(e.month)}</div>
          <div class="festival-style">${esc(e.style)}</div>
        </div>
        <div class="festival-body">
          <h3 class="festival-name">${esc(e.name)}</h3>
          <p class="festival-description">${esc(e.description)}</p>
          ${e.address ? `<div class="festival-where">${esc(e.address)}</div>` : ''}
          ${e.website ? `<div class="festival-where"><a href="${esc(e.website)}" target="_blank" rel="noopener">${esc(e.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))} →</a></div>` : ''}
        </div>
      </article>`).join('');
    return `<div class="festival-season">
      <div class="wrap"><h2 class="festival-season-title">${esc(season)}</h2></div>
      <div class="festival-list">${items}</div>
    </div>`;
  }).join('');

  return head({ title: `${c.title} in the Twin Cities`, description: c.subtitle, slug: c.slug, theme: c.hero_color }) +
    header({ activeSlug: c.slug }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">${c.entries.length} on the calendar</div>
        <h1 class="section-title">${esc(c.title)} <em>in the Twin Cities</em></h1>
        <p class="section-deck">${esc(c.intro)}</p>
      </div>
    </section>
    ${upcomingStrip}
    ${seasons}` +
    footer();
}

// ---------- /admin/picks/ — private dashboard for reader poll submissions ----------
// Static HTML page that talks to the Worker's /admin/recent endpoint.
// Auth enforced server-side by the worker; this page just stores the key in
// localStorage and sends it as a header on each fetch. Not linked from the
// site, not in sitemap, has noindex. Anyone can hit the URL but without the
// admin key the worker returns 401.
function renderAdminPicks() {
  const title = 'Reader Picks · Admin';
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/style.css?v=34">
<style>
  body { background: var(--paper); }
  .admin-wrap { max-width: 960px; margin: 0 auto; padding: 32px var(--gutter) 96px; }
  .admin-mast { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid var(--ink); margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
  .admin-mast h1 { font-family: var(--font-display); font-style: italic; font-weight: 900; font-size: clamp(28px, 4vw, 40px); margin: 0; letter-spacing: -0.02em; }
  .admin-mast .private-mark { font-family: var(--font-label); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--clay); padding: 4px 10px; border: 1px solid var(--clay); border-radius: 999px; }
  .admin-auth { padding: 32px; border: 1px solid var(--rule); border-radius: 4px; max-width: 480px; }
  .admin-auth label { display: block; font-family: var(--font-label); font-weight: 600; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 8px; }
  .admin-auth input { width: 100%; padding: 12px 14px; border: 1px solid var(--rule); border-radius: 4px; font-family: var(--font-body); font-size: 16px; background: transparent; color: var(--ink); }
  .admin-auth button { margin-top: 14px; }
  .admin-error { color: #C44; font-family: var(--font-body); font-size: 14px; margin-top: 12px; }
  .admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 28px; }
  .admin-stat { padding: 16px 18px; border: 1px solid var(--rule); border-radius: 4px; }
  .admin-stat-label { font-family: var(--font-label); font-weight: 700; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 4px; }
  .admin-stat-value { font-family: var(--font-display); font-weight: 900; font-size: 28px; color: var(--clay); line-height: 1; }
  .admin-controls { display: flex; gap: 10px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
  .admin-controls select { padding: 8px 12px; border: 1px solid var(--rule); border-radius: 4px; font-family: var(--font-body); font-size: 14px; background: transparent; color: var(--ink); }
  .admin-controls button { appearance: none; background: transparent; border: 1px solid var(--rule); border-radius: 999px; padding: 8px 14px; font-family: var(--font-label); font-weight: 600; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink); cursor: pointer; }
  .admin-controls button:hover { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .admin-controls button.is-danger:hover { background: #C44; color: white; border-color: #C44; }
  .admin-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; }
  .admin-card { padding: 18px 20px; border: 1px solid var(--rule); border-radius: 4px; background: var(--paper); }
  .admin-card.is-handled { opacity: 0.45; border-style: dashed; }
  .admin-card-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
  .admin-card-cat { font-family: var(--font-label); font-weight: 700; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--clay); padding: 3px 8px; background: rgba(225,25,0,0.06); border-radius: 3px; }
  .admin-card-when { font-family: var(--font-label); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); margin-left: auto; }
  .admin-card-place { font-family: var(--font-display); font-weight: 700; font-size: 22px; line-height: 1.15; margin: 0 0 8px; color: var(--ink); }
  .admin-card-why { font-family: var(--font-display); font-style: italic; font-size: 16px; line-height: 1.5; color: var(--ink-soft); margin: 0 0 10px; padding-left: 12px; border-left: 3px solid var(--rule); }
  .admin-card-meta { display: flex; gap: 16px; flex-wrap: wrap; font-family: var(--font-label); font-size: 11px; letter-spacing: 0.1em; color: var(--ink-faint); margin-bottom: 12px; }
  .admin-card-meta a { color: var(--ink); border-bottom: 1px solid var(--ink); text-decoration: none; }
  .admin-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .admin-card-actions button { appearance: none; background: transparent; border: 1px solid var(--rule); border-radius: 4px; padding: 6px 12px; font-family: var(--font-label); font-weight: 600; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink); cursor: pointer; }
  .admin-card-actions button:hover { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .admin-empty { padding: 40px 0; text-align: center; font-family: var(--font-display); font-style: italic; font-size: 18px; color: var(--ink-soft); }
  .admin-tallies { padding: 20px 24px; border: 1px solid var(--rule); border-radius: 4px; margin-bottom: 32px; }
  .admin-tallies h2 { font-family: var(--font-display); font-weight: 900; font-size: 18px; margin: 0 0 12px; letter-spacing: -0.01em; }
  .admin-tallies-list { font-family: var(--font-body); font-size: 14px; color: var(--ink-soft); margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; }
  .admin-tallies-list li { display: flex; gap: 12px; }
  .admin-tallies-list li b { color: var(--ink); font-family: var(--font-display); font-weight: 700; min-width: 2em; text-align: right; }
  .admin-tallies-cat { font-family: var(--font-label); font-weight: 700; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--clay); margin-top: 14px; margin-bottom: 6px; }
  .admin-tallies-cat:first-of-type { margin-top: 0; }
</style>
</head>
<body>
${header({ activeSlug: 'admin-picks' })}
<main class="admin-wrap">
  <div class="admin-mast">
    <h1>Reader Picks</h1>
    <span class="private-mark">Private</span>
  </div>

  <div id="auth-gate" class="admin-auth" style="display:none;">
    <label for="admin-key">Admin key</label>
    <input type="password" id="admin-key" placeholder="paste your admin key" autocomplete="off">
    <button class="cover-cta" id="auth-go" type="button">Unlock →</button>
    <div class="admin-error" id="auth-error"></div>
  </div>

  <div id="dashboard" style="display:none;">
    <div class="admin-stats" id="stats"></div>
    <div class="admin-tallies" id="tallies-block" style="display:none;">
      <h2>Running tallies (top picks per category)</h2>
      <div id="tallies-body"></div>
    </div>
    <div class="admin-controls">
      <select id="filter-kind">
        <option value="">All types</option>
        <option value="vote">Votes only</option>
        <option value="tip">Tips only</option>
        <option value="newsletter">Newsletter signups</option>
      </select>
      <select id="filter-cat"><option value="">All categories</option></select>
      <button id="show-handled" type="button">Show handled</button>
      <button id="refresh" type="button">Refresh</button>
      <button id="logout" type="button" class="is-danger">Sign out</button>
    </div>
    <ul class="admin-list" id="list"></ul>
    <div class="admin-empty" id="empty" style="display:none;">No submissions yet.</div>
  </div>
</main>

<script>
  var WORKER_URL = ${JSON.stringify(POLL_WORKER_URL)};
  var KEY_STORAGE = 'bom-admin-key';
  var HANDLED_STORAGE = 'bom-handled-ids';
  var SHOW_HANDLED = false;
  var SUBMISSIONS = [];
  var TALLIES = {};

  function getKey()  { return localStorage.getItem(KEY_STORAGE) || ''; }
  function setKey(k) { localStorage.setItem(KEY_STORAGE, k); }
  function clearKey(){ localStorage.removeItem(KEY_STORAGE); }
  function handledSet() {
    try { return new Set(JSON.parse(localStorage.getItem(HANDLED_STORAGE) || '[]')); }
    catch (_) { return new Set(); }
  }
  function markHandled(id) {
    var s = handledSet(); s.add(id);
    localStorage.setItem(HANDLED_STORAGE, JSON.stringify([...s]));
  }
  function unmarkHandled(id) {
    var s = handledSet(); s.delete(id);
    localStorage.setItem(HANDLED_STORAGE, JSON.stringify([...s]));
  }
  function relativeTime(ts) {
    var diff = Date.now() - ts;
    var mins = Math.round(diff / 60000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return mins + 'm ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24)   return hrs + 'h ago';
    var days = Math.round(hrs / 24);
    if (days < 30)  return days + 'd ago';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function categoryLabel(slug) {
    if (!slug) return '';
    return String(slug).replace(/-/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function fetchSubmissions() {
    var res = await fetch(WORKER_URL + '/admin/recent', {
      headers: { 'X-Admin-Key': getKey() }
    });
    if (res.status === 401) { clearKey(); showAuth('Wrong key. Try again.'); return; }
    if (!res.ok) throw new Error('Worker returned ' + res.status);
    var data = await res.json();
    SUBMISSIONS = data.submissions || [];
    SUBMISSIONS.sort((a,b) => b.ts - a.ts);
    return SUBMISSIONS;
  }

  async function fetchTalliesForCategories(slugs) {
    var out = {};
    await Promise.all(slugs.map(async function(slug){
      try {
        var res = await fetch(WORKER_URL + '/tallies/' + encodeURIComponent(slug));
        if (!res.ok) return;
        out[slug] = await res.json();
      } catch (_) {}
    }));
    return out;
  }

  function showAuth(err) {
    document.getElementById('auth-gate').style.display = '';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('auth-error').textContent = err || '';
  }
  function showDashboard() {
    document.getElementById('auth-gate').style.display = 'none';
    document.getElementById('dashboard').style.display = '';
  }

  function renderStats() {
    var byCat = {};
    SUBMISSIONS.forEach(s => {
      if (!s.category) return; // tips and newsletter signups have no category
      byCat[s.category] = (byCat[s.category]||0)+1;
    });
    var topCats = Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0, 4);
    var html = '<div class="admin-stat"><div class="admin-stat-label">Total</div><div class="admin-stat-value">' + SUBMISSIONS.length + '</div></div>';
    var handled = handledSet().size;
    html += '<div class="admin-stat"><div class="admin-stat-label">Handled</div><div class="admin-stat-value">' + handled + '</div></div>';
    var open = SUBMISSIONS.filter(s => !handledSet().has(s.ts + '-' + (s.ip_hash||''))).length;
    html += '<div class="admin-stat"><div class="admin-stat-label">Open</div><div class="admin-stat-value">' + open + '</div></div>';
    if (topCats[0]) {
      html += '<div class="admin-stat"><div class="admin-stat-label">Top category</div><div class="admin-stat-value" style="font-size:18px;">' + categoryLabel(topCats[0][0]) + '</div></div>';
    }
    document.getElementById('stats').innerHTML = html;
  }

  function renderTallies() {
    var slugs = [...new Set(SUBMISSIONS.map(s => s.category).filter(Boolean))];
    if (slugs.length === 0) {
      document.getElementById('tallies-block').style.display = 'none';
      return;
    }
    fetchTalliesForCategories(slugs).then(function(tallies){
      TALLIES = tallies;
      var block = document.getElementById('tallies-block');
      var body = document.getElementById('tallies-body');
      var html = '';
      slugs.forEach(function(slug){
        var t = tallies[slug];
        if (!t || !t.items || t.items.length === 0) return;
        html += '<div class="admin-tallies-cat">' + categoryLabel(slug) + '</div>';
        html += '<ul class="admin-tallies-list">';
        t.items.slice(0, 5).forEach(function(it){
          html += '<li><b>' + it.count + '</b> <span>' + escapeHtml(it.name) + '</span></li>';
        });
        html += '</ul>';
      });
      if (html) {
        body.innerHTML = html;
        block.style.display = '';
      }
    });
  }

  function populateCategoryFilter() {
    var sel = document.getElementById('filter-cat');
    // Tips + newsletter signups have no category, so drop falsy values.
    var slugs = [...new Set(SUBMISSIONS.map(s => s.category).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">All categories</option>' +
      slugs.map(s => '<option value="' + escapeHtml(s) + '">' + escapeHtml(categoryLabel(s)) + '</option>').join('');
  }

  function renderList() {
    var filterCat = document.getElementById('filter-cat').value;
    var filterKind = document.getElementById('filter-kind').value;
    var handled = handledSet();
    var visible = SUBMISSIONS.filter(s => {
      if (filterKind && (s.kind || 'vote') !== filterKind) return false;
      if (filterCat && s.category !== filterCat) return false;
      var id = s.ts + '-' + (s.ip_hash||'');
      var isHandled = handled.has(id);
      return SHOW_HANDLED ? isHandled : !isHandled;
    });
    var ul = document.getElementById('list');
    var emp = document.getElementById('empty');
    if (visible.length === 0) {
      ul.innerHTML = '';
      emp.style.display = '';
      emp.textContent = SHOW_HANDLED ? 'No handled submissions yet.' : 'Inbox zero. Check back later.';
      return;
    }
    emp.style.display = 'none';
    ul.innerHTML = visible.map(function(s){
      var id = s.ts + '-' + (s.ip_hash||'');
      var isHandled = handled.has(id);
      var kind = s.kind || 'vote';
      var kindLabels = { vote: 'Vote', tip: 'Tip', newsletter: 'Newsletter' };
      var kindColors = { vote: '#E11900', tip: '#1E5AAA', newsletter: '#2E9E4A' };
      var kindLabel = kindLabels[kind] || kind;
      var kindColor = kindColors[kind] || '#666';

      var headline = '';
      var subtext = '';
      if (kind === 'vote') {
        headline = s.place;
        subtext = s.why ? '<p class="admin-card-why">' + escapeHtml(s.why) + '</p>' : '';
      } else if (kind === 'tip') {
        headline = s.place || (s.name ? s.name + "'s tip" : 'Tip');
        subtext = s.message ? '<p class="admin-card-why">' + escapeHtml(s.message) + '</p>' : '';
      } else if (kind === 'newsletter') {
        headline = 'Newsletter signup';
        subtext = '';
      }

      var catLine = (kind === 'vote' && s.category)
        ? '<span class="admin-card-cat">' + escapeHtml(categoryLabel(s.category)) + '</span>'
        : '';
      var kindBadge = '<span class="admin-card-cat" style="background:' + kindColor + ';color:#fff;border:0;">' + kindLabel + '</span>';

      var copyBtn = (kind === 'vote')
        ? '<button data-act="copy" data-id="' + escapeHtml(id) + '">Copy as JS entry</button>'
        : '';

      return '<li class="admin-card' + (isHandled ? ' is-handled' : '') + '" data-id="' + escapeHtml(id) + '">' +
        '<div class="admin-card-head">' +
          kindBadge + catLine +
          '<span class="admin-card-when">' + relativeTime(s.ts) + '</span>' +
        '</div>' +
        '<h3 class="admin-card-place">' + escapeHtml(headline) + '</h3>' +
        subtext +
        '<div class="admin-card-meta">' +
          (s.name ? '<span>From: ' + escapeHtml(s.name) + '</span>' : '') +
          (s.email ? '<span>Email: <a href="mailto:' + escapeHtml(s.email) + '">' + escapeHtml(s.email) + '</a></span>' : '<span>No email</span>') +
          '<span>IP hash: ' + escapeHtml((s.ip_hash||'').slice(0,8)) + '</span>' +
        '</div>' +
        '<div class="admin-card-actions">' +
          copyBtn +
          (isHandled
            ? '<button data-act="unhandle" data-id="' + escapeHtml(id) + '">Move back to open</button>'
            : '<button data-act="handle" data-id="' + escapeHtml(id) + '">Mark handled</button>') +
        '</div>' +
      '</li>';
    }).join('');
  }

  document.addEventListener('click', function(e){
    if (e.target.dataset && e.target.dataset.act) {
      var act = e.target.dataset.act;
      var id = e.target.dataset.id;
      var sub = SUBMISSIONS.find(s => (s.ts + '-' + (s.ip_hash||'')) === id);
      if (!sub) return;
      if (act === 'copy') {
        var snippet = JSON.stringify({
          name: sub.place,
          neighborhood: '',
          style: '',
          description: '',
          address: ''
        }, null, 2);
        if (sub.why) snippet = '// reader said: ' + sub.why.replace(/\\n/g, ' ') + '\\n' + snippet;
        navigator.clipboard.writeText(snippet);
        e.target.textContent = 'Copied!';
        setTimeout(() => e.target.textContent = 'Copy as JS entry', 1200);
      } else if (act === 'handle') {
        markHandled(id);
        renderList(); renderStats();
      } else if (act === 'unhandle') {
        unmarkHandled(id);
        renderList(); renderStats();
      }
    }
  });

  document.getElementById('filter-cat').addEventListener('change', renderList);
  document.getElementById('filter-kind').addEventListener('change', renderList);
  document.getElementById('refresh').addEventListener('click', () => loadAll());
  document.getElementById('show-handled').addEventListener('click', function(){
    SHOW_HANDLED = !SHOW_HANDLED;
    this.textContent = SHOW_HANDLED ? 'Show open' : 'Show handled';
    renderList();
  });
  document.getElementById('logout').addEventListener('click', function(){
    if (!confirm('Sign out and clear the admin key from this browser?')) return;
    clearKey();
    location.reload();
  });
  document.getElementById('auth-go').addEventListener('click', function(){
    var v = document.getElementById('admin-key').value.trim();
    if (!v) return;
    setKey(v);
    loadAll();
  });
  document.getElementById('admin-key').addEventListener('keydown', function(e){
    if (e.key === 'Enter') document.getElementById('auth-go').click();
  });

  async function loadAll() {
    if (!getKey()) { showAuth(); return; }
    try {
      await fetchSubmissions();
      if (!SUBMISSIONS) return;
      showDashboard();
      populateCategoryFilter();
      renderStats();
      renderTallies();
      renderList();
    } catch (e) {
      showAuth(e.message);
    }
  }

  loadAll();
</script>
</body></html>`;
}

function renderAbout() {
  const title = 'About bestofmpls';
  const description = 'A locally written guide to Minneapolis and Saint Paul.';
  return head({ title, description, slug: 'about', theme: 'default' }) +
    header({ activeSlug: 'about' }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">About</div>
        <h1 class="section-title">Made for the metro <em>by the people who live here</em></h1>
      </div>
    </section>
    <section class="wrap">
      <div class="about-body">
        <p>bestofmpls is a guide to the museums, music, theaters, coffee shops, sandwiches, restaurants, bars, hotels, festivals, and small good things that make Minneapolis and Saint Paul worth living in. Two of the best small cities in America, written by the people who actually live here.</p>
        <p>The Twin Cities is a real cultural place. Two great encyclopedic museums. The most theater seats per capita in America after Manhattan. A music scene that has shaped American popular music for half a century. An indie press scene, a food scene that has earned its national attention, and dozens of small neighborhoods that each have their own bar, bookstore, and morning bakery. We do not feel the need to argue any of that anymore.</p>
        <p>The lists are not sponsored. Picks are not paid placements. There is no pay-to-play readers-poll voting. If a place pays to advertise on this site, it will be marked clearly and will not appear in the editorial rankings.</p>
        <p>If you know a place we missed, a correction we need, or a tip we should chase, write to <a href="mailto:hello@bestofmpls.com">hello@bestofmpls.com</a>. We read every note.</p>
      </div>
    </section>` +
    footer();
}

function renderNeighborhoodIndex(neighborhoods) {
  const title = 'Neighborhoods';
  const description = 'Browse the Twin Cities by neighborhood. Every entry on the site mapped to where it lives.';
  return head({ title, description, slug: 'neighborhoods', theme: 'default' }) +
    header({ activeSlug: 'neighborhoods' }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">${neighborhoods.length} neighborhoods</div>
        <h1 class="section-title">By <em>neighborhood</em></h1>
        <p class="section-deck">Every entry on the site, sorted by where it actually lives. Useful when you are trying to plan a single afternoon, or when a friend says "I am staying in the North Loop, where do I go?"</p>
      </div>
    </section>
    <section class="entry-list">
      ${neighborhoods.map((nb, i) => `
        <article class="entry${i === 0 ? ' entry--featured' : ''}">
          <div class="entry-rank">${i === 0 ? '★' : String(i + 1).padStart(2, '0')}</div>
          <div class="entry-body">
            <div class="entry-meta">
              <span>${nb.entries.length} places listed</span>
              ${i === 0 ? '<span class="entry-meta-pick">Most-listed neighborhood</span>' : ''}
            </div>
            <h2 class="entry-name"><a href="/neighborhoods/${nb.slug}/">${esc(nb.name)} →</a></h2>
            <p class="entry-description">${esc(nb.intro)}</p>
          </div>
        </article>
      `).join('')}
    </section>` +
    footer();
}

function renderNeighborhoodPage(nb) {
  const title = `${nb.name} guide`;
  const description = `Every place on bestofmpls in ${nb.name}, from food to music to shops.`;

  // Group this neighborhood's entries by category for clean section breaks
  const byCategory = {};
  for (const item of nb.entries) {
    const k = item.category.slug;
    byCategory[k] = byCategory[k] || { category: item.category, items: [] };
    byCategory[k].items.push(item.entry);
  }
  const sections = Object.values(byCategory).map(group => `
    <section class="nb-section">
      <div class="wrap nb-section-head">
        <div class="cluster-eyebrow">${esc(group.category.title)} · ${group.items.length}</div>
        <a class="cat-card-arrow" href="/${group.category.slug}/">See full list →</a>
      </div>
      <div class="nb-list">
        ${group.items.map(e => `
          <article class="nb-entry">
            <div class="nb-entry-meta">
              ${e.style ? `<span class="entry-meta-style">${esc(e.style)}</span>` : ''}
              ${e.price ? `<span class="entry-footer-price">${esc(e.price)}</span>` : ''}
            </div>
            <h3 class="nb-entry-name">${esc(e.name)}</h3>
            <p class="nb-entry-description">${esc(e.description)}</p>
            <div class="entry-footer">
              ${e.address ? `<span>${esc(e.address)}</span>` : ''}
              ${e.website ? `<a class="entry-website" href="${esc(e.website)}" target="_blank" rel="noopener">${esc(e.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))} →</a>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');

  return head({ title, description, slug: `neighborhoods/${nb.slug}`, theme: 'default' }) +
    header({}) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">Neighborhood guide · ${nb.entries.length} places</div>
        <h1 class="section-title">${esc(nb.name)}</h1>
        <p class="section-deck">${esc(nb.intro)}</p>
        <p style="margin-top: 16px; font-family: var(--font-label); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-soft);"><a href="/neighborhoods/" style="color: var(--clay); border-bottom: 1px solid var(--clay);">← All neighborhoods</a></p>
      </div>
    </section>
    ${sections}` +
    footer();
}

// ---------- First Time / Itineraries page ----------
function renderItineraries() {
  const it = itineraries;
  const description = 'A working playbook for visiting the Twin Cities: 24 hours, a weekend, or a week.';

  const basics = it.basics.map(b => `
    <div class="basic-block">
      <div class="basic-block-label">${esc(b.label)}</div>
      <p class="basic-block-body">${esc(b.body)}</p>
    </div>
  `).join('');

  const plans = it.plans.map((plan, i) => `
    <section class="plan" id="${esc(plan.slug)}">
      <div class="wrap plan-head">
        <div class="cluster-eyebrow">${esc(plan.eyebrow)}</div>
        <h2 class="plan-headline">${esc(plan.headline)}</h2>
        <p class="cluster-deck">${esc(plan.deck)}</p>
      </div>
      <ol class="plan-stops">
        ${plan.stops.map((s, j) => `
          <li class="plan-stop">
            <div class="plan-stop-time">${esc(s.time)}</div>
            <div class="plan-stop-body">
              <h3 class="plan-stop-title">${esc(s.title)}</h3>
              <p class="plan-stop-body-text">${esc(s.body)}</p>
              ${s.linkSlug ? `<a class="plan-stop-link" href="/${esc(s.linkSlug)}/">See the full list →</a>` : ''}
            </div>
          </li>
        `).join('')}
      </ol>
    </section>
  `).join('');

  const planNav = it.plans.map(p => `<a href="#${esc(p.slug)}" class="plan-nav-link">${esc(p.label)}</a>`).join('');

  return head({ title: it.title, description, slug: 'visit', theme: it.hero_color }) +
    header({ activeSlug: 'visit' }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">For visitors</div>
        <h1 class="section-title">${esc(it.title)} <em>?</em></h1>
        <p class="section-deck">${esc(it.intro)}</p>
        <nav class="plan-nav">${planNav}</nav>
      </div>
    </section>
    <section class="basics">
      <div class="wrap basics-grid">${basics}</div>
    </section>
    ${plans}` +
    footer();
}

// ---------- Loon's Nest slang glossary ----------
// ---------- Now Showing / Exhibitions page ----------
function renderExhibitions() {
  const ex = exhibitions;
  const description = 'Current and upcoming art exhibitions at Twin Cities museums and galleries.';

  if (!ex.exhibitions || ex.exhibitions.length === 0) {
    // Empty state. Page exists but lists nothing yet; reads as "monthly refresh in progress."
    return head({ title: ex.title, description, slug: 'now-showing', theme: ex.hero_color }) +
      header({ activeSlug: 'now-showing' }) +
      `<section class="section-head">
        <div class="wrap">
          <div class="section-eyebrow">Currently being researched</div>
          <h1 class="section-title">${esc(ex.title)} <em>across the Twin Cities</em></h1>
          <p class="section-deck">${esc(ex.intro)}</p>
        </div>
      </section>
      <section class="wrap" style="padding: 64px var(--gutter);">
        <p style="font-family: var(--font-body); font-size: 18px; line-height: 1.6; max-width: 640px; color: var(--ink-soft);">This calendar is being compiled right now. Check back in a few hours, or follow individual museums directly: <a href="/museums-and-galleries/" style="color: var(--clay); border-bottom: 1px solid var(--clay);">browse museums and galleries</a>.</p>
      </section>` +
      footer();
  }

  // Group by current vs upcoming
  const current = ex.exhibitions.filter(e => e.type === 'current');
  const upcoming = ex.exhibitions.filter(e => e.type === 'upcoming');

  const renderShow = (e) => `
    <article class="exhibition">
      <div class="exhibition-when">
        <div class="exhibition-dates">${esc(e.dates)}</div>
        <div class="exhibition-venue">${esc(e.venue)}</div>
      </div>
      <div class="exhibition-body">
        <h3 class="exhibition-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} <span class="entry-meta-link-icon">↗</span></a>` : esc(e.title)}</h3>
        ${e.artist ? `<div class="exhibition-artist">${esc(e.artist)}</div>` : ''}
        ${e.subtitle ? `<div class="exhibition-subtitle">${esc(e.subtitle)}</div>` : ''}
        <p class="exhibition-description">${esc(e.description)}</p>
      </div>
    </article>`;

  const sections = [];
  if (current.length) {
    sections.push(`
      <div class="exhibition-section">
        <div class="wrap"><h2 class="exhibition-section-title">Now on view</h2></div>
        <div class="exhibition-list">${current.map(renderShow).join('')}</div>
      </div>`);
  }
  if (upcoming.length) {
    sections.push(`
      <div class="exhibition-section">
        <div class="wrap"><h2 class="exhibition-section-title">Opening soon</h2></div>
        <div class="exhibition-list">${upcoming.map(renderShow).join('')}</div>
      </div>`);
  }

  const lastUpdated = ex.last_updated
    ? `<p style="font-family: var(--font-label); font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); margin-top: 16px;">Last updated ${esc(ex.last_updated)}</p>`
    : '';

  return head({ title: ex.title, description, slug: 'now-showing', theme: ex.hero_color }) +
    header({ activeSlug: 'now-showing' }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">${ex.exhibitions.length} on view</div>
        <h1 class="section-title">${esc(ex.title)} <em>across the Twin Cities</em></h1>
        <p class="section-deck">${esc(ex.intro)}</p>
        ${lastUpdated}
      </div>
    </section>
    ${sections.join('')}` +
    footer();
}

// ---------- Calendar — scraped live events ----------
function renderCalendar() {
  const title = 'The Calendar';
  const description = 'Concerts, openings, talks, and performances at every Twin Cities venue. Updated daily.';
  const allEvents = eventsData.events || [];

  // Films stay out of the calendar entirely. Concerts, talks, openings,
  // performances only. Dedupe on (title, venue, date) to drop occasional
  // same-night double bookings.
  const allShows = dedupeNonFilms(allEvents.filter(e => !isFilmEvent(e)));

  // Window the calendar to roughly the next three weeks. A scrollable forever
  // list is not a calendar — readers want "what's on this week and next."
  // Anything beyond the window stays scrapable but does not render here.
  const WINDOW_DAYS = 21;
  const [ty, tm, td] = TODAY_ISO.split('-').map(Number);
  const cutoff = Date.UTC(ty, tm - 1, td + WINDOW_DAYS);
  const events = allShows.filter(e => {
    if (e.date < TODAY_ISO) return false;
    const [y, m, d] = e.date.split('-').map(Number);
    return Date.UTC(y, m - 1, d) <= cutoff;
  });
  const beyondCount = allShows.filter(e => e.date > TODAY_ISO).length - events.length;

  // Group by ISO date for the primary view.
  const byDate = new Map();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  }
  const dateKeys = [...byDate.keys()].sort();
  // Sort within each day by time, untimed last.
  for (const d of dateKeys) {
    byDate.get(d).sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  }

  // Venues across the whole window — for the filter chips at the top.
  // A reader who wants "just First Ave shows" can click that venue and the
  // others fade out client-side. No forever scroll, no separate venue page.
  const allVenues = [...new Set(allShows.map(e => e.venue))].sort();

  function fmtDay(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  function dayLabel(iso) {
    if (iso === TODAY_ISO) return 'Tonight';
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const todayDt = new Date(Date.UTC(ty, tm - 1, td));
    const days = Math.round((dt - todayDt) / 86400000);
    if (days === 1) return 'Tomorrow';
    return fmtDay(iso);
  }
  function venueAnchor(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  const updated = eventsData.generated_at
    ? new Date(eventsData.generated_at).toLocaleString('en-US', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null;

  const sourcesLine = (eventsData.sources || [])
    .filter(s => s.ok)
    .map(s => `${s.label} (${s.count})`)
    .join(' · ');

  // Venue filter chips. "All venues" first, then alphabetical. Client-side
  // toggle, no page navigation. Works as quick search-by-venue without
  // sending the reader to a separate venue-grouped page.
  const venueChips = `
    <button class="cal-chip cal-chip-all is-on" type="button" data-venue="all">All venues</button>
    ${allVenues.map(v => `<button class="cal-chip" type="button" data-venue="${esc(v)}">${esc(v)}</button>`).join('')}`;

  // Per-day signals — small editorial tags above each day's list. Computed
  // from the data we already have, no extra inputs needed.
  //  - cluster: 3+ shows in one neighborhood that night = "walkable night
  //    in <neighborhood>" (the area is going to feel alive)
  //  - quiet: ≤2 shows total = quiet night
  //  - busy:  8+ shows = lots happening
  function neighborhoodOf(venueNeigh) {
    if (!venueNeigh) return null;
    // venue_neighborhood is "Northeast Minneapolis" or "North Loop, Minneapolis" —
    // collapse to the leading area name only.
    return venueNeigh.split(',')[0].trim();
  }
  function daySignals(iso, events) {
    const tags = [];
    const byNeigh = new Map();
    for (const e of events) {
      const n = neighborhoodOf(e.venue_neighborhood);
      if (!n) continue;
      byNeigh.set(n, (byNeigh.get(n) || 0) + 1);
    }
    const clusters = [...byNeigh.entries()].filter(([_, c]) => c >= 3).sort((a, b) => b[1] - a[1]);
    if (clusters.length) tags.push({ kind: 'cluster', text: `Walkable night in ${clusters[0][0]} · ${clusters[0][1]} shows` });
    if (events.length >= 8) tags.push({ kind: 'busy', text: 'Big night across the metro' });
    else if (events.length <= 2 && iso > TODAY_ISO) tags.push({ kind: 'quiet', text: 'Quiet on the calendar' });
    return tags;
  }

  const dayBlocks = dateKeys.map(iso => {
    const events = byDate.get(iso);
    const signals = daySignals(iso, events);
    const signalsBar = signals.length ? `
        <div class="cal-day-signals">${signals.map(s => `<span class="cal-day-signal cal-day-signal--${esc(s.kind)}">${esc(s.text)}</span>`).join('')}</div>` : '';
    return `
    <section class="cal-day" data-date="${iso}">
      <header class="cal-day-head">
        <h2 class="cal-day-label">${esc(dayLabel(iso))}</h2>
        <span class="cal-day-date">${esc(fmtDay(iso))}</span>
      </header>
      ${signalsBar}
      <ul class="cal-day-list">
        ${events.map(e => `
          <li class="cal-row" data-venue="${esc(e.venue)}">
            <div class="cal-row-when">${e.time ? esc(fmtTime(e.time)) : 'TBA'}</div>
            <div class="cal-row-body">
              <h3 class="cal-row-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} <span class="entry-meta-link-icon">↗</span></a>` : esc(e.title)}</h3>
              <div class="cal-row-venue"><a href="/calendar/venue/${esc(entrySlug(e.venue))}/" class="cal-row-venue-link">${esc(e.venue)}</a>${e.venue_neighborhood ? ` ${nhoodTag(e.venue_neighborhood)}` : ''}</div>
              ${e.subtitle ? `<p class="cal-row-sub">${esc(e.subtitle.slice(0, 140))}${e.subtitle.length > 140 ? '…' : ''}</p>` : ''}
            </div>
          </li>`).join('')}
      </ul>
    </section>`;
  }).join('');

  const beyondNote = beyondCount > 0
    ? `<p class="cal-beyond">${beyondCount} more show${beyondCount === 1 ? '' : 's'} on the books past the next ${WINDOW_DAYS} days.</p>`
    : '';

  const empty = events.length === 0
    ? `<section class="wrap" style="padding: 64px var(--gutter);">
         <p style="font-family: var(--font-body); font-size: 18px; color: var(--ink-soft);">Quiet stretch on the scraped calendar — nothing in the next ${WINDOW_DAYS} days. Refresh in a few hours, or browse the venues directly under <a href="/live-music/" style="color: var(--clay); border-bottom: 1px solid var(--clay);">live music</a>.</p>
       </section>`
    : `<div class="cal-controls">
         <div class="wrap cal-controls-inner">
           <span class="cal-filter-label">Filter by venue:</span>
           <div class="cal-chip-row">${venueChips}</div>
         </div>
       </div>
       <div class="cal-stream">${dayBlocks}</div>
       ${beyondNote}`;

  return head({ title, description, slug: 'calendar', theme: 'forest' }) +
    header({ activeSlug: 'calendar' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${events.length} shows · next ${WINDOW_DAYS} days · ${allVenues.length} venues</div>
         <h1 class="section-title">${esc(title)}</h1>
         <p class="section-deck">${esc(description)}</p>
         ${updated ? `<p style="font-family: var(--font-label); font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); margin-top: 16px;">Last refreshed ${esc(updated)} · sources: ${esc(sourcesLine)}</p>` : ''}
       </div>
     </section>
     ${empty}
     <script>
       (function(){
         var chips = document.querySelectorAll('.cal-chip');
         var rows = document.querySelectorAll('.cal-row');
         var days = document.querySelectorAll('.cal-day');
         function apply(venue){
           chips.forEach(function(c){ c.classList.toggle('is-on', c.dataset.venue === venue); });
           rows.forEach(function(r){
             r.style.display = (venue === 'all' || r.dataset.venue === venue) ? '' : 'none';
           });
           days.forEach(function(d){
             var any = false;
             d.querySelectorAll('.cal-row').forEach(function(r){ if (r.style.display !== 'none') any = true; });
             d.style.display = any ? '' : 'none';
           });
         }
         chips.forEach(function(c){ c.addEventListener('click', function(){ apply(c.dataset.venue); }); });
       })();
     </script>` +
    footer();
}

// ---------- Per-venue detail pages ----------
//
// Each scraped venue gets a page at /calendar/venue/<slug>/ listing all of
// its upcoming shows (not capped at the 21-day window — this is the
// dedicated venue page, so we show the full booking calendar). We also
// attempt to match the venue back to its directory entry under /live-music/
// so the page can link to the entry's neighborhood/address/description.
function resolveVenues() {
  // Manual map from scraped venue name → matching live-music directory entry
  // name. Anything not in the map falls back to a name-only entry.
  const directoryAlias = {
    'First Avenue': 'First Avenue & 7th St Entry',
    '7th St Entry': 'First Avenue & 7th St Entry',
    'Turf Club': 'First Avenue & 7th St Entry',
    'Fine Line': 'The Fine Line Music Cafe',
    'The Cedar Cultural Center': 'Cedar Cultural Center',
    'Palace Theatre': 'Palace Theatre',
    'The Fitzgerald Theater': 'Fitzgerald Theater',
    'Dakota Jazz Club': 'Dakota Jazz Club & Restaurant',
    'The Hook and Ladder': 'The Hook and Ladder Theater',
    'Berlin': 'Berlin'
  };
  // Build a quick lookup of live-music entries.
  const liveMusicByName = new Map();
  for (const e of (liveMusic.entries || [])) liveMusicByName.set(e.name, e);

  const events = (eventsData.events || []).filter(e => !isFilmEvent(e));
  const events_dedup = dedupeNonFilms(events);

  const venues = new Map();
  for (const e of events_dedup) {
    const slug = entrySlug(e.venue);
    if (!venues.has(slug)) {
      const aliasName = directoryAlias[e.venue];
      const dirEntry = aliasName ? liveMusicByName.get(aliasName) : null;
      venues.set(slug, {
        slug,
        name: e.venue,
        neighborhood: e.venue_neighborhood || (dirEntry && dirEntry.neighborhood) || null,
        directory: dirEntry || null,
        events: []
      });
    }
    venues.get(slug).events.push(e);
  }
  // Collapse runs per venue so a four-night dance piece is one row, not four.
  for (const v of venues.values()) {
    v.events = collapseRuns(v.events);
  }
  return [...venues.values()].sort((a, b) => b.events.length - a.events.length);
}

function renderVenuePage(v) {
  const title = v.name;
  const description = `Upcoming live music and events at ${v.name}${v.neighborhood ? ', ' + v.neighborhood : ''}. ${v.events.length} show${v.events.length === 1 ? '' : 's'} on the schedule.`;
  const slug = `calendar/venue/${v.slug}`;

  function fmtTime12(t) {
    if (!t) return 'Time TBA';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  function fmtLong(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function fmtShort(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  // Date label for a single event that might be a multi-night run. Returns
  // "Thursday, May 14" for one night, "May 13–16 (4 nights)" for a run.
  function whenLabel(e) {
    if (!e.run_dates || e.run_dates.length <= 1) return fmtLong(e.run_start || e.date);
    return `${fmtShort(e.run_start)} – ${fmtShort(e.run_end)} · ${e.run_dates.length} nights`;
  }

  // Group by year-month, using run_start so a multi-night piece anchors to
  // its opening date.
  const byMonth = new Map();
  for (const e of v.events) {
    const key = (e.run_start || e.date).slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(e);
  }
  const monthLabel = (key) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const monthBlocks = [...byMonth.keys()].sort().map(key => `
    <section class="venue-month">
      <h2 class="venue-month-label">${esc(monthLabel(key))}</h2>
      <ul class="venue-show-list">
        ${byMonth.get(key).map(e => `
          <li class="venue-show">
            <div class="venue-show-when">
              <div class="venue-show-date">${esc(whenLabel(e))}</div>
              <div class="venue-show-time">${esc(fmtTime12(e.time))}</div>
            </div>
            <div class="venue-show-body">
              <h3 class="venue-show-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} <span class="entry-meta-link-icon">↗</span></a>` : esc(e.title)}</h3>
              ${e.subtitle ? `<p class="venue-show-sub">${esc(e.subtitle.slice(0, 200))}${e.subtitle.length > 200 ? '…' : ''}</p>` : ''}
            </div>
          </li>`).join('')}
      </ul>
    </section>`).join('');

  // The directory description (from live-music.js) is the mythology — the
  // editorial paragraph that tells you WHAT this room actually is. Promote
  // it above the booking schedule on the venue page so the page doesn't
  // read as a database row. Optional ritual_notes field (hand-written
  // local lore) gets its own block below when present.
  const mythologyBlock = v.directory && v.directory.description ? `
    <div class="venue-mythology">
      <p class="venue-mythology-text">${esc(v.directory.description)}</p>
      ${v.directory.ritual_notes ? `
        <div class="venue-mythology-rituals">
          <div class="venue-mythology-eyebrow">Notes from the room</div>
          <p class="venue-mythology-rituals-text">${esc(v.directory.ritual_notes)}</p>
        </div>` : ''}
    </div>` : '';

  const dirInfo = v.directory ? `
    <div class="venue-dir-info">
      ${v.directory.address ? `<div class="venue-dir-row"><span class="venue-dir-label">Address</span><a class="venue-dir-val" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.directory.address)}">${esc(v.directory.address)}</a></div>` : ''}
      ${v.directory.website ? `<div class="venue-dir-row"><span class="venue-dir-label">Official site</span><a class="venue-dir-val" target="_blank" rel="noopener" href="${esc(v.directory.website)}">${esc(v.directory.website.replace(/^https?:\/\//, ''))}</a></div>` : ''}
    </div>` : '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    name: v.name,
    address: v.directory?.address ? { '@type': 'PostalAddress', streetAddress: v.directory.address, addressLocality: 'Minneapolis', addressRegion: 'MN' } : undefined,
    url: `${SITE}/calendar/venue/${v.slug}/`,
    event: v.events.slice(0, 30).map(e => ({
      '@type': 'Event',
      name: e.title,
      startDate: e.date + (e.time ? `T${e.time}:00` : ''),
      url: e.url || undefined,
      location: { '@type': 'Place', name: v.name }
    }))
  };

  return head({ title, description, slug, theme: 'forest' }) +
    header({ activeSlug: 'calendar' }) +
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>
     <section class="venue-hero">
       <div class="wrap venue-hero-inner">
         <div class="venue-hero-breadcrumb"><a href="/calendar/">The Calendar</a> · <span>Venue</span></div>
         <h1 class="venue-hero-name">${esc(v.name)}</h1>
         ${v.neighborhood ? `<div class="venue-hero-neigh">${nhoodTag(v.neighborhood)}</div>` : ''}
         <div class="venue-hero-count">${v.events.length} upcoming show${v.events.length === 1 ? '' : 's'} on the books</div>
         ${mythologyBlock}
         ${dirInfo}
       </div>
     </section>
     <section class="venue-shows">
       <div class="wrap">
         ${monthBlocks}
       </div>
     </section>
     <section class="venue-footer wrap">
       <p><a href="/calendar/">← Back to the full calendar</a>${v.directory ? ` · <a href="/live-music/${entrySlug(v.directory.name)}/">More on ${esc(v.directory.name)} →</a>` : ''}</p>
     </section>` +
    footer();
}

// ---------- /this-weekend/ — Fri/Sat/Sun bundle ----------
function renderWeekend() {
  const allEvents = eventsData.events || [];
  const events = dedupeNonFilms(allEvents.filter(e => !isFilmEvent(e)));

  // Find the next Friday/Saturday/Sunday triplet. If today is Thu, Fri, Sat,
  // or Sun, that means "this" weekend (the one already happening or about to
  // happen). If today is Mon, Tue, Wed, it means the coming Fri.
  const [ty, tm, td] = TODAY_ISO.split('-').map(Number);
  const todayDate = new Date(Date.UTC(ty, tm - 1, td));
  const todayDow = todayDate.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat

  // Days from today to this Friday. If today is Fri/Sat/Sun, "Friday" = the
  // most recent Friday (today or up to 2 days ago).
  let daysToFri;
  if (todayDow === 5) daysToFri = 0;
  else if (todayDow === 6) daysToFri = -1;
  else if (todayDow === 0) daysToFri = -2;
  else daysToFri = 5 - todayDow;

  const friDate = new Date(Date.UTC(ty, tm - 1, td + daysToFri));
  const isoFromDate = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  const friIso = isoFromDate(friDate);
  const satIso = isoFromDate(new Date(Date.UTC(ty, tm - 1, td + daysToFri + 1)));
  const sunIso = isoFromDate(new Date(Date.UTC(ty, tm - 1, td + daysToFri + 2)));

  const weekendDays = [
    { label: 'Friday',   iso: friIso },
    { label: 'Saturday', iso: satIso },
    { label: 'Sunday',   iso: sunIso }
  ];
  for (const d of weekendDays) {
    d.events = events
      .filter(e => e.date === d.iso)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }

  const totalShows = weekendDays.reduce((sum, d) => sum + d.events.length, 0);
  const headlineDate = (function(){
    const [y, m, dd] = friIso.split('-').map(Number);
    return new Date(y, m - 1, dd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  })();
  const endDate = (function(){
    const [y, m, dd] = sunIso.split('-').map(Number);
    return new Date(y, m - 1, dd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  })();

  function fmtTime12(t) {
    if (!t) return 'TBA';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  const dayBlocks = weekendDays.map(d => `
    <section class="weekend-day">
      <header class="weekend-day-head">
        <h2 class="weekend-day-label">${esc(d.label)}</h2>
        <span class="weekend-day-date">${esc((function(){ const [y,m,dd]=d.iso.split('-').map(Number); return new Date(y,m-1,dd).toLocaleDateString('en-US',{month:'short',day:'numeric'}); })())}</span>
        <span class="weekend-day-count">${d.events.length} ${d.events.length === 1 ? 'show' : 'shows'}</span>
      </header>
      ${d.events.length === 0 ? `<p class="weekend-empty">Quiet on the scraped calendar for ${esc(d.label.toLowerCase())}.</p>` : `
        <ul class="weekend-show-list">
          ${d.events.map(e => `
            <li class="weekend-show">
              <div class="weekend-show-when">${esc(fmtTime12(e.time))}</div>
              <div class="weekend-show-body">
                <h3 class="weekend-show-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} <span class="entry-meta-link-icon">↗</span></a>` : esc(e.title)}</h3>
                <div class="weekend-show-venue"><a href="/calendar/venue/${esc(entrySlug(e.venue))}/">${esc(e.venue)}</a>${e.venue_neighborhood ? ` ${nhoodTag(e.venue_neighborhood)}` : ''}</div>
              </div>
            </li>`).join('')}
        </ul>`}
    </section>`).join('');

  return head({ title: 'This Weekend', description: `Friday through Sunday across Minneapolis and Saint Paul. ${totalShows} shows on the calendar between ${headlineDate} and ${endDate}.`, slug: 'this-weekend', theme: 'forest' }) +
    header({ activeSlug: 'this-weekend' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${totalShows} shows · ${headlineDate} to ${endDate}</div>
         <h1 class="section-title">This Weekend</h1>
         <p class="section-deck">Friday through Sunday. Every concert, opening, talk, and performance the scraper found, by day.</p>
       </div>
     </section>
     <section class="weekend-grid">
       <div class="wrap weekend-grid-inner">${dayBlocks}</div>
     </section>` +
    footer();
}

// ---------- Daily horoscope ----------
function renderHoroscope() {
  const title = 'Daily Horoscopes';
  const description = 'A grounded daily reading for the metro. Mood pieces, more than predictions. Refreshed each morning.';
  const data = horoscopeData;
  const date = data.date
    ? (function(){ const [y,m,d] = data.date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); })()
    : null;

  if (!data.horoscopes || data.horoscopes.length === 0) {
    return head({ title, description, slug: 'horoscope', theme: 'midnight' }) +
      header({ activeSlug: 'horoscope' }) +
      `<section class="section-head"><div class="wrap"><h1 class="section-title">${esc(title)}</h1><p class="section-deck">Coming back tomorrow morning.</p></div></section>` +
      footer();
  }

  const cards = data.horoscopes.map(h => `
    <article class="horoscope-card" id="${esc(h.slug)}">
      <header class="horoscope-card-head">
        <span class="horoscope-symbol" aria-hidden="true">${zodiacSvg(h.sign)}</span>
        <h2 class="horoscope-sign">${esc(h.sign)}</h2>
        <span class="horoscope-dates">${esc(h.dates)}</span>
      </header>
      <p class="horoscope-text">${esc(h.text)}</p>
    </article>`).join('');

  return head({ title, description, slug: 'horoscope', theme: 'midnight' }) +
    header({ activeSlug: 'horoscope' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${date ? esc(date) : 'Today'}</div>
         <h1 class="section-title">${esc(title)}</h1>
         <p class="section-deck">${esc(data.intro || description)}</p>
       </div>
     </section>
     <section class="horoscope-grid wrap">
       ${cards}
     </section>` +
    footer();
}

// ---------- The Map — every place geocoded ----------
function renderMap() {
  const title = 'The Map';
  const description = 'Every place in the directory, every event venue, plotted across the metro. Filter by category, click for details.';

  // Build a flat list of points: every entry that has a geocoded address.
  // Hours are inlined when known so the map can offer an Open Now filter
  // computed entirely client-side.
  const points = [];
  const mapSeen = new Set();
  for (const c of categories) {
    if (c.layout === 'seasonal') continue;
    for (const e of c.entries) {
      if (mapSeen.has(e.name)) continue;
      const coords = lookupCoords(c.slug, e);
      if (!coords) continue;
      mapSeen.add(e.name);
      const hLook = hoursData[`${c.slug}:${e.name}`];
      points.push({
        lat: coords.lat,
        lng: coords.lng,
        name: e.name,
        category: c.title,
        cluster: clusters.find(cl => cl.categories.includes(c))?.eyebrow || 'Other',
        slug: c.slug,
        anchor: e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        neighborhood: e.neighborhood || '',
        address: (hLook && hLook.matched_address) || e.address || '',
        url: e.website || null,
        hours: (hLook && hLook.hours && hLook.hours.length > 0) ? hLook.hours : null
      });
    }
  }
  const pointsWithHours = points.filter(p => p.hours).length;

  // Cluster colors map to homepage IA so the map reads like the rest of the site.
  const CLUSTER_COLORS = {
    'See & Experience': '#7B2CBF',
    'Eat': '#E11900',
    'Drink': '#0E5C2F',
    'Shop': '#1E5AAA',
    'Stay & Do': '#B8860B',
    'Other': '#666'
  };

  // Inject all points as a JSON blob. Leaflet on the page reads it client-side.
  const pointsJson = JSON.stringify(points);
  const colorsJson = JSON.stringify(CLUSTER_COLORS);
  const clustersList = ['See & Experience', 'Eat', 'Drink', 'Shop', 'Stay & Do'];

  return head({ title, description, slug: 'map', theme: 'forest' }) +
    header({ activeSlug: 'map' }) +
    `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
     <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
     <section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${points.length} places mapped</div>
         <h1 class="section-title">${esc(title)}</h1>
         <p class="section-deck">${esc(description)}</p>
       </div>
     </section>
     <div class="map-controls">
       <div class="wrap map-controls-inner">
         <span class="cal-filter-label">Show:</span>
         <button class="cal-chip cal-chip-all is-on" data-cluster="all" type="button">All ${points.length}</button>
         ${clustersList.map(cl => `<button class="cal-chip" data-cluster="${esc(cl)}" type="button" style="--chip-color:${CLUSTER_COLORS[cl]}">${esc(cl)}</button>`).join('')}
         ${pointsWithHours >= 5 ? `<button class="cal-chip cal-chip-opennow" data-opennow="1" type="button"><span class="opennow-dot"></span> Open right now (${pointsWithHours} have hours)</button>` : ''}
       </div>
     </div>
     <div id="bom-map" class="bom-map"></div>
     <script>
       (function(){
         var POINTS = ${pointsJson};
         var COLORS = ${colorsJson};
         var map = L.map('bom-map', { scrollWheelZoom: true }).setView([44.96, -93.18], 11);
         L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
           attribution: '© OpenStreetMap contributors © CARTO',
           subdomains: 'abcd', maxZoom: 19
         }).addTo(map);

         var markers = POINTS.map(function(p){
           var color = COLORS[p.cluster] || '#666';
           var icon = L.divIcon({
             className: 'bom-marker',
             html: '<span style="background:'+color+'"></span>',
             iconSize: [14, 14], iconAnchor: [7, 7]
           });
           var m = L.marker([p.lat, p.lng], { icon: icon });
           m.cluster = p.cluster;
           var html = '<div class="bom-popup">' +
             '<div class="bom-popup-cat" style="color:'+color+'">'+p.category+'</div>' +
             '<div class="bom-popup-name"><a href="/'+p.slug+'/#'+p.anchor+'">'+p.name+'</a></div>' +
             (p.neighborhood ? '<div class="bom-popup-neigh">'+p.neighborhood+'</div>' : '') +
             '</div>';
           m.bindPopup(html);
           m.addTo(map);
           return m;
         });

         var state = { cluster: 'all', openOnly: false };
         function applyFilters() {
           markers.forEach(function(m, i){
             var p = POINTS[i];
             var clusterOk = (state.cluster === 'all' || p.cluster === state.cluster);
             var openOk = !state.openOnly || (p.hours && isOpenNow(p.hours));
             if (clusterOk && openOk) m.addTo(map);
             else map.removeLayer(m);
           });
         }
         function isOpenNow(periods) {
           var now = new Date();
           var dow = now.getDay();
           var nm = now.getHours() * 60 + now.getMinutes();
           function pt(s){ var p = s.split(':'); return parseInt(p[0],10)*60 + parseInt(p[1],10); }
           for (var i = 0; i < periods.length; i++){
             var p = periods[i];
             if (p.day !== dow) continue;
             var o = pt(p.open), c = p.close ? pt(p.close) : 1440;
             if (c <= o) c += 1440;
             if (nm >= o && nm < c) return true;
           }
           var yest = (dow + 6) % 7;
           for (var j = 0; j < periods.length; j++){
             var q = periods[j]; if (q.day !== yest || !q.close) continue;
             var oo = pt(q.open), cc = pt(q.close);
             if (cc <= oo && nm < cc) return true;
           }
           return false;
         }
         var clusterChips = document.querySelectorAll('.cal-chip[data-cluster]');
         clusterChips.forEach(function(c){
           c.addEventListener('click', function(){
             state.cluster = c.dataset.cluster;
             clusterChips.forEach(function(x){ x.classList.toggle('is-on', x.dataset.cluster === state.cluster); });
             applyFilters();
           });
         });
         var openChip = document.querySelector('.cal-chip[data-opennow]');
         if (openChip) openChip.addEventListener('click', function(){
           state.openOnly = !state.openOnly;
           openChip.classList.toggle('is-on', state.openOnly);
           applyFilters();
         });
       })();
     </script>` +
    footer();
}

// ---------- Departed — closure tracker ----------
function renderDeparted() {
  const c = closures;
  const description = 'Twin Cities places that have closed. A running record.';
  const items = c.entries.map(e => `
    <article class="departed-entry">
      <div class="departed-when">
        <div class="departed-closed">${esc(e.closed)}</div>
        <div class="departed-opened">opened ${esc(e.opened)}</div>
      </div>
      <div class="departed-body">
        <h3 class="departed-name">${esc(e.name)}</h3>
        <div class="departed-meta">${esc(e.kind)} · ${esc(e.neighborhood)}</div>
        <p class="departed-epitaph">${esc(e.epitaph)}</p>
      </div>
    </article>`).join('');
  return head({ title: c.title, description, slug: 'departed', theme: 'midnight' }) +
    header({ activeSlug: 'departed' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${c.entries.length} entries · running list</div>
         <h1 class="section-title">${esc(c.title)}</h1>
         <p class="section-deck">${esc(c.intro)}</p>
       </div>
     </section>
     <section class="departed-list wrap">${items}</section>` +
    footer();
}

// ---------- Take Them To — situational picks ----------
function renderSituations() {
  const s = situations;
  const description = 'Curated mini-itineraries for specific people and specific kinds of evenings.';
  // Hide snow-day during the warm half of the year. Returns in October.
  const COLD_SLUGS = new Set(['snow-day']);
  const visibleSituations = IS_WARM_SEASON
    ? s.situations.filter(sit => !COLD_SLUGS.has(sit.slug))
    : s.situations;
  const cards = visibleSituations.map(sit => `
    <article class="situation" id="${esc(sit.slug)}">
      <header class="situation-head">
        <h2 class="situation-title">${esc(sit.title)}</h2>
        <p class="situation-deck">${esc(sit.deck)}</p>
      </header>
      <ol class="situation-picks">
        ${sit.picks.map(p => `
          <li class="situation-pick">
            <div class="situation-pick-kind">${esc(p.kind)}</div>
            <div class="situation-pick-name">${esc(p.name)}</div>
            <div class="situation-pick-where">${esc(p.neighborhood)}</div>
            <p class="situation-pick-why">${esc(p.why)}</p>
          </li>
        `).join('')}
      </ol>
    </article>`).join('');
  return head({ title: s.title, description, slug: 'take-them-to', theme: 'forest' }) +
    header({ activeSlug: 'take-them-to' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${visibleSituations.length} situations</div>
         <h1 class="section-title">${esc(s.title)}</h1>
         <p class="section-deck">${esc(s.intro)}</p>
       </div>
     </section>
     <section class="situations-list wrap">${cards}</section>` +
    footer();
}

// ---------- Today — the daily small good thing ----------
function renderToday() {
  const t = todayData;
  const title = 'Today';
  const description = 'A daily small good thing. One short essay about a moment, a place, a texture of life in the metro.';
  if (!t) {
    return head({ title, description, slug: 'today', theme: 'midnight' }) +
      header({ activeSlug: 'today' }) +
      `<section class="section-head"><div class="wrap"><h1 class="section-title">${esc(title)}</h1><p class="section-deck">Coming back tomorrow morning.</p></div></section>` +
      footer();
  }
  const date = (function(){ const [y,m,d] = t.date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); })();

  return head({ title: `${title}: ${t.title}`, description, slug: 'today', theme: 'midnight' }) +
    header({ activeSlug: 'today' }) +
    `<section class="today-page">
       <article class="today-essay wrap">
         <div class="today-eyebrow">${esc(date)} · A small good thing</div>
         <h1 class="today-title">${esc(t.title)}</h1>
         <p class="today-body">${esc(t.body)}</p>
         <div class="today-foot">
           <span>${t.word_count} words</span>
           <span>·</span>
           <a href="/horoscope/">Today's horoscope →</a>
           <span>·</span>
           <a href="/calendar/">Tonight's events →</a>
         </div>
       </article>
     </section>` +
    footer();
}

// ---------- Surprise — random place ----------
function renderSurprise() {
  const title = 'Surprise me';
  const description = 'A random place from the directory, picked fresh on every visit. A small antidote to overthinking your Saturday.';

  // Build a flat list of all entries with metadata, JSON-ified for client.
  const allEntries = [];
  for (const c of categories) {
    if (c.layout === 'seasonal') continue;
    for (const e of c.entries) {
      allEntries.push({
        name: e.name,
        category: c.title,
        slug: c.slug,
        anchor: e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        neighborhood: e.neighborhood || '',
        description: e.description || '',
        address: e.address || ''
      });
    }
  }

  return head({ title, description, slug: 'surprise', theme: 'forest' }) +
    header({ activeSlug: 'surprise' }) +
    `<section class="surprise-page">
       <div class="wrap surprise-inner">
         <div class="section-eyebrow">${allEntries.length} places · one at random</div>
         <div id="surprise-card" class="surprise-card"><p style="font-family: var(--font-body); color: var(--ink-soft);">Loading a place...</p></div>
         <button id="surprise-again" class="cover-cta surprise-button" type="button">Pick another</button>
       </div>
     </section>
     <script>
       var ALL = ${JSON.stringify(allEntries)};
       function pick() {
         var e = ALL[Math.floor(Math.random() * ALL.length)];
         var html = '<div class="surprise-cat">' + e.category + '</div>' +
           '<h1 class="surprise-name"><a href="/' + e.slug + '/#' + e.anchor + '">' + e.name + '</a></h1>' +
           (e.neighborhood ? '<div class="surprise-where">' + e.neighborhood + '</div>' : '') +
           (e.description ? '<p class="surprise-desc">' + e.description + '</p>' : '') +
           (e.address ? '<div class="surprise-addr"><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.address) + '" target="_blank" rel="noopener">' + e.address + ' ↗</a></div>' : '');
         document.getElementById('surprise-card').innerHTML = html;
       }
       pick();
       document.getElementById('surprise-again').addEventListener('click', pick);
     </script>` +
    footer();
}

// ---------- Featured event landing pages ----------
// One page per entry in featured-events.js. Routes always exist (so the URL
// is shareable year-round) but the homepage banner only surfaces while the
// event is inside its window.
function renderFeaturedEvent(ev) {
  const title = `${ev.name} ${ev.year}`;
  const description = ev.teaser;
  const isActive = TODAY_ISO >= ev.starts && TODAY_ISO <= ev.ends;
  const isUpcoming = TODAY_ISO < ev.starts;

  // Schema.org Event JSON-LD — gets the page into Google's event rich results.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Festival',
    name: `${ev.name} ${ev.year}`,
    description: ev.intro,
    startDate: ev.starts,
    endDate: ev.ends,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: ev.location,
      address: { '@type': 'PostalAddress', addressLocality: 'Minneapolis', addressRegion: 'MN' },
      geo: ev.coords ? { '@type': 'GeoCoordinates', latitude: ev.coords.lat, longitude: ev.coords.lng } : undefined
    },
    organizer: { '@type': 'Organization', name: 'Northeast Minneapolis Arts Association (NEMAA)', url: 'https://nemaa.org' },
    url: `${SITE}/${ev.slug}/`,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: ev.official_url || `${SITE}/${ev.slug}/` }
  };

  const statusLabel = isActive ? featureDaysLabel(ev) : (isUpcoming ? featureDaysLabel(ev) : 'Wrapped');

  return head({ title, description, slug: ev.slug, theme: 'forest' }) +
    header({ activeSlug: ev.slug }) +
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>
     <section class="event-hero">
       <div class="wrap event-hero-inner">
         <div class="event-hero-status">
           ${(isActive || isUpcoming) ? '<span class="feature-banner-pulse" aria-hidden="true"></span>' : ''}
           <span>${esc(statusLabel)}</span>
         </div>
         <h1 class="event-hero-headline">${esc(ev.name)}</h1>
         <p class="event-hero-tagline">${esc(ev.tagline)}</p>
         <div class="event-hero-meta">
           <div class="event-meta-item"><span class="event-meta-label">Dates</span><span class="event-meta-val">${esc(ev.dates_display)}</span></div>
           <div class="event-meta-item"><span class="event-meta-label">Hours</span><span class="event-meta-val">${esc(ev.hours_display)}</span></div>
           <div class="event-meta-item"><span class="event-meta-label">Where</span><span class="event-meta-val">${esc(ev.location)}</span></div>
           <div class="event-meta-item"><span class="event-meta-label">Price</span><span class="event-meta-val">Free</span></div>
         </div>
         ${ev.official_url ? `<a class="event-hero-link" href="${esc(ev.official_url)}" target="_blank" rel="noopener">Official site →</a>` : ''}
       </div>
     </section>

     <section class="event-body wrap">
       <div class="event-intro">${esc(ev.intro)}</div>
     </section>

     <section class="event-anchors wrap">
       <h2 class="event-section-title">Anchor buildings</h2>
       <p class="event-section-deck">Six places to start. You will not see them all, and that is fine. Pick two, walk slow, talk to the people behind the work.</p>
       <ul class="event-anchors-list">
         ${ev.anchors.map(a => `
           <li class="event-anchor">
             <div class="event-anchor-head">
               <h3 class="event-anchor-name">${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)}</a>` : esc(a.name)}</h3>
               <div class="event-anchor-address">${esc(a.address)}</div>
             </div>
             <p class="event-anchor-why">${esc(a.why)}</p>
           </li>
         `).join('')}
       </ul>
     </section>

     <section class="event-tips wrap">
       <h2 class="event-section-title">Plan</h2>
       <ul class="event-tips-list">
         ${ev.tips.map(t => `<li>${esc(t)}</li>`).join('')}
       </ul>
     </section>

     ${ev.pairings && ev.pairings.length ? `
     <section class="event-pairings wrap">
       <h2 class="event-section-title">Eat and drink while you're up there</h2>
       <ul class="event-pairings-list">
         ${ev.pairings.map(p => `
           <li class="event-pairing">
             <div class="event-pairing-name">${esc(p.name)}</div>
             <p class="event-pairing-why">${esc(p.why)}</p>
           </li>`).join('')}
       </ul>
     </section>` : ''}

     <section class="event-footer wrap">
       <p>The directory has more on what to do in Northeast: <a href="/breweries/">breweries</a>, <a href="/coffee/">coffee</a>, <a href="/pizza/">pizza</a>, <a href="/museums/">galleries and arts buildings</a>.</p>
     </section>` +
    newsletterCapture({ context: 'event' }) +
    footer();
}

// ---------- /tonight/ — what is happening tonight, plus sunset + countdowns ----------
//
// Static-site freshness trap: the page is rebuilt on cron, so between
// midnight and the next build run, the server-baked "today" is yesterday.
// At 12:50 AM Thursday, the static page would still call Wednesday's events
// "Happening tonight." The fix is client-side: bundle a week's worth of
// events into the page as JSON, let the browser compute the real current
// Central date on load, and pick the right "tonight" and "tomorrow" sets
// from that bundle. Server-side render is the JS-disabled fallback.
function renderTonight() {
  const r = rightnowData;
  const title = 'Tonight';
  const description = 'Concerts, openings, talks, and screenings happening tonight in Minneapolis and Saint Paul. Plus sunset, weather, and what is coming up next.';

  if (!r) {
    return head({ title, description, slug: 'tonight', theme: 'midnight' }) +
      header({ activeSlug: 'tonight' }) +
      `<section class="section-head"><div class="wrap"><h1 class="section-title">${esc(title)}</h1><p class="section-deck">Live data unavailable right now. Check back in an hour.</p></div></section>` +
      footer();
  }

  // Bundle a week's worth of upcoming events, films excluded.
  const allUpcoming = dedupeNonFilms(
    (eventsData.events || []).filter(e => !isFilmEvent(e) && e.date >= r.today)
  );
  // Slim event records so the inline JSON stays small.
  const bundle = allUpcoming.map(e => ({
    d: e.date,
    t: e.time || null,
    n: e.title,
    v: e.venue,
    vs: entrySlug(e.venue),
    nh: e.venue_neighborhood || null,
    nc: e.venue_neighborhood ? neighborhoodCode(e.venue_neighborhood) : null,
    s: e.subtitle ? (e.subtitle.length > 200 ? e.subtitle.slice(0, 200) + '…' : e.subtitle) : null,
    u: e.url || null
  }));

  // Server-rendered fallback for no-JS readers — uses the build's TODAY_ISO,
  // same as before. JS replaces this on load using the user's clock.
  function eventsOnDate(iso) {
    return allUpcoming
      .filter(e => e.date === iso)
      .sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });
  }
  const tonightEventsServer = eventsOnDate(r.today);
  const tomorrowIso = (function(){
    const [y, m, d] = r.today.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d)); dt.setUTCDate(dt.getUTCDate() + 1);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
  })();
  const tomorrowEventsServer = eventsOnDate(tomorrowIso);

  function fmtTime12(t) {
    if (!t) return 'Time TBA';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  const eventRow = (e) => `
    <li class="tonight-event">
      <div class="tonight-event-time">${esc(fmtTime12(e.time))}</div>
      <div class="tonight-event-body">
        <h3 class="tonight-event-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} <span class="entry-meta-link-icon">↗</span></a>` : esc(e.title)}</h3>
        <div class="tonight-event-meta">
          <a class="tonight-event-venue" href="/calendar/venue/${esc(entrySlug(e.venue))}/">${esc(e.venue)}</a>
          ${e.venue_neighborhood ? nhoodTag(e.venue_neighborhood) : ''}
        </div>
        ${e.subtitle ? `<p class="tonight-event-sub">${esc(e.subtitle.slice(0, 200))}${e.subtitle.length > 200 ? '…' : ''}</p>` : ''}
      </div>
    </li>`;

  const renderTonightBlock = (events) => events.length ? `
      <div class="wrap">
        <div class="tonight-section-eyebrow" data-tonight-count>${events.length} ${events.length === 1 ? 'show' : 'shows'} tonight</div>
        <h2 class="tonight-section-title">Happening tonight</h2>
        <ul class="tonight-events-list">${events.map(eventRow).join('')}</ul>
      </div>` : `
      <div class="wrap">
        <h2 class="tonight-section-title">Happening tonight</h2>
        <p class="tonight-empty">Quiet night on the scraped calendar. <a href="/calendar/">See what is coming up later this week →</a></p>
      </div>`;

  const renderTomorrowBlock = (events) => events.length ? `
      <div class="wrap">
        <div class="tonight-section-eyebrow">Tomorrow night</div>
        <h2 class="tonight-section-title">${events.length} ${events.length === 1 ? 'show' : 'shows'} tomorrow</h2>
        <ul class="tonight-events-list">${events.slice(0, 6).map(eventRow).join('')}</ul>
        ${events.length > 6 ? `<a class="tonight-more" href="/calendar/">See all ${events.length} →</a>` : ''}
      </div>` : '';

  const pickCard = `
    <article class="tonight-pick">
      <div class="tonight-pick-eyebrow">Tonight's sunset pick</div>
      <h2 class="tonight-pick-name">${esc(r.sunset_pick.name)}</h2>
      <div class="tonight-pick-where">${esc(r.sunset_pick.neighborhood)}</div>
      <p class="tonight-pick-why">${esc(r.sunset_pick.why)}</p>
    </article>`;

  const countdowns = r.countdowns.map(c => `
    <li class="countdown">
      <div class="countdown-days">
        <span class="countdown-num">${c.days}</span>
        <span class="countdown-unit">${c.days === 1 ? 'day' : 'days'} until</span>
      </div>
      <div class="countdown-body">
        <div class="countdown-name">${esc(c.name)}</div>
        <div class="countdown-blurb">${esc(c.blurb)}</div>
      </div>
    </li>`).join('');

  // Build-time fallback for the headline (count + day name).
  const builtDayLabel = (function(){
    const [y,m,d] = r.today.split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  })();

  return head({ title, description, slug: 'tonight', theme: 'midnight' }) +
    header({ activeSlug: 'tonight' }) +
    `<section class="tonight-hero">
       <div class="wrap tonight-hero-inner">
         <div class="tonight-hero-eyebrow" data-tonight-hero-eyebrow>${esc(builtDayLabel)} · Tonight in the metro</div>
         <h1 class="tonight-hero-headline" data-tonight-hero-headline>
           <span data-tonight-hero-count>${tonightEventsServer.length}</span> <span data-tonight-hero-noun>${tonightEventsServer.length === 1 ? 'show' : 'shows'}</span> tonight.
         </h1>
         <div class="tonight-hero-marquee">
           <span class="tonight-hero-temp"><span class="tonight-hero-temp-num">${r.weather.temp_now}</span><span class="tonight-hero-temp-unit">°F</span></span>
           <span class="tonight-hero-condition">${esc(r.weather.condition)}</span>
         </div>
         <div class="tonight-hero-meta">
           <div class="tonight-meta-item"><span class="tonight-meta-label">Sunset</span><span class="tonight-meta-val">${esc(r.sun.set)}</span></div>
           <div class="tonight-meta-item"><span class="tonight-meta-label">Sunrise tomorrow</span><span class="tonight-meta-val">${esc(r.sun.rise)}</span></div>
           <div class="tonight-meta-item"><span class="tonight-meta-label">Daylight today</span><span class="tonight-meta-val">${Math.floor(r.sun.daylight_min/60)}h ${r.sun.daylight_min%60}m</span></div>
         </div>
       </div>
     </section>
     <section class="tonight-events-section" data-tonight-today-block>${renderTonightBlock(tonightEventsServer)}</section>
     <section class="tonight-events-section tonight-events-tomorrow" data-tonight-tomorrow-block>${renderTomorrowBlock(tomorrowEventsServer)}</section>
     <section class="tonight-pick-section wrap">${pickCard}</section>
     <section class="tonight-countdowns wrap">
       <h2 class="tonight-section-title">Coming up on the calendar</h2>
       <ul class="countdowns-list">${countdowns}</ul>
     </section>
     <script id="tonight-events-data" type="application/json">${JSON.stringify(bundle)}</script>
     <script>
     (function(){
       // Find today's Central date even when the server-baked TODAY_ISO is
       // a build or two stale.
       function centralIso(d){
         var f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year:'numeric', month:'2-digit', day:'2-digit' });
         return f.format(d);
       }
       function isoPlus(iso, days){
         var p = iso.split('-').map(Number);
         var d = new Date(Date.UTC(p[0], p[1]-1, p[2]));
         d.setUTCDate(d.getUTCDate() + days);
         return d.getUTCFullYear() + '-' + String(d.getUTCMonth()+1).padStart(2,'0') + '-' + String(d.getUTCDate()).padStart(2,'0');
       }
       function fmtTime(t){
         if (!t) return 'Time TBA';
         var p = t.split(':').map(Number);
         var h = p[0], m = p[1], ampm = h >= 12 ? 'PM' : 'AM';
         var hr = h % 12 === 0 ? 12 : h % 12;
         return hr + ':' + String(m).padStart(2,'0') + ' ' + ampm;
       }
       function esc(s){
         return String(s == null ? '' : s)
           .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
           .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
       }
       function rowHtml(e){
         var venueLink = '<a class="tonight-event-venue" href="/calendar/venue/' + esc(e.vs) + '/">' + esc(e.v) + '</a>';
         var neigh = e.nh ? '<span class="nhood-tag" title="' + esc(e.nh) + '">' + (e.nc ? '<span class="nhood-tag-code">' + esc(e.nc) + '</span>' : '') + '<span class="nhood-tag-name">' + esc(e.nh) + '</span></span>' : '';
         var titleHtml = e.u
           ? '<a href="' + esc(e.u) + '" target="_blank" rel="noopener">' + esc(e.n) + ' <span class="entry-meta-link-icon">↗</span></a>'
           : esc(e.n);
         var sub = e.s ? '<p class="tonight-event-sub">' + esc(e.s) + '</p>' : '';
         return '<li class="tonight-event">' +
           '<div class="tonight-event-time">' + esc(fmtTime(e.t)) + '</div>' +
           '<div class="tonight-event-body">' +
             '<h3 class="tonight-event-title">' + titleHtml + '</h3>' +
             '<div class="tonight-event-meta">' + venueLink + ' ' + neigh + '</div>' +
             sub +
           '</div>' +
         '</li>';
       }
       function dayLabel(iso){
         var p = iso.split('-').map(Number);
         var d = new Date(p[0], p[1]-1, p[2]);
         return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
       }

       var dataEl = document.getElementById('tonight-events-data');
       if (!dataEl) return;
       var events;
       try { events = JSON.parse(dataEl.textContent); } catch (_) { return; }

       var today = centralIso(new Date());
       var tomorrow = isoPlus(today, 1);

       function byDate(iso){
         return events.filter(function(e){ return e.d === iso; }).sort(function(a,b){
           if (a.t && b.t) return a.t < b.t ? -1 : (a.t > b.t ? 1 : 0);
           if (a.t) return -1;
           if (b.t) return 1;
           return 0;
         });
       }
       var todayEvents = byDate(today);
       var tomorrowEvents = byDate(tomorrow);

       // Hero: count + day label.
       var eyebrow = document.querySelector('[data-tonight-hero-eyebrow]');
       if (eyebrow) eyebrow.textContent = dayLabel(today) + ' · Tonight in the metro';
       var countEl = document.querySelector('[data-tonight-hero-count]');
       var nounEl  = document.querySelector('[data-tonight-hero-noun]');
       if (countEl) countEl.textContent = todayEvents.length;
       if (nounEl)  nounEl.textContent  = todayEvents.length === 1 ? 'show' : 'shows';

       // Today block.
       var todayBlock = document.querySelector('[data-tonight-today-block]');
       if (todayBlock) {
         if (todayEvents.length === 0) {
           todayBlock.innerHTML = '<div class="wrap"><h2 class="tonight-section-title">Happening tonight</h2><p class="tonight-empty">Quiet night on the scraped calendar. <a href="/calendar/">See what is coming up later this week →</a></p></div>';
         } else {
           todayBlock.innerHTML = '<div class="wrap">' +
             '<div class="tonight-section-eyebrow">' + todayEvents.length + ' ' + (todayEvents.length === 1 ? 'show' : 'shows') + ' tonight</div>' +
             '<h2 class="tonight-section-title">Happening tonight</h2>' +
             '<ul class="tonight-events-list">' + todayEvents.map(rowHtml).join('') + '</ul>' +
           '</div>';
         }
       }

       // Tomorrow block.
       var tomorrowBlock = document.querySelector('[data-tonight-tomorrow-block]');
       if (tomorrowBlock) {
         if (tomorrowEvents.length === 0) {
           tomorrowBlock.innerHTML = '';
         } else {
           var moreLink = tomorrowEvents.length > 6 ? '<a class="tonight-more" href="/calendar/">See all ' + tomorrowEvents.length + ' →</a>' : '';
           tomorrowBlock.innerHTML = '<div class="wrap">' +
             '<div class="tonight-section-eyebrow">Tomorrow night</div>' +
             '<h2 class="tonight-section-title">' + tomorrowEvents.length + ' ' + (tomorrowEvents.length === 1 ? 'show' : 'shows') + ' tomorrow</h2>' +
             '<ul class="tonight-events-list">' + tomorrowEvents.slice(0, 6).map(rowHtml).join('') + '</ul>' +
             moreLink +
           '</div>';
         }
       }
     })();
     </script>` +
    footer();
}

// ---------- /near/ — what's within walking distance of you ----------
function renderNear() {
  const title = 'Near you';
  const description = 'Tap the button to share your location. We will list every place in the directory within walking distance.';

  // Inline every entry that has coords. Client-side sorts by haversine
  // distance from the user's geolocation. No network needed.
  // Dedup: many entries appear in multiple categories (Quang in restaurants
  // and vietnamese, Bauhaus in breweries and patios). Keep the first
  // occurrence so the same place doesn't appear twice in the results.
  const points = [];
  const seenNames = new Set();
  for (const c of categories) {
    if (c.layout === 'seasonal') continue;
    for (const e of c.entries) {
      if (seenNames.has(e.name)) continue;
      const coords = lookupCoords(c.slug, e);
      if (!coords) continue;
      seenNames.add(e.name);
      const hLook = hoursData[`${c.slug}:${e.name}`];
      points.push({
        lat: coords.lat,
        lng: coords.lng,
        name: e.name,
        category: c.title,
        cluster: clusters.find(cl => cl.categories.includes(c))?.eyebrow || 'Other',
        slug: c.slug,
        anchor: e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        neighborhood: e.neighborhood || '',
        hours: (hLook && hLook.hours && hLook.hours.length > 0) ? hLook.hours : null
      });
    }
  }

  return head({ title, description, slug: 'near', theme: 'forest' }) +
    header({ activeSlug: 'near' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${points.length} places mapped</div>
         <h1 class="section-title">${esc(title)}</h1>
         <p class="section-deck">${esc(description)} Nothing leaves your browser, no app to install, no sign-in.</p>
       </div>
     </section>
     <section class="near-controls">
       <div class="wrap near-controls-inner">
         <button id="near-locate" class="cover-cta" type="button">Find places near me</button>
         <div id="near-radius-group" class="near-radius-group" style="display:none;">
           <span class="cal-filter-label">Radius:</span>
           <button class="cal-chip" data-radius="0.5" type="button">5 min walk</button>
           <button class="cal-chip is-on" data-radius="1.0" type="button">10 min walk</button>
           <button class="cal-chip" data-radius="1.5" type="button">15 min walk</button>
           <button class="cal-chip" data-radius="3.0" type="button">Drive</button>
           <button class="cal-chip cal-chip-opennow" id="near-opennow" type="button"><span class="opennow-dot"></span> Open right now</button>
           <span class="opennow-note" id="near-status"></span>
         </div>
       </div>
     </section>
     <section id="near-results" class="near-results wrap"></section>
     <script>
       (function(){
         var POINTS = ${JSON.stringify(points)};
         var state = { lat: null, lng: null, radius: 1.0, openOnly: false };

         function haversineMi(lat1, lng1, lat2, lng2) {
           var R = 3958.8;
           var toR = function(d){ return d * Math.PI / 180; };
           var dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
           var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(toR(lat1)) * Math.cos(toR(lat2)) *
                   Math.sin(dLng/2) * Math.sin(dLng/2);
           return 2 * R * Math.asin(Math.sqrt(a));
         }
         function isOpenNow(periods){
           if (!periods) return null;
           var now = new Date(), dow = now.getDay(), nm = now.getHours()*60 + now.getMinutes();
           function pt(s){ var p = s.split(':'); return parseInt(p[0],10)*60 + parseInt(p[1],10); }
           for (var i=0;i<periods.length;i++){ var p=periods[i]; if (p.day!==dow) continue; var o=pt(p.open), c=p.close?pt(p.close):1440; if (c<=o) c+=1440; if (nm>=o && nm<c) return true; }
           var y = (dow+6)%7;
           for (var j=0;j<periods.length;j++){ var q=periods[j]; if (q.day!==y || !q.close) continue; var oo=pt(q.open), cc=pt(q.close); if (cc<=oo && nm<cc) return true; }
           return false;
         }
         function render(){
           if (state.lat === null) return;
           var nearby = POINTS.map(function(p){
             return { p: p, d: haversineMi(state.lat, state.lng, p.lat, p.lng) };
           }).filter(function(x){
             if (x.d > state.radius) return false;
             if (state.openOnly && !(x.p.hours && isOpenNow(x.p.hours))) return false;
             return true;
           }).sort(function(a, b){ return a.d - b.d; });

           var status = document.getElementById('near-status');
           status.textContent = nearby.length + ' places within ' + state.radius + ' mile' + (state.radius === 1 ? '' : 's') + (state.openOnly ? ', open now' : '');

           var html = '';
           if (nearby.length === 0) {
             html = '<p class="near-empty">No places in the directory within that radius. Try a wider one, or you may be outside the central metro.</p>';
           } else {
             html = '<ul class="near-list">' + nearby.map(function(x){
               var open = isOpenNow(x.p.hours);
               var statusBadge = open === true ? '<span class="status-pip is-open"></span> Open' :
                                 open === false ? '<span class="status-pip is-closed"></span> Closed' : '';
               var dist = x.d < 0.1 ? (Math.round(x.d*5280)) + ' ft' : x.d.toFixed(1) + ' mi';
               return '<li class="near-item">' +
                 '<div class="near-dist">' + dist + '</div>' +
                 '<div class="near-body">' +
                 '<div class="near-cat">' + x.p.category + '</div>' +
                 '<a class="near-name" href="/' + x.p.slug + '/#' + x.p.anchor + '">' + x.p.name + '</a>' +
                 (x.p.neighborhood ? '<div class="near-neigh">' + x.p.neighborhood + '</div>' : '') +
                 (statusBadge ? '<div class="near-status">' + statusBadge + '</div>' : '') +
                 '</div></li>';
             }).join('') + '</ul>';
           }
           document.getElementById('near-results').innerHTML = html;
         }

         document.getElementById('near-locate').addEventListener('click', function(){
           if (!navigator.geolocation) {
             alert('Your browser does not support geolocation.');
             return;
           }
           document.getElementById('near-locate').textContent = 'Locating...';
           navigator.geolocation.getCurrentPosition(function(pos){
             state.lat = pos.coords.latitude;
             state.lng = pos.coords.longitude;
             document.getElementById('near-locate').style.display = 'none';
             document.getElementById('near-radius-group').style.display = 'flex';
             render();
           }, function(err){
             document.getElementById('near-locate').textContent = 'Find places near me';
             alert('Could not get your location: ' + err.message);
           }, { enableHighAccuracy: true, timeout: 10000 });
         });

         document.querySelectorAll('[data-radius]').forEach(function(btn){
           btn.addEventListener('click', function(){
             state.radius = parseFloat(btn.dataset.radius);
             document.querySelectorAll('[data-radius]').forEach(function(b){ b.classList.toggle('is-on', b === btn); });
             render();
           });
         });
         document.getElementById('near-opennow').addEventListener('click', function(){
           state.openOnly = !state.openOnly;
           document.getElementById('near-opennow').classList.toggle('is-on', state.openOnly);
           render();
         });
       })();
     </script>` +
    footer();
}

// ---------- /quiz/ — five-question neighborhood matcher ----------
function renderQuiz() {
  const title = 'Where should I be tonight?';
  const description = 'Answer five quick questions. We will tell you which Twin Cities neighborhood your evening lives in, and three places to start.';

  // Map quiz answers to neighborhood scores. Each question contributes
  // points to one or more neighborhoods.
  const neighborhoods = [
    { slug: 'northeast-minneapolis', label: 'Northeast Minneapolis', short: 'Northeast', deck: 'Old breweries, working artist studios, the densest run of independent restaurants in the metro.', picks: ['Young Joni replacement (try Brunson\'s Pub)', 'Indeed Brewing patio', 'Northrup King artist studios'] },
    { slug: 'north-loop', label: 'North Loop, Minneapolis', short: 'North Loop', deck: 'Warehouse-conversion restaurants, designer-menswear shops, riverfront walks.', picks: ['Spoon and Stable', 'Bar La Grassa', 'A walk to the Stone Arch Bridge'] },
    { slug: 'uptown-lyn-lake', label: 'Uptown / Lyn-Lake', short: 'Lyn-Lake', deck: 'Where Minneapolis nightlife still lives, less polished than it was, more interesting in some ways.', picks: ['The CC Club', 'Khâluna', "Mortimer's"] },
    { slug: 'cathedral-hill', label: 'Cathedral Hill, St. Paul', short: 'Cathedral Hill', deck: 'A walking St. Paul neighborhood under the cathedral. Feels like a small vacation.', picks: ['Hyacinth', "Nina's Coffee Cafe", 'A walk past the Cathedral at golden hour'] },
    { slug: 'linden-hills', label: 'Linden Hills, Minneapolis', short: 'Linden Hills', deck: 'Tight Main-Street feel: bookstores, ice cream, real restaurants, walk the whole thing in 20 minutes.', picks: ['Tilia patio', 'Sebastian Joe\'s', 'Wild Rumpus or Birchbark Books'] },
    { slug: 'downtown-st-paul', label: 'Downtown St. Paul', short: 'Downtown St. Paul', deck: 'Lowertown warehouse district, the Saint Paul Hotel, a downtown that still feels lived-in.', picks: ['Meritage', 'The Saint Paul Hotel lobby bar', "Mickey's Diner"] },
    { slug: 'south-minneapolis', label: 'South Minneapolis', short: 'South Mpls', deck: 'Lake Street, Powderhorn, the Mississippi gorge. The heart of working Minneapolis.', picks: ['Quang for pho', 'Matt\'s Bar for the original Juicy Lucy', 'A walk to Minnehaha Falls'] }
  ];

  const questions = [
    {
      key: 'vibe',
      q: 'How loud is the room?',
      options: [
        { label: 'A booth, talking quietly', score: { 'cathedral-hill': 3, 'linden-hills': 2, 'downtown-st-paul': 2, 'north-loop': 1 } },
        { label: 'Background music, easy conversation', score: { 'north-loop': 3, 'linden-hills': 2, 'cathedral-hill': 1, 'south-minneapolis': 1 } },
        { label: 'A real night out', score: { 'uptown-lyn-lake': 3, 'northeast-minneapolis': 3, 'south-minneapolis': 1 } }
      ]
    },
    {
      key: 'who',
      q: 'Who is the evening for?',
      options: [
        { label: 'Out-of-town friend you want to impress', score: { 'north-loop': 3, 'cathedral-hill': 2, 'downtown-st-paul': 2, 'northeast-minneapolis': 1 } },
        { label: 'A first or second date', score: { 'cathedral-hill': 3, 'north-loop': 2, 'linden-hills': 2, 'uptown-lyn-lake': 1 } },
        { label: 'Two friends and a long catch-up', score: { 'linden-hills': 3, 'south-minneapolis': 2, 'northeast-minneapolis': 2, 'cathedral-hill': 1 } },
        { label: 'A group of six who want to drink', score: { 'uptown-lyn-lake': 3, 'northeast-minneapolis': 3, 'downtown-st-paul': 1 } }
      ]
    },
    {
      key: 'mode',
      q: 'How do you want to get there?',
      options: [
        { label: 'Walk from one place to the next', score: { 'linden-hills': 3, 'cathedral-hill': 3, 'north-loop': 2, 'downtown-st-paul': 2, 'uptown-lyn-lake': 1 } },
        { label: 'Park once and stay put', score: { 'south-minneapolis': 3, 'northeast-minneapolis': 2, 'uptown-lyn-lake': 1 } },
        { label: 'Light rail or rideshare', score: { 'downtown-st-paul': 3, 'north-loop': 2, 'cathedral-hill': 1 } }
      ]
    },
    {
      key: 'food',
      q: 'What kind of meal?',
      options: [
        { label: 'A restaurant with a tasting menu', score: { 'north-loop': 3, 'linden-hills': 2, 'cathedral-hill': 2 } },
        { label: 'A long, casual neighborhood dinner', score: { 'linden-hills': 3, 'cathedral-hill': 2, 'south-minneapolis': 2, 'northeast-minneapolis': 2 } },
        { label: 'Something specific (pho, taco, Juicy Lucy)', score: { 'south-minneapolis': 3, 'uptown-lyn-lake': 1, 'northeast-minneapolis': 1 } },
        { label: 'Just a good drink, food optional', score: { 'uptown-lyn-lake': 3, 'cathedral-hill': 2, 'northeast-minneapolis': 2 } }
      ]
    },
    {
      key: 'after',
      q: 'After dinner?',
      options: [
        { label: 'A second drink in walking distance', score: { 'uptown-lyn-lake': 3, 'cathedral-hill': 2, 'north-loop': 2, 'northeast-minneapolis': 2 } },
        { label: 'Live music', score: { 'northeast-minneapolis': 3, 'uptown-lyn-lake': 2, 'downtown-st-paul': 2, 'south-minneapolis': 1 } },
        { label: 'A long walk by water', score: { 'linden-hills': 3, 'south-minneapolis': 2, 'north-loop': 2, 'cathedral-hill': 1 } },
        { label: 'Home by ten', score: { 'linden-hills': 3, 'cathedral-hill': 2, 'south-minneapolis': 1 } }
      ]
    }
  ];

  return head({ title, description, slug: 'quiz', theme: 'forest' }) +
    header({ activeSlug: 'quiz' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">Five quick questions</div>
         <h1 class="section-title">${esc(title)}</h1>
         <p class="section-deck">${esc(description)}</p>
       </div>
     </section>
     <section class="quiz-page wrap">
       <form id="quiz-form" class="quiz-form">
         ${questions.map((q, qi) => `
           <fieldset class="quiz-q" data-qi="${qi}">
             <legend class="quiz-q-label"><span class="quiz-q-num">${qi + 1}</span> ${esc(q.q)}</legend>
             ${q.options.map((o, oi) => `
               <label class="quiz-opt">
                 <input type="radio" name="q${qi}" value="${oi}">
                 <span>${esc(o.label)}</span>
               </label>
             `).join('')}
           </fieldset>
         `).join('')}
         <button type="submit" class="cover-cta quiz-submit">See my neighborhood →</button>
       </form>
       <section id="quiz-result" class="quiz-result"></section>
     </section>
     <script>
       (function(){
         var QUESTIONS = ${JSON.stringify(questions)};
         var NEIGHBORHOODS = ${JSON.stringify(neighborhoods)};
         var byslug = {};
         NEIGHBORHOODS.forEach(function(n){ byslug[n.slug] = n; });

         document.getElementById('quiz-form').addEventListener('submit', function(e){
           e.preventDefault();
           var scores = {};
           NEIGHBORHOODS.forEach(function(n){ scores[n.slug] = 0; });
           QUESTIONS.forEach(function(q, qi){
             var sel = document.querySelector('input[name="q' + qi + '"]:checked');
             if (!sel) return;
             var opt = q.options[parseInt(sel.value, 10)];
             Object.keys(opt.score).forEach(function(k){ scores[k] = (scores[k]||0) + opt.score[k]; });
           });
           var ranked = NEIGHBORHOODS.map(function(n){ return { n: n, score: scores[n.slug] }; })
             .sort(function(a, b){ return b.score - a.score; });
           var winner = ranked[0].n;
           var runnerUp = ranked[1].n;

           var html = '<article class="quiz-winner">' +
             '<div class="quiz-winner-eyebrow">Tonight you are in</div>' +
             '<h2 class="quiz-winner-name">' + winner.label + '</h2>' +
             '<p class="quiz-winner-deck">' + winner.deck + '</p>' +
             '<a class="cat-card-arrow" href="/neighborhoods/' + winner.slug + '/">See the full neighborhood guide →</a>' +
             '<div class="quiz-winner-picks"><div class="quiz-picks-label">Three places to start</div><ul>' +
             winner.picks.map(function(p){ return '<li>' + p + '</li>'; }).join('') +
             '</ul></div>' +
             '</article>' +
             '<aside class="quiz-runnerup">' +
             '<div class="quiz-runnerup-label">Or, runner-up</div>' +
             '<a href="/neighborhoods/' + runnerUp.slug + '/">' + runnerUp.label + ' →</a>' +
             '</aside>';
           var result = document.getElementById('quiz-result');
           result.innerHTML = html;
           result.scrollIntoView({ behavior: 'smooth', block: 'start' });
         });
       })();
     </script>` +
    footer();
}

// ---------- /skyway/ — downtown Minneapolis indoor pedestrian network ----------
function renderSkyway() {
  const s = skyway;
  const description = 'A short navigator for the largest indoor pedestrian network in the country. Hand-picked nodes, plain English routing, no app.';

  // Build adjacency JSON for client-side BFS routing
  const adj = {};
  s.nodes.forEach(n => { adj[n.id] = []; });
  s.edges.forEach(([a, b, w]) => {
    if (adj[a]) adj[a].push({ to: b, w });
    if (adj[b]) adj[b].push({ to: a, w });
  });
  const nodeMap = {};
  s.nodes.forEach(n => { nodeMap[n.id] = n; });

  const nodeOptions = s.nodes.map(n => `<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('');
  const tipsList = s.tips.map(t => `<li>${esc(t)}</li>`).join('');

  return head({ title: s.title, description, slug: 'skyway', theme: 'midnight' }) +
    header({ activeSlug: 'skyway' }) +
    `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
     <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
     <section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${s.nodes.length} nodes · ${s.edges.length} segments</div>
         <h1 class="section-title">${esc(s.title)}</h1>
         <p class="section-deck">${esc(s.intro)}</p>
         <p style="font-family: var(--font-label); font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); margin-top: 16px;">General hours · ${esc(s.hours_general)}</p>
       </div>
     </section>
     <div class="skyway-controls">
       <div class="wrap skyway-controls-inner">
         <div class="skyway-route">
           <label>From <select id="sk-from">${nodeOptions}</select></label>
           <label>To <select id="sk-to">${nodeOptions}</select></label>
           <button id="sk-go" type="button" class="cover-cta">Show route</button>
         </div>
         <div id="sk-result" class="skyway-result"></div>
       </div>
     </div>
     <div id="skyway-map" class="bom-map"></div>
     <section class="wrap" style="padding: 56px var(--gutter);">
       <h2 class="tonight-section-title">Tips that will save you time</h2>
       <ul class="skyway-tips">${tipsList}</ul>
     </section>
     <script>
       (function(){
         var NODES = ${JSON.stringify(s.nodes)};
         var ADJ   = ${JSON.stringify(adj)};
         var NODEMAP = {};
         NODES.forEach(function(n){ NODEMAP[n.id] = n; });

         // Map setup centered on IDS Crystal Court
         var map = L.map('skyway-map', { scrollWheelZoom: true }).setView([44.9762, -93.2705], 14);
         L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
           attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 19
         }).addTo(map);

         // Plot every node
         var markers = {};
         NODES.forEach(function(n){
           var icon = L.divIcon({
             className: 'sk-marker',
             html: '<span></span>',
             iconSize: [16, 16], iconAnchor: [8, 8]
           });
           var m = L.marker([n.lat, n.lng], { icon: icon }).addTo(map);
           m.bindPopup('<b>' + n.name + '</b><br><span style="font-family: sans-serif; font-size: 12px;">' + n.note + '</span>');
           markers[n.id] = m;
         });

         // Faint baseline edges
         var baseLines = [];
         Object.keys(ADJ).forEach(function(from){
           ADJ[from].forEach(function(e){
             if (from < e.to) {
               var a = NODEMAP[from], b = NODEMAP[e.to];
               var line = L.polyline([[a.lat, a.lng], [b.lat, b.lng]], { color: '#666', weight: 2, opacity: 0.4 }).addTo(map);
               baseLines.push(line);
             }
           });
         });
         var routeLine = null;

         function bfs(from, to) {
           var queue = [[from]];
           var seen = {};
           seen[from] = true;
           while (queue.length) {
             var path = queue.shift();
             var last = path[path.length - 1];
             if (last === to) return path;
             (ADJ[last] || []).forEach(function(e){
               if (!seen[e.to]) { seen[e.to] = true; queue.push(path.concat([e.to])); }
             });
           }
           return null;
         }

         document.getElementById('sk-go').addEventListener('click', function(){
           var from = document.getElementById('sk-from').value;
           var to   = document.getElementById('sk-to').value;
           if (from === to) {
             document.getElementById('sk-result').innerHTML = '<p>You are already there.</p>';
             return;
           }
           var path = bfs(from, to);
           if (!path) {
             document.getElementById('sk-result').innerHTML = '<p>No skyway route found between those two. Walk outside.</p>';
             return;
           }
           var totalMin = 0;
           for (var i = 0; i < path.length - 1; i++) {
             var es = ADJ[path[i]];
             for (var j = 0; j < es.length; j++) if (es[j].to === path[i+1]) totalMin += es[j].w;
           }
           var html = '<div class="sk-route-summary">' + path.length + ' stops · about ' + totalMin + ' min indoors</div>' +
             '<ol class="sk-route-list">' + path.map(function(id){ return '<li><b>' + NODEMAP[id].name + '</b><div class="sk-step-note">' + NODEMAP[id].note + '</div></li>'; }).join('') + '</ol>';
           document.getElementById('sk-result').innerHTML = html;

           // Draw route on map
           if (routeLine) map.removeLayer(routeLine);
           var coords = path.map(function(id){ return [NODEMAP[id].lat, NODEMAP[id].lng]; });
           routeLine = L.polyline(coords, { color: '#E11900', weight: 5, opacity: 0.85 }).addTo(map);
           map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
         });
       })();
     </script>` +
    footer();
}

// ---------- /history/ — On This Day in the metro ----------
function renderHistory() {
  const h = history;
  const description = h.subtitle;

  // Find today's matches; show them first.
  const now = new Date();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();
  const todays = h.entries.filter(e => e.month === todayM && e.day === todayD);

  // For everything else, group by month and sort within month.
  const byMonth = {};
  for (const e of h.entries) {
    if (e.month === todayM && e.day === todayD) continue;
    if (!byMonth[e.month]) byMonth[e.month] = [];
    byMonth[e.month].push(e);
  }
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function fmtYear(year) {
    const ago = now.getFullYear() - year;
    return `${year} <span class="hist-ago">· ${ago} year${ago === 1 ? '' : 's'} ago</span>`;
  }
  function entryRow(e) {
    return `
      <li class="hist-entry">
        <div class="hist-entry-date">${monthNames[e.month-1]} ${e.day}</div>
        <div class="hist-entry-body">
          <div class="hist-entry-year">${fmtYear(e.year)}</div>
          <h3 class="hist-entry-title"><span class="hist-kind hist-kind-${esc(e.kind)}">${esc(e.kind)}</span> ${esc(e.title)}</h3>
          <p class="hist-entry-blurb">${esc(e.blurb)}</p>
        </div>
      </li>`;
  }

  const todaySection = todays.length > 0 ? `
    <section class="hist-today wrap">
      <div class="hist-today-eyebrow">${monthNames[todayM-1]} ${todayD} in Twin Cities history</div>
      <ul class="hist-list hist-list-today">${todays.map(entryRow).join('')}</ul>
    </section>` : `
    <section class="hist-today wrap">
      <div class="hist-today-eyebrow">${monthNames[todayM-1]} ${todayD} in Twin Cities history</div>
      <p class="hist-empty">Nothing on file for today yet. If you know an anniversary that should be here, send a tip.</p>
    </section>`;

  const monthSections = monthNames.map((mn, i) => {
    const m = i + 1;
    const list = (byMonth[m] || []).sort((a, b) => a.day - b.day);
    if (list.length === 0) return '';
    return `
      <section class="hist-month wrap" id="month-${m}">
        <h2 class="hist-month-title">${mn}</h2>
        <ul class="hist-list">${list.map(entryRow).join('')}</ul>
      </section>`;
  }).join('');

  return head({ title: h.title, description, slug: 'history', theme: 'midnight' }) +
    header({ activeSlug: 'history' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${h.entries.length} entries · ${todays.length} today</div>
         <h1 class="section-title">${esc(h.title)}</h1>
         <p class="section-deck">${esc(h.intro)}</p>
       </div>
     </section>
     ${todaySection}
     <section class="hist-rest">
       <div class="wrap">
         <h2 class="hist-rest-title">The full year, by month</h2>
       </div>
       ${monthSections}
     </section>` +
    footer();
}

// ---------- /mystery/ — sealed-envelope itineraries ----------
function renderMystery() {
  const m = mystery;
  const description = m.subtitle;

  // Hide cold-season envelopes during the warm half of the year. They
  // return naturally in October.
  const visible = IS_WARM_SEASON
    ? m.itineraries.filter(it => it.season !== 'cold')
    : m.itineraries;

  const cards = visible.map(it => {
    const variantCount = (it.variants || []).length;
    return `
    <a class="mystery-card" href="/mystery/#${esc(it.slug)}" data-mystery="${esc(it.slug)}">
      <div class="mystery-card-tier">${esc(it.tier)} · ${esc(it.season === 'warm' ? 'Warm season' : 'Cold season')}${variantCount > 1 ? ` · ${variantCount} versions` : ''}</div>
      <h3 class="mystery-card-label">${esc(it.label)}</h3>
      <div class="mystery-card-cta">Reveal the night →</div>
    </a>`;
  }).join('');

  // Inline only the visible itineraries so the deep-link router can't land
  // on a hidden cold-season envelope.
  const itinJson = JSON.stringify(visible);

  return head({ title: m.title, description, slug: 'mystery', theme: 'midnight' }) +
    header({ activeSlug: 'mystery' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${visible.length} sealed envelopes</div>
         <h1 class="section-title">${esc(m.title)}</h1>
         <p class="section-deck">${esc(m.intro)}</p>
       </div>
     </section>
     <section class="mystery-grid wrap" id="mystery-grid">${cards}</section>
     <section class="mystery-reveal wrap" id="mystery-reveal" style="display:none;"></section>
     <script>
       (function(){
         var ITINS = ${itinJson};
         var byslug = {};
         ITINS.forEach(function(it){ byslug[it.slug] = it; });

         // Pick a variant index that is different from the previous one when
         // possible. Used both for first reveal and re-roll.
         function pickDifferent(variants, prevIndex) {
           if (!variants || variants.length === 0) return 0;
           if (variants.length === 1) return 0;
           var i = Math.floor(Math.random() * variants.length);
           if (i === prevIndex) i = (i + 1) % variants.length;
           return i;
         }

         function renderItin(slug, variantIndex) {
           var it = byslug[slug];
           if (!it) return;
           var variants = it.variants || (it.stops ? [{ stops: it.stops }] : []);
           if (variants.length === 0) return;
           if (typeof variantIndex !== 'number') {
             variantIndex = pickDifferent(variants, -1);
           }
           var stops = variants[variantIndex].stops;
           document.getElementById('mystery-grid').style.display = 'none';
           var rev = document.getElementById('mystery-reveal');
           rev.style.display = '';

           var versionsLine = variants.length > 1
             ? '<span class="mystery-versions">Version ' + (variantIndex + 1) + ' of ' + variants.length + '</span>'
             : '';
           var rerollBtn = variants.length > 1
             ? '<button class="mystery-reroll" type="button" id="mystery-reroll">Re-roll for a different night →</button>'
             : '';

           var html = '<div class="mystery-back"><a href="#" id="mystery-close">← Back to all envelopes</a></div>' +
             '<div class="mystery-titleblock">' +
             '<div class="mystery-tier">' + it.tier + ' · ' + (it.season === "warm" ? "Warm season" : "Cold season") + '</div>' +
             '<h2 class="mystery-title">' + it.label + '</h2>' +
             '<p class="mystery-instructions">Tap each envelope to reveal the next stop. ' + versionsLine + '</p>' +
             '</div>' +
             '<ol class="mystery-stops">' +
             stops.map(function(s, i){
               return '<li class="mystery-stop" data-i="' + i + '">' +
                 '<button class="mystery-stop-btn" type="button">' +
                   '<span class="mystery-stop-num">' + (i + 1) + '</span>' +
                   '<span class="mystery-stop-kind">' + s.kind + '</span>' +
                   '<span class="mystery-stop-cta">Reveal →</span>' +
                 '</button>' +
                 '<div class="mystery-stop-content" hidden>' +
                   '<div class="mystery-stop-kind-revealed">' + s.kind + '</div>' +
                   '<p class="mystery-stop-text">' + s.text + '</p>' +
                 '</div>' +
               '</li>';
             }).join('') +
             '</ol>' +
             rerollBtn;
           rev.innerHTML = html;
           rev.scrollIntoView({ behavior: 'smooth', block: 'start' });

           document.getElementById('mystery-close').addEventListener('click', function(e){
             e.preventDefault();
             window.location.hash = '';
             document.getElementById('mystery-grid').style.display = '';
             rev.style.display = 'none';
             rev.innerHTML = '';
           });

           var rerollEl = document.getElementById('mystery-reroll');
           if (rerollEl) {
             rerollEl.addEventListener('click', function(){
               var next = pickDifferent(variants, variantIndex);
               renderItin(slug, next);
             });
           }

           rev.querySelectorAll('.mystery-stop-btn').forEach(function(btn){
             btn.addEventListener('click', function(){
               var stop = btn.closest('.mystery-stop');
               stop.classList.add('is-revealed');
               stop.querySelector('.mystery-stop-content').hidden = false;
               btn.style.display = 'none';
             });
           });
         }

         document.querySelectorAll('[data-mystery]').forEach(function(el){
           el.addEventListener('click', function(e){
             e.preventDefault();
             window.location.hash = el.dataset.mystery;
             renderItin(el.dataset.mystery);
           });
         });

         // Honor deep link hash on load
         if (window.location.hash) {
           var slug = window.location.hash.slice(1);
           if (byslug[slug]) renderItin(slug);
         }
       })();
     </script>` +
    footer();
}

function renderSlang() {
  const title = "The Loon's Nest";
  const description = 'A short Twin Cities glossary for visitors and recent transplants.';
  const terms = [
    { term: 'The Cities', def: 'Minneapolis and Saint Paul, taken together. Locals rarely call them "the metro" or "MSP" in conversation.' },
    { term: 'Bde Maka Ska', def: 'Pronounced beh-DAY mah-KAH-skah. Formerly Lake Calhoun. Renamed in 2018 to its Dakota name. Use the Dakota name; the old name has aged badly.' },
    { term: 'NE / Northeast', def: 'Northeast Minneapolis. Pronounced "NORE-east" with a slightly drawn-out vowel. Distinct from "North," which is North Minneapolis (a different neighborhood with very different vibes).' },
    { term: 'The U', def: 'The University of Minnesota. Specifically the Twin Cities campus. "I went to the U" means UMN.' },
    { term: 'Eat Street', def: 'The stretch of Nicollet Avenue south of downtown Minneapolis, dense with restaurants. Roughly 24th to Lake Street.' },
    { term: 'Hot dish', def: 'Casserole. Always casserole. The most-loved version uses tater tots and cream of mushroom.' },
    { term: 'Lutefisk', def: 'Cod cured in lye. Eaten almost exclusively at Christmas by Norwegian-Lutheran Minnesotans, often as a kind of cultural endurance test.' },
    { term: 'Lefse', def: 'A thin Norwegian potato flatbread, usually rolled with butter and sugar. Less divisive than lutefisk.' },
    { term: 'The Mall', def: 'Mall of America in Bloomington. But locals do not actually shop there much. The fact that you have heard of it is the point.' },
    { term: 'Up Nort', def: 'Anywhere outside the metro, generally. "We went up nort to the cabin" usually means somewhere on a lake within three hours of the city.' },
    { term: 'The Cabin', def: 'A second house on a lake. Owning one is a Minnesota class signifier. Asking "do you have a cabin" is a small social audit.' },
    { term: 'Pull tabs', def: 'A paper-tab gambling game played in bars to fund nonprofits, hockey teams, and church basement projects. Legal here, mostly nowhere else.' },
    { term: 'Skol', def: 'Norwegian "cheers." Also the chant of the Minnesota Vikings, learned and adopted by the entire city in 2018 with the "Skol Vikings" stadium ritual.' },
    { term: 'Jucy / Juicy Lucy', def: 'A burger with cheese melted inside the patty. Invented in South Minneapolis. Two bars on Cedar Avenue both claim to have invented it. Spelling depends on which bar you back. Pick a side.' },
    { term: 'Don\'tcha know', def: 'Mostly a stereotype now, but you will hear genuine "ya, you betcha" and "oh, for fun" from older Minnesotans. Not affectations on their part.' },
    { term: 'Minnesota Nice', def: 'Both real and complicated. Strangers will help you with directions and your car battery. Strangers will also avoid all conflict and never invite you over for dinner.' },
    { term: 'The State Fair', def: 'The Minnesota State Fair. Held the twelve days ending Labor Day. The largest state fair in the country by daily attendance. Locals call it just "the fair."' },
    { term: 'On a Stick', def: 'A reference to State Fair food. Hundreds of items are served on sticks. The list of new things on sticks each year is published in newspapers.' },
    { term: 'The Loop', def: 'Usually the North Loop, the warehouse-conversion neighborhood north of downtown Mpls. Confusingly, "the Loop" alone can also mean the smaller Northeast loop along East Hennepin.' },
    { term: 'The Suburbs', def: 'Anything outside the I-494/694 ring. Locals divide them by direction (west metro, north metro, south metro). Edina and Wayzata are wealthy west-metro. Brooklyn Park is north. Bloomington is south.' }
  ];

  const items = terms.map(t => `
    <div class="slang-entry">
      <dt class="slang-term">${esc(t.term)}</dt>
      <dd class="slang-def">${esc(t.def)}</dd>
    </div>
  `).join('');

  return head({ title, description, slug: 'glossary', theme: 'sage' }) +
    header({ activeSlug: 'glossary' }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">Twin Cities glossary</div>
        <h1 class="section-title">${esc(title)} <em>a small dictionary</em></h1>
        <p class="section-deck">A few things visitors should know before they say them out loud. The terms locals actually use, with some honest notes.</p>
      </div>
    </section>
    <section class="wrap">
      <dl class="slang-list">${items}</dl>
    </section>` +
    footer();
}

// ---------- Search page (client-side) ----------
function renderSearch(searchIndex) {
  const title = 'Search bestofmpls';
  const description = 'Search every entry on bestofmpls. Restaurants, music, museums, neighborhoods.';
  return head({ title, description, slug: 'search', theme: 'default' }) +
    header({ activeSlug: 'search' }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">Search</div>
        <h1 class="section-title">Find <em>anything</em></h1>
        <p class="section-deck">Type a place, a neighborhood, or what you are looking for. Searches across all ${searchIndex.length}+ entries on the site.</p>
      </div>
    </section>
    <section class="wrap search-wrap">
      <input id="search-input" type="search" placeholder="Try 'pizza in Northeast' or 'late night St. Paul'" class="search-input" autofocus aria-label="Search">
      <div id="search-results" class="search-results" aria-live="polite"></div>
    </section>
    <script id="search-index" type="application/json">${JSON.stringify(searchIndex)}</script>
    <script>
    (function(){
      var idx = JSON.parse(document.getElementById('search-index').textContent);
      var input = document.getElementById('search-input');
      var out = document.getElementById('search-results');

      function score(item, q) {
        var s = (item.name + ' ' + item.category + ' ' + item.neighborhood + ' ' + item.style + ' ' + item.description).toLowerCase();
        var terms = q.toLowerCase().split(/\\s+/).filter(Boolean);
        if (!terms.length) return 0;
        var hits = 0;
        terms.forEach(function(t){ if (s.indexOf(t) !== -1) hits++; });
        if (hits < terms.length) return 0;
        // Boost if term appears in name
        var nameHits = 0;
        terms.forEach(function(t){ if (item.name.toLowerCase().indexOf(t) !== -1) nameHits++; });
        return hits + nameHits * 3;
      }

      function render(q) {
        if (!q || q.length < 2) {
          out.innerHTML = '<p class="search-empty">Start typing.</p>';
          return;
        }
        var results = idx
          .map(function(i){ return { item: i, s: score(i, q) }; })
          .filter(function(r){ return r.s > 0; })
          .sort(function(a, b){ return b.s - a.s; })
          .slice(0, 30);

        if (!results.length) {
          out.innerHTML = '<p class="search-empty">No matches. Try a different word.</p>';
          return;
        }

        out.innerHTML = results.map(function(r){
          var i = r.item;
          return '<a class="search-result" href="' + i.url + '">' +
            '<div class="search-result-meta">' + i.category + (i.neighborhood ? ' &middot; ' + i.neighborhood : '') + '</div>' +
            '<div class="search-result-name">' + i.name + '</div>' +
            '<p class="search-result-desc">' + i.description.slice(0, 140) + (i.description.length > 140 ? '...' : '') + '</p>' +
            '</a>';
        }).join('');
      }

      var t;
      input.addEventListener('input', function(e){
        clearTimeout(t);
        t = setTimeout(function(){ render(e.target.value); }, 80);
      });
      render('');
    })();
    </script>` +
    footer();
}

function renderContribute() {
  const title = 'Send us a tip';
  const description = 'Submit a place, a correction, or a tip for bestofmpls.';
  const enabled = !!POLL_WORKER_URL;
  return head({ title, description, slug: 'contribute', theme: 'default' }) +
    header({ activeSlug: 'contribute' }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">Community</div>
        <h1 class="section-title">Send us a tip <em>or correct us</em></h1>
        <p class="section-deck">We rely on readers to flag what is missing, what changed, and what is genuinely good that we have not gotten to yet. Please be specific. We read every note.</p>
      </div>
    </section>
    <section class="wrap">
      <form class="contribute-form" data-tip-form>
        <div>
          <label for="name">Your name</label>
          <input id="name" name="name" type="text" placeholder="So we can credit you if we use it" maxlength="120">
        </div>
        <div>
          <label for="email">Your email</label>
          <input id="email" name="email" type="email" placeholder="In case we need to follow up" maxlength="200">
        </div>
        <div>
          <label for="place">The place or topic</label>
          <input id="place" name="place" type="text" placeholder="e.g. Best ramen in St. Paul, or a correction to the pizza list" required maxlength="200">
        </div>
        <div>
          <label for="message">Tell us about it</label>
          <textarea id="message" name="message" placeholder="Why is this worth listing? What do they do well? Address if you have it." required maxlength="2000"></textarea>
        </div>
        <input type="text" name="hp" tabindex="-1" autocomplete="off" class="poll-hp" aria-hidden="true">
        <div class="poll-actions">
          <button class="cover-cta" type="submit">Send the tip →</button>
          <span class="poll-status" data-tip-status></span>
        </div>
      </form>
      <div class="poll-thanks" data-tip-thanks hidden>
        <h3 class="poll-thanks-title">Thanks. Got it.</h3>
        <p class="poll-thanks-body">Your note is in the queue. We read every one.</p>
        <button class="poll-thanks-again" type="button" data-tip-again>Send another →</button>
      </div>
      <div class="about-body" style="padding-top: 24px;">
        <p style="font-style: italic; color: var(--ink-soft);">Prefer email? Write to <a href="mailto:hello@bestofmpls.com">hello@bestofmpls.com</a> directly.</p>
      </div>
    </section>
    ${enabled ? `<script>
      (function(){
        var form = document.querySelector('[data-tip-form]');
        var status = document.querySelector('[data-tip-status]');
        var thanks = document.querySelector('[data-tip-thanks]');
        var again = document.querySelector('[data-tip-again]');
        var endpoint = ${JSON.stringify(POLL_WORKER_URL + '/tip')};
        if (!form) return;
        form.addEventListener('submit', async function(e){
          e.preventDefault();
          var fd = new FormData(form);
          status.textContent = 'Sending...';
          form.querySelector('button[type="submit"]').disabled = true;
          try {
            var res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: fd.get('name'),
                email: fd.get('email'),
                place: fd.get('place'),
                message: fd.get('message'),
                hp: fd.get('hp')
              })
            });
            var data = await res.json();
            if (!res.ok) throw new Error(data.error || 'something broke');
            form.style.display = 'none';
            thanks.hidden = false;
          } catch (err) {
            status.textContent = err.message || 'Something went wrong, try again.';
            form.querySelector('button[type="submit"]').disabled = false;
          }
        });
        if (again) again.addEventListener('click', function(){
          form.reset();
          form.style.display = '';
          thanks.hidden = true;
          status.textContent = '';
          form.querySelector('button[type="submit"]').disabled = false;
        });
      })();
    </script>` : ''}` +
    footer();
}

function render404() {
  return head({ title: 'Page not found', description: 'That page is not here.', slug: '404', theme: 'default' }) +
    header({}) +
    `<section class="wrap notfound">
      <p class="notfound-num">404</p>
      <h1 class="notfound-msg">That page is not here.</h1>
      <p><a href="/">Back to the cover</a></p>
    </section>` +
    footer();
}

function renderSitemap(neighborhoods) {
  const urls = [
    { loc: SITE + '/', priority: '1.0' },
    { loc: SITE + '/visit/', priority: '0.9' },
    { loc: SITE + '/tonight/', priority: '0.9' },
    { loc: SITE + '/calendar/', priority: '0.9' },
    { loc: SITE + '/this-weekend/', priority: '0.9' },
    { loc: SITE + '/map/', priority: '0.9' },
    { loc: SITE + '/near/', priority: '0.8' },
    { loc: SITE + '/quiz/', priority: '0.8' },
    { loc: SITE + '/skyway/', priority: '0.8' },
    { loc: SITE + '/mystery/', priority: '0.8' },
    { loc: SITE + '/take-them-to/', priority: '0.8' },
    { loc: SITE + '/now-showing/', priority: '0.8' },
    { loc: SITE + '/horoscope/', priority: '0.7' },
    { loc: SITE + '/departed/', priority: '0.7' },
    { loc: SITE + '/surprise/', priority: '0.7' },
    { loc: SITE + '/neighborhoods/', priority: '0.8' },
    { loc: SITE + '/glossary/', priority: '0.6' },
    { loc: SITE + '/search/', priority: '0.5' },
    { loc: SITE + '/about/', priority: '0.6' },
    { loc: SITE + '/contribute/', priority: '0.5' },
    ...(featuredEvts.events || []).map(ev => ({ loc: `${SITE}/${ev.slug}/`, priority: '0.95' })),
    ...categories.map(c => ({ loc: `${SITE}/${c.slug}/`, priority: '0.9' })),
    ...resolveVenues().map(v => ({ loc: `${SITE}/calendar/venue/${v.slug}/`, priority: '0.8' })),
    ...(neighborhoods || []).map(nb => ({ loc: `${SITE}/neighborhoods/${nb.slug}/`, priority: '0.8' })),
    // Per-entry detail pages. The biggest SEO surface on the site.
    ...categories.flatMap(c => {
      if (c.layout === 'seasonal') return [];
      return c.entries.map(e => ({
        loc: `${SITE}/${c.slug}/${entrySlug(e.name)}/`,
        priority: '0.7'
      }));
    })
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
}

function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml`;
}

function renderFavicon() {
  // Bold "B" in clay on cream
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#F4EEDF"/>
  <text x="32" y="48" font-family="Archivo, system-ui, sans-serif" font-size="48" font-weight="800" text-anchor="middle" fill="#B0673A">b</text>
</svg>`;
}

// ---------- Build ----------
function build() {
  console.log('\n→ bestofmpls build');
  console.log(`  ${categories.length} categories, ${categories.reduce((s, c) => s + c.entries.length, 0)} entries\n`);

  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  ensureDir(DIST);

  fs.copyFileSync(path.join(SRC, 'style.css'), path.join(DIST, 'style.css'));
  console.log(`  → style.css`);

  // Copy self-hosted fonts so we don't depend on Google Fonts being reachable.
  const publicFontsDir = path.join(ROOT, 'public/fonts');
  if (fs.existsSync(publicFontsDir)) {
    const distFontsDir = path.join(DIST, 'fonts');
    ensureDir(distFontsDir);
    for (const f of fs.readdirSync(publicFontsDir)) {
      fs.copyFileSync(path.join(publicFontsDir, f), path.join(distFontsDir, f));
      console.log(`  → fonts/${f}`);
    }
  }

  writeFile('index.html', renderHome());
  for (const c of categories) writeFile(`${c.slug}/index.html`, renderCategory(c));

  // Per-entry detail pages. ~350 of them, each at /{c.slug}/{entry-slug}/.
  // Build the indexable surface area Google can crawl for long-tail searches
  // (e.g., "owamni minneapolis hours", "spoon and stable bar walk-in").
  let entryPagesWritten = 0;
  for (const c of categories) {
    if (c.layout === 'seasonal') continue; // festivals etc. stay on one page
    for (const e of c.entries) {
      const slug = entrySlug(e.name);
      if (!slug) continue;
      writeFile(`${c.slug}/${slug}/index.html`, renderEntry(c, e, categories));
      entryPagesWritten++;
    }
  }
  console.log(`  → ${entryPagesWritten} entry detail pages`);

  // Neighborhood pages
  const neighborhoods = buildNeighborhoodIndex();
  writeFile('neighborhoods/index.html', renderNeighborhoodIndex(neighborhoods));
  for (const nb of neighborhoods) writeFile(`neighborhoods/${nb.slug}/index.html`, renderNeighborhoodPage(nb));

  // First-time / itineraries page
  writeFile('visit/index.html', renderItineraries());

  // Now Showing — current art exhibitions
  writeFile('now-showing/index.html', renderExhibitions());

  // Calendar — scraped live events
  writeFile('calendar/index.html', renderCalendar());

  // Per-venue calendar pages
  for (const v of resolveVenues()) {
    writeFile(`calendar/venue/${v.slug}/index.html`, renderVenuePage(v));
  }

  // This Weekend — Fri/Sat/Sun bundle
  writeFile('this-weekend/index.html', renderWeekend());

  // Daily horoscope
  writeFile('horoscope/index.html', renderHoroscope());

  // The Map — every place plotted
  writeFile('map/index.html', renderMap());

  // Departed — closure tracker
  writeFile('departed/index.html', renderDeparted());

  // Take Them To — situational picks
  writeFile('take-them-to/index.html', renderSituations());

  // Tonight — sunset clock, weather, civic countdowns
  writeFile('tonight/index.html', renderTonight());

  // Featured events — dedicated landing pages, one per entry
  for (const ev of (featuredEvts.events || [])) {
    writeFile(`${ev.slug}/index.html`, renderFeaturedEvent(ev));
  }

  // Near You — geolocation walking-radius
  writeFile('near/index.html', renderNear());

  // Quiz — neighborhood matcher
  writeFile('quiz/index.html', renderQuiz());

  // Skyway — downtown indoor pedestrian network navigator
  writeFile('skyway/index.html', renderSkyway());

  // Mystery — sealed-envelope itineraries
  writeFile('mystery/index.html', renderMystery());

  // Surprise — random place
  writeFile('surprise/index.html', renderSurprise());

  // Loon's Nest slang glossary
  writeFile('glossary/index.html', renderSlang());

  // Build search index from all entries across all categories
  const searchIndex = [];
  for (const c of categories) {
    if (c.layout === 'seasonal') continue;
    for (const e of c.entries) {
      searchIndex.push({
        name: e.name,
        category: c.title,
        neighborhood: e.neighborhood || '',
        style: e.style || '',
        description: e.description || '',
        url: `/${c.slug}/#${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      });
    }
  }
  writeFile('search/index.html', renderSearch(searchIndex));

  writeFile('about/index.html', renderAbout());

  // Private admin dashboard for reader poll submissions. Not in sitemap,
  // marked noindex. Anyone can hit the URL but the worker enforces auth.
  writeFile('admin/picks/index.html', renderAdminPicks());
  writeFile('contribute/index.html', renderContribute());
  writeFile('404.html', render404());
  writeFile('sitemap.xml', renderSitemap(neighborhoods));
  writeFile('robots.txt', renderRobots());
  writeFile('favicon.svg', renderFavicon());

  // GitHub Pages custom-domain marker. Tells GH Pages to serve at bestofmpls.com.
  fs.writeFileSync(path.join(DIST, 'CNAME'), 'bestofmpls.com\n');
  console.log(`  → CNAME (bestofmpls.com)`);

  // Copy public/ recursively into dist/. Includes the OG image (generated
  // by build-og.js) and any other static assets like /img/, /fonts/, etc.
  function copyPublic(src, destRel) {
    for (const f of fs.readdirSync(src)) {
      const srcPath = path.join(src, f);
      const stat = fs.statSync(srcPath);
      const relPath = destRel ? `${destRel}/${f}` : f;
      const destPath = path.join(DIST, relPath);
      if (stat.isDirectory()) {
        ensureDir(destPath);
        copyPublic(srcPath, relPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  → ${relPath} (from public/)`);
      }
    }
  }
  const publicDir = path.join(ROOT, 'public');
  if (fs.existsSync(publicDir)) copyPublic(publicDir, '');

  console.log(`\n✓ Built to dist/\n`);
}

build();
