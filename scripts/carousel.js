// Render an IG carousel (1080x1350 PNG slides) from a day-mode props JSON
// produced by shorts-data.js. Same design language as the video template:
// dark ground, Archivo 800 uppercase, clay red, mono chips, grain.
//
//   node scripts/carousel.js <props.json> <outdir>
//
// Slides: cover (kicker + hook) → one per item → close (URL + email CTA).
// Uses headless Chrome via puppeteer-core (same binary discovery as the
// guthrie scraper).
const fs = require('fs');
const path = require('path');

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  process.env.CHROME_PATH,
].filter(Boolean);
function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    try { fs.accessSync(p); return p; } catch (_) {}
  }
  throw new Error('carousel: no Chrome binary found (set CHROME_PATH)');
}

const propsPath = process.argv[2];
const outDir = process.argv[3];
if (!propsPath || !outDir) { console.error('usage: node scripts/carousel.js <props.json> <outdir>'); process.exit(1); }
const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const GRAIN = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(%23n)' opacity='0.5'/></svg>`);

// Auto-fit like the video template: size from the longest unbreakable word.
const fit = (text, cap, avail = 880) => {
  const longest = Math.max(...String(text).split(/\s+/).map(w => w.length), 1);
  return Math.min(cap, Math.floor(avail / (0.70 * longest)));
};

const page = body => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=IBM+Plex+Mono:wght@600&family=IBM+Plex+Sans:wght@700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1350px; background: #0E0E10; color: #F5F4F0;
         font-family: 'Archivo', sans-serif; position: relative; overflow: hidden; }
  .pad { position: absolute; inset: 0; padding: 90px 80px; display: flex;
         flex-direction: column; justify-content: center; }
  .grain { position: absolute; inset: 0; background-image: url("${GRAIN}");
           background-repeat: repeat; opacity: 0.13; mix-blend-mode: overlay; pointer-events: none; }
  .label { display: inline-block; font-size: 40px; font-weight: 800; letter-spacing: 0.1em;
           text-transform: uppercase; color: #F4F2EC; background: #C8200F; padding: 8px 22px; }
  .chip { display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 38px;
          font-weight: 600; letter-spacing: 0.08em; color: #0E0E10; background: #F5F4F0; padding: 10px 22px; }
  .kicker { font-size: 60px; font-weight: 800; text-transform: uppercase; }
  .venue { font-weight: 800; text-transform: uppercase; color: #C8200F; margin-top: 30px; }
  .bug { position: absolute; bottom: 70px; left: 0; right: 0; text-align: center;
         font-family: 'IBM Plex Sans', sans-serif; font-weight: 700; font-size: 38px; }
  .bug .dot { color: #C8200F; }
  .swipe { position: absolute; top: 74px; right: 80px; font-family: 'IBM Plex Mono', monospace;
           font-size: 30px; color: #878683; letter-spacing: 0.08em; }
</style></head><body>${body}<div class="grain"></div></body></html>`;

const bug = '<div class="bug">bestofmpls<span class="dot">.</span></div>';

const slides = [];

// Cover
slides.push(page(`
  <div class="pad">
    <div class="kicker" style="font-size:${fit(props.kicker, 64)}px">${props.kicker}</div>
    <div style="font-size:${fit(props.hook1 + ' ' + props.hook2, 170)}px; font-weight:800; text-transform:uppercase; color:#C8200F; line-height:0.98; margin-top:24px;">
      ${props.hook1}<br>${props.hook2}
    </div>
    <div style="margin-top:70px;" class="swipe" >&nbsp;</div>
  </div>
  <div class="swipe">swipe &rarr;</div>
  ${bug}`));

// Items
for (const item of props.items) {
  slides.push(page(`
    <div class="pad">
      ${item.label ? `<div style="margin-bottom:26px;"><span class="label">${item.label}</span></div>` : ''}
      <div style="margin-bottom:34px;"><span class="chip">${item.chip}</span></div>
      <div style="font-size:${fit(item.title, 108)}px; font-weight:800; text-transform:uppercase; letter-spacing:-0.01em; line-height:1.02;">${item.title}</div>
      <div class="venue" style="font-size:${fit(item.venue, 54)}px">${item.venue}</div>
    </div>
    ${bug}`));
}

// Close
slides.push(page(`
  <div class="pad">
    <div style="font-size:${fit(props.closeTop, 84)}px; font-weight:800; text-transform:uppercase;">${props.closeTop}</div>
    <div style="margin-top:36px;"><span style="font-size:${fit(props.closeUrl, 92, 840)}px; font-weight:800; text-transform:uppercase; color:#F4F2EC; background:#C8200F; padding:8px 30px;">${props.closeUrl}</span></div>
    <div style="margin-top:90px; font-family:'IBM Plex Sans',sans-serif; font-weight:700; font-size:64px;">bestofmpls<span style="color:#C8200F">.</span></div>
    <div style="margin-top:24px; font-weight:800; font-size:34px; letter-spacing:0.12em; text-transform:uppercase; color:#C8200F;">free monday email &middot; link in bio</div>
  </div>`));

(async () => {
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'new' });
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  for (let i = 0; i < slides.length; i++) {
    const tmp = path.join(outDir, `_slide.html`);
    fs.writeFileSync(tmp, slides[i]);
    await pg.goto('file://' + tmp, { waitUntil: 'networkidle0' });
    await pg.screenshot({ path: path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`) });
  }
  fs.unlinkSync(path.join(outDir, `_slide.html`));
  await browser.close();
  console.log(`${slides.length} slides -> ${outDir}`);
})();
