#!/usr/bin/env node
/**
 * Bulk-remove entries from category data files by name. Used after the
 * audit script flags closures so we can clear them out in one pass.
 *
 * Usage: node scripts/remove-entries.js
 *   The TARGETS array below is hand-curated from audit results.
 *
 * Approach: read each file as text, find the matching `{ name: 'X', ... }`
 * block by walking braces, and splice it out. The data files are flat
 * arrays of single-level objects so brace tracking is reliable.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src/data');

const TARGETS = [
  { file: 'bakeries.js',          name: 'Cocoa & Fig' },
  { file: 'breweries.js',         name: 'Eastlake Craft Brewery' },
  { file: 'coffee.js',            name: 'Bull Run Coffee' },
  { file: 'coffee.js',            name: 'Groundswell' },
  { file: 'coffee.js',            name: 'Anelace Coffee' },
  { file: 'dive-bars.js',         name: "Palmer's Bar" },
  { file: 'dive-bars.js',         name: "Lee's Liquor Lounge" },
  { file: 'ethiopian.js',         name: 'Fasika Ethiopian Restaurant' },
  { file: 'happy-hours.js',       name: 'The Bachelor Farmer Cafe' },
  { file: 'hidden-gems.js',       name: 'The Soap Factory ruins' },
  { file: 'hmong.js',             name: 'Union Hmong Kitchen' },
  { file: 'indian.js',            name: 'Bawarchi Biryanis' },
  { file: 'indian.js',            name: 'Bombay Bistro' },
  { file: 'japanese.js',          name: 'Masu Sushi & Robata' },
  { file: 'mens-clothing.js',     name: 'Forage Modern Workshop' },
  { file: 'mexican.js',           name: 'Pajarito' },
  { file: 'patios.js',            name: 'Tin Fish' },
  { file: 'restaurants.js',       name: 'Petite León' },
  { file: 'shops.js',             name: "Hymie's Vintage Records" },
  { file: 'womens-clothing.js',   name: 'Cliché' },
  { file: 'womens-clothing.js',   name: 'Local Motion' }
];

function removeEntry(filePath, name) {
  const src = fs.readFileSync(filePath, 'utf8');
  // Find the line containing `name: 'X'` or `name: "X"` — the variant of
  // quote that the data file uses. Try both quote styles.
  const candidates = [
    `name: '${name}'`,
    `name: "${name}"`,
    // Smart-quote variants showing up in the data files
    `name: '${name.replace(/'/g, '’')}'`,
    `name: "${name.replace(/'/g, '’')}"`
  ];
  let nameIdx = -1;
  for (const c of candidates) {
    nameIdx = src.indexOf(c);
    if (nameIdx !== -1) break;
  }
  if (nameIdx === -1) return { ok: false, reason: 'name not found' };

  // Walk backwards from nameIdx to find the opening '{' of this entry.
  let openIdx = -1;
  for (let i = nameIdx; i >= 0; i--) {
    if (src[i] === '{') { openIdx = i; break; }
  }
  if (openIdx === -1) return { ok: false, reason: 'opening brace not found' };

  // Walk forwards from openIdx tracking braces to find the matching close.
  let depth = 0;
  let closeIdx = -1;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) { closeIdx = i; break; }
    }
  }
  if (closeIdx === -1) return { ok: false, reason: 'closing brace not found' };

  // Extend the close past any trailing comma + newline so we don't leave
  // a dangling comma in the file.
  let endIdx = closeIdx + 1;
  while (endIdx < src.length && (src[endIdx] === ',' || src[endIdx] === '\n' || src[endIdx] === ' ')) {
    endIdx++;
    if (src[endIdx - 1] === '\n') break;
  }

  // Also walk backward over leading whitespace/newline of this entry block
  // so we don't leave a blank line in the file.
  let startIdx = openIdx;
  while (startIdx > 0 && (src[startIdx - 1] === ' ' || src[startIdx - 1] === '\n')) {
    if (src[startIdx - 1] === '\n' && src[startIdx - 2] === '\n') break;
    startIdx--;
  }
  // Keep one newline before the next entry
  if (src[startIdx - 1] !== '\n') startIdx = openIdx;
  else startIdx -= 1;

  const out = src.slice(0, startIdx) + src.slice(endIdx);
  fs.writeFileSync(filePath, out);
  return { ok: true };
}

let ok = 0, fail = 0;
for (const t of TARGETS) {
  const filePath = path.join(SRC, t.file);
  if (!fs.existsSync(filePath)) {
    console.log(`! ${t.file}: file missing`);
    fail++; continue;
  }
  const r = removeEntry(filePath, t.name);
  if (r.ok) { ok++; console.log(`✓ ${t.file}: removed "${t.name}"`); }
  else      { fail++; console.log(`× ${t.file}: ${t.name} — ${r.reason}`); }
}
console.log(`\n${ok} removed, ${fail} failed.\n`);
