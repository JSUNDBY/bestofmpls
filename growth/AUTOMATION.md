# Best of MPLS — Growth-Automation Blueprint

From the Revenue Working Group session (Margo, Kai, Sales/Civic, chaired by Ray).
The rule that governs all of it: **automate discovery, scoring, drafting,
scheduling, and measurement. Never the post, the send, or the human yes.**

## The engine

Two proven mechanisms do the work: **GitHub Actions cron** (free, deterministic,
already runs the scrape + newsletter) for "run a script, file the output," and a
**scheduled cloud agent** for anything needing judgment (caption polish, trend
reads). Runs on their own; the human steps stay one-click.

**Runs automatically:**
- 4x/day: scrape events, refresh openings, rebuild /new, /tonight, /rightnow (live)
- Weekly (Mon): social pack regenerates and commits itself to `growth/social-pack.md` (LIVE — shipped)
- Weekly: openings → warm-lead pack; weak-web prospects re-scored; data-health punch list
- Monthly: lapsed-reader win-back drafted; GA4 source-to-signup report

**One-click human steps (never automated):**
- POST to IG/TikTok (your tap, or a scheduler you authorize once)
- SEND the newsletter and any outreach (drafts land ready; you press send)
- The CALL / the yes (Icehouse, Ben Johnson, press — relationships are hand-done)

## Ranked build list (leverage per effort)

1. **Enriched weak-web pitch list** — score *real* web weakness per guide business
   (no site, Facebook-only, PDF menu, not mobile) via Firecrawl/Places, output a
   ranked, honest prospect list. The blank "First 10" in SALES-KIT, filled. Needs
   the live web lookup so it doesn't cold-email businesses with great sites. **Next build.**
2. **Social pack to repo** — `social-ideas.js` runs Monday, commits a paste-ready
   pack (caption + tags + shot list + post slot per concept). **SHIPPED.**
3. **Newsletter → Beehiiv draft** — option to land a draft instead of auto-send, if
   Josh wants the review step (currently auto-sends Mondays). His call.
4. **Outreach drafts to Gmail + contact log** — per-business email citing the
   specific weakness, lands as a labeled Gmail draft; a CSV prevents re-contacting.
5. **Timely SEO page generator** — deterministic "This Weekend in {neighborhood}" /
   "{category} open now" pages from existing data. Facts only, never invented opinion.
6. **Openings → warm-lead feed** — weekly diff of new openings into the pitch pipeline.
7. **Monthly win-back + GA4 source report** — protects the 40% open rate the money
   model rests on; shows which sources convert to signups.
8. **Weekly trend/listening briefing** — cloud agent reads GSC + trends. *Blocked on
   Search Console verification still owed on both sites.*
9. **Polished captions + editorial newsletter curation** — agent rewrites in-voice,
   after the deterministic versions prove out.

## The guardrail (Carl)

Automate aggregation, never opinion. Automate drafting, never sending. Automate
measurement, never outreach. Every place the brand renders a judgment, a human
renders it, and any claimed fact assembles from our own verified data, never an
AI's invention. That unbought judgment is the only thing we can't buy back.
