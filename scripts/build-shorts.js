#!/usr/bin/env node
/**
 * build-shorts.js — render the weekly "live music this week" vertical Short.
 *
 * Reads the same two files the newsletter reads: src/data/events.json for the
 * shows and src/data/editorial-notes.json for the web-verified one-liners.
 * Verified acts lead; the rest fall back to scraped facts only (name, venue,
 * neighborhood) so the video can never assert something nobody confirmed.
 *
 * Cards are rendered as HTML in headless Chrome so they inherit the real brand
 * (brand-kit/BRAND-KIT.md), then ffmpeg cuts them into a 1080x1920 MP4.
 * No npm dependencies: Chrome and ffmpeg are both already on the machine.
 *
 * Run: node scripts/build-shorts.js [--audio path/to/bed.mp3]
 * Out: dist/shorts/<date>-live-music.mp4  +  a .json sidecar with the metadata
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist', 'shorts');
const WORK_DIR = path.join(ROOT, '.shorts-work');

const CHROME = process.env.CHROME_BIN || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].find(p => fs.existsSync(p));

const W = 1080, H = 1920, FPS = 30;
const HOOK_SEC = 2.5, ACT_SEC = 4.5, END_SEC = 3;
const MAX_ACTS = 5;

// brand-kit/BRAND-KIT.md — these four, no others.
const BG = '#0E0E10', TEXT = '#F5F4F0', CLAY = '#C8200F', MUTED = '#B8B8B4';

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Always reason in Minneapolis time. toISOString() is UTC, which after 7pm CDT
// rolls the date forward and silently shifts the whole week window, and the
// Actions runner is UTC too.
const TZ = 'America/Chicago';
const isoInTZ = d => d.toLocaleDateString('en-CA', { timeZone: TZ });

function todayISO() { return isoInTZ(new Date()); }
function sundayISO() {
  const [y, m, d] = todayISO().split('-').map(Number);
  const local = new Date(y, m - 1, d);
  const day = local.getDay() || 7;               // Sunday counts as end of week
  local.setDate(local.getDate() - day + 7);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Thursday · 8 PM". Built from parts so the date can't drift a day on parse. */
