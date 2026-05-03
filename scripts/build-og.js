#!/usr/bin/env node
/**
 * Generate Open Graph image for bestofmpls.
 * SVG → PNG via rsvg-convert (librsvg).
 *
 * Output: dist/og-image.png (1200x630)
 *
 * Uses Impact / Arial Black system fonts since SVG @font-face is unreliable
 * across renderers. Result is a PNG so end-viewer's fonts don't matter.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Brand palette: Stark Editorial. White paper, black ink, bright red accent.
const PAPER = '#FFFFFF';
const PAPER_FAINT = '#7A7A7A';
const INK = '#0A0A0A';
const CLAY = '#E11900';

function generateSVG() {
  // Embed the skyline photo as base64 so rsvg-convert can render it without
  // any file-system path issues. JPEG keeps it manageable.
  const skylinePath = path.join(ROOT, 'public/img/skyline-og.jpg');
  const skylineB64 = fs.readFileSync(skylinePath).toString('base64');
  const skylineDataUri = `data:image/jpeg;base64,${skylineB64}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${INK}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.92"/>
    </linearGradient>
    <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Hero photo: Minneapolis skyline at twilight -->
  <image xlink:href="${skylineDataUri}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>

  <!-- Top fade for eyebrow legibility -->
  <rect x="0" y="0" width="1200" height="140" fill="url(#topFade)"/>

  <!-- Bottom fade for brand mark + headline + URL legibility -->
  <rect x="0" y="280" width="1200" height="350" fill="url(#bottomFade)"/>

  <!-- Top eyebrow (over photo) -->
  <text x="80" y="68" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="3.5" fill="${CLAY}">VOL. 01 · SPRING 2026</text>

  <!-- Hero brand mark, lower-left over photo -->
  <text x="80" y="490" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="900" font-size="124" letter-spacing="-3" fill="${PAPER}">bestofmpls<tspan fill="${CLAY}">.</tspan></text>

  <!-- Sub-headline: the cities -->
  <text x="80" y="552" font-family="Playfair Display, Georgia, serif" font-weight="400" font-size="36" letter-spacing="-0.5" fill="${PAPER}">Minneapolis <tspan font-style="italic" font-weight="700" fill="${CLAY}">&amp;</tspan> Saint Paul.</text>

  <!-- Bottom row: tagline + URL -->
  <text x="80" y="600" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="400" font-size="20" fill="${PAPER}" fill-opacity="0.85">An independent guide to a city of long winters and bright light.</text>
  <text x="1120" y="600" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="3" fill="${CLAY}" text-anchor="end">BESTOFMPLS.COM</text>
</svg>`;
}

function build() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ does not exist; run main build first');
    process.exit(1);
  }

  const svgPath = path.join(DIST, 'og-image.svg');
  const pngPath = path.join(DIST, 'og-image.png');

  // Write SVG
  fs.writeFileSync(svgPath, generateSVG());
  console.log(`  → og-image.svg`);

  // Convert SVG to PNG with rsvg-convert
  try {
    execSync(`rsvg-convert -w 1200 -h 630 "${svgPath}" -o "${pngPath}"`);
    const stat = fs.statSync(pngPath);
    console.log(`  → og-image.png (${(stat.size / 1024).toFixed(1)}KB)`);
  } catch (e) {
    console.error('rsvg-convert failed:', e.message);
    process.exit(1);
  }
}

build();
