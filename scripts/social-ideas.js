#!/usr/bin/env node
/**
 * social-ideas.js — turn the site's own live data into a ready-to-shoot week
 * of short-video / carousel concepts, so the content calendar is never blank.
 *
 * Faceless-friendly by design: every idea is a shot list of places/things to
 * film, not an on-camera script. Pulls timely data where it exists (this
 * weekend's events, the happy hour pick, the week's horoscope, a food truck,
 * recent openings) and rotates evergreen formats (neighborhood walks,
 * best-of teasers, take-them-to) so no two weeks look the same.
 *
 * Run: node scripts/social-ideas.js          # prints the plan + writes social-plan.md
 *
 * Voice: warm, direct, local. No em dashes, no emojis (matches the brand).
 * Every caption ends pointing at the newsletter or the site — that's the funnel.
 */

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'src/data');
const SITE = 'https://bestofmpls.com';

const load = f => { try { return require(path.join(DATA, f)); } catch (_) { return null; } };

// Day-of-year seed so the rotation advances each week but is stable within a day.
function weekSeed() {
  const d = new Date();
  const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return Math.floor(doy / 7);
}
function pick(arr, n, offset = 0) {
  if (!arr || !arr.length) return [];
  const out = [];
  for (let i = 0; i < n && i < arr.length; i++) out.push(arr[(offset + i) % arr.length]);
  return out;
}

const HASHTAGS = {
  base: '#minneapolis #saintpaul #twincities #onlyinmn #mnpls',
  food: '#mplsfood #twincitieseats #mnfood #eatlocalmn',
  drink: '#mplsbars #twincitiescocktails #mnbeer',
  events: '#mplsevents #twincitieslife #thingstodomn',
};

const today = (() => {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date());
})();

function sundayOfWeek() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (7 - day));
  return d.toISOString().slice(0, 10);
}

const ideas = [];
const seed = weekSeed();

// 1. THIS WEEKEND (timely) — real scraped events
(() => {
  const ev = load('events.json');
  if (!ev || !ev.events) return;
  const sun = sundayOfWeek();
  const isShow = e => e.category !== 'film' && e.category !== 'art' && e.category !== 'lecture';
  const weekend = ev.events.filter(e => isShow(e) && e.date >= today && e.date <= sun).slice(0, 5);
  if (weekend.length < 3) return;
  ideas.push({
    format: 'Reel (15-25s)',
    title: 'This Weekend in the Twin Cities',
    hook: 'On screen, frame 1: "5 things to do this weekend in Minneapolis"',
    shots: weekend.map(e => `${e.title} at ${e.venue}${e.time ? ' (' + e.time + ')' : ''} — b-roll of the venue or a poster`),
    caption: `Five ways to spend the weekend, no scrolling six apps required. Full calendar and more at the link. ${weekend.map(e => e.venue).slice(0,3).join(', ')} and more.`,
    tags: `${HASHTAGS.base} ${HASHTAGS.events}`,
  });
})();

// 2. HAPPY HOUR PICK (timely)
(() => {
  const hh = load('happy-hours.js');
  if (!hh || !hh.entries || !hh.entries.length) return;
  const p = hh.entries[seed % hh.entries.length];
  ideas.push({
    format: 'Reel (10-15s)',
    title: `Happy Hour Pick: ${p.name}`,
    hook: 'On screen: "The happy hour locals actually go to"',
    shots: [`Exterior of ${p.name}${p.neighborhood ? ' (' + p.neighborhood + ')' : ''}`, 'The drink and a snack, close up', p.hours ? `Text overlay: ${p.hours}` : 'Text overlay: the deal'],
    caption: `${p.name}${p.neighborhood ? ' in ' + p.neighborhood : ''}. ${p.description || ''} More happy hours at the link.`,
    tags: `${HASHTAGS.base} ${HASHTAGS.drink}`,
  });
})();

// 3. NEIGHBORHOOD WALK (evergreen, rotates) — a few spots in one area
(() => {
  const cats = ['restaurants.js','coffee.js','cocktail-bars.js','bakeries.js','burgers.js'];
  const hoods = ['Northeast Minneapolis','North Loop, Minneapolis','Uptown, Minneapolis','Cathedral Hill, St. Paul','Linden Hills, Minneapolis','Lowertown, St. Paul'];
  const hood = hoods[seed % hoods.length];
  const spots = [];
  for (const f of cats) {
    const m = load(f); if (!m) continue;
    for (const e of m.entries) if (e.neighborhood === hood) spots.push(`${e.name} (${m.title})`);
  }
  if (spots.length < 3) return;
  ideas.push({
    format: 'Reel or carousel',
    title: `A Perfect Day in ${hood.split(',')[0]}`,
    hook: `On screen: "Where to eat and drink in ${hood.split(',')[0]}, ranked by a local"`,
    shots: pick(spots, 5, seed).map(s => `${s} — quick exterior + one signature shot`),
    caption: `One neighborhood, a whole day. ${hood.split(',')[0]} done right. Full neighborhood guide at the link.`,
    tags: `${HASHTAGS.base} ${HASHTAGS.food}`,
  });
})();

