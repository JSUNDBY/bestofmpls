# Venue coverage audit

Generated 2026-09-04 by `scripts/venue-audit.js` from the current events feed
(1371 upcoming events across 58 feed venues).
Re-run any time; this file is overwritten.

## Covered — directory venues with schedules (12)

| Venue | Guide category | Upcoming events |
|---|---|---|
| Guthrie Theater | Theaters | 133 |
| Trylon Cinema | Arthouse Cinemas | 120 |
| The 331 Club | Live Music | 77 |
| Berlin | Live Music | 65 |
| First Avenue & 7th St Entry | Live Music | 61 |
| Cedar Cultural Center | Live Music | 50 |
| Riverview Theater | Arthouse Cinemas | 36 |
| Icehouse | Live Music | 29 |
| Varsity Theater | Live Music | 24 |
| Dakota Jazz Club & Restaurant | Live Music | 22 |
| The Fine Line Music Cafe | Live Music | 21 |
| Palace Theatre | Live Music | 3 |

## In the guide but SILENT — no events in the feed (26)

These are listed as places, but readers see no schedule. Each is either
scrapeable (a gap to close), genuinely between shows, or not a calendar
venue at all (galleries handled via /now-showing/, cinemas via showtimes).

- The Armory (Live Music)
- The Hook and Ladder Theater (Live Music)
- Aster Cafe (Live Music)
- Skyway Theatre (Live Music)
- Fitzgerald Theater (Live Music)
- Children’s Theatre Company (Theaters)
- Penumbra Theatre (Theaters)
- Mixed Blood Theatre (Theaters)
- Brave New Workshop (Dudley Riggs Theatre) (Theaters)
- Theater Latté Da (Theaters)
- Park Square Theatre (Theaters)
- Open Eye Theatre (Theaters)
- Pillsbury House Theatre (Theaters)
- History Theatre (Theaters)
- Northrup King Building (Arts Buildings)
- Casket Arts Building (Arts Buildings)
- California Building (Arts Buildings)
- Solar Arts Building (Arts Buildings)
- Grain Belt Bottling House (Arts Buildings)
- Tilsner Artists' Lofts (Arts Buildings)
- Lowertown Artist Lofts (Arts Buildings)
- Heights Theater (Arthouse Cinemas)
- Parkway Theater (Arthouse Cinemas)
- Mann Edina 4 (Arthouse Cinemas)
- Capri Theater (Arthouse Cinemas)
- Walker Art Center cinema (Arthouse Cinemas)

## Not in the guide at all — metro majors to consider

- The Fillmore Minneapolis
- Uptown Theater
- Xcel Energy Center
- Target Center
- US Bank Stadium
- The Cabooze
- Green Room
- Uptown VFW
- Mortimer's
- Palmer's Bar
- Myth Live
- Mystic Lake
- Treasure Island
- O'Gara's
- Hook & Ladder
- Surly Festival Field
- The Loft at Barfly
- Granada Theater

## Every venue currently in the feed

- 300 Washington Ave SE, Minneapolis, MN 55455 (1)
- 7th St Entry (24)
- Amsterdam Bar & Hall (42)
- Berlin (65)
- Coffman Memorial Union Theater (1)
- Crooners Supper Club (154)
- Dakota Jazz Club (22)
- David Petersen Gallery (1)
- Dudley Riggs Theatre (9)
- Fine Line (21)
- First Avenue (15)
- General Admission (5)
- Grand Casino Arena (1)
- Guthrie Theater (133)
- Hennepin County Library (6)
- Hennepin County Library, Brookdale (1)
- Hennepin County Library, East Lake (2)
- Hennepin County Library, Eden Prairie (1)
- Hennepin County Library, Edina (2)
- Hennepin County Library, Golden Valley (3)
- Hennepin County Library, Hopkins (2)
- Hennepin County Library, Maple Grove (1)
- Hennepin County Library, Maple Plain (2)
- Hennepin County Library, Minneapolis Central (12)
- Hennepin County Library, Nokomis (8)
- Hennepin County Library, North Regional (1)
- Hennepin County Library, Pierre Bottineau (1)
- Hennepin County Library, Plymouth (2)
- Hennepin County Library, Rogers (3)
- Hennepin County Library, St. Louis Park (1)
- Hennepin County Library, Sumner (1)
- Hennepin County Library, Washburn (1)
- Highpoint Center for Printmaking (2)
- Icehouse (29)
- Lake Harriet Bandshell (6)
- Midway Contemporary Art (1)
- Orchestra Hall (120)
- Ordway Concert Hall (7)
- Orpheum Theatre (61)
- Palace Theatre (3)
- Pantages Theatre (23)
- Pryes Stage at Schilling Amphitheater at the West End (2)
- Riverview Theater (36)
- SooVAC (2)
- State Theatre (41)
- TOA Presents (1)
- Target Atrium, Orchestra Hall (3)
- The 331 Club (77)
- The Cedar Cultural Center (50)
- The Fitzgerald Theater (6)
- The Loft Literary Center (10)
- The M (Minnesota Museum of American Art) (1)
- The Parkway Theater (62)
- Trylon Cinema (120)
- Turf Club (22)
- Varsity Theater (24)
- Walker Art Center (1)
- White Squirrel Bar (117)

## The scraper queue (ranked, from the 2026-09-04 audit)

DONE this session: **The Fillmore** (28 shows, plain JSON-LD; also added to the guide).

1. **The Armory** — biggest remaining music gap (8k-cap tours). Site sits
   behind a redirect/bot wall; needs the Guthrie treatment (headless Chrome).
2. **Fix the dead pair: Aster Cafe + Hook and Ladder** — both scrapers return
   zero since July; their sites likely changed shape.
3. **The theater companies** — Children's Theatre, Theater Latté Da, History
   Theatre, Penumbra, Park Square: full seasons, zero coverage. Most run
   WordPress; check each for Tribe REST or JSON-LD.
4. **Skyway Theatre** (EDM/club calendar) and **Fitzgerald** (only appears
   when First Avenue co-promotes; check their own feed).
5. **Uptown Theater** (Live Nation like the Fillmore — probably the same easy
   JSON-LD scrape) and the arena tier (Xcel, Target Center, US Bank) — arena
   listings may fit /calendar/ but would drown the board; decide framing first.

Not calendar gaps: arts buildings (open studios, covered editorially),
cinemas (showtimes handled by riverview/parkway/trylon scrapers where wired),
galleries (covered via /now-showing/).
