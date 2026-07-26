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

import { EmailMessage } from 'cloudflare:email';

const ALLOWED_ORIGINS = [
  'https://bestofmpls.com',
  'https://www.bestofmpls.com',
  'http://localhost:47823',
  'http://localhost:47905'
];

// Notification email. NOTIFY_TO must match the send_email binding's
// destination_address in wrangler.toml (a verified Email Routing destination).
const NOTIFY_FROM = 'noreply@bestofmpls.com';
const NOTIFY_TO = 'j.sundby@gmail.com';

// Email Josh about a submission. Best-effort: a send failure must never break
// the submission itself, so callers wrap this in ctx.waitUntil and it swallows
// its own errors.
async function notify(env, subject, lines) {
  if (!env.NOTIFY) return;
  const body = lines.filter((l) => l != null).join('\r\n');
  const raw = [
    `From: Best of MPLS <${NOTIFY_FROM}>`,
    `To: ${NOTIFY_TO}`,
    `Subject: ${subject}`,
    `Message-ID: <${crypto.randomUUID()}@bestofmpls.com>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="utf-8"',
    '',
    body
  ].join('\r\n');
  try {
    await env.NOTIFY.send(new EmailMessage(NOTIFY_FROM, NOTIFY_TO, raw));
  } catch (e) {
    console.error('notify failed:', e && e.message);
  }
}

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

      ctx.waitUntil(notify(env, `New reader vote: ${category}`, [
        'A new reader poll vote on bestofmpls.com:',
        '',
        `Category: ${category}`,
        `Place:    ${place}`,
        why ? `Why:      ${why}` : 'Why:      (none)',
        `Email:    ${email || '(none)'}`
      ]));
      return json({ ok: true, place, category, total_for_place: (entry ? entry.count : 1) }, 200, origin);
    }

    // ===== POST /signal — The Living Best of engine =====
    // A reader action on a place: save, regular, directions-tap, or a story.
    // Stored per place; save/regular dedupe per device. The build reads the
    // public aggregate at GET /signals and scores it with time-decay.
    if (request.method === 'POST' && url.pathname === '/signal') {
      let body;
      try { body = await request.json(); }
      catch (_) { return json({ error: 'invalid json' }, 400, origin); }
      if (body.hp) return json({ ok: true }, 200, origin);

      const TYPES = ['save', 'regular', 'directions', 'story'];
      const type = clean(body.type, 16);
      const place = clean(body.place, 120).toLowerCase().replace(/[^a-z0-9/_-]/g, '');
      const device = clean(body.device, 64).replace(/[^a-zA-Z0-9_-]/g, '');
      if (!TYPES.includes(type)) return json({ error: 'bad type' }, 400, origin);
      if (!place || place.length < 3) return json({ error: 'bad place' }, 400, origin);
      if (!device || device.length < 8) return json({ error: 'bad device' }, 400, origin);

      // Per-(device, place, type) rate limit so a single tap can't be spammed.
      const rlKey = `rl:sig:${device}:${place}:${type}`;
      if (await env.POLLS.get(rlKey)) return json({ error: 'too fast' }, 429, origin);
      ctx.waitUntil(env.POLLS.put(rlKey, '1', { expirationTtl: type === 'directions' ? 3600 : 5 }));

      const ts = Date.now();
      const key = `lb:${place}`;
      let rec = null;
      try { const ex = await env.POLLS.get(key); rec = ex ? JSON.parse(ex) : null; } catch (_) {}
      if (!rec) rec = { saves: {}, regulars: {}, directions: [], stories: [] };

      if (type === 'save' || type === 'regular') {
        const map = type === 'save' ? rec.saves : rec.regulars;
        if (body.remove) delete map[device];        // toggle off
        else map[device] = ts;                       // dedupes by device
      } else if (type === 'directions') {
        rec.directions.push(ts);
        if (rec.directions.length > 1000) rec.directions = rec.directions.slice(-1000);
      } else if (type === 'story') {
        const text = clean(body.text, 1000);
        if (text.length < 10) return json({ error: 'tell us a little more' }, 400, origin);
        rec.stories.push({ d: device, ts, text, ok: false });   // ok:false until moderated
        if (rec.stories.length > 500) rec.stories = rec.stories.slice(-500);
        ctx.waitUntil(notify(env, `New Best-of story: ${place}`, [
          'A reader shared a moment on bestofmpls.com:', '',
          `Place: ${place}`, '', text, '',
          'Set ok:true on this story in KV to publish it.'
        ]));
      }
      await env.POLLS.put(key, JSON.stringify(rec));
      const count = (n) => Object.keys(n || {}).length;
      return json({ ok: true, type, place, saves: count(rec.saves), regulars: count(rec.regulars) }, 200, origin);
    }

    // ===== GET /signals — public aggregate for the build (no device ids) =====
    if (request.method === 'GET' && url.pathname === '/signals') {
      const out = {};
      let cursor;
      do {
        const list = await env.POLLS.list({ prefix: 'lb:', cursor, limit: 1000 });
        for (const k of list.keys) {
          try {
            const rec = JSON.parse(await env.POLLS.get(k.name));
            out[k.name.slice(3)] = {
              saves: Object.values(rec.saves || {}),
              regulars: Object.values(rec.regulars || {}),
              directions: rec.directions || [],
              stories: (rec.stories || []).filter(s => s.ok).map(s => ({ ts: s.ts, text: s.text }))
            };
          } catch (_) {}
        }
        cursor = list.list_complete ? null : list.cursor;
      } while (cursor);
      return json({ generated: Date.now(), places: out }, 200, origin, { 'Cache-Control': 'public, max-age=120' });
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
      ctx.waitUntil(notify(env, 'New tip from bestofmpls.com', [
        'A new tip was submitted on bestofmpls.com:',
        '',
        `Name:  ${name || '(none)'}`,
        `Email: ${email || '(none)'}`,
        `Place: ${place || '(none)'}`,
        '',
        'Message:',
        message
      ]));
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
      ctx.waitUntil(notify(env, 'New newsletter signup', [
        'A new newsletter signup on bestofmpls.com:',
        '',
        `Email: ${email}`,
        '',
        '(also forwarded to Beehiiv)'
      ]));

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
    // ===== GET /admin/stories — every story with its moderation state =====
    if (request.method === 'GET' && url.pathname === '/admin/stories') {
      const adminKey = request.headers.get('X-Admin-Key');
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return json({ error: 'unauthorized' }, 401, origin);
      }
      const out = [];
      let cursor;
      do {
        const page = await env.POLLS.list({ prefix: 'lb:', cursor });
        for (const k of page.keys) {
          const v = await env.POLLS.get(k.name);
          if (!v) continue;
          try {
            const rec = JSON.parse(v);
            const place = k.name.slice(3);
            for (const s of rec.stories || []) out.push({ place, ts: s.ts, text: s.text, ok: !!s.ok });
          } catch (_) {}
        }
        cursor = page.list_complete ? null : page.cursor;
      } while (cursor);
      out.sort((a, b) => b.ts - a.ts);
      return json({ count: out.length, stories: out }, 200, origin);
    }

    // ===== POST /admin/story — publish (ok:true), unpublish (ok:false), or
    // remove a story, identified by (place, ts) =====
    if (request.method === 'POST' && url.pathname === '/admin/story') {
      const adminKey = request.headers.get('X-Admin-Key');
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return json({ error: 'unauthorized' }, 401, origin);
      }
      let body;
      try { body = await request.json(); }
      catch (_) { return json({ error: 'invalid json' }, 400, origin); }
      const place = clean(body.place, 120).toLowerCase().replace(/[^a-z0-9/_-]/g, '');
      const ts = Number(body.ts);
      if (!place || !ts) return json({ error: 'bad place/ts' }, 400, origin);
      const key = `lb:${place}`;
      const v = await env.POLLS.get(key);
      if (!v) return json({ error: 'no such place' }, 404, origin);
      let rec;
      try { rec = JSON.parse(v); } catch (_) { return json({ error: 'corrupt record' }, 500, origin); }
      const idx = (rec.stories || []).findIndex(s => s.ts === ts);
      if (idx < 0) return json({ error: 'no such story' }, 404, origin);
      if (body.remove) rec.stories.splice(idx, 1);
      else rec.stories[idx].ok = !!body.ok;
      await env.POLLS.put(key, JSON.stringify(rec));
      return json({ ok: true, place, ts, action: body.remove ? 'removed' : (body.ok ? 'published' : 'unpublished') }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/admin/recent') {
      const adminKey = request.headers.get('X-Admin-Key');
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return json({ error: 'unauthorized' }, 401, origin);
      }
      // KV lists keys in ascending (oldest-first) order, so a plain limit:50
      // returns the FIRST 50 ever and silently hides everything newer. Walk the
      // whole prefix, then keep the newest 50.
      let cursor;
      const names = [];
      do {
        const page = await env.POLLS.list({ prefix: 'submission:', cursor, limit: 1000 });
        names.push(...page.keys.map((k) => k.name));
        cursor = page.list_complete ? null : page.cursor;
      } while (cursor);
      const out = [];
      for (const name of names.slice(-50).reverse()) {
        const v = await env.POLLS.get(name);
        if (v) out.push(JSON.parse(v));
      }
      return json({ count: out.length, total: names.length, submissions: out }, 200, origin);
    }

    return json({ error: 'not found' }, 404, origin);
  }
};
