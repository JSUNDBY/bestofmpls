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

  // Layout: text panel on left (480w), photo on right (720w).
  // Photo at 720x630 is ~1.14:1; original photo is 1.5:1, so we crop sides
  // (much less aggressive than the previous 1.9:1 top/bottom crop).
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background: white paper for the text panel -->
  <rect width="1200" height="630" fill="${PAPER}"/>

  <!-- Photo on right side, shows full vertical composition -->
  <image xlink:href="${skylineDataUri}" x="480" y="0" width="720" height="630" preserveAspectRatio="xMidYMid slice"/>

  <!-- Vertical hairline between text panel and photo -->
  <line x1="480" y1="0" x2="480" y2="630" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Top eyebrow on text panel -->
  <text x="64" y="80" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="13" letter-spacing="3.5" fill="${CLAY}">VOL. 01 · SPRING 2026</text>

  <!-- Top hairline below eyebrow -->
  <line x1="64" y1="108" x2="416" y2="108" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Hero brand mark, italic Playfair, fits within text panel width -->
  <text x="64" y="240" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="900" font-size="78" letter-spacing="-2" fill="${INK}">bestofmpls<tspan fill="${CLAY}">.</tspan></text>

  <!-- Sub-headline split across two lines so it fits the panel -->
  <text x="64" y="310" font-family="Playfair Display, Georgia, serif" font-weight="400" font-size="34" letter-spacing="-0.5" fill="${INK}">Minneapolis</text>
  <text x="64" y="352" font-family="Playfair Display, Georgia, serif" font-weight="400" font-size="34" letter-spacing="-0.5" fill="${INK}"><tspan font-style="italic" font-weight="700" fill="${CLAY}">&amp;</tspan> Saint Paul.</text>

  <!-- Italic tagline lower in the panel -->
  <text x="64" y="445" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="400" font-size="19" fill="${INK}">An independent guide to a</text>
  <text x="64" y="471" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="400" font-size="19" fill="${INK}">city of long winters and</text>
  <text x="64" y="497" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="400" font-size="19" fill="${INK}">bright light.</text>

  <!-- Bottom hairline -->
  <line x1="64" y1="540" x2="416" y2="540" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Bottom URL -->
  <text x="64" y="588" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="3" fill="${CLAY}">BESTOFMPLS.COM</text>
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
