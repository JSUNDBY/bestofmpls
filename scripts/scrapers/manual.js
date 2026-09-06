/**
 * Manual events — the flyer channel. Reads src/data/manual-events.json and
 * emits upcoming entries into the feed like any scraped source, so a hand-
 * added event survives the 4x-daily scrape regenerating events.json.
 * Verification rule lives in the json's _doc: organizer's own announcement
 * or nothing.
 */

const fs = require('fs');
const path = require('path');
const { slugify } = require('./_helpers');

const FILE = path.join(__dirname, '../../src/data/manual-events.json');

async function scrape() {
  const todayISO = new Date().toISOString().slice(0, 10);
  let data;
  try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (_) { return []; }
  return (data.events || [])
    .filter(e => e.title && e.date && e.date >= todayISO)
    .map(e => ({
      id: `manual:${e.date}:${slugify(e.title)}`,
      end_date: e.end_date || null,
      image: e.image || null,
      price: e.price || null,
      age: e.age || null,
      subtitle: e.subtitle || null,
      source: 'manual',
      ...e
    }));
}

module.exports = { source: 'manual', label: 'Hand-added events', scrape };
