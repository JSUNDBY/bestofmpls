/**
 * Bryant Lake Bowl Theater scraper — STUB (Lyn-Lake, 810 W Lake St).
 *
 * No accessible event feed as of June 2026.
 *
 * What they use:
 *   - bryantlakebowl.com — Squarespace site with a /shows page.
 *   - Squarespace does not expose a public REST API for event listings.
 *   - The /shows page renders events via Squarespace's internal CMS —
 *     no JSON-LD, no structured feed.
 *
 * What would need to happen to scrape:
 *   1. Squarespace Business/Commerce plans have a limited Content API;
 *      Bryant Lake Bowl would need to grant API access.
 *   2. Alternatively, they could embed a third-party ticketing widget
 *      (Eventbrite, Brown Paper Tickets) which would create a scrapeable
 *      feed on the ticketer's side.
 *   3. A headless browser (Playwright) could render the /shows page and
 *      extract event cards, though this is fragile.
 */

async function scrape() {
  return [];
}

module.exports = { source: 'bryantlakebowl', label: 'Bryant Lake Bowl', scrape };
