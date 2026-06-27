#!/usr/bin/env node
/**
 * editorial-targets.js — print the week's notable shows (as JSON) for the
 * editorial pass to research and write one-line "why go" takes about.
 *
 * Deterministic selection so the weekly run is stable: in-window, no films, no
 * non-show noise, de-duped by title; marquee rooms first, then a spread of the
 * rest (max 2 per venue), capped. The editorial pass (a workflow now, the
 * weekly scheduled task going forward) reads this, web-verifies each act, and
 * writes src/data/editorial-notes.json keyed by event id.
 *
 * Run: node scripts/editorial-targets.js
 */
const fs = require('fs');
const path = require('path');
const EVENTS_FILE = path.join(__dirname, '..', 'src/data/events.json');

const NOISE = /\b(yoga|trivia|bingo|karaoke|open mic|open-mic|happy hour|brunch|story ?time|book club|class|workshop|market|paint|craft night|meeting|networking|drag brunch)\b/i;
const MARQUEE = new Set(['First Avenue', '7th St Entry', 'Fine Line', 'Turf Club', 'Palace Theatre', 'The Cedar Cultural Center', 'Dakota Jazz Club', 'Varsity Theater', 'Walker Art Center', 'Amsterdam Bar & Hall', 'The Armory', 'Icehouse', 'Crooners Supper Club', 'Berlin', 'The Parkway Theater']);
const MAX = 22;

function todayISO() { return new Date().toISOString().slice(0, 10); }
function sundayISO() { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 7); return d.toISOString().slice(0, 10); }

function main() {
  const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  const today = todayISO(), sun = sundayISO();
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const seen = new Set();
  const clean = [];
  for (const e of (data.events || [])) {
    if (e.date < today || e.date > sun) continue;
    if (e.category === 'film') continue;
    if (NOISE.test(e.title)) continue;
    const t = norm(e.title);
    if (seen.has(t)) continue;
    seen.add(t);
    clean.push(e);
  }
  // Marquee first, then spread the rest (max 2 per venue).
  clean.sort((a, b) => (MARQUEE.has(b.venue) ? 1 : 0) - (MARQUEE.has(a.venue) ? 1 : 0));
  const perVenue = new Map();
  const out = [];
  for (const e of clean) {
    const c = perVenue.get(e.venue) || 0;
    if (!MARQUEE.has(e.venue) && c >= 2) continue;
    perVenue.set(e.venue, c + 1);
    out.push({ id: e.id, title: e.title, venue: e.venue, date: e.date, neighborhood: e.venue_neighborhood || '', listing: e.subtitle || '' });
    if (out.length >= MAX) break;
  }
  process.stdout.write(JSON.stringify(out, null, 2));
}
main();