function whenLabel(iso, time) {
  const [y, m, d] = iso.split('-').map(Number);
  const day = DAYS[new Date(y, m - 1, d).getDay()];
  if (!time || time === '00:00') return day;
  let [h, min] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${day} · ${h}${min ? ':' + String(min).padStart(2, '0') : ''} ${ampm}`;
}

/**
 * This week's music shows, verified-note acts first.
 *
 * The editorial pass runs Sunday for the week ahead, so by midweek its notes
 * can be for shows that already happened. Rather than fail, fall back to acts
 * with no note: the card then shows only name, venue and neighborhood, which
 * are scraped facts, and drops the "why go" line entirely.
 */
function pickActs() {
  const events = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/events.json'), 'utf8')).events || [];
  const notes = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/editorial-notes.json'), 'utf8')).notes || {};
  const today = todayISO(), sun = sundayISO();

  const inWindow = events.filter(e =>
    e.category === 'music' && e.date >= today && e.date <= sun);

  // Group by night, verified acts first within each night.
  const byDate = new Map();
  for (const e of inWindow) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  }
  for (const list of byDate.values()) {
    list.sort((a, b) => (notes[b.id] ? 1 : 0) - (notes[a.id] ? 1 : 0));
  }

  // Round-robin across the nights so the video covers the week instead of
  // clumping on whichever night the scraper happened to list first.
  const dates = [...byDate.keys()].sort();
  const cursor = new Map(dates.map(d => [d, 0]));
  const picked = [];
  const usedVenues = new Set();

  let progress = true;
  while (picked.length < MAX_ACTS && progress) {
    progress = false;
    for (const d of dates) {
      if (picked.length >= MAX_ACTS) break;
      const list = byDate.get(d);
      let i = cursor.get(d);
      while (i < list.length && usedVenues.has(list[i].venue)) i++;   // one per venue
      cursor.set(d, i + 1);
      if (i >= list.length) continue;
      const e = list[i];
      usedVenues.add(e.venue);
      picked.push({
        title: e.title, venue: e.venue, hood: e.venue_neighborhood || e.city || '',
        city: e.city || '', date: e.date, time: e.time || '',
        when: whenLabel(e.date, e.time), note: notes[e.id] || null,
      });
      progress = true;
    }
  }
  // Round-robin picks a good spread but leaves them out of order. Run the
  // finished set back through chronologically so the video reads as a week.
  picked.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return picked;
}

const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; background:${BG}; }
  .card { position:relative; width:${W}px; height:${H}px; overflow:hidden;
          display:flex; flex-direction:column; justify-content:center;
          /* safe zone: TikTok/IG cover the top ~12% and bottom ~20% */
          padding:${Math.round(H * 0.14)}px 90px ${Math.round(H * 0.22)}px; }
  .eyebrow { font-family:Archivo,sans-serif; font-weight:700; font-size:38px;
             letter-spacing:.14em; text-transform:uppercase; color:${CLAY}; margin-bottom:34px; }
  .headline { font-family:'IBM Plex Sans',sans-serif; font-weight:800; font-size:118px;
              line-height:1.02; letter-spacing:-.02em; color:${TEXT}; }
  .act { font-family:'IBM Plex Sans',sans-serif; font-weight:800; font-size:104px;
         line-height:1.03; letter-spacing:-.02em; color:${TEXT}; }
  .act.long { font-size:80px; }
  .act.xlong { font-size:62px; }
  .where { font-family:'Source Sans 3',sans-serif; font-weight:600; font-size:46px;
           color:${TEXT}; margin-top:40px; }
  .chip { display:inline-block; font-family:Archivo,sans-serif; font-weight:600; font-size:30px;
          letter-spacing:.1em; text-transform:uppercase; color:${BG}; background:${CLAY};
          padding:12px 22px; margin-top:26px; }
  .note { font-family:'Source Sans 3',sans-serif; font-weight:400; font-size:46px;
          line-height:1.34; color:${MUTED}; margin-top:44px; }
  .rule { width:200px; height:4px; background:${CLAY}; margin:0 auto 52px; }
  /* progress cue, bottom-right, opposite the logo */
  .num { position:absolute; right:90px; bottom:${Math.round(H * 0.10)}px;
         font-family:'IBM Plex Sans',sans-serif; font-weight:700; font-size:38px; color:${MUTED}; }
  .logo { position:absolute; left:90px; bottom:${Math.round(H * 0.10)}px;
          font-family:'IBM Plex Sans',sans-serif; font-weight:700; font-size:40px; color:${TEXT}; }
  .logo i { color:${CLAY}; font-style:normal; }
  .end { align-items:center; text-align:center; }
  .tag { font-family:Archivo,sans-serif; font-weight:700; font-size:38px; letter-spacing:.1em;
         text-transform:uppercase; color:${CLAY}; margin-top:64px; }
  .url { font-family:'Source Sans 3',sans-serif; font-weight:600; font-size:44px; color:${TEXT}; margin-top:18px; }
  .sub { font-family:'Source Sans 3',sans-serif; font-weight:400; font-size:40px; color:${MUTED}; margin-top:18px; }
`;

const LOGO = `<div class="logo">bestofmpls<i>.</i></div>`;

// Say Minneapolis when it's true, Twin Cities when the bill crosses the river.
// The Minneapolis keyword still carries in the title, description and tags.
const hookCard = (n, place) => `<section class="card">
  <div class="eyebrow">This week in music</div>
  <div class="headline">${n} shows worth leaving the house for in ${place}</div>${LOGO}</section>`;

const actCard = (a, i, total) => {
  const cls = a.title.length > 46 ? 'act xlong' : a.title.length > 26 ? 'act long' : 'act';
  return `<section class="card">
    <div class="eyebrow">${esc(a.when)}</div>
    <div class="${cls}">${esc(a.title)}</div>
    <div class="where">${esc(a.venue)}</div>
    ${a.hood ? `<div><span class="chip">${esc(a.hood)}</span></div>` : ''}
    ${a.note ? `<div class="note">${esc(a.note)}</div>` : ''}
    <div class="num">${i + 1} / ${total}</div>${LOGO}</section>`;
};

const endCard = () => `<section class="card end">
  <div class="rule"></div>
  <div class="headline" style="font-size:104px;">bestofmpls<span style="color:${CLAY}">.</span></div>
  <div class="sub">A guide to the Twin Cities</div>
  <div class="tag">Full calendar, every venue</div>
  <div class="url">bestofmpls.com/calendar</div></section>`;

/**
 * All cards go on ONE tall page and come back as ONE screenshot, then ffmpeg
 * crops each card out. Launching Chrome per card raced on the shared profile
 * and produced truncated PNGs; giving each its own profile made Chrome hang on
 * first-run. One launch sidesteps both, and is ~7x faster.
 */
function renderStrip(sections) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@700;800&family=Archivo:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>${sections.join('')}</body></html>`;

  const htmlPath = path.join(WORK_DIR, 'strip.html');
  const pngPath = path.join(WORK_DIR, 'strip.png');
  fs.writeFileSync(htmlPath, html);

  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--force-device-scale-factor=1',
    `--window-size=${W},${H * sections.length}`,
    '--virtual-time-budget=10000',        // let the webfonts land before the shot
    `--screenshot=${pngPath}`,
    `file://${htmlPath}`,
  ], { stdio: 'ignore', timeout: 120000 });

  const size = fs.existsSync(pngPath) ? fs.statSync(pngPath).size : 0;
  if (size < 10000) throw new Error(`Chrome wrote a bad screenshot (${size}b)`);
  return pngPath;
}