// 4. FOOD TRUCK OF THE WEEK (timely-ish)
(() => {
  const t = load('food-trucks.js');
  if (!t || !t.entries || !t.entries.length) return;
  const p = t.entries[seed % t.entries.length];
  ideas.push({
    format: 'Reel (10-15s)',
    title: `Chase This Truck: ${p.name}`,
    hook: 'On screen: "The food truck worth tracking down"',
    shots: [`${p.name} truck, wide`, 'The food, hero shot', `Text overlay: ${p.style}`],
    caption: `${p.name}. ${p.description || ''} We keep a running map of where the trucks are, link in bio.`,
    tags: `${HASHTAGS.base} ${HASHTAGS.food} #foodtruck`,
  });
})();

// 5. WEEKLY HOROSCOPE (timely, ownable voice)
(() => {
  const h = load('horoscope.json');
  if (!h || !h.horoscopes) return;
  const three = pick(h.horoscopes, 3, seed);
  ideas.push({
    format: 'Carousel (3-4 slides)',
    title: 'Twin Cities Horoscope',
    hook: 'Slide 1: "Your Minneapolis horoscope this week"',
    shots: three.map(z => `${z.sign}: "${(z.text || '').slice(0, 90)}..."`),
    caption: 'A weekly reading written for the metro. All twelve signs at the link. Which one are you.',
    tags: `${HASHTAGS.base} #horoscope #minneapolis`,
  });
})();

// 6-7. BEST-OF TEASERS (evergreen, rotates across categories)
(() => {
  const teasers = [
    { f: 'burgers.js', hook: 'On screen: "The burger Minneapolis invented and will fight you about"', cap: 'The Juicy Lucy and the best burgers in the metro. Full ranking at the link.' },
    { f: 'pizza.js', hook: 'On screen: "Best pizza in the Twin Cities, no chains"', cap: 'Where to get a real slice. Full list at the link.' },
    { f: 'coffee.js', hook: 'On screen: "Coffee shops worth leaving the house for"', cap: 'The metro\'s best roasters and rooms. Full guide at the link.' },
    { f: 'cocktail-bars.js', hook: 'On screen: "Where to actually get a good cocktail"', cap: 'The bars that take the drink seriously. Full list at the link.' },
  ];
  const chosen = pick(teasers, 2, seed);
  for (const t of chosen) {
    const m = load(t.f); if (!m) continue;
    const spots = pick(m.entries, 5, seed);
    ideas.push({
      format: 'Reel or carousel',
      title: m.title,
      hook: t.hook,
      shots: spots.map(e => `${e.name}${e.neighborhood ? ' (' + e.neighborhood.split(',')[0] + ')' : ''} — signature shot`),
      caption: t.cap,
      tags: `${HASHTAGS.base} ${HASHTAGS.food}`,
    });
  }
})();

// 8. NEW + NOTABLE (taps recent additions / James Beard energy)
(() => {
  const m = load('restaurants.js');
  if (!m) return;
  const spots = pick(m.entries.slice(-8), 4, seed);
  ideas.push({
    format: 'Carousel',
    title: 'New and Worth the Table',
    hook: 'Slide 1: "New Twin Cities restaurants people are actually talking about"',
    shots: spots.map(e => `${e.name} — ${e.style || ''}`),
    caption: 'The openings worth your next reservation. More at the link.',
    tags: `${HASHTAGS.base} ${HASHTAGS.food}`,
  });
})();

// Suggested posting queue — local-friendly slots, spread across the week so the
// pack reads like a ready-to-schedule queue (paste into Buffer/Metricool).
const POST_SLOTS = [
  'Mon 5:30 PM', 'Tue 11:30 AM', 'Wed 5:30 PM', 'Thu 11:30 AM',
  'Fri 4:00 PM', 'Sat 10:00 AM', 'Sun 11:00 AM', 'Mon 12:00 PM',
];

// ===== Render =====
const monday = (() => { const d = new Date(); const day = d.getDay()||7; d.setDate(d.getDate()-day+1); return d.toLocaleDateString('en-US',{month:'long',day:'numeric'}); })();
let md = `# Best of MPLS — Content Plan (week of ${monday})\n\n`;
md += `${ideas.length} post concepts from live site data. Faceless-friendly: each is a shot list, not an on-camera script. Shoot 2-3 in one outing, let the repurposer fan them across IG / TikTok / Reels / Threads. The Post slot is a suggested time to queue it.\n\n`;
ideas.forEach((idea, i) => {
  md += `---\n\n## ${i + 1}. ${idea.title}\n`;
  md += `**Format:** ${idea.format}  ·  **Post:** ${POST_SLOTS[i % POST_SLOTS.length]}\n\n`;
  md += `**Hook:** ${idea.hook}\n\n`;
  md += `**Shot list:**\n${idea.shots.map(s => `- ${s}`).join('\n')}\n\n`;
  md += `**Caption:** ${idea.caption}\n\n`;
  md += `**Tags:** ${idea.tags}\n\n`;
});
md += `---\n\nEvery caption should end "link in bio" pointing at ${SITE} (and the newsletter signup). That is the whole funnel: video pulls them in, the newsletter keeps them.\n`;

// Local copy (gitignored) + a tracked copy the weekly cron commits back so the
// fresh pack is always waiting in the repo with zero effort.
fs.writeFileSync(path.join(ROOT, 'social-plan.md'), md);
fs.mkdirSync(path.join(ROOT, 'growth'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'growth/social-pack.md'), md);
console.log(md);
console.log(`\n[wrote ${ideas.length} ideas to social-plan.md and growth/social-pack.md]`);
