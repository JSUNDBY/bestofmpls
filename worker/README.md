# bestofmpls poll worker

A Cloudflare Worker that accepts reader poll submissions for category pages on bestofmpls.com.

## What it does

- `POST /vote` — accepts a category + place + optional notes/email. Rate-limited to 1 submission per IP per 30 seconds. Honeypot field catches bots.
- `GET /tallies/:category` — returns the aggregated counts for that category. Edge-cached 60s.
- `GET /admin/recent` — returns the most recent 50 raw submissions including emails. Requires the `X-Admin-Key` header to match the `ADMIN_KEY` secret.

## One-time setup

From this directory:

```bash
# 1. Log in (opens a browser tab)
npx wrangler login

# 2. Create the KV namespace
npx wrangler kv namespace create POLLS
# Wrangler prints something like:
#   id = "abc123def456..."
# Paste that into wrangler.toml, replacing REPLACE_WITH_KV_ID.

# 3. Set the admin key (used to read raw submissions)
npx wrangler secret put ADMIN_KEY
# It will prompt — paste a long random string and remember it.

# 4. Deploy
npx wrangler deploy
# It will print the URL, something like:
#   https://bestofmpls-poll.<your-subdomain>.workers.dev
```

After step 4, copy the deployed URL and paste it into `src/style.css` at the top of `bestofmpls/scripts/build.js` where `POLL_WORKER_URL` is defined. Rebuild the site and the form is live.

## Local dev

```bash
npx wrangler dev
# Worker available at http://localhost:8787
# Hit it with: curl http://localhost:8787/
```

## Watching live submissions

```bash
npx wrangler tail
# Streams live request logs from the deployed worker
```

## Reading the submission audit log

The site exposes only aggregated counts. To read the raw submissions (with emails and free-text "why" notes), hit the admin endpoint:

```bash
curl https://bestofmpls-poll.<your-subdomain>.workers.dev/admin/recent \
  -H "X-Admin-Key: <the secret you set in step 3>"
```

Returns JSON with up to 50 most recent submissions.

## Storage layout

Workers KV. Free tier (100k reads/day, 1k writes/day) supports comfortably 500 votes/day, plenty for this use case.

Keys:

- `tally:{category}` — JSON map `{ placeNorm: { name, count, first_ts, last_ts } }`. Read on every tally request, written on every vote.
- `submission:{ts}-{nonce}` — full submission JSON, kept for two years then auto-expired.
- `rl:{ipHash}` — rate-limit marker, 30s TTL.

## Costs

Free tier covers expected traffic. If a category goes viral, the next paid tier is $5/mo and supports 10M reads.
