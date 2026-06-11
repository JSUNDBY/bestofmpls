/**
 * bestofmpls reader poll worker.
 *
 * Endpoints:
 *   POST /vote           — accept a single submission. Body JSON:
 *                          { category, place, why?, email?, hp? }
 *                          Rate-limited per IP (one submission per 30s).
 *                          Honeypot field 'hp' must be empty.
 *   GET  /tallies/:cat   — return aggregated counts for a category.
 *                          Public, cached for 60s on Cloudflare's edge.
 *   GET  /admin/recent   — return the most recent 50 submissions including
 *                          email + why fields. Requires header
 *                          X-Admin-Key matching the ADMIN_KEY secret.
 *   OPTIONS /*           — CORS preflight.
 *
 * Storage in KV:
 *   tally:{category}              → JSON {placeName: count}
 *   submission:{ts}-{nonce}       → JSON of the full submission
 *   rl:{ipHash}                   → presence flag with 30s TTL
 */

const ALLOWED_ORIGINS = [
  'https://bestofmpls.com',
  'https://www.bestofmpls.com',
  'http://localhost:47823'
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(body, status, origin, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
      ...(extraHeaders || {})
    }
  });
}

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(String(str || ''));
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function clean(s, max) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
}

// Normalize a place name into a tally key. Lowercased, alphanumerics only,
// preserves apostrophes-stripped spelling. So "Bauhaus Brew Labs" and
// "bauhaus brew labs" land in the same bucket but different real names stay
// separate.
function normalizePlace(s) {
  return s.toLowerCase().replace(/[''`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Health check at the root, so a quick browser hit confirms it's up.
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, service: 'bestofmpls-poll', endpoints: ['POST /vote', 'GET /tallies/:category'] }, 200, origin);
    }

    // ===== POST /vote =====
    if (request.method === 'POST' && url.pathname === '/vote') {
      let body;
      try { body = await request.json(); }
      catch (_) { return json({ error: 'invalid json' }, 400, origin); }

      // Honeypot: a real user never fills this. Bots scrape forms and fill
      // every field, so this catches a lot of automated junk.
      if (body.hp) return json({ ok: true }, 200, origin);

      const category = clean(body.category, 80);
      const place    = clean(body.place, 120);
      const why      = clean(body.why, 600);
      const email    = clean(body.email, 200);

      if (!category) return json({ error: 'missing category' }, 400, origin);
      if (!place)    return json({ error: 'missing place name' }, 400, origin);
      if (place.length < 2) return json({ error: 'place name too short' }, 400, origin);

      // Rate limit: one submission per IP per 30s.
      const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0.0.0.0';
      const ipHash = (await sha256Hex(ip)).slice(0, 16);
      const rlKey = `rl:${ipHash}`;
      const existing = await env.POLLS.get(rlKey);
      if (existing) {
        return json({ error: 'too fast — try again in a moment' }, 429, origin);
      }
      // Mark the rate-limit key with a 30s TTL.
      ctx.waitUntil(env.POLLS.put(rlKey, '1', { expirationTtl: 30 }));

      const ts = Date.now();
      const nonce = crypto.randomUUID().slice(0, 8);
      const placeNorm = normalizePlace(place);

      // Persist the full submission for board review.
      const submissionKey = `submission:${ts}-${nonce}`;
      const submission = {
        kind: 'vote',
        category,
        place,
        place_norm: placeNorm,
        why,
        email_hash: email ? (await sha256Hex(email)).slice(0, 16) : null,
        email,                       // kept for board review only
        ip_hash: ipHash,
        ts
      };
      await env.POLLS.put(submissionKey, JSON.stringify(submission), {
        // Keep submissions for 2 years. After that, only the aggregated
        // tally remains and the personal data is gone.
        expirationTtl: 60 * 60 * 24 * 365 * 2
      });

      // Update the aggregated tally for the category. Read-modify-write is
      // not strictly atomic in KV, but for low write rates this is fine and
      // any lost race just under-counts by one.
      const tallyKey = `tally:${category}`;
      let tally = {};
      try {
        const existing = await env.POLLS.get(tallyKey);
        if (existing) tally = JSON.parse(existing);
      } catch (_) {}

      // Use the original spelling the FIRST time we see a place name. After
      // that, increment by the normalized key so different capitalizations
      // collapse together.
      const entry = Object.values(tally).find(e => e && e.norm === placeNorm);
      if (entry) {
        entry.count += 1;
        entry.last_ts = ts;
      } else {
        tally[placeNorm] = { name: place, norm: placeNorm, count: 1, first_ts: ts, last_ts: ts };
      }
      await env.POLLS.put(tallyKey, JSON.stringify(tally));

      return json({ ok: true, place, category, total_for_place: (entry ? entry.count : 1) }, 200, origin);
    }

    // ===== POST /tip =====
    // Free-form tip / correction / general feedback. No tally, just stored
    // for review in the admin dashboard.
    if (request.method === 'POST' && url.pathname === '/tip') {
      let body;
      try { body = await request.json(); }
      catch (_) { return json({ error: 'invalid json' }, 400, origin); }
      if (body.hp) return json({ ok: true }, 200, origin);

      const name    = clean(body.name, 120);
      const email   = clean(body.email, 200);
      const place   = clean(body.place, 200);
      const message = clean(body.message, 2000);

      if (!message) return json({ error: 'tell us something' }, 400, origin);
      if (message.length < 10) return json({ error: 'a little more, please' }, 400, origin);

      const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
      const ipHash = (await sha256Hex(ip)).slice(0, 16);
      const rlKey = `rl:${ipHash}`;
      if (await env.POLLS.get(rlKey)) {
        return json({ error: 'too fast — try again in a moment' }, 429, origin);
      }
      ctx.waitUntil(env.POLLS.put(rlKey, '1', { expirationTtl: 30 }));

      const ts = Date.now();
      const nonce = crypto.randomUUID().slice(0, 8);
      const submission = { kind: 'tip', name, email, place, message, ip_hash: ipHash, ts };
      await env.POLLS.put(`submission:${ts}-${nonce}`, JSON.stringify(submission), {
        expirationTtl: 60 * 60 * 24 * 365 * 2
      });
      return json({ ok: true }, 200, origin);
    }

    // ===== POST /newsletter =====
    if (request.method === 'POST' && url.pathname === '/newsletter') {
      let body;
      try { body = await request.json(); }
      catch (_) { return json({ error: 'invalid json' }, 400, origin); }
      if (body.hp) return json({ ok: true }, 200, origin);

      const email = clean(body.email, 200);
      if (!email || !email.includes('@')) return json({ error: 'need a real email' }, 400, origin);

      const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
      const ipHash = (await sha256Hex(ip)).slice(0, 16);
      const rlKey = `rl:${ipHash}`;
      if (await env.POLLS.get(rlKey)) {
        return json({ error: 'too fast — try again in a moment' }, 429, origin);
      }
      ctx.waitUntil(env.POLLS.put(rlKey, '1', { expirationTtl: 30 }));

      // Forward to Beehiiv. BEEHIIV_API_KEY and BEEHIIV_PUB_ID are worker secrets.
      if (env.BEEHIIV_API_KEY && env.BEEHIIV_PUB_ID) {
        try {
          const bhRes = await fetch(
            `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUB_ID}/subscriptions`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.BEEHIIV_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, utm_source: 'website', utm_medium: 'organic' })
            }
          );
          if (!bhRes.ok) {
            const err = await bhRes.json().catch(() => ({}));
            return json({ error: err.message || 'subscription failed' }, 502, origin);
          }
        } catch (e) {
          return json({ error: 'could not reach Beehiiv' }, 502, origin);
        }
      }

      // Also log to KV for our own records.
      const ts = Date.now();
      const nonce = crypto.randomUUID().slice(0, 8);
      const submission = { kind: 'newsletter', email, ip_hash: ipHash, ts };
      ctx.waitUntil(env.POLLS.put(`submission:${ts}-${nonce}`, JSON.stringify(submission), {
        expirationTtl: 60 * 60 * 24 * 365 * 2
      }));

      return json({ ok: true }, 200, origin);
    }

    // ===== GET /tallies/:category =====
    if (request.method === 'GET' && url.pathname.startsWith('/tallies/')) {
      const category = decodeURIComponent(url.pathname.slice('/tallies/'.length));
      if (!category) return json({ error: 'missing category' }, 400, origin);

      const tallyKey = `tally:${category}`;
      const raw = await env.POLLS.get(tallyKey);
      const tally = raw ? JSON.parse(raw) : {};
      const items = Object.values(tally)
        .map(e => ({ name: e.name, count: e.count }))
        .sort((a, b) => b.count - a.count);

      // Cache on the edge for 60s so a busy category page doesn't hammer KV.
      return json(
        { category, total: items.reduce((s, i) => s + i.count, 0), items },
        200, origin,
        { 'Cache-Control': 'public, max-age=60' }
      );
    }

    // ===== GET /admin/recent (board only) =====
    if (request.method === 'GET' && url.pathname === '/admin/recent') {
      const adminKey = request.headers.get('X-Admin-Key');
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return json({ error: 'unauthorized' }, 401, origin);
      }
      const list = await env.POLLS.list({ prefix: 'submission:', limit: 50 });
      const out = [];
      for (const k of list.keys.reverse()) {
        const v = await env.POLLS.get(k.name);
        if (v) out.push(JSON.parse(v));
      }
      return json({ count: out.length, submissions: out }, 200, origin);
    }

    return json({ error: 'not found' }, 404, origin);
  }
};
