#!/usr/bin/env node
/*
 * Google Search Console report for bestofmpls.com.
 *
 * Reads Search Analytics (last 28 days) via a service account so it can run
 * unattended — no browser, no interactive login. Setup is one-time and lives
 * in docs/SEARCH-CONSOLE.md.
 *
 * Key file (a service-account JSON, kept OUT of the repo) is found via, in order:
 *   1. $GSC_KEY_FILE
 *   2. ~/.config/bestofmpls/gsc-service-account.json
 *
 * Run: node scripts/gsc-report.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const SITE_URL = 'https://bestofmpls.com/'; // URL-prefix property (trailing slash matters)

function resolveKeyFile() {
  const candidates = [
    process.env.GSC_KEY_FILE,
    path.join(os.homedir(), '.config', 'bestofmpls', 'gsc-service-account.json'),
  ].filter(Boolean);
  return candidates.find(p => fs.existsSync(p)) || null;
}

// Date helpers. GSC data lags ~2-3 days, so the window ends 3 days back.
function ymd(d) { return d.toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

async function main() {
  const keyFile = resolveKeyFile();
  if (!keyFile) {
    console.error('No Search Console key file found.');
    console.error('Set $GSC_KEY_FILE or place it at ~/.config/bestofmpls/gsc-service-account.json');
    console.error('See docs/SEARCH-CONSOLE.md for one-time setup.');
    process.exit(2);
  }

  let google;
  try {
    ({ google } = require('googleapis'));
  } catch {
    console.error('The "googleapis" package is not installed. Run: npm install');
    process.exit(2);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const sc = google.searchconsole({ version: 'v1', auth });

  const startDate = ymd(daysAgo(31));
  const endDate = ymd(daysAgo(3));

  const query = (body) => sc.searchanalytics
    .query({ siteUrl: SITE_URL, requestBody: { startDate, endDate, ...body } })
    .then(r => r.data.rows || []);

  let totals, topQueries, topPages, crossPages, bestQueries;
  try {
    [totals, topQueries, topPages, crossPages, bestQueries] = await Promise.all([
      query({}), // site totals (no dimensions)
      query({ dimensions: ['query'], rowLimit: 25 }),
      query({ dimensions: ['page'], rowLimit: 25 }),
      query({
        dimensions: ['page'], rowLimit: 50,
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/in-' }] }],
      }),
      query({
        dimensions: ['query'], rowLimit: 25,
        dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'contains', expression: 'best' }] }],
      }),
    ]);
  } catch (e) {
    const msg = (e && e.errors && e.errors[0] && e.errors[0].message) || e.message || String(e);
    console.error(`Search Console API error: ${msg}`);
    if (/permission|forbidden|403/i.test(msg)) {
      console.error('The service account is probably not added as a user on the property.');
      console.error('Fix: Search Console → Settings → Users and permissions → add the service-account email (Restricted is enough).');
    }
    process.exit(1);
  }

  const n = (x, d = 0) => (typeof x === 'number' ? x.toFixed(d) : '0');
  const pct = (x) => (x == null ? '—' : (x * 100).toFixed(1) + '%');
  const row = (r) => `${String(r.clicks).padStart(5)} clk  ${String(r.impressions).padStart(6)} imp  ${pct(r.ctr).padStart(6)} ctr  pos ${n(r.position, 1).padStart(4)}`;
  const label = (r) => (r.keys && r.keys[0]) ? r.keys[0].replace(SITE_URL.replace(/\/$/, ''), '') : '(total)';

  const out = [];
  out.push(`\nBest of MPLS — Search Console  (${startDate} → ${endDate})`);
  const t = totals[0];
  if (t) out.push(`SITE TOTAL: ${t.clicks} clicks · ${t.impressions} impressions · ${pct(t.ctr)} CTR · avg pos ${n(t.position, 1)}`);
  else out.push('SITE TOTAL: no data yet (Google may still be crawling — check again in 1-2 weeks).');

  const section = (title, rows, withLabel = true) => {
    out.push(`\n${title}`);
    if (!rows.length) { out.push('  (none)'); return; }
    for (const r of rows.slice(0, 15)) out.push(`  ${row(r)}  ${withLabel ? label(r) : ''}`.trimEnd());
  };

  section('TOP QUERIES', topQueries);
  section('"best ..." QUERIES (did the new titles land?)', bestQueries);
  section('TOP PAGES', topPages);
  section('NEIGHBORHOOD LONG-TAIL PAGES (/{cat}/in-{neighborhood}/)', crossPages);

  // Quick CTR-opportunity flag: pages with real impressions but weak CTR.
  const weak = topPages.filter(r => r.impressions >= 50 && (r.ctr || 0) < 0.01);
  if (weak.length) {
    out.push('\nLOW-CTR PAGES (impressions but <1% CTR — title/description worth sharpening):');
    for (const r of weak.slice(0, 10)) out.push(`  ${label(r)}  (${r.impressions} imp, ${pct(r.ctr)})`);
  }

  console.log(out.join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
