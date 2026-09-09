// Emit props JSON for the daily video formula. Reads the live events feed;
// output goes to Remotion's ListShort composition via --props.
//
//   node scripts/shorts-data.js <outdir> [day]
//
// day: mon|tue|wed|thu|fri|free|weekend (default: today's weekday; Sat/Sun
// fall back to the fri tonight-only recipe). The formula (locked with Josh
// 2026-09-08): Mon week-ahead, Tue tonight+this-week, Wed pick+weekend
// tease, Thu weekend-sorted, Fri tonight-go. Every mode writes <day>.json.
const fs = require('fs');
const path = require('path');

const outDir = process.argv[2] || '.';
const dayArg = (process.argv[3] || '').toLowerCase();
const events = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'events.json'), 'utf8')).events;

const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
// Local date parts, never toISOString: UTC rolls over at 7pm Central and
// made "tonight" mean tomorrow.
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  kicker: 'Verified free',
  hook1: 'in Minneapolis',
  hook2: 'this week.',
  items: freePicks.map(clean),
  closeTop: 'Free and worth seeing, all week:',
  closeUrl: 'bestofmpls.com/free',
}, null, 2));

fs.writeFileSync(path.join(outDir, 'weekend.json'), JSON.stringify({
  kicker: 'Your Minneapolis',
  hook1: 'weekend,',
  hook2: 'sorted.',
  items: weekendFinal.map(clean),
  closeTop: 'Everything worth seeing this weekend:',
  closeUrl: 'bestofmpls.com',
}, null, 2));

console.log(`free picks: ${freePicks.length}, weekend picks: ${weekendFinal.length}`);
console.log('free:', freePicks.map(e => `${e.date} ${e.title} @ ${e.venue}`).join(' | '));
console.log('wknd:', weekendFinal.map(e => `${e.date} ${e.title} @ ${e.venue}`).join(' | '));

// ---------- Daily formula modes ----------
const DOW_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const mode = dayArg || DOW_NAMES[dow];

// Honest count for a date range: everything showy and real, including
// titles too messy to put on a card. The closer states this number.
const countAll = (startIso, endIso) => events.filter(e =>
  e.date >= startIso && e.date <= endIso && !noise(e) && SHOWY.has(e.category)).length;

// Marquee-first pool for a date range, quality-gated, diversified by venue.
function pool(startIso, endIso) {
  return events
    .filter(e => e.date >= startIso && e.date <= endIso && !noise(e) && SHOWY.has(e.category))
    .filter(displayable)
    .sort((a, b) => (MARQUEE.test(b.venue || '') ? 1 : 0) - (MARQUEE.test(a.venue || '') ? 1 : 0)
      || (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
}
// Spread picks across distinct days so a week overview isn't one busy night.
function spreadAcrossDays(list, n) {
  const seenDay = new Set(); const seenVenue = new Set(); const out = [];
  for (const e of list) {
    if (seenDay.has(e.date) || seenVenue.has(e.venue)) continue;
    seenDay.add(e.date); seenVenue.add(e.venue); out.push(e);
    if (out.length === n) break;
  }
  // Not enough distinct days: fill remaining slots venue-diverse.
  if (out.length < n) for (const e of list) {
    if (out.includes(e) || seenVenue.has(e.venue)) continue;
    seenVenue.add(e.venue); out.push(e);
    if (out.length === n) break;
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
const tag = (e, label) => ({ ...clean(e), label });
const tonightPool = pool(todayIso, todayIso);
const weekPool = pool(iso(addDays(today, 1)), weekEnd);
const weekAll = pool(todayIso, weekEnd);

const DAY_MODES = {
  mon: () => ({
    kicker: "It's Monday in the Twin Cities.",
    hook1: 'Make some',
    hook2: 'plans.',
    items: spreadAcrossDays(weekAll, 4).map(e => tag(e, null)),
    closeTop: `${countAll(todayIso, weekEnd)} shows this week.\nYou saw 4.`,
    closeUrl: 'bestofmpls.com',
  }),
  tue: () => {
    const tonight = diversify(tonightPool, 2);
    const used = new Set(tonight.map(e => e.venue));
    return {
    kicker: "It's Tuesday in the Twin Cities.",
    hook1: 'The week',
    hook2: 'starts tonight.',
    items: [
      ...tonight.map(e => tag(e, 'TONIGHT')),
      ...spreadAcrossDays(weekPool.filter(e => !used.has(e.venue)), 3).map(e => tag(e, 'THIS WEEK')),
    ],
    closeTop: `${countAll(todayIso, todayIso)} shows tonight.\n${countAll(todayIso, weekEnd)} this week.`,
    closeUrl: 'bestofmpls.com/tonight',
  }; },
  wed: () => {
    const tonight = diversify(tonightPool, 1);
    const used = new Set(tonight.map(e => e.venue));
    return {
    kicker: "It's Wednesday in the Twin Cities.",
    hook1: 'Don\'t wait',
    hook2: 'for Friday.',
    items: [
      ...tonight.map(e => tag(e, 'TONIGHT')),
      ...spreadAcrossDays(pool(fri, sun).filter(e => !used.has(e.venue)), 3).map(e => tag(e, 'THE WEEKEND')),
    ],
    closeTop: `${countAll(todayIso, todayIso)} shows tonight.\n${countAll(fri, sun)} this weekend.`,
    closeUrl: 'bestofmpls.com/tonight',
  }; },
  thu: () => ({
    kicker: "It's Thursday in the Twin Cities.",
    hook1: 'Your weekend\'s',
    hook2: 'handled.',
    items: weekendFinal.map(e => tag(e, null)),
    closeTop: `${countAll(fri, sun)} shows this weekend.\nYou saw ${weekendFinal.length}.`,
    closeUrl: 'bestofmpls.com',
  }),
  fri: () => ({
    kicker: "It's Friday in the Twin Cities.",
    hook1: 'Go',
    hook2: 'out.',
    items: diversify(tonightPool, 3).map(e => tag(e, null)),
    closeTop: `${countAll(todayIso, todayIso)} shows tonight.\nYou saw ${Math.min(3, diversify(tonightPool, 3).length)}.`,
    closeUrl: 'bestofmpls.com/tonight',
  }),
};
DAY_MODES.sat = DAY_MODES.fri;
DAY_MODES.sun = DAY_MODES.fri;

if (DAY_MODES[mode]) {
  const props = DAY_MODES[mode]();
  fs.writeFileSync(path.join(outDir, `${mode}.json`), JSON.stringify(props, null, 2));
  console.log(`${mode}: ${props.items.length} items`);
  console.log(props.items.map(i => `${i.label ? '[' + i.label + '] ' : ''}${i.chip} ${i.title} @ ${i.venue}`).join('\n'));
}
