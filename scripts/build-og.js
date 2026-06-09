#!/usr/bin/env node
/**
 * Generate Open Graph image for bestofmpls.
 * SVG → PNG via rsvg-convert (librsvg).
 *
 * Output: dist/og-image.png (1200x630)
 *
 * Updated to match the new civic register: cream paper, Archivo Narrow /
 * Liberation Sans Narrow marquee headline, IBM Plex Mono / Liberation
 * Mono accents, neighborhood-code tags as decoration. Photo overlay
 * retired — the new design is municipal-modernist, not magazine.
 *
 * Font stack relies on system grotesks (Liberation Sans Narrow on
 * Ubuntu CI; Helvetica Neue Condensed on macOS). Web fonts are
 * intentionally not used — librsvg can't fetch @font-face reliably and
 * a PNG renders identically regardless of viewer fonts.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Brand palette: Scandinavian municipal modernism.
const PAPER     = '#F4F2EC';
const PAPER_2   = '#ECE9E1';
const INK       = '#141414';
const INK_SOFT  = '#4A4A48';
const INK_FAINT = '#878683';
const CLAY      = '#C8200F';

// Font stacks chosen to render well in both macOS dev and Ubuntu CI.
const FONT_MARQUEE = '"Liberation Sans Narrow", "Helvetica Neue Condensed", "Arial Narrow", Impact, sans-serif';
const FONT_DISPLAY = '"Liberation Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
const FONT_MONO    = '"Liberation Mono", "DejaVu Sans Mono", "Menlo", "Courier New", monospace';

function generateSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Cream paper -->
  <rect x="0" y="0" width="1200" height="630" fill="${PAPER}"/>

  <!-- Top clay bar (mirrors the right-now panel's hard 3px top rule). -->
  <rect x="0" y="0" width="1200" height="8" fill="${CLAY}"/>

  <!-- Top eyebrow strip with a square clay swatch (mirrors the civic-notice
       block on the homepage). -->
  <rect x="60" y="58" width="14" height="14" fill="${CLAY}"/>
  <text x="86" y="71" font-family='${FONT_DISPLAY}' font-weight="700" font-size="14" letter-spacing="3.2" fill="${CLAY}">AN INDEPENDENT GUIDE · MINNEAPOLIS · SAINT PAUL</text>

  <!-- Marquee headline. Two lines of compressed sans, ALL CAPS, very tight
       tracking — same treatment as the cover headline on the site. -->
  <g transform="translate(60, 220)">
    <text x="0" y="0" font-family='${FONT_MARQUEE}' font-weight="700" font-size="190" letter-spacing="-6" fill="${INK}">BEST OF MPLS</text>
    <text x="0" y="158" font-family='${FONT_MARQUEE}' font-weight="700" font-size="190" letter-spacing="-6" fill="${INK}">&amp; SAINT PAUL<tspan fill="${CLAY}">.</tspan></text>
  </g>

  <!-- Subtitle (display sans, normal weight) -->
  <text x="60" y="510" font-family='${FONT_DISPLAY}' font-weight="500" font-size="22" fill="${INK_SOFT}">Where to eat, drink, hear, see, and spend a Saturday in the metro.</text>

  <!-- Right-side neighborhood-code tag rail — the site's signature
       repeatable graphic. Outlined Plex Mono codes. -->
  <g transform="translate(975, 95)">
    ${[
      ['NE',  'Northeast'],
      ['NL',  'North Loop'],
      ['DT',  'Downtown'],
      ['LH',  'Lowry Hill'],
      ['WB',  'West Bank'],
      ['STP', 'Saint Paul']
    ].map(([code, label], i) => {
      const y = i * 42;
      return `
    <g transform="translate(0, ${y})">
      <rect x="0" y="0" width="${code.length === 3 ? 60 : 50}" height="26" fill="none" stroke="${CLAY}" stroke-width="1.5"/>
      <text x="${code.length === 3 ? 30 : 25}" y="18" font-family='${FONT_MONO}' font-weight="600" font-size="14" fill="${CLAY}" text-anchor="middle">${code}</text>
      <text x="${code.length === 3 ? 70 : 60}" y="18" font-family='${FONT_DISPLAY}' font-weight="500" font-size="13" fill="${INK_SOFT}" letter-spacing="0.5">${label.toUpperCase()}</text>
    </g>`;
    }).join('')}
  </g>

  <!-- Bottom rule -->
  <rect x="60" y="555" width="1080" height="2" fill="${INK}"/>

  <!-- Bottom row: mono dateline + URL -->
  <text x="60" y="595" font-family='${FONT_MONO}' font-weight="500" font-size="14" fill="${INK_FAINT}" letter-spacing="0.5">VOL.01 · 2026 · CIVIC CULTURAL UTILITY</text>
  <text x="1140" y="595" font-family='${FONT_DISPLAY}' font-weight="700" font-size="16" letter-spacing="3" fill="${CLAY}" text-anchor="end">BESTOFMPLS.COM</text>
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
  console.log(`  → og-image.svg`);

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
