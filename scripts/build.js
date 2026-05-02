#!/usr/bin/env node
/**
 * bestofmpls — static site generator
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
const categories = [
  require(path.join(SRC, 'data/pizza.js')),
  require(path.join(SRC, 'data/dive-bars.js')),
  require(path.join(SRC, 'data/brunch.js')),
  require(path.join(SRC, 'data/patios.js')),
  require(path.join(SRC, 'data/happy-hours.js'))
];

// ---------- Helpers ----------
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

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
<title>${esc(title)} — bestofmpls</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)} — bestofmpls">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="bestofmpls">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} — bestofmpls">
<meta name="twitter:description" content="${esc(description)}">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/styles.css">
</head>
<body${theme ? ` data-theme="${theme}"` : ''}>`;
}

function header({ activeSlug } = {}) {
  const navItems = [
    { href: '/', label: 'Cover', slug: '' },
    ...categories.map(c => ({
      href: `/${c.slug}/`,
      label: c.title.replace(/^Best /, '').replace(/ in.*/, '').replace(/ for.*/, ''),
      slug: c.slug
    })),
    { href: '/about/', label: 'About', slug: 'about' }
  ];
  return `<header class="site-header">
  <div class="wrap">
    <div class="masthead">
      <div class="masthead-date">${esc(TODAY)} · Twin Cities Edition</div>
      <div class="masthead-tagline">The Twin Cities, curated.</div>
    </div>
    <a href="/" class="logo">bestofmpls<span class="dot">.</span></a>
  </div>
  <nav class="primary-nav">
    <div class="wrap">
      <div class="primary-nav-inner">
        ${navItems.map(n => `<a href="${n.href}"${activeSlug === n.slug ? ' class="active"' : ''}>${esc(n.label)}</a>`).join('')}
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
        <p class="footer-tag">An independent guide to the best of Minneapolis, St. Paul, and the metro that surrounds them. Written by people who actually live here.</p>
      </div>
      <div>
        <p class="footer-list-title">Categories</p>
        <ul class="footer-list">
          ${categories.map(c => `<li><a href="/${c.slug}/">${esc(c.title.replace(/^Best /, ''))}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <p class="footer-list-title">More</p>
        <ul class="footer-list">
          <li><a href="/about/">About</a></li>
          <li><a href="mailto:hello@bestofmpls.com">Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="colophon">
      <span>© ${new Date().getFullYear()} bestofmpls — All rights reserved</span>
      <span>Made in Minneapolis</span>
    </div>
  </div>
</footer>
</body>
</html>`;
}

// ---------- Pages ----------
function renderHome() {
  const title = 'bestofmpls — The Twin Cities, curated';
  const description = 'An independent guide to the best restaurants, bars, patios, and brunch in Minneapolis & St. Paul.';
  return head({ title, description, slug: '', theme: 'crimson' }) +
    header({ activeSlug: '' }) +
    `<section class="cover">
      <div class="wrap">
        <div class="cover-issue">Volume 1 · Spring 2026</div>
        <h1 class="cover-headline">The best of <em>Mpls.</em></h1>
        <p class="cover-deck">An honest, opinionated, locally-written guide to the restaurants, bars, patios, and Sunday brunches worth your time across Minneapolis, St. Paul, and the rest of the metro.</p>
        <div class="cover-meta">
          <span>${categories.length} categories</span>
          <span>${categories.reduce((sum, c) => sum + c.entries.length, 0)} places</span>
          <span>0 sponsored picks</span>
        </div>
      </div>
    </section>
    <section class="cat-grid">
      ${categories.map(c => `
        <a class="cat-card" href="/${c.slug}/">
          <div class="cat-card-eyebrow">${esc(c.title.replace(/^Best /, '').split(' ')[0])} · ${c.entries.length} picks</div>
          <h2 class="cat-card-title">${esc(c.title)}</h2>
          <p class="cat-card-deck">${esc(c.subtitle)}</p>
          <span class="cat-card-arrow">→</span>
        </a>
      `).join('')}
    </section>` +
    footer();
}

function renderCategory(c) {
  const description = c.subtitle;
  const entries = c.entries.map((e, i) => {
    const rank = String(i + 1).padStart(2, '0');
    const meta = [];
    if (e.neighborhood) meta.push(`<span>${esc(e.neighborhood)}</span>`);
    if (e.style) meta.push(`<span class="entry-meta-style">${esc(e.style)}</span>`);
    const footer = [];
    if (e.address) footer.push(`<span>${esc(e.address)}</span>`);
    if (e.price) footer.push(`<span class="entry-footer-price">${esc(e.price)}</span>`);
    if (e.hours) footer.push(`<span>${esc(e.hours)}</span>`);
    return `<article class="entry" id="${esc(e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">
      <div class="entry-rank">${rank}</div>
      <div class="entry-body">
        <div class="entry-meta">${meta.join('')}</div>
        <h2 class="entry-name">${esc(e.name)}</h2>
        <p class="entry-description">${esc(e.description)}</p>
        <div class="entry-footer">${footer.join('')}</div>
      </div>
    </article>`;
  }).join('');

  // ItemList schema for SEO
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: c.title,
    description: c.subtitle,
    numberOfItems: c.entries.length,
    itemListElement: c.entries.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Restaurant',
        name: e.name,
        address: e.address,
        priceRange: e.price
      }
    }))
  };

  return head({ title: c.title, description, slug: c.slug, theme: c.hero_color }) +
    header({ activeSlug: c.slug }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">The list · ${c.entries.length} picks</div>
        <h1 class="section-title">${esc(c.title)}</h1>
        <p class="section-deck">${esc(c.intro)}</p>
      </div>
    </section>
    <section class="entry-list">
      ${entries}
    </section>
    <script type="application/ld+json">${JSON.stringify(schema)}</script>` +
    footer();
}

