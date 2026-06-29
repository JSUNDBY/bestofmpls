#!/usr/bin/env node
/**
 * Generate the Open Graph share images for bestofmpls.
 * SVG → PNG via rsvg-convert (librsvg). Output: dist/og-image.png (1200x630)
 * plus one dist/og-<slug>.png per entry in dist/og-manifest.json (written by
 * build.js — the big, share-worthy landing pages).
 *
 * Design (2026 duotone pass): a dark card in the register of the site's footer.
 * The twilight Minneapolis skyline is embedded (base64, so it renders in CI with
 * no asset-path dependency) and run through the same duotone filter used on the
 * site (#duotone-bom): shadows → near-black so they dissolve into the card,
 * highlights → cream so the lit skyline glows along the lower band. The default
 * card leads with the wordmark; section cards lead with the section title and put
 * the section name in the eyebrow. Type uses a normal-width system grotesk
 * (Liberation/DejaVu on CI) — the "new look" is carried by the duotone skyline
 * and composition, not a webfont we can't ship to the renderer.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SKYLINE = path.join(ROOT, 'public', 'img', 'skyline-cover.jpg');

const CARD       = '#0A0A0A';   // matches the footer slab
const CREAM      = '#F4EEDF';
const CREAM_SOFT = '#C7C3B8';
const CREAM_FAINT= '#8E8B82';
const CLAY       = '#C8200F';

// Normal-width system sans available both on macOS (Helvetica) and Ubuntu CI
// (Liberation Sans / DejaVu Sans). No narrow faces — their widths vary too much.
const FONT = '"Liberation Sans", "DejaVu Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif';
const FONT_MONO = '"Liberation Mono", "DejaVu Sans Mono", "Menlo", "Courier New", monospace';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Size the big headline to fit the ~1080px measure for the longest titles.
function fitSize(text) {
  return Math.max(72, Math.min(140, Math.floor(1080 / (text.length * 0.58))));
}

function chrome(sky) {
  // Shared card chrome: background, duotone skyline band, scrim, clay bar, bottom row.
  return {
    defs: `<defs>
    <filter id="duotone-bom" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0.039 0.957"/>
        <feFuncG type="table" tableValues="0.039 0.933"/>
        <feFuncB type="table" tableValues="0.039 0.874"/>
      </feComponentTransfer>
    </filter>
    <linearGradient id="bandmask" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000"/><stop offset="0.50" stop-color="#000"/>
      <stop offset="0.66" stop-color="#fff"/><stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <mask id="skymask"><rect x="0" y="0" width="1200" height="630" fill="url(#bandmask)"/></mask>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CARD}" stop-opacity="0"/>
      <stop offset="1" stop-color="${CARD}" stop-opacity="0.92"/>
    </linearGradient>
  </defs>`,
    back: `<rect x="0" y="0" width="1200" height="630" fill="${CARD}"/>
  <g mask="url(#skymask)" opacity="0.66">
    <image xlink:href="${sky}" x="0" y="118" width="1200" height="801" filter="url(#duotone-bom)" preserveAspectRatio="none"/>
  </g>
  <rect x="0" y="496" width="1200" height="134" fill="url(#scrim)"/>
  <rect x="0" y="0" width="1200" height="10" fill="${CLAY}"/>`,
    bottom: `<rect x="64" y="558" width="1072" height="2" fill="${CREAM}" opacity="0.4"/>
  <text x="64" y="600" font-family='${FONT_MONO}' font-weight="500" font-size="16" letter-spacing="0.5" fill="${CREAM_FAINT}">A LIVING GUIDE · UPDATED DAILY · MADE FOR THE METRO</text>
  <text x="1136" y="600" font-family='${FONT}' font-weight="800" font-size="20" letter-spacing="2" fill="${CLAY}" text-anchor="end">BESTOFMPLS.COM</text>`,
  };
}

function svgOpen() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">`;
}

function defaultCard(sky) {
  const c = chrome(sky);
  return `${svgOpen()}
  ${c.defs}
  ${c.back}
  <rect x="64" y="74" width="14" height="14" fill="${CLAY}"/>
  <text x="90" y="86" font-family='${FONT_MONO}' font-weight="700" font-size="17" letter-spacing="2.5" fill="${CLAY}">AN INDEPENDENT GUIDE TO MINNEAPOLIS &amp; SAINT PAUL</text>
  <text x="62" y="258" font-family='${FONT}' font-weight="800" font-size="150" letter-spacing="-4" fill="${CREAM}">bestofmpls<tspan fill="${CLAY}">.</tspan></text>
  <text x="64" y="330" font-family='${FONT}' font-weight="500" font-size="33" fill="${CREAM_SOFT}">What's good in the Twin Cities, tonight.</text>
  ${c.bottom}
</svg>`;
}

function sectionCard(sky, { headline, kicker }) {
  const c = chrome(sky);
  const size = fitSize(headline);
  return `${svgOpen()}
  ${c.defs}
  ${c.back}
  <rect x="64" y="74" width="14" height="14" fill="${CLAY}"/>
  <text x="90" y="86" font-family='${FONT_MONO}' font-weight="700" font-size="17" letter-spacing="2.5" fill="${CLAY}">${esc((kicker || '').toUpperCase())} · BESTOFMPLS</text>
  <text x="62" y="262" font-family='${FONT}' font-weight="800" font-size="${size}" letter-spacing="-2" fill="${CREAM}">${esc(headline)}</text>
  <text x="64" y="330" font-family='${FONT}' font-weight="500" font-size="31" fill="${CREAM_SOFT}">What's good in the Twin Cities, tonight.</text>
  ${c.bottom}
</svg>`;
}

function render(svg, outName) {
  const svgPath = path.join(DIST, outName.replace(/\.png$/, '.svg'));
  const pngPath = path.join(DIST, outName);
  fs.writeFileSync(svgPath, svg);
  execSync(`rsvg-convert -w 1200 -h 630 "${svgPath}" -o "${pngPath}"`);
  fs.unlinkSync(svgPath);
  console.log(`  → ${outName} (${(fs.statSync(pngPath).size / 1024).toFixed(1)}KB)`);
}

function build() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ does not exist; run main build first');
    process.exit(1);
  }
  const sky = `data:image/jpeg;base64,${fs.readFileSync(SKYLINE).toString('base64')}`;

  render(defaultCard(sky), 'og-image.png');

  const manifestPath = path.join(DIST, 'og-manifest.json');
  if (fs.existsSync(manifestPath)) {
    let sections = [];
    try { sections = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (_) {}
    for (const s of sections) {
      if (!s || !s.slug || !s.headline) continue;
      render(sectionCard(sky, s), `og-${s.slug}.png`);
    }
  }
}

build();
