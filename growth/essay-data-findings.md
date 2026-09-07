# Essay data findings: "We tracked every show in the Twin Cities"

Data pull: `src/data/events.json`, generated 2026-09-07T17:42Z. 1,421 events across 68 venues from 41 scrapers. Analysis scripts ran against the live snapshot; every stat below shows its underlying counts. Read the caveats section before quoting anything.

## Three headline-stat candidates

1. **Sunday is a bigger show night than Thursday, and it nearly ties Friday.** Over the next 90 days: Friday averages 15.3 shows per night, Sunday 15.0, Thursday 14.1. The "weekend" in this town runs Friday through Sunday at near-equal intensity, then falls off a cliff into Monday (7.4). Counterintuitive because everyone assumes Sunday is a dead night.
2. **The single busiest stage in the Twin Cities calendar is a supper club in Fridley.** Crooners has 155 listed shows, more than the Guthrie (136), Orchestra Hall (120), or any First Avenue room. A suburb nobody puts on a "music city" map out-programs every downtown venue, one night at a time.
3. **Monday belongs to the regulars.** Monday has the fewest events (101 upcoming), but it is the 331 Club's single busiest night (13 Monday shows, led by the Roe Family Singers' long-running residency), and 1 in 5 Monday events is a film (20 of 101, vs 11% of the whole calendar). Monday isn't quiet, it's specific: residencies and repertory cinema.

Backup candidates: 45% of all listings come from just 5 venues (637 of 1,421); the median advertised ticket among price-listing venues is $25; 7:00pm is the start time of 28% of all timed shows (313 of 1,117).

## Corpus overview

- **Total events:** 1,421
- **Structure:** 1,411 dated single-night shows + 10 multi-day runs/exhibitions (`end_date` differs from `date`)
- **Forward-looking:** 1,408 dated shows on or after 2026-09-07, spanning **2026-09-07 to 2027-07-17**
- **Distinct venues:** 68 total, 64 with upcoming dated shows
- **Categories (all events):** music 833, performance 302, film 152, lecture 63, sports 48, art 15, festival 8
- **Cities:** Minneapolis 1,129 · St. Paul/Saint Paul 236 (two spellings in the data) · Prior Lake 28 (Mystic Lake) · 15 suburban library/other listings · 5 null

Volume decays with horizon (booking lead time, not a real drop):

| Month | Shows |
|---|---|
| 2026-09 | 533 |
| 2026-10 | 426 |
| 2026-11 | 211 |
| 2026-12 | 119 |
| 2027-01 | 38 |
| 2027-02+ | 79 |

Any "shows per week" claim should use the 90-day window (2026-09-07 to 2026-12-06, 1,198 shows, ~93/week), not the thin far tail.

## Nights of the week

90-day window (each weekday occurs exactly 13 times, so raw counts are directly comparable):

| Night | Shows | Avg/night |
|---|---|---|
| Monday | 96 | 7.4 |
| Tuesday | 121 | 9.3 |
| Wednesday | 155 | 11.9 |
| Thursday | 183 | 14.1 |
| Friday | 199 | 15.3 |
| Saturday | 249 | 19.2 |
| Sunday | 195 | 15.0 |

- Saturday is 2.6x Monday.
- Sunday (15.0/night) beats Thursday (14.1) and sits within 2% of Friday (15.3). Same ordering holds over all 1,408 future shows: Sat 307, Fri 235, Sun 226, Thu 214, Wed 177, Tue 148, Mon 101.
- The real quiet nights are Monday and Tuesday, not Sunday.

## Busiest upcoming dates

| Date | Day | Events |
|---|---|---|
| 2026-09-26 | Sat | 37 |
| 2026-09-19 | Sat | 34 |
| 2026-09-12 | Sat | 32 |
| 2026-09-25 | Fri | 31 |
| 2026-09-13 | Sun | 28 |
| 2026-09-18 | Fri | 28 |
| 2026-09-27 | Sun | 27 |
| 2026-09-10 | Thu | 26 |
| 2026-09-24 | Thu | 25 |
| 2026-10-10 | Sat | 25 |

Sept 26 (37 events) is the busiest night in the corpus. Note these skew toward September because far-out months are under-booked (see decay table); "busiest night of fall" is the honest framing.

## Price analysis

**Coverage is the story's weak leg.** 1,184 of 1,421 events (83.3%) have no price field at all. Of the 237 with a price string:

- 90 are free ("Free" x 87, plus $0-floor ranges like "$0–$15")
- 147 are paid with a parseable dollar amount
- 0 non-empty strings were unparseable (the scrapers normalize well; parse regex: `\$\d+(\.\d{1,2})?`, "free" case-insensitive)