function renderAbout() {
  const title = 'About bestofmpls';
  const description = 'An independent, locally-written guide to the best of Minneapolis & St. Paul.';
  return head({ title, description, slug: 'about', theme: 'crimson' }) +
    header({ activeSlug: 'about' }) +
    `<section class="section-head">
      <div class="wrap">
        <div class="section-eyebrow">About</div>
        <h1 class="section-title">An independent guide<br>to the Twin Cities.</h1>
      </div>
    </section>
    <section class="wrap">
      <div class="about-body">
        <p>bestofmpls is a locally-written, opinionated guide to the restaurants, bars, patios, and weekend rituals that make Minneapolis and St. Paul worth living in. We are not a magazine and we are not an algorithm. We are people who actually live here, eat here, drink here, and have strong opinions about all of it.</p>
        <p>City Pages — the alt-weekly that did the original "Best of" issue every year for thirty years — closed in 2020 and never came back. The Twin Cities deserves a successor: something honest, free to read, written by locals, and not paywalled behind a magazine subscription. That is what this is.</p>
        <p>Our lists are not sponsored. Our picks are not paid placements. We do not run a "voted best by readers" pay-to-play scheme. The list is the list because we think the list is the list. If a restaurant pays to advertise on this site (and many will, eventually), it will be marked clearly and will not appear in the editorial rankings.</p>
        <p>If you have a place you think we missed, a strong correction, or a tip you want to share, write to <a href="mailto:hello@bestofmpls.com">hello@bestofmpls.com</a>. We read every note.</p>
      </div>
    </section>` +
    footer();
}

function render404() {
  return head({ title: 'Page not found', description: 'That page is not here.', slug: '404', theme: 'crimson' }) +
    header({}) +
    `<section class="wrap notfound">
      <p class="notfound-num">404</p>
      <h1 class="notfound-msg">That page is not here.</h1>
      <p><a href="/">Back to the cover →</a></p>
    </section>` +
    footer();
}

function renderSitemap() {
  const urls = [
    { loc: SITE + '/', priority: '1.0' },
    { loc: SITE + '/about/', priority: '0.6' },
    ...categories.map(c => ({ loc: `${SITE}/${c.slug}/`, priority: '0.9' }))
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
  // Simple SVG favicon — bold "B" mark in crimson on cream
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#F2EBDD"/>
  <text x="32" y="50" font-family="Archivo Black, system-ui, sans-serif" font-size="52" font-weight="900" text-anchor="middle" fill="#A8243F">B</text>
</svg>`;
}

// ---------- Build ----------
function build() {
  console.log('\n→ bestofmpls build');
  console.log(`  ${categories.length} categories, ${categories.reduce((s, c) => s + c.entries.length, 0)} entries\n`);

  // Wipe and recreate dist
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  ensureDir(DIST);

  // Copy CSS
  fs.copyFileSync(path.join(SRC, 'styles.css'), path.join(DIST, 'styles.css'));
  console.log(`  → styles.css`);

  // Pages
  writeFile('index.html', renderHome());
  for (const c of categories) writeFile(`${c.slug}/index.html`, renderCategory(c));
  writeFile('about/index.html', renderAbout());
  writeFile('404.html', render404());
  writeFile('sitemap.xml', renderSitemap());
  writeFile('robots.txt', renderRobots());
  writeFile('favicon.svg', renderFavicon());

  console.log(`\n✓ Built to dist/\n`);
}

build();
