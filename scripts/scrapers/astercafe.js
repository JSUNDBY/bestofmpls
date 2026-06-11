/**
 * Aster Cafe scraper — STUB (Northeast Minneapolis, 125 SE Main St).
 *
 * No accessible event feed as of June 2026.
 *
 * What they use:
 *   - Main site: astercafe.com — Divi/WordPress, but the /music-calendar
 *     page redirects to the homepage which shows no event listings.
 *   - Events subdomain: events.astercafe.com — a separate WordPress install
 *     used for private venue-rental inquiries, not a public music calendar.
 *   - No Tribe Events Calendar API, no JSON-LD event markup.
 *
 * What would need to happen to scrape:
 *   1. They could install The Events Calendar (tribe) plugin on their main
 *      site — then `https://astercafe.com/wp-json/tribe/events/v1/events`
 *      would return structured JSON.
 *   2. Alternatively, if they publish event HTML with schema.org Event
 *      JSON-LD markup, the extractJsonLdEvents() helper would handle it.
 *   3. Aster posts shows to their Facebook page; a Facebook Graph API key
 *      (with pages_read_engagement) could pull those.
 */

async function scrape() {
  return [];
}

module.exports = { source: 'astercafe', label: 'Aster Cafe', scrape };
