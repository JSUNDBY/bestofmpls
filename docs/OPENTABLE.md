# OpenTable reservation affiliate rail

Status: **plumbing ready, not earning.** Verified Aug 2026.

## The honest read first

This rail monetizes reservation clicks that go to OpenTable. Right now the
dataset has **one** OpenTable restaurant (Char Bar). The Twin Cities fine-dining
scene runs on **Resy and Tock, which have no public affiliate program.** So even
with perfect tracking, this rail earns close to nothing until the reservation
inventory grows, and its ceiling is capped by how few local rooms use OpenTable.

Treat this as insurance, not a revenue lever. The real passive levers are
audience size (traffic + email list) and the on-manifesto products. See
`growth/SELLABILITY.md`.

## What's built

`scripts/build.js` appends a tracking param to any `reservation:` URL that
points at `opentable.com`. It only touches OpenTable links, handles URLs that
already have query params, and is a no-op when no ref is set. Resy/Tock/Yelp
links pass through untouched.

The ref is read from an environment variable, so nothing sensitive lives in git:

```js
const OPENTABLE_AFFILIATE_REF = process.env.OPENTABLE_AFFILIATE_REF || '';
```

## To turn it on (your steps — account actions are yours, not Claude's)

1. Apply to OpenTable's affiliate/partner program. As of Aug 2026 this is run
   mostly through OpenTable's own partner portal (historically also Impact.com).
2. On approval, note the **exact link format** they give you. Two cases:
   - **A ref id** (a value you append as `?ref=...`): set it and you're done.
   - **An Impact-style tracking link** (a redirect through an impact gateway
     with a `u=<encoded destination>` deep-link param): the append logic in
     `reservationUrl()` needs a small rewrite to build that gateway URL. Flag
     it and Claude will update the function.
3. In Cloudflare Pages → the bestofmpls project → Settings → Environment
   variables, add `OPENTABLE_AFFILIATE_REF` = your ref id (Production).
4. Trigger a redeploy. Every OpenTable reserve button now carries your ref.

## To make it actually worth anything

Grow OpenTable reservation inventory. When adding or editing restaurants in
`src/data/restaurants.js` (and the cuisine files), add a real `reservation:`
OpenTable URL **only where the restaurant genuinely books through OpenTable** —
never invent one. Most premium MPLS rooms are Resy, so the addressable set is
small by nature. Reader utility is the main reason to add these links; the
affiliate cents are a bonus.
