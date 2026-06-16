/**
 * Minnesota Historical Society (mnhs.org) — STUB (returns []).
 *
 * Target: the MNHS History Forum / events ("Lectures & Talks"), Downtown
 * St. Paul.
 *
 * What I found (2026-06-15):
 *   - https://www.mnhs.org/events is a HubSpot-rendered page. NO JSON-LD, NO
 *     RSS, and no public events API/HubDB endpoint is exposed in the page.
 *   - The server HTML *does* contain ~58 `.new-event-listing-box` /
 *     `li.views-row` blocks, but it is a stale cached snapshot: EVERY event is
 *     flagged "This event is no longer available" (some "Sold Out" /
 *     "Cancelled"). The live calendar is filtered/populated client-side by JS
 *     that this fetch-only scraper cannot drive.
 *   - The visible date text ("Wednesday, June 17 : 3:15 PM - 4:45 PM") carries
 *     NO year. The only year anywhere on the page is the page-load date marker
 *     (`dataaaaaaa="...||2026-06-15"`), which is identical on every row and is
 *     not the event's date. So even the dates can't be resolved reliably.
 *   - The dedicated History Forum URL (https://www.mnhs.org/historyforum)
 *     301-redirects to a 2023 campaign calendar
 *     (/calendar?...utm_campaign=History-Forum-2023), i.e. stale.
 *   - Event detail pages (e.g. /events/51136014363) also have no structured
 *     Event markup.
 *
 * Conclusion: there is no accessible/parseable feed that yields reliable,
 * future-dated events. Parsing the cached HTML would publish events that are
 * already marked unavailable and whose year is guessed — that fails the
 * "only future-dated, do not fabricate" bar. Returning [] rather than risk
 * dead/wrong listings.
 *
 * What would be needed to enable this source:
 *   - A headless browser (Playwright/Puppeteer) to load the JS-driven calendar
 *     and read the rendered, future-only events with real dates; OR
 *   - access to the underlying HubSpot HubDB / calendar JSON endpoint the page
 *     calls client-side (not discoverable from the static HTML); OR
 *   - an official MNHS events feed (none published as of this writing).
 */

async function scrape() {
  return [];
}

module.exports = { source: 'mnhs', label: 'Minnesota Historical Society', scrape };
