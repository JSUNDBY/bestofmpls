# AEO visibility tracking

Monthly check of whether bestofmpls.com surfaces in search and answer engines
for its eight target queries. Run on the 5th of each month by the
aeo-visibility-check scheduled task (this first entry ran interactively).
Method: WebSearch per query, record presence, position, and who wins instead.
The point is the trend line, not any single month.

## August 5, 2026

| Query | Seen? | Position | Who wins |
|---|---|---|---|
| best restaurants in Minneapolis | No | - | Saveur, OpenTable, MSP Mag (50 Best), DeRusha |
| best pizza Minneapolis | No | - | Minnesota Monthly, venue sites (Luce, Black Sheep, Lola), Axios TC, UberEats |
| what to do in Minneapolis tonight | No | - | Yelp, AllEvents, Star Tribune calendar, Eventbrite, Ticketmaster |
| best patios Twin Cities | No | - | Star Tribune (60-patio guide), Yelp, Explore MN, MinnPost, MSP Mag |
| things to do this weekend Minneapolis | No | - | AllEvents, Fever, Eventbrite, Ticketmaster, Family Fun TC |
| best cocktail bars Minneapolis | No | - | Minnesota Monthly, Yelp, venue sites, Madison in MPLS |
| Jucy Lucy Minneapolis where to get one | No | - | Meet Minneapolis, Wikipedia, The Infatuation, Matt's Bar, Discover The Cities |
| art gallery shows Minneapolis | No | - | Meet Minneapolis, Explore MN, Walker, MPLSART, Racket |

Flat against July. Zero for eight both months, no query where we newly appeared
and none where we disappeared, since we were never in. One month is not enough
time for the AEO layer and the Notes essays that shipped July 5 to register, so
this is the expected read, not a bad one.

Two things moved underneath the scoreboard. The event queries got more crowded,
not less: AllEvents and Fever pushed into the tonight and weekend results where
Meet Minneapolis used to sit alone, which means the aggregator lane we called
most winnable is filling up with thin auto-generated listings. That cuts both
ways. They are easy to beat on quality and hard to beat on volume. On the
gallery side MPLSART lost its outright grip and Racket showed up with a
beginner's guide, which is the first sign that a well-written editorial piece
can crack a lane that listings owned. The Jucy Lucy row still has Wikipedia and
Meet Minneapolis locked at the top and our essay has not surfaced. Watch that
one again in September before deciding whether the essay strategy needs more
than patience.

## July 5, 2026 — baseline

| Query | Seen? | Position | Who wins |
|---|---|---|---|
| best restaurants in Minneapolis | No | - | MSP Mag, Time Out, Saveur, OpenTable, DeRusha |
| best pizza Minneapolis | No | - | Minnesota Monthly, Discover The Cities, venue sites, Facebook groups |
| what to do in Minneapolis tonight | No | - | Meet Minneapolis, Eventbrite, Yelp, Ticketmaster, MSP Mag calendar |
| best patios Twin Cities | No | - | Star Tribune (60-patio guide), MSP Mag, Explore MN, Minnesota Monthly |
| things to do this weekend Minneapolis | No | - | Meet Minneapolis, Eventbrite, Star Tribune, SeatGeek, Family Fun TC |
| best cocktail bars Minneapolis | No | - | Minnesota Monthly, personal blogs, venue sites, Yelp |
| Jucy Lucy Minneapolis where to get one | No | - | Meet Minneapolis, Discover The Cities, The Infatuation, Axios TC, Wikipedia |
| art gallery shows Minneapolis | No | - | MPLSART.COM (dominant), Meet Minneapolis, Walker, Mia, Explore MN |

Zero for eight. Expected: the domain is about two months old and the AEO layer
(llms.txt, AI-crawler allows, dateModified, WebSite schema) plus the Notes
essays shipped the same day as this baseline. Nothing here reflects those yet.

Reads worth acting on:

- The tonight/weekend queries are won by calendars and aggregators, not
  editorial. Our /tonight/ and /this-weekend/ are structurally better answers
  (curated, dated, schema'd); this is the most winnable lane.
- The Jucy Lucy query is exactly what the new /notes/jucy-lucy/ essay targets.
  Watch this row: it is the cleanest test of whether the essay strategy works.
- MPLSART.COM owns the gallery lane outright. They are a listings peer, not
  press; worth studying and possibly befriending rather than fighting.
- Every food query has a "one local's favorites" personal blog ranking. Google
  clearly rewards the independent-local angle we already have; authority
  (mentions, links) is what is missing, and only real-world citations fix that.