Only a handful of sources emit prices: Crooners (154 of the 237), Icehouse (27), Hennepin County libraries (~50, all free), plus scattered gallery/bandshell listings. So price stats describe *venues that advertise prices*, not the whole scene. Do not write "38% of Twin Cities shows are free" (90 of 237) — the denominator is biased.

Paid, parseable (n=147, using the low end of each advertised range):
- Min $10, **median $25**, mean $27.95, max $60. Quartiles $25 / $25 / $30.
- By category: only music has priced events (n=147, median $25) — no other category clears the bar.
- By venue (min 10 priced events, only 2 qualify):
  - **Crooners Supper Club:** n=123, median $30, range $10–$60
  - **Icehouse:** n=24, median $15, flat $15 across the board

Free-venue patterns:
- **Every Hennepin County Library event is free** (51 of 51 across 18 branches).
- **Crooners lists 31 free shows of 155** (20%) — mostly piano-lounge sets.
- White Squirrel Bar (112 shows) and The 331 Club (75) list no prices, but both are known free-show bars; if counted as free, the free share of the calendar jumps dramatically. Flag for editorial verification before claiming it.

## Venue league table (top 20 by listings)

| # | Venue | Events | Dominant category |
|---|---|---|---|
| 1 | Crooners Supper Club | 155 | music |
| 2 | Guthrie Theater | 136 | performance |
| 3 | Orchestra Hall | 120 | music |
| 4 | Trylon Cinema | 114 | film |
| 5 | White Squirrel Bar | 112 | music |
| 6 | The 331 Club | 74 | music |
| 7 | The Parkway Theater | 62 | performance 43 / film 19 |
| 8 | Orpheum Theatre | 61 | performance |
| 9 | Berlin | 59 | music |
| 10 | State Theatre | 43 | performance 32 / music 11 |
| 11 | Grand Casino Arena | 43 | sports 27 / music 12 |
| 12 | Amsterdam Bar & Hall | 41 | music |
| 13 | Icehouse | 27 | music |
| 14 | The Fillmore Minneapolis | 26 | music |
| 15 | Varsity Theater | 25 | music |
| 16 | Pantages Theatre | 23 | performance |
| 17 | Dakota Jazz Club | 22 | music |
| 18 | 7th St Entry | 22 | music |
| 19 | Fine Line | 19 | music |
| 20 | Mystic Showroom | 19 | music |

- **Concentration:** top 5 venues hold 637 of 1,421 listings (45%).
- **Trylon** (a ~90-seat volunteer-run cinema in Longfellow) out-programs every rock club in town — 114 screenings, #4 overall. Great underdog stat.
- **Most expensive by median:** Crooners ($30 median). **Cheapest paid:** Icehouse (flat $15).
- **All-free venue:** Hennepin County Library system (51/51 free).
- First Avenue & affiliates contribute 315 events as a *source*, but split across rooms (7th St Entry 22, Fine Line 19, Turf Club, Mainroom, Palace, Fitzgerald, etc.) — no single First Ave room cracks the top 15. Empire vs. single-stage framing available here.

## Neighborhood density

First segment of `venue_neighborhood`, with Crooners' room names folded into one venue (the raw data uses its room names — "Dunsmore Jazz Room", "Main Stage Showroom", "Maggie's Piano Lounge", "The Belvedere" — as neighborhoods; caveat below):

| Neighborhood | Events |
|---|---|
| Downtown Minneapolis | 397 |
| Fridley (Crooners) | 155 |
| Mill District | 146 |
| Longfellow | 114 |
| West End (St. Paul) | 112 |
| Northeast Minneapolis | 79 |
| Downtown St. Paul | 64 |
| Standish | 63 |
| "Downtown" (unqualified) | 38 |
| North Loop | 35 |
| Prior Lake (Mystic Lake) | 28 |
| Whittier | 27 |
| Dinkytown | 25 |
| Warehouse District | 19 |
| Standish-Ericsson | 18 |
| Hamline-Midway | 18 |

- Downtown Minneapolis holds ~28% of everything.
- **Longfellow (114) and Standish (63+18) are almost entirely one venue each** (Trylon; Parkway + others) — single-venue neighborhoods punching absurdly above their weight.
- St. Paul total (~236) is about a fifth of Minneapolis (~1,129) — partly real, partly scraper coverage (see caveats).

## Category mix by night (future dated shows)

