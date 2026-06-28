# The Living Best of MPLS — design spec

> Not built yet. This is the mechanism design for review before any code.

## The idea
The only city "best of" that's **alive**. Every other one (MSP Mag's readers' poll,
the Infatuation's critic verdict) is frozen: decided once, stale for a year. This
one is a continuously-updated, transparent read of what's essential in the metro
**right now**, built from what people actually do, who keeps going back, and the
moments places give them. It shows its work, and it changes as the city changes.

## Why it can't be copied
- It runs on live behavior + freshness, the moat the competitive teardown
  identified. The incumbents are frozen snapshots; they have no live data.
- It blends three things no award combines: **intent** (#1), **loyalty**
  (#2 Regulars), and **meaning** (#3 Stories).
- It's transparent (shows *why* each place is there) and never goes stale.

## The signals (what feeds the score)
All captured honestly through the existing Cloudflare worker (the /vote pattern).
No invented data, ever.

| Signal | What it means | Weight | Source |
|---|---|---|---|
| **Save / "I'd go"** | interest | 1 | new button on each spot |
| **Regular / "I go here"** | loyalty (the #2 idea) | 3 | new button on each spot |
| **Get directions tapped** | real visit intent | 1 | beacon on the existing directions button |
| **Story shared** | meaning (the #3 idea) | 5, and it **publishes** | new "share a moment" form |
| **Nomination / vote** | endorsement | 2 | existing /vote endpoint |
| **Verified accolade** | quality floor/boost | editorial | from our data (James Beard, etc.) |

**Time-decay is the key.** Every signal decays with age (~90-day half-life), so the
ranking reflects *now*, not all-time. Decay is what makes it living instead of a
leaderboard the same five places win forever.

## The score
`score(place) = Σ ( weight × decay(age) ) + accoladeBoost`

Per category, the current leader is "Best of MPLS, right now," shown **with the
breakdown** ("9 regulars · 4 saves · 2 stories · James Beard winner") and the
runners beneath. The breakdown is the trust: you can see exactly why it's there.

## Where people participate
Every spot's page gets three small actions: **Save · I'm a regular · Share a
moment.** That turns every entry page into a participation point, which fills the
engagement / list-growth gap the competitive analysis flagged. Stories publish
under the place (and become genuinely good local content).

## How it stays live but stays simple
The worker accumulates signals (KV/D1, exactly like votes). The existing 4x/day
build reads the tallies and renders the current standings, "updated 4x a day."
(True real-time via a client fetch is a later option; the rebuild cadence already
feels alive and keeps the static-site simplicity and speed.)

## Cold start (the honest hard part)
Day one has no behavior. We seed the baseline with **verified accolades + the 18
research recs + existing votes**, so it launches credible, then real signals
reshape it over the following weeks. Thin categories show "still gathering signal"
rather than a shaky winner.

## Anti-gaming + honesty
- One save / one regular per person per place (localStorage + worker IP
  rate-limit). Stories are moderated before they publish.
- It's a read of *engaged-reader behavior*, stated plainly, not a scientific
  census of the metro. That honesty is the brand, and it's the opposite of the
  pay-to-play "best of" world.

## Build phases
1. **Worker:** `/signal` endpoint (save, regular, directions, story) + storage +
   tallies + `/admin` view. Beacon the directions button.
2. **Site:** the three action buttons on entry pages + the story form.
3. **Build:** scoring function reads tallies + accolades, renders standings into
   the (re-enabled) Best of page and a live "standing" line on each entry. Seed
   the cold start.
4. **Stories:** display + a moderation flow (reuse the /tip + /admin pattern).

## Name (to pick)
- The Living Best of MPLS
- Best of MPLS, Live
- Right Now — the metro's living best of
- The Pulse

## Locked direction (Josh)
1. **It's the organizing principle, rolled out over time.** Ship the Best-of page
   first, but build the engine as a reusable core that can later power Tonight,
   the map, neighborhoods, the whole site.
2. **Light identity, no friction.** Start anonymous; design toward "my regulars /
   my saves." (How, below.)
3. **Editorial curates, the automation stays unbiased.** Josh keeps as much
   curatorial control as possible; the score itself is never hand-weighted. The
   two are layered, not mixed (How, below). "Live" is not the brand yet, but the
   freshness and the by-the-people nature must be visible: show how often it
   updates and how many locals shaped it. Fresh, for the people, by the people.

## How light identity works
- **Layer 0 — anonymous device (day one, zero friction):** each browser gets a
  random ID in localStorage. Their saves/regulars are remembered on that device;
  one save / one regular per device per place. They just tap, no login. This is
  how "my saves / my regulars" works from the start (per device).
- **Layer 1 — optional passwordless link (later):** if they want their saves to
  follow them across devices, they enter an email and get a magic link. No
  passwords, minimal data, fully optional. Bonus: that opt-in grows the newsletter
  list with real consent.
- Privacy: the device ID is anonymous, the only thing tied to it is their own
  saves; email only if they choose it.

## How editorial control + unbiased automation coexist (layered, not mixed)
- **The score is pure signal.** Computed only from real actions + time-decay,
  transparent, never hand-tuned per business, and the paid `featured` flag never
  touches it. That's the "not skewed in any way" part.
- **Editorial wraps around it, never inside the math:**
  - *Eligibility & categories* — Josh curates what's in the pool.
  - *Veto / hide* — Josh can remove what's wrong, closed, or off-register.
  - *Editor's note* — Josh's voice appears alongside a standing as a clearly
    separate, labeled note, never as a thumb on the ranking.
- So Josh curates heavily (pool, framing, notes, veto) while the ranking stays
  honest and unbought.

## How freshness + "by the people" is shown
- Every standing carries "Updated [date] · shaped by [N] locals this season" and a
  "how this works" link (shows its work). The cadence and the participation are
  always visible, without renaming the brand to "live."

## Build phases
1. **Engine core** — worker `/signal` endpoint + storage + per-device dedup; the
   scoring function (decay) in the build; cold-start seed (accolades + the 18 recs
   + existing votes). Reusable, keyed by place id so any surface can read it.
2. **Participation UI** — Save · I'm a regular · Share a moment on entry pages
   (anonymous device id); directions beacon; story form + moderation.
3. **The page** — re-enable Best of, rendered from the living score, with the
   freshness/“shaped by N locals” line, the shows-its-work breakdown, and room
   for editor's notes; a per-entry standing line.
4. **Roll across the site** — surface standings on Tonight, the map, neighborhoods.
5. **Later** — optional passwordless identity for cross-device + list growth.
