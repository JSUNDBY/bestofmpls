# Spotify integration — setup guide

How to get the API credentials we need to enrich event listings with
Spotify links, top tracks, and "if you like X" data.

## Getting the credentials (10 minutes, free, no business required)

1. Go to **[developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)**.
2. Log in with any Spotify account (the free tier is fine — no Premium needed).
3. Click **Create app**.
4. Fill in:
   - **App name:** `bestofmpls event enrichment`
   - **App description:** `Enriching local-music event listings with Spotify artist data.`
   - **Website:** `https://bestofmpls.com`
   - **Redirect URI:** `https://bestofmpls.com/` (not used for our flow, but required)
   - Which APIs do you plan to use: **Web API**
5. Accept the developer terms, click **Save**.
6. On the new app's dashboard page, click **Settings**.
7. Copy two values:
   - **Client ID** (visible)
   - **Client secret** (click "View client secret" to reveal)

That's all you need. We use the **Client Credentials** flow (server-to-server),
which means no user has to log in — we just fetch a bearer token periodically
and call the Web API.

## Where to put the credentials

Once you have them, paste both into the GitHub repo's secrets so the
scraper cron can use them:

1. Go to `github.com/JSUNDBY/bestofmpls` → **Settings** → **Secrets and
   variables** → **Actions**.
2. Click **New repository secret** twice:
   - Name: `SPOTIFY_CLIENT_ID`, value: the Client ID
   - Name: `SPOTIFY_CLIENT_SECRET`, value: the Client secret
3. Tell me you've added them and I'll wire the enrichment step into the
   build pipeline.

## What we'll do with them

A new script — `scripts/enrich-spotify.js` — that runs after the event
scrape and, for each unique scraped artist, hits the Spotify Web API to
look up:

- Spotify URL for the artist (so we can deep-link from event listings)
- Genre tags
- Popularity score (rough proxy for whether a show will sell out)
- Whether the artist is local Twin Cities (we can cross-reference the
  Spotify city tag against MN)
- Top track (optional — for an embed)

Output gets cached in `src/data/spotify-artists.json` so we don't
re-query for the same artist twice. The cache is keyed by artist name
+ event title so misses don't keep retrying.

The data is then rendered on:

- **Event listings:** small Spotify icon next to each event title that
  opens the artist on Spotify
- **Venue pages:** "if you liked this venue, you might like…" using
  artist similarity
- **Scene pages:** computed top-5 artists currently in the scene from
  upcoming events

Rate limits are generous under client credentials (~180 requests/min)
so we can enrich a full 450-event scrape in under three minutes.

## Why Spotify and not Apple Music

Apple Music's API requires:
- A paid Apple Developer account ($99/year)
- A MusicKit identifier
- A private key + JWT signing process per request

Spotify's Web API:
- Free
- Client Credentials flow (no user login)
- Public catalog data is fully accessible

Spotify is the right starting point. If Apple ever becomes important,
we can add a parallel enrichment step — the data shape stays the same.

## Privacy / terms note

We are only reading public catalog data — artist names, genres,
popularity, URLs. No user data, no playback, no listening history. The
Spotify Web API client-credentials flow is the standard way to do
this; the site is acting as a publisher pointing readers at Spotify,
not as a playback app.
