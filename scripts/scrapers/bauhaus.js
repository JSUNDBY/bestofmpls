/**
 * Bauhaus Brew Labs scraper — STUB (Northeast Minneapolis, 1315 Tyler St NE).
 *
 * No accessible event feed as of June 2026.
 *
 * What they use:
 *   - bauhausbrewlabs.com — Squarespace site. Events are listed at
 *     /taproomevents but the page is a Squarespace event block with no
 *     public API.
 *   - No JSON-LD event markup, no structured feed.
 *
 * What would need to happen to scrape:
 *   1. Same Squarespace constraints as Bryant Lake Bowl — they'd need to
 *      grant API access or migrate to a ticketing platform with a public feed.
 *   2. Bauhaus also posts events to Facebook/Instagram; a Facebook Graph API
 *      key (pages_read_engagement) could pull from their Facebook Page.
 *   3. A headless browser (Playwright) could render /taproomevents and
 *      extract the Squarespace event cards, though fragile.
 */

async function scrape() {
  return [];
}

module.exports = { source: 'bauhaus', label: 'Bauhaus Brew Labs', scrape };
