#!/usr/bin/env node
/**
 * Generate the Open Graph share image for bestofmpls.
 * SVG → PNG via rsvg-convert (librsvg). Output: dist/og-image.png (1200x630).
 *
 * Design (2026 duotone pass): a dark card in the register of the site's footer.
 * The twilight Minneapolis skyline is embedded (base64, so it renders in CI with
 * no asset-path dependency) and run through the same duotone filter used on the
 * site (#duotone-bom): shadows → near-black so they dissolve into the card,
 * highlights → cream so the lit skyline glows along the lower band. A clay top
 * bar, a big cream wordmark, and a legible bottom row complete it. Type uses a
 * normal-width system grotesk (Liberation/DejaVu on CI) — the "new look" is
 * carried by the duotone skyline and composition, not a webfont we can't ship to
 * the renderer. Conservative sizing with right-margin clearance so nothing
 * overflows whatever font the renderer falls back to.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SKYLINE = path.join(ROOT, 'public', 'img', 'skyline-cover.jpg');

const CARD       = '#0A0A0A';   // matches the footer slab
const CREAM      = '#F4EEDF';   // the site's footer cream
const CREAM_SOFT = '#C7C3B8';   // secondary on dark
const CREAM_FAINT= '#8E8B82';   // metadata on dark
const CLAY       = '#C8200F';   // brand sign red

// Normal-width system sans available both on macOS (Helvetica) and Ubuntu CI
// (Liberation Sans / DejaVu Sans). No narrow faces — their widths vary too much.
const FONT = '"Liberation Sans", "DejaVu Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif';
const FONT_MONO = '"Liberation Mono", "DejaVu Sans Mono", "Menlo", "Courier New", monospace';

function skylineDataUri() {
  const buf = fs.readFileSync(SKYLINE);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

function generateSVG() {
  const sky = skylineDataUri();
  // Source photo is 800x534; scaled to full 1200 width → ~801 tall. Placed so the
  // building line lands in the visible (unmasked) lower band, foreground spills
  // below the canvas.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="duotone-bom" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0.039 0.957"/>
        <feFuncG type="table" tableValues="0.039 0.933"/>
        <feFuncB type="table" tableValues="0.039 0.874"/>
      </feComponentTransfer>
    </filter>
    <linearGradient id="bandmask" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000"/>
      <stop offset="0.50" stop-color="#000"/>
      <stop offset="0.66" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <mask id="skymask"><rect x="0" y="0" width="1200" height="630" fill="url(#bandmask)"/></mask>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CARD}" stop-opacity="0"/>
      <stop offset="1" stop-color="${CARD}" stop-opacity="0.92"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="1200" height="630" fill="${CARD}"/>

  <!-- Duotone skyline, glowing in the lower band -->
  <g mask="url(#skymask)" opacity="0.66">
    <image xlink:href="${sky}" x="0" y="118" width="1200" height="801" filter="url(#duotone-bom)" preserveAspectRatio="none"/>
  </g>
  <!-- Bottom scrim keeps the URL row legible over the skyline -->
  <rect x="0" y="496" width="1200" height="134" fill="url(#scrim)"/>
  <!-- Clay brand bar -->
  <rect x="0" y="0" width="1200" height="10" fill="${CLAY}"/>

  <!-- Eyebrow -->
  <rect x="64" y="74" width="14" height="14" fill="${CLAY}"/>
  <text x="90" y="86" font-family='${FONT_MONO}' font-weight="700" font-size="17" letter-spacing="2.5" fill="${CLAY}">AN INDEPENDENT GUIDE TO MINNEAPOLIS &amp; SAINT PAUL</text>

  <!-- Wordmark -->
  <text x="62" y="258" font-family='${FONT}' font-weight="800" font-size="150" letter-spacing="-4" fill="${CREAM}">bestofmpls<tspan fill="${CLAY}">.</tspan></text>

  <!-- Deck -->
  <text x="64" y="330" font-family='${FONT}' font-weight="500" font-size="33" fill="${CREAM_SOFT}">What's good in the Twin Cities, tonight.</text>

  <!-- Bottom rule + row -->
  <rect x="64" y="558" width="1072" height="2" fill="${CREAM}" opacity="0.4"/>
  <text x="64" y="600" font-family='${FONT_MONO}' font-weight="500" font-size="16" letter-spacing="0.5" fill="${CREAM_FAINT}">A LIVING GUIDE · UPDATED DAILY · MADE FOR THE METRO</text>
  <text x="1136" y="600" font-family='${FONT}' font-weight="800" font-size="20" letter-spacing="2" fill="${CLAY}" text-anchor="end">BESTOFMPLS.COM</text>
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
