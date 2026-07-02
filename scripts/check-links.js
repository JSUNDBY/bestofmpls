#!/usr/bin/env node
/**
 * Internal-link integrity check over dist/. Fails the build when any internal
 * href points at a page that does not exist, so a broken link can never ship.
 *
 * Scope: static hrefs in the HTML only. <script> blocks are stripped first so
 * client-side template strings ('/'+slug+'/...') don't false-positive; those
 * paths are covered by their own guards (venueHref, entrySlug) at build time.
 * Hash fragments are not validated here (several pages use client-side hash
 * routing, e.g. /mystery/#...).
 *
 * Usage: node scripts/check-links.js   (exit 1 on any broken link)
 */

const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');

function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) yield* walk(p);
    else if (f.name.endsWith('.html')) yield p;
  }
}

function targetExists(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '/' || clean === '') return true;
  const rel = clean.replace(/^\//, '');
  if (fs.existsSync(path.join(DIST, rel.replace(/\/$/, ''), 'index.html'))) return true;
  if (fs.existsSync(path.join(DIST, rel))) return true; // /calendar.ics, /og-image.png...
  return false;
}

const HREF_RE = /href="(\/[^"]*)"/g;
const broken = new Map(); // href -> Set(sources)
let pages = 0, links = 0;

for (const file of walk(DIST)) {
  pages++;
  let html = fs.readFileSync(file, 'utf8');
  // Strip scripts: client templates build their URLs at runtime.
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  for (const m of html.matchAll(HREF_RE)) {
    links++;
    const href = m[1];
    if (!targetExists(href)) {
      if (!broken.has(href)) broken.set(href, new Set());
      broken.get(href).add(path.relative(DIST, file));
    }
  }
}

console.log(`  link check: ${links} internal links across ${pages} pages`);
if (broken.size) {
  console.error(`  ✗ ${broken.size} broken internal link(s):`);
  for (const [href, srcs] of broken) {
    console.error(`    ${href}   <- ${[...srcs].slice(0, 3).join(', ')}${srcs.size > 3 ? ` (+${srcs.size - 3} more)` : ''}`);
  }
  process.exit(1);
}
console.log('  ✓ all internal links resolve');
