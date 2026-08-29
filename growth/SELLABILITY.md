# bestofmpls: the path to value (and, someday, a sale)

Written Aug 2026. Supersedes the monetization framing in `PLAN.md` where they
disagree. This is the plan we're actually running.

## The decisions we locked

- **Keep the no-ads, no-affiliate promise.** It's on the `/partner/` page and in
  the MANIFESTO. Josh's north star: "blow up in a good way, but don't be trash."
  Generic display ads are the trash. They'd earn little at this scale and cheapen
  the premium, trustworthy feel that is the actual product. Locked.
- **Passive-first. No cold selling.** Josh works behind the camera and won't run
  a listings outreach motion. Revenue has to come from inbound, products, and
  audience, not phone calls.
- **Exit horizon: open.** Not building for a fast flip. Build the durable
  foundation that raises value whether he holds or sells later.

## How a site like this is valued

Content and local sites sell for roughly **2.5–3.5x annual net profit**
(35–45x monthly). Buyers pay the premium for three things, in order:

1. **Recurring revenue** (subscriptions, listings) over one-time.
2. **Diversified traffic** (not one Google update from zero).
3. **Low owner-dependence** (documented, automatable, an owned email list that
   transfers).

The uncomfortable truth: the sale price is paid on transferable cash flow and
owned audience, **not** on traffic volume or editorial quality alone, and **not**
on Josh's services income (that's him, not the asset — it funds the build).

## The binding constraint right now

It is **audience size**, not the monetization mechanism. At current scale no
rail earns much. So the highest-ROI work is growing reach and the owned list;
revenue rails are plumbing that pays off once the audience is there.

## The plan, in priority order

### 1. The traffic engine (the whole game, given passive-first)
Passive revenue scales with pageviews, so traffic *is* the business model.
- **Seasonal tentpole pages.** `/state-fair/` (shipped Aug 2026) is the template:
  a page that owns a huge recurring search spike and gets refreshed yearly.
  Build the calendar behind it: Twin Cities Marathon, Holidazzle, holiday
  markets, U of M move-in, Pride, Art-A-Whirl, an evergreen "this weekend."
- **Deepen head terms already ranking** (read Search Console, double down) and
  scale the category×neighborhood long-tail (`MIN_CROSS` lever in build.js).
- **The live calendar is the moat** — the return-visit engine a static guide
  can't copy. Keep it fed and reliable.
- **Off-Google top of funnel:** the faceless short-form video engine
  (`scripts/social-ideas.js`) → IG / TikTok / YouTube Shorts. Traffic
  diversification is worth a premium at sale.

### 2. The owned email list (the biggest value multiplier)
- Strengthen email capture on every high-traffic page.
- Ship the weekly "what's on" newsletter (`scripts/send-newsletter.js` exists;
  `newsletter_signup` GA event is wired). The list survives algorithm changes,
  monetizes passively (sponsorship), and transfers cleanly to a buyer.

### 3. On-ethic recurring revenue (what the MANIFESTO blesses)
The manifesto's sanctioned money: "civic sponsorships, memberships, seasonal
city guides, curated ticketing, city packs, neighborhood maps, cultural
memberships, trusted recommendations." Passive-compatible subset:
- **Inbound featured listings** (marked, `featured` flag built) — recurring,
  self-serve via the `/partner/` page, warm/inbound only.
- **Newsletter sponsorship** — once the list is real (needs size + 40%+ open).
- **Reader membership** — a "friends of bestofmpls" supporter tier. Passive
  recurring that *reinforces* the no-ads promise.
- **Digital products** — curated ticketing bundle, city pack, neighborhood map.
  Higher upside, more build, fully on-brand.

### 4. OpenTable reservation affiliate (insurance, not a lever)
Plumbing ready (env-var ref, one field from live). But inventory is one
restaurant and the metro runs on Resy (no program), so it earns ~$0 today.
See `docs/OPENTABLE.md`. Don't expect money here.

## The next 90 days
1. Build 3–4 more seasonal tentpoles behind the State Fair.
2. Strengthen email capture + get the weekly newsletter actually shipping.
3. Start the short-form video cadence (off-Google reach).
4. Stand up the inbound listings path + a membership tier so there's a
   recurring-revenue story forming.
Everything documented so it's transferable. A real P&L — even a small one —
turns "nice site" into "asset with a story," which is what makes any later
sale decision concrete instead of hypothetical.
