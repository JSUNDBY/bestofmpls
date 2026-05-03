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
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>

  <!-- Background: white paper -->
  <rect width="1200" height="630" fill="${PAPER}"/>

  <!-- Subtle paper grain overlay -->
  <rect width="1200" height="630" filter="url(#grain)"/>

  <!-- Top eyebrow -->
  <text x="80" y="90" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="15" letter-spacing="3.5" fill="${CLAY}">VOL. 01 · SPRING 2026</text>

  <!-- Top hairline -->
  <line x1="80" y1="120" x2="1120" y2="120" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Hero brand mark. The whole point of the image. Italic Playfair, red dot. -->
  <text x="80" y="335" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="900" font-size="168" letter-spacing="-4" fill="${INK}">bestofmpls<tspan fill="${CLAY}">.</tspan></text>

  <!-- Sub-headline: the cities, in regular serif -->
  <text x="80" y="430" font-family="Playfair Display, Georgia, serif" font-weight="400" font-size="58" letter-spacing="-1" fill="${INK}">Minneapolis <tspan font-style="italic" font-weight="700" fill="${CLAY}">&amp;</tspan> Saint Paul.</text>

  <!-- Bottom hairline -->
  <line x1="80" y1="520" x2="1120" y2="520" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Bottom row: italic tagline left, URL right -->
  <text x="80" y="575" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="400" font-size="22" fill="${INK}">An independent guide to a city of long winters and bright light.</text>
  <text x="1120" y="575" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="3" fill="${CLAY}" text-anchor="end">BESTOFMPLS.COM</text>
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