/**
 * Crop one card out of the strip into a clip, with a slow drift so the frame
 * isn't dead. Deliberately avoids the zoompan filter: it segfaults on the
 * ffmpeg 2.8 build on this machine. A 5% oversample plus an animated crop gets
 * the same slow push and works on every ffmpeg back to 2.x. The amplitude stays
 * under the card's 90px side padding, so drifting can never clip text.
 */
function clip(strip, index, seconds, mp4) {
  const vf = [
    `crop=${W}:${H}:0:${index * H}`,
    `scale=${Math.round(W * 1.05)}:${Math.round(H * 1.05)}`,
    `crop=${W}:${H}:'(iw-ow)/2+((iw-ow)/2)*sin(t*0.35)':'(ih-oh)/2+((ih-oh)/2)*cos(t*0.25)'`,
    `fps=${FPS}`,
    `fade=t=in:st=0:d=0.35`,
    `format=yuv420p`,
  ].join(',');

  execFileSync('ffmpeg', [
    '-y', '-loop', '1', '-i', strip, '-vf', vf, '-t', String(seconds),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(FPS), mp4,
  ], { stdio: 'ignore', timeout: 180000 });
}

function main() {
  if (!CHROME) { console.error('No Chrome found. Set CHROME_BIN.'); process.exit(1); }
  const acts = pickActs();
  if (acts.length < 3) {
    console.error(`Only ${acts.length} show(s) in this week's window. Need 3+. Run: npm run scrape`);
    process.exit(1);
  }

  fs.rmSync(WORK_DIR, { recursive: true, force: true });
  fs.mkdirSync(WORK_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const place = acts.every(a => /minneapolis/i.test(a.city || a.hood))
    ? 'Minneapolis' : 'the Twin Cities';

  const cards = [
    { html: hookCard(acts.length, place), sec: HOOK_SEC },
    ...acts.map((a, i) => ({ html: actCard(a, i, acts.length), sec: ACT_SEC })),
    { html: endCard(), sec: END_SEC },
  ];

  console.log(`rendering ${cards.length} cards`);
  const strip = renderStrip(cards.map(c => c.html));

  const clips = [];
  cards.forEach((c, i) => {
    const mp4 = path.join(WORK_DIR, `clip-${String(i).padStart(2, '0')}.mp4`);
    clip(strip, i, c.sec, mp4);
    clips.push(mp4);
  });

  const listPath = path.join(WORK_DIR, 'concat.txt');
  fs.writeFileSync(listPath, clips.map(f => `file '${f}'`).join('\n'));

  const date = todayISO();
  const outPath = path.join(OUT_DIR, `${date}-live-music.mp4`);
  const audioIdx = process.argv.indexOf('--audio');
  const audio = audioIdx > -1 ? process.argv[audioIdx + 1] : null;

  const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listPath];
  if (audio) args.push('-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', outPath);
  execFileSync('ffmpeg', args, { stdio: 'ignore', timeout: 300000 });

  const total = cards.reduce((s, c) => s + c.sec, 0);
  const meta = {
    title: `Live Music in Minneapolis This Week | ${acts.length} Shows Worth Seeing`,
    description: [
      `${acts.length} Twin Cities concerts worth your night this week.`,
      '',
      ...acts.map(a => `${a.when.replace(' · ', ', ')}: ${a.title} at ${a.venue}`),
      '',
      'Full Minneapolis and St. Paul music calendar: https://bestofmpls.com/calendar',
      '',
      '#minneapolis #saintpaul #twincities #onlyinmn #mnpls #mplsevents #twincitieslife #thingstodomn #livemusic #shorts',
    ].join('\n'),
    tags: ['minneapolis', 'saint paul', 'twin cities', 'live music minneapolis',
           'things to do minneapolis', 'minnesota', 'mpls', 'concerts'],
    verified: acts.filter(a => a.note).length,
  };
  fs.writeFileSync(outPath.replace(/\.mp4$/, '.json'), JSON.stringify(meta, null, 2));

  fs.rmSync(WORK_DIR, { recursive: true, force: true });
  console.log(`\n${outPath}`);
  console.log(`${acts.length} acts (${meta.verified} with verified notes), ${total}s, ${W}x${H}`);
  acts.forEach(a => console.log(`  ${a.note ? '*' : ' '} ${a.title} (${a.venue})`));
}

main();
