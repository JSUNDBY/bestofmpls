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

const ROOT  = path.resolve(__dirname, '..');
const SRC   = path.join(ROOT, 'src');
const DIST  = path.join(ROOT, 'dist');
const SITE  = 'https://bestofmpls.com';
const TODAY = new Date().toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric'
});

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
const shops        = require(path.join(SRC, 'data/shops.js'));
const mensClothing = require(path.join(SRC, 'data/mens-clothing.js'));
const womensClothing = require(path.join(SRC, 'data/womens-clothing.js'));
const hotels       = require(path.join(SRC, 'data/hotels.js'));
const outdoors     = require(path.join(SRC, 'data/outdoors.js'));
const hiddenGems   = require(path.join(SRC, 'data/hidden-gems.js'));
const festivals    = require(path.join(SRC, 'data/festivals.js'));

// Editorial clusters drive the homepage layout. With 28 categories, the
// homepage now reads like a real city magazine: Culture, Eat, Drink, Shop,
// Stay & Do, plus the dark calendar feature for Festivals.
const clusters = [
  {
    eyebrow: 'See & Experience',
    title: 'Culture',
    deck: 'The institutions, stages, screens, and rooms that make this a city worth living in.',
    categories: [museums, liveMusic, theaters, cinemas, lgbtq]
  },
  {
    eyebrow: 'Eat',
    title: 'Where to eat',
    deck: 'A real food town in fifteen directions at once. Restaurants worth a reservation, sushi, banh mi, tacos, sandwiches, late-night slices, ice cream by the lake, and the burger Minneapolis invented.',
    categories: [restaurants, foodHalls, coffee, bakeries, sandwiches, burgers, pizza, brunch, mexican, vietnamese, korean, japanese, hmong, ethiopian, indian, iceCream, lateNight]
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
  museums, liveMusic, theaters, cinemas, lgbtq,
  // Eat
  restaurants, foodHalls, coffee, bakeries, sandwiches, burgers, pizza, brunch,
  mexican, vietnamese, korean, japanese, hmong, ethiopian, indian, iceCream, lateNight,
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

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} · bestofmpls">
<meta name="twitter:description" content="${esc(description)}">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/styles.css">
<script>
// Set color mode before paint to avoid flash. Reads localStorage first,
// falls back to system preference. mode-ready class added after first
// frame so the smooth transition only kicks in for user toggles.
(function(){
  var stored = localStorage.getItem('bom-mode');
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var mode = stored || (prefersDark ? 'dark' : 'light');
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
  // Top nav uses cluster names, not all 12 categories. Cleaner look,
  // and the cluster names anchor to the homepage section.
  const navItems = [
    { href: '/', label: 'Cover', slug: '' },
    { href: '/visit/', label: 'First Time?', slug: 'visit' },
    { href: '/#culture', label: 'Culture' },
    { href: '/#eat', label: 'Eat' },
    { href: '/#drink', label: 'Drink' },
    { href: '/#shop', label: 'Shop' },
    { href: '/neighborhoods/', label: 'Neighborhoods', slug: 'neighborhoods' },
    { href: '/festivals/', label: 'Festivals', slug: 'festivals' },
    { href: '/glossary/', label: "Loon's Nest", slug: 'glossary' },
    { href: '/search/', label: 'Search', slug: 'search' },
    { href: '/contribute/', label: 'Send a Tip', slug: 'contribute' }
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
        <button class="nav-toggle" type="button" aria-label="Open menu" data-nav-toggle>
          <span class="nav-toggle-icon">☰</span>
          <span>Menu</span>
        </button>
      </div>
    </div>
    <a href="/" class="logo">bestofmpls<span class="dot">.</span></a>
  </div>
  <nav class="primary-nav">
    <div class="wrap">
      <div class="primary-nav-inner">
        ${navItems.map(n => `<a href="${n.href}"${activeSlug && n.slug === activeSlug ? ' class="active"' : ''}>${esc(n.label)}</a>`).join('')}
      </div>
    </div>
  </nav>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">bestofmpls<span class="dot">.</span></div>
        <p class="footer-tag">A guide to the museums, music, food, and small good things of Minneapolis and Saint Paul. Made for the metro by the people who live here.</p>
        <div class="footer-newsletter">
          <p class="footer-list-title">Get the weekly</p>
          <form class="footer-newsletter-form" action="https://formspree.io/f/REPLACE_WITH_FORM_ID" method="POST">
            <input type="email" name="email" placeholder="you@example.com" required aria-label="Email address">
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      <div>
        <p class="footer-list-title">Categories</p>
        <ul class="footer-list">
          ${categories.map(c => `<li><a href="/${c.slug}/">${esc(c.title)}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <p class="footer-list-title">More</p>
        <ul class="footer-list">
          <li><a href="/about/">About</a></li>
          <li><a href="/contribute/">Send us a tip</a></li>
          <li><a href="mailto:hello@bestofmpls.com">Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="colophon">
      <span>© ${new Date().getFullYear()} bestofmpls. All rights reserved.</span>
      <span>Made in Minneapolis</span>
    </div>
  </div>
</footer>
<script>
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

// Mobile nav: toggle .is-open on .primary-nav when hamburger is clicked.
(function(){
  var btn = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('.primary-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function(){
    nav.classList.toggle('is-open');
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
    // 1-2 categories use 2-column layout. 3+ use 3-column.
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

  return head({ title, description, slug: '', theme: 'default' }) +
    header({ activeSlug: '' }) +
    `<section class="cover">
      <div class="wrap">
        <div class="cover-issue">Vol. 01 · Spring 2026</div>
        <h1 class="cover-headline">Minneapolis<br><em>&amp;</em> Saint Paul.</h1>
        <p class="cover-deck">Where to eat, drink, see, hear, sleep, and spend a Saturday in two of the best small cities in America. Made for the metro by the people who live here.</p>
        <div class="cover-meta">
          <span>${categories.length} categories</span>
          <span>${categories.reduce((sum, c) => sum + c.entries.length, 0)} places</span>
          <span>Updated weekly</span>
        </div>
      </div>
    </section>
    ${clusterSections}
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
    const rank = String(i + 1).padStart(2, '0');
    // First entry on each list gets a featured treatment ("Editor's pick")
    const featured = i === 0 ? ' entry--featured' : '';
    const meta = [];
    if (e.neighborhood) meta.push(`<span>${esc(e.neighborhood)}</span>`);
    if (e.style) meta.push(`<span class="entry-meta-style">${esc(e.style)}</span>`);
    const footerBits = [];
    if (e.address) footerBits.push(`<span>${esc(e.address)}</span>`);
    if (e.price) footerBits.push(`<span class="entry-footer-price">${esc(e.price)}</span>`);
    if (e.hours) footerBits.push(`<span>${esc(e.hours)}</span>`);
    if (e.capacity) footerBits.push(`<span>Capacity ${esc(e.capacity)}</span>`);
    if (e.website) {
      const cleanUrl = e.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
      footerBits.push(`<a class="entry-website" href="${esc(e.website)}" target="_blank" rel="noopener">${esc(cleanUrl)} →</a>`);
    }
    return `<article class="entry${featured}" id="${esc(e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">
      <div class="entry-rank">${i === 0 ? '★' : rank}</div>
      <div class="entry-body">
        <div class="entry-meta">${meta.join('')}${i === 0 ? '<span class="entry-meta-pick">Editor’s pick</span>' : ''}</div>
        <h2 class="entry-name">${esc(e.name)}</h2>
        <p class="entry-description">${esc(e.description)}</p>
        <div class="entry-footer">${footerBits.join('')}</div>
      </div>
    </article>`;
  }).join('');

  // ItemList schema for SEO. Use Place as fallback for non-restaurant categories.
  const itemType = (c.slug.includes('pizza') || c.slug.includes('brunch') || c.slug.includes('happy') || c.slug.includes('bars'))
    ? 'Restaurant' : 'Place';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: c.title,
    description: c.subtitle,
    numberOfItems: c.entries.length,
    itemListElement: c.entries.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': itemType, name: e.name, address: e.address }
    }))
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
    <section class="entry-list">
      ${entries}
    </section>
    <script type="application/ld+json">${JSON.stringify(schema)}</script>` +
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
      <form class="contribute-form" action="https://formspree.io/f/REPLACE_WITH_FORM_ID" method="POST">
        <div>
          <label for="name">Your name</label>
          <input id="name" name="name" type="text" placeholder="So we can credit you if we use it">
        </div>
        <div>
          <label for="email">Your email</label>
          <input id="email" name="email" type="email" placeholder="In case we need to follow up">
        </div>
        <div>
          <label for="place">The place or topic</label>
          <input id="place" name="place" type="text" placeholder="e.g. Best ramen in St. Paul, or a correction to the pizza list" required>
        </div>
        <div>
          <label for="message">Tell us about it</label>
          <textarea id="message" name="message" placeholder="Why is this worth listing? What do they do well? Address if you have it." required></textarea>
        </div>
        <button type="submit">Send the tip</button>
      </form>
      <div class="about-body" style="padding-top: 0;">
        <p style="font-style: italic; color: var(--ink-soft);">Prefer email? Write to <a href="mailto:hello@bestofmpls.com">hello@bestofmpls.com</a> directly.</p>
      </div>
    </section>` +
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

  fs.copyFileSync(path.join(SRC, 'styles.css'), path.join(DIST, 'styles.css'));
  console.log(`  → styles.css`);

  writeFile('index.html', renderHome());
  for (const c of categories) writeFile(`${c.slug}/index.html`, renderCategory(c));
  // Neighborhood pages
  const neighborhoods = buildNeighborhoodIndex();
  writeFile('neighborhoods/index.html', renderNeighborhoodIndex(neighborhoods));
  for (const nb of neighborhoods) writeFile(`neighborhoods/${nb.slug}/index.html`, renderNeighborhoodPage(nb));

  // First-time / itineraries page
  writeFile('visit/index.html', renderItineraries());

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
  writeFile('contribute/index.html', renderContribute());
  writeFile('404.html', render404());
  writeFile('sitemap.xml', renderSitemap(neighborhoods));
  writeFile('robots.txt', renderRobots());
  writeFile('favicon.svg', renderFavicon());

  console.log(`\n✓ Built to dist/\n`);
}

build();