| Night | music | perf | film | lecture | sports | fest | art | total |
|---|---|---|---|---|---|---|---|---|
| Mon | 65 | 3 | 20 | 9 | 4 | 0 | 0 | 101 |
| Tue | 82 | 29 | 23 | 7 | 6 | 0 | 1 | 148 |
| Wed | 109 | 43 | 14 | 8 | 3 | 0 | 0 | 177 |
| Thu | 124 | 38 | 15 | 28 | 6 | 0 | 3 | 214 |
| Fri | 158 | 49 | 17 | 1 | 6 | 4 | 0 | 235 |
| Sat | 165 | 82 | 33 | 8 | 14 | 4 | 1 | 307 |
| Sun | 127 | 57 | 30 | 2 | 9 | 0 | 1 | 226 |

- **Thursday is lecture night:** 28 of 63 lectures (44%) land on Thursday; Friday has exactly 1.
- **Monday is film-heavy:** 20% of Monday events are films vs 11% overall (Trylon and Parkway repertory programming).
- **Theater (performance) collapses on Monday:** 3 events — the industry's dark night, visible in the data.
- No "Monday jazz night" signal at the category level (data has no genre tags), but venue-level rhythms exist: 331 Club peaks on Monday (13); White Squirrel's Monday (16) is its #3 night; Trylon peaks Sunday (30); Berlin peaks Friday (20); Crooners peaks Sunday (32).
- 7:00pm is the modal start time: 313 of 1,117 timed shows (28%). 85 shows start at 1:00pm (matinees).

## Corpus growth (git history — coverage growth, not scene growth)

`git log --follow` gives 27 snapshots from 2026-05-03 to 2026-09-07:

| Snapshot | Events | Venues |
|---|---|---|
| 2026-05-03 | 137 | 9 |
| 2026-05-28 | 453 | 18 |
| 2026-06-26 | 895 | 35 |
| 2026-07-11 | 1,179 | 46 |
| 2026-08-31 | 1,148 | 54 |
| 2026-09-07 | 1,421 | 68 |

This measures *scraper coverage* growing (9 venues to 68 in four months), not the scene changing. Usable as a meta stat ("we went from tracking 9 venues to 68") but not for longitudinal claims about the scene itself. All scene analysis above uses the current snapshot's forward calendar.

## Data-quality caveats (put a version of these in the essay)

1. **Coverage, not census.** 41 scrapers, 68 venues. Notable gaps: the Cedar's scraper failed this run (503, 0 events); Hook & Ladder, Aster Cafe, Bryant-Lake Bowl, Bauhaus, MN History Center, Westminster returned 0. `docs/VENUE-AUDIT.md` listed 26 known venues with no scraper as of 2026-09-04. Any superlative should say "of the venues we track."
2. **Sports are included:** 48 pro home games (Grand Casino Arena 27, Target Field 9, U.S. Bank Stadium 9, Target Center 3). Decide whether "shows" includes them; excluding sports changes Saturday by up to 14 events.
3. **Multi-showtime days look like duplicates but aren't:** 87 title+date+venue groups have multiple entries, all with distinct start times (Trylon double screenings, Guthrie matinee+evening). Zero true duplicates (same title+date+venue+time) found. Per-day event counts therefore count *performances*, not *productions*.
4. **Crooners' `venue_neighborhood` holds room names, not neighborhoods** (Dunsmore Jazz Room, etc.). Folded into "Fridley (Crooners)" here; fix upstream if neighborhood pages use this field.
5. **Price data covers only ~17% of events**, dominated by one venue (Crooners = 65% of priced listings). Fine for "at venues that post prices" framing; wrong for scene-wide price claims. Big-room Ticketmaster shows carry no price.
6. **"St. Paul" vs "Saint Paul"** both appear in `city` (198 + 38). Merge before quoting city splits.
7. **Six past-dated events** (long-running gallery shows keyed to opening date) and 10 multi-day runs were excluded from night-of-week math.
8. **Booking-horizon decay:** months beyond ~60 days out are under-populated. Never compare month-over-month volume within this snapshot.
9. **Canceled shows:** the pipeline added canceled-show guards (commit f4a1503) but individual listings aren't re-verified here; a handful of cancellations may persist.

## Reproduction

Analysis script: `/private/tmp/claude-501/-Users-joshsundby-Desktop-Karpathy-Karpathy/370839de-9672-46b7-ba74-e9490235e704/scratchpad/analyze.py` (throwaway; rerun against `src/data/events.json`). Price parser: dollar amounts via regex on the price string, low end of ranges used for medians, "free"/"$0" flagged free. Weekday normalization: each weekday occurs exactly 13 times in the 2026-09-07 to 2026-12-06 window.
