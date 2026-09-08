// Emit props JSON for the weekly video franchises (Free This Week, Weekend
// in 30 Seconds). Reads the live events feed; output goes to Remotion's
// ListShort composition via --props. Run any day; windows are computed from
// today. Usage: node scripts/shorts-data.js <outdir>
const fs = require('fs');
const path = require('path');

const outDir = process.argv[2] || '.';
const events = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'events.json'), 'utf8')).events;

const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
const iso = d => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const todayIso = iso(today);

const fmt12 = t => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${m ? ':' + String(m).padStart(2, '0') : ''} ${ap}`;
};
const dayChip = isoDate => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
};
const stripHype = t => t.replace(/^(LATE SHOW ADDED!|JUST ANNOUNCED[:!]?|2ND SHOW ADDED!|SOLD OUT[:!]?)\s*/i, '');
const clean = e => ({
  chip: dayChip(e.date) + (e.time ? ' · ' + fmt12(e.time) : ''),
  title: stripHype(e.title).trim(),
  venue: e.venue || '',
});
const noise = e => !e.title || /\*|CANCEL|POSTPONE/i.test(e.title) || e.category === 'sports';
// Display quality gate: a title either fits the card cleanly or the show is
// skipped for one that does. Never truncate, never show scraper junk.
// (Josh, 2026-09-08: "i never want to see a garbage image like this.")
const displayable = e => {
  const t = stripHype(e.title).trim();
  return t.length <= 40
    && !/[#\/|@~^]|\.{3}|\bannual\b|\bpresents\b|\bfeat\b|\bw\//i.test(t)
    && t === t.replace(/\s{2,}/g, ' ')
    && (e.venue || '').length <= 30;
};
// Max one pick per venue so five list slots show five rooms, not one venue's week.
function diversify(list, n) {
  const seen = new Set(); const out = [];
  for (const e of list) {
    if (seen.has(e.venue)) continue;
    seen.add(e.venue); out.push(e);
    if (out.length === n) break;
  }
  return out;
}

// --- Free This Week: next 7 days, price says free ---
const weekEnd = iso(addDays(today, 7));
const SHOWY = new Set(['music', 'performance', 'film', 'art', 'festival']);
const free = events
  .filter(e => e.date >= todayIso && e.date <= weekEnd && !noise(e) && (/\bfree\b|no cover/i.test(e.price || '') || /\bfree\b|no cover/i.test(e.subtitle || '')))
  .filter(e => SHOWY.has(e.category))
  .filter(displayable)
  .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
const freePicks = diversify(free, 5);

// --- Weekend: Fri-Sun, marquee venues first ---
const dow = today.getDay(); // 0 Sun .. 6 Sat
const daysToFri = (5 - dow + 7) % 7;
const fri = iso(addDays(today, daysToFri));
const sun = iso(addDays(today, daysToFri + 2));
const MARQUEE = /first avenue|7th st|orpheum|state theatre|pantages|guthrie|orchestra hall|dakota|fillmore|palace|armory|fine line|varsity|turf club|icehouse|cedar|parkway|uptown theater|grand casino|target center/i;
const wkd = events
  .filter(e => e.date >= fri && e.date <= sun && !noise(e))
  .filter(displayable)
  .sort((a, b) => (MARQUEE.test(b.venue || '') ? 1 : 0) - (MARQUEE.test(a.venue || '') ? 1 : 0)
    || (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
// Diversify per day (a single dedupe across days spends every slot on Friday).
const sat = iso(addDays(today, daysToFri + 1));
const byDay = d => wkd.filter(e => e.date === d);
const weekendFinal = [
  ...diversify(byDay(fri), 2),
  ...diversify(byDay(sat), 2),
  ...diversify(byDay(sun), 1),
];

fs.writeFileSync(path.join(outDir, 'free-week.json'), JSON.stringify({
  kicker: 'Everything free',
  hook1: 'in Minneapolis',
  hook2: 'this week.',
  items: freePicks.map(clean),
  closeTop: 'The full list, all week:',
  closeUrl: 'bestofmpls.com/free',
}, null, 2));

fs.writeFileSync(path.join(outDir, 'weekend.json'), JSON.stringify({
  kicker: 'Your Minneapolis',
  hook1: 'weekend,',
  hook2: 'sorted.',
  items: weekendFinal.map(clean),
  closeTop: 'The whole calendar:',
  closeUrl: 'bestofmpls.com',
}, null, 2));

console.log(`free picks: ${freePicks.length}, weekend picks: ${weekendFinal.length}`);
console.log('free:', freePicks.map(e => `${e.date} ${e.title} @ ${e.venue}`).join(' | '));
console.log('wknd:', weekendFinal.map(e => `${e.date} ${e.title} @ ${e.venue}`).join(' | '));
