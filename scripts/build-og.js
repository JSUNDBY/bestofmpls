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
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>

  <!-- Background: white paper -->
  <rect width="1200" height="630" fill="${PAPER}"/>

  <!-- Subtle paper grain overlay -->
  <rect width="1200" height="630" filter="url(#grain)" opacity="0.5"/>

  <!-- Top hairline -->
  <line x1="80" y1="80" x2="1120" y2="80" stroke="${INK}" stroke-opacity="0.2" stroke-width="1"/>

  <!-- Top-left issue badge -->
  <text x="80" y="56" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="600" font-size="14" letter-spacing="3" fill="${CLAY}">VOLUME 01 · SPRING 2026</text>

  <!-- Top-right tagline -->
  <text x="1120" y="56" font-family="Georgia, serif" font-style="italic" font-size="18" fill="${PAPER_FAINT}" text-anchor="end">Made for the metro.</text>

  <!-- Brand mark, large. Playfair italic 900. -->
  <text x="80" y="200" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="900" font-size="100" letter-spacing="-2" fill="${INK}">bestofmpls<tspan fill="${CLAY}">.</tspan></text>

  <!-- Headline (the city pair). Playfair regular + italic accent. -->
  <text x="80" y="370" font-family="Playfair Display, Georgia, serif" font-weight="400" font-size="100" letter-spacing="-2" fill="${INK}">Minneapolis</text>
  <text x="80" y="488" font-family="Playfair Display, Georgia, serif" font-weight="400" font-size="100" letter-spacing="-2" fill="${INK}"><tspan font-style="italic" font-weight="700" fill="${CLAY}">&amp;</tspan> Saint Paul.</text>

  <!-- Bottom hairline -->
  <line x1="80" y1="540" x2="1120" y2="540" stroke="${INK}" stroke-opacity="0.2" stroke-width="1"/>

  <!-- Bottom row: deck + URL -->
  <text x="80" y="580" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="20" fill="${PAPER_FAINT}">An independent guide to the museums, music, food, and small good things.</text>
  <text x="1120" y="580" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="600" font-size="20" fill="${CLAY}" text-anchor="end">bestofmpls.com</text>
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
