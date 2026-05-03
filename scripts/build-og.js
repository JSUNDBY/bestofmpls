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

  <!-- Top eyebrow row -->
  <text x="80" y="86" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="15" letter-spacing="3.5" fill="${CLAY}">BESTOFMPLS · VOL. 01 · SPRING 2026</text>

  <!-- Top hairline below eyebrow -->
  <line x1="80" y1="116" x2="1120" y2="116" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Massive headline. Two lines. Italic red ampersand. -->
  <text x="80" y="290" font-family="Playfair Display, Georgia, serif" font-weight="400" font-size="140" letter-spacing="-3" fill="${INK}">Minneapolis</text>
  <text x="80" y="430" font-family="Playfair Display, Georgia, serif" font-weight="400" font-size="140" letter-spacing="-3" fill="${INK}"><tspan font-style="italic" font-weight="700" fill="${CLAY}">&amp;</tspan> Saint Paul.</text>

  <!-- Bottom hairline -->
  <line x1="80" y1="510" x2="1120" y2="510" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Bottom row: tagline left, URL right (italic serif tagline, all-caps URL) -->
  <text x="80" y="570" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="400" font-size="26" fill="${INK}">An independent guide to Minneapolis &amp; Saint Paul.</text>
  <text x="1120" y="570" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="3" fill="${CLAY}" text-anchor="end">BESTOFMPLS.COM</text>
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
