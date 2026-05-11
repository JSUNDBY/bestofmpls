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
// Warm season runs April through September. Cold-flavored content (snow-day,
// big-cold-night mystery, etc.) is hidden during these months and quietly
// returns each October.
const CURRENT_MONTH = parseInt(TODAY_ISO.slice(5, 7), 10);
const IS_WARM_SEASON = CURRENT_MONTH >= 4 && CURRENT_MONTH <= 9;

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
    categories: [hotels, outdoors, wellness, hiddenGems]
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
  hotels, outdoors, wellness, hiddenGems,
  // Calendar
  festivals
];

// ---------- Helpers ----------
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=Archivo:wght@500;600;700&display=swap">
<link rel="stylesheet" href="/style.css?v=18">
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
</head>
<body${theme ? ` data-theme="${theme}"` : ''}>`;
}

function header({ activeSlug } = {}) {
  // Primary nav is now five items only. Everything else lives in the Menu
  // overlay (data-menu-open), grouped editorially. Same overlay is reused
  // for the mobile hamburger.
  const primaryNav = [
    { href: '/', label: 'Cover', slug: '' },
    { href: '/tonight/', label: 'Tonight', slug: 'tonight' },
    { href: '/calendar/', label: 'Calendar', slug: 'calendar' },
    { href: '/map/', label: 'Map', slug: 'map' },
    { href: '/search/', label: 'Search', slug: 'search' }
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
        <p class="footer-list-title">Get the weekly</p>
        <form class="footer-newsletter-form" data-newsletter-form>
          <input type="email" name="email" placeholder="you@example.com" required aria-label="Email address" maxlength="200">
          <input type="text" name="hp" tabindex="-1" autocomplete="off" class="poll-hp" aria-hidden="true">
          <button type="submit">Subscribe</button>
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
<script>
// Footer newsletter signup: fetch-POST to the poll worker's /newsletter
// endpoint. Shows inline confirmation in place of the form on success.
(function(){
  var form = document.querySelector('[data-newsletter-form]');
  var status = document.querySelector('[data-newsletter-status]');
  if (!form || !status) return;
  var endpoint = ${JSON.stringify(POLL_WORKER_URL ? POLL_WORKER_URL + '/newsletter' : '')};
  if (!endpoint) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var fd = new FormData(form);
    status.textContent = 'Sending...';
    form.querySelector('button[type="submit"]').disabled = true;
    try {
      var res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email'), hp: fd.get('hp') })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'try again later');
      form.style.display = 'none';
      status.textContent = "Subscribed. We'll be in touch.";
    } catch (err) {
      status.textContent = err.message || 'Try again in a moment.';
      form.querySelector('button[type="submit"]').disabled = false;
    }
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

  // Featured calendar strip — show next 4 upcoming festivals
  const calendarPicks = festivals.entries.slice(0, 4);

  // Live events strip — show next 6 from scraped events
  const liveEventPicks = (eventsData.events || []).slice(0, 6);
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
    ${r ? `
    <section class="rightnow-strip">
      <div class="wrap rightnow-inner">
        <div class="rightnow-item">
          <div class="rightnow-label">Sunset</div>
          <div class="rightnow-value">${esc(r.sun.set)}</div>
          <a class="rightnow-link" href="/tonight/">Where to watch →</a>
        </div>
        <div class="rightnow-item">
          <div class="rightnow-label">Right now</div>
          <div class="rightnow-value">${r.weather.temp_now}°F</div>
          <span class="rightnow-link">${esc(r.weather.condition)}</span>
        </div>
        ${r.countdowns.slice(0, 3).map(c => `
        <div class="rightnow-item">
          <div class="rightnow-label">In ${c.days} day${c.days === 1 ? '' : 's'}</div>
          <div class="rightnow-value rightnow-value-event">${esc(c.name)}</div>
          <a class="rightnow-link" href="/tonight/">More countdowns →</a>
        </div>`).join('')}
      </div>
    </section>` : ''}
    <section class="tools-strip">
      <div class="wrap tools-strip-inner">
        <a class="tool-card" href="/map/"><span class="tool-icon" aria-hidden="true">◉</span><span class="tool-label">The Map</span><span class="tool-deck">Every place, plotted</span></a>
        <a class="tool-card" href="/near/"><span class="tool-icon" aria-hidden="true">◎</span><span class="tool-label">Near You</span><span class="tool-deck">10 minute walk</span></a>
        <a class="tool-card" href="/calendar/"><span class="tool-icon" aria-hidden="true">▭</span><span class="tool-label">Calendar</span><span class="tool-deck">${(eventsData.events || []).length} upcoming</span></a>
        <a class="tool-card" href="/tonight/"><span class="tool-icon" aria-hidden="true">☾</span><span class="tool-label">Tonight</span><span class="tool-deck">${rightnowData ? `Sunset ${rightnowData.sun.set}` : 'Sunset + countdowns'}</span></a>
        <a class="tool-card" href="/quiz/"><span class="tool-icon" aria-hidden="true">?</span><span class="tool-label">Quiz</span><span class="tool-deck">Where to be tonight</span></a>
        <a class="tool-card" href="/skyway/"><span class="tool-icon" aria-hidden="true">⇄</span><span class="tool-label">Skyway</span><span class="tool-deck">${skyway.nodes.length} downtown nodes</span></a>
        <a class="tool-card" href="/take-them-to/"><span class="tool-icon" aria-hidden="true">⌖</span><span class="tool-label">Take Them To</span><span class="tool-deck">${(IS_WARM_SEASON ? situations.situations.filter(s => s.slug !== 'snow-day') : situations.situations).length} situations</span></a>
        <a class="tool-card" href="/now-showing/"><span class="tool-icon" aria-hidden="true">▣</span><span class="tool-label">Now Showing</span><span class="tool-deck">${exhibitions.exhibitions.length} exhibitions</span></a>
        <a class="tool-card" href="/horoscope/"><span class="tool-icon" aria-hidden="true">✦</span><span class="tool-label">Horoscope</span><span class="tool-deck">For the metro, today</span></a>
        <a class="tool-card" href="/surprise/"><span class="tool-icon" aria-hidden="true">⚂</span><span class="tool-label">Surprise me</span><span class="tool-deck">A random pick</span></a>
        <a class="tool-card" href="/mystery/"><span class="tool-icon" aria-hidden="true">✉</span><span class="tool-label">Mystery</span><span class="tool-deck">Sealed-envelope nights</span></a>
        <a class="tool-card" href="/departed/"><span class="tool-icon" aria-hidden="true">†</span><span class="tool-label">Departed</span><span class="tool-deck">Places we lost</span></a>
      </div>
    </section>
    ${clusterSections}
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
                <div class="live-feature-meta">${esc(e.venue)}${e.subtitle ? ' · ' + esc(e.subtitle.slice(0, 60) + (e.subtitle.length > 60 ? '…' : '')) : ''}</div>
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
    if (e.neighborhood) meta.push(`<span>${esc(e.neighborhood)}</span>`);
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
    if (e.price) footerBits.push(`<span class="entry-footer-price">${esc(e.price)}</span>`);
    if (e.hours) footerBits.push(`<span>${esc(e.hours)}</span>`);
    if (e.capacity) footerBits.push(`<span>Capacity ${esc(e.capacity)}</span>`);
    const rankBlock = isFeatured ? `<div class="entry-rank">★</div>` : '';
    const pickBadge = isFeatured ? '<span class="entry-meta-pick">Editor’s pick</span>' : '';
    // Look up hours for this entry. If we have them, embed as a data attribute
    // so the inline script at footer can compute open/closed in the user's
    // timezone on page load.
    const hoursLookup = hoursData[`${c.slug}:${e.name}`];
    const hoursAttr = hoursLookup && hoursLookup.hours && hoursLookup.hours.length > 0
      ? ` data-hours='${JSON.stringify(hoursLookup.hours).replace(/'/g, '&#39;')}'`
      : '';
    return `<article class="entry${featured}" id="${esc(e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}"${hoursAttr}>
      ${rankBlock}
      <div class="entry-body">
        <div class="entry-meta">${meta.join('')}${pickBadge}<span class="entry-status" data-entry-status></span></div>
        <h2 class="entry-name">${esc(e.name)}</h2>
        <p class="entry-description">${esc(e.description)}</p>
        <div class="entry-footer">${footerBits.join('')}</div>
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
  'hidden-gems':            'hidden gem'
};
function pollNoun(c) {
  if (POLL_NOUNS[c.slug]) return POLL_NOUNS[c.slug];
  // Fallback: lowercase + crude singularization
  return String(c.title || 'spot').toLowerCase().replace(/^best\s+/, '').replace(/s\b/, '');
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
<link rel="stylesheet" href="/style.css?v=18">
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
  const description = 'Live music, art openings, lectures, and screenings across Minneapolis and Saint Paul. Updated daily.';
  const events = eventsData.events || [];

  // Group events by ISO date.
  const byDate = new Map();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  }
  const dateKeys = [...byDate.keys()].sort();

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
  function categoryLabel(c) {
    const map = { music: 'Music', art: 'Art', film: 'Film', lecture: 'Talk', performance: 'Performance', theater: 'Theater', community: 'Community' };
    return map[c] || (c ? c[0].toUpperCase() + c.slice(1) : 'Event');
  }

  // Build a category filter list out of what is actually present today.
  const cats = [...new Set(events.map(e => e.category))].sort();
  const venues = [...new Set(events.map(e => e.venue))].sort();

  const filterChips = cats.map(c => `<button class="cal-chip" data-cat="${esc(c)}" type="button">${esc(categoryLabel(c))}</button>`).join('');

  const dayBlocks = dateKeys.map(iso => {
    const items = byDate.get(iso).map(e => `
      <article class="cal-event" data-cat="${esc(e.category)}" data-venue="${esc(e.venue)}">
        ${e.time ? `<div class="cal-event-time">${esc(fmtTime(e.time))}</div>` : '<div class="cal-event-time">&nbsp;</div>'}
        <div class="cal-event-body">
          <div class="cal-event-meta">
            <span class="cal-event-cat">${esc(categoryLabel(e.category))}</span>
            <span class="cal-event-venue">${esc(e.venue)}</span>
            ${e.venue_neighborhood ? `<span class="cal-event-neigh">${esc(e.venue_neighborhood)}</span>` : ''}
          </div>
          <h3 class="cal-event-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} <span class="entry-meta-link-icon">↗</span></a>` : esc(e.title)}</h3>
          ${e.subtitle ? `<p class="cal-event-sub">${esc(e.subtitle)}</p>` : ''}
        </div>
      </article>`).join('');
    return `
      <div class="cal-day" data-date="${iso}">
        <div class="cal-day-header"><div class="wrap"><h2 class="cal-day-date">${esc(fmtDay(iso))}</h2></div></div>
        <div class="cal-day-list">${items}</div>
      </div>`;
  }).join('');

  const updated = eventsData.generated_at
    ? new Date(eventsData.generated_at).toLocaleString('en-US', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null;

  const sourcesLine = (eventsData.sources || [])
    .filter(s => s.ok)
    .map(s => `${s.label} (${s.count})`)
    .join(' · ');

  const empty = events.length === 0
    ? `<section class="wrap" style="padding: 64px var(--gutter);">
         <p style="font-family: var(--font-body); font-size: 18px; color: var(--ink-soft);">The calendar is being assembled. Refresh in a few hours, or check the venues directly: <a href="/live-music/" style="color: var(--clay); border-bottom: 1px solid var(--clay);">live music venues</a> and <a href="/museums-and-galleries/" style="color: var(--clay); border-bottom: 1px solid var(--clay);">museums and galleries</a>.</p>
       </section>`
    : `<div class="cal-controls">
         <div class="wrap cal-controls-inner">
           <div class="cal-filter-group">
             <span class="cal-filter-label">Show:</span>
             <button class="cal-chip cal-chip-all is-on" data-cat="all" type="button">All ${events.length}</button>
             ${filterChips}
           </div>
         </div>
       </div>
       <div class="cal-stream">${dayBlocks}</div>`;

  return head({ title, description, slug: 'calendar', theme: 'forest' }) +
    header({ activeSlug: 'calendar' }) +
    `<section class="section-head">
       <div class="wrap">
         <div class="section-eyebrow">${events.length} upcoming · ${dateKeys.length} days</div>
         <h1 class="section-title">${esc(title)} <em>for the metro</em></h1>
         <p class="section-deck">${esc(description)}</p>
         ${updated ? `<p style="font-family: var(--font-label); font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); margin-top: 16px;">Last refreshed ${esc(updated)} · sources: ${esc(sourcesLine)}</p>` : ''}
       </div>
     </section>
     ${empty}
     <script>
       (function(){
         var chips = document.querySelectorAll('.cal-chip');
         var events = document.querySelectorAll('.cal-event');
         var days = document.querySelectorAll('.cal-day');
         function apply(cat){
           chips.forEach(function(c){ c.classList.toggle('is-on', c.dataset.cat === cat); });
           events.forEach(function(e){
             e.style.display = (cat === 'all' || e.dataset.cat === cat) ? '' : 'none';
           });
           days.forEach(function(d){
             var visible = d.querySelectorAll('.cal-event:not([style*="display: none"])').length;
             d.style.display = visible === 0 ? 'none' : '';
           });
         }
         chips.forEach(function(c){ c.addEventListener('click', function(){ apply(c.dataset.cat); }); });
       })();
     </script>` +
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

// ---------- /tonight/ — sunset clock + best places to watch + civic countdowns ----------
function renderTonight() {
  const r = rightnowData;
  const title = 'Tonight';
  const description = 'Sunset, weather, and what is coming up next on the metro calendar.';

  if (!r) {
    return head({ title, description, slug: 'tonight', theme: 'midnight' }) +
      header({ activeSlug: 'tonight' }) +
      `<section class="section-head"><div class="wrap"><h1 class="section-title">${esc(title)}</h1><p class="section-deck">Live data unavailable right now. Check back in an hour.</p></div></section>` +
      footer();
  }

  const date = (function(){ const [y,m,d] = r.today.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); })();

  const pickCard = `
    <article class="tonight-pick">
      <div class="tonight-pick-eyebrow">Tonight's sunset pick</div>
      <h2 class="tonight-pick-name">${esc(r.sunset_pick.name)}</h2>
      <div class="tonight-pick-where">${esc(r.sunset_pick.neighborhood)}</div>
      <p class="tonight-pick-why">${esc(r.sunset_pick.why)}</p>
    </article>`;

  const otherPicks = r.sunset_picks.filter(p => p.name !== r.sunset_pick.name).map(p => `
    <li class="tonight-other">
      <div class="tonight-other-name">${esc(p.name)}</div>
      <div class="tonight-other-where">${esc(p.neighborhood)}</div>
      <p class="tonight-other-why">${esc(p.why)}</p>
    </li>`).join('');

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

  return head({ title, description, slug: 'tonight', theme: 'midnight' }) +
    header({ activeSlug: 'tonight' }) +
    `<section class="tonight-hero">
       <div class="wrap tonight-hero-inner">
         <div class="tonight-hero-eyebrow">${esc(date)}</div>
         <h1 class="tonight-hero-headline">
           Sunset at <em>${esc(r.sun.set)}</em>.
         </h1>
         <div class="tonight-hero-meta">
           <div class="tonight-meta-item"><span class="tonight-meta-label">Sunrise</span><span class="tonight-meta-val">${esc(r.sun.rise)}</span></div>
           <div class="tonight-meta-item"><span class="tonight-meta-label">Daylight</span><span class="tonight-meta-val">${Math.floor(r.sun.daylight_min/60)}h ${r.sun.daylight_min%60}m</span></div>
           <div class="tonight-meta-item"><span class="tonight-meta-label">Conditions</span><span class="tonight-meta-val">${esc(r.weather.summary)}</span></div>
         </div>
       </div>
     </section>
     <section class="tonight-pick-section wrap">${pickCard}</section>
     <section class="tonight-others wrap">
       <h2 class="tonight-section-title">Other places to watch tonight</h2>
       <ul class="tonight-others-list">${otherPicks}</ul>
     </section>
     <section class="tonight-countdowns wrap">
       <h2 class="tonight-section-title">Coming up on the calendar</h2>
       <ul class="countdowns-list">${countdowns}</ul>
     </section>` +
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
    ...categories.map(c => ({ loc: `${SITE}/${c.slug}/`, priority: '0.9' })),
    ...(neighborhoods || []).map(nb => ({ loc: `${SITE}/neighborhoods/${nb.slug}/`, priority: '0.8' }))
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
