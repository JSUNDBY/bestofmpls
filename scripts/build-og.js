#!/usr/bin/env node
/**
 * Generate the Open Graph share image for bestofmpls.
 * SVG → PNG via rsvg-convert (librsvg). Output: dist/og-image.png (1200x630).
 *
 * Design notes (the previous version broke): the headline used a NARROW font at
 * 190px tuned for the CI font, which rendered wider elsewhere and overflowed the
 * canvas, and a neighborhood-tag rail sat on top of it. This version uses a
 * normal-width system sans at a conservative size with big right-margin clearance
 * so it can't overflow in any font, and drops the colliding rail. Municipal-
 * modernist register: cream paper, clay accent, lots of air.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PAPER     = '#F4F2EC';
const INK       = '#141414';
const INK_SOFT  = '#4A4A48';
const INK_FAINT = '#8A8A86';
const CLAY      = '#C8200F';

// Normal-width system sans available both on macOS (Helvetica) and Ubuntu CI
// (Liberation Sans / DejaVu Sans). No narrow faces — their widths vary too much.
const FONT = '"Liberation Sans", "DejaVu Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif';
const FONT_MONO = '"Liberation Mono", "DejaVu Sans Mono", "Menlo", "Courier New", monospace';

function generateSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect x="0" y="0" width="1200" height="630" fill="${PAPER}"/>
  <rect x="0" y="0" width="1200" height="10" fill="${CLAY}"/>

  <!-- Eyebrow -->
  <rect x="64" y="70" width="14" height="14" fill="${CLAY}"/>
  <text x="90" y="82" font-family='${FONT}' font-weight="700" font-size="17" letter-spacing="2.5" fill="${CLAY}">AN INDEPENDENT GUIDE TO MINNEAPOLIS &amp; SAINT PAUL</text>

  <!-- Wordmark, the brand exactly as it reads on the site -->
  <text x="62" y="300" font-family='${FONT}' font-weight="800" font-size="150" letter-spacing="-4" fill="${INK}">bestofmpls<tspan fill="${CLAY}">.</tspan></text>

  <!-- Deck -->
  <text x="64" y="372" font-family='${FONT}' font-weight="500" font-size="33" fill="${INK_SOFT}">What's good in the Twin Cities, tonight.</text>

  <!-- Capability line -->
  <text x="64" y="438" font-family='${FONT_MONO}' font-weight="500" font-size="19" letter-spacing="1" fill="${INK_FAINT}">A LIVING GUIDE · 600+ SPOTS · A REAL CALENDAR · UPDATED DAILY · FREE</text>

  <!-- Bottom rule + row -->
  <rect x="64" y="556" width="1072" height="2" fill="${INK}"/>
  <text x="64" y="598" font-family='${FONT_MONO}' font-weight="500" font-size="16" letter-spacing="0.5" fill="${INK_FAINT}">MADE FOR THE METRO BY THE PEOPLE WHO LIVE HERE</text>
  <text x="1136" y="598" font-family='${FONT}' font-weight="800" font-size="20" letter-spacing="2" fill="${CLAY}" text-anchor="end">BESTOFMPLS.COM</text>
</svg>`;
}

function build() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ does not exist; run main build first');
    process.exit(1);
  }
  const svgPath = path.join(DIST, 'og-image.svg');
  const pngPath = path.join(DIST, 'og-image.png');
  fs.writeFileSync(svgPath, generateSVG());
  console.log('  → og-image.svg');
  try {
    execSync(`rsvg-convert -w 1200 -h 630 "${svgPath}" -o "${pngPath}"`);
    console.log(`  → og-image.png (${(fs.statSync(pngPath).size / 1024).toFixed(1)}KB)`);
  } catch (e) {
    console.error('rsvg-convert failed:', e.message);
    process.exit(1);
  }
}

build();
