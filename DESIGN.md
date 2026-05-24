# bestofmpls — Design Brief

This is the canonical brief for anyone (human or AI) doing aesthetic, voice,
or UX work on the site. **Read [MANIFESTO.md](./MANIFESTO.md) first** — it
captures the *why*. This file is the visual rulebook for executing it.

**The visual register is Scandinavian municipal modernism — seasonally
aware, not winter-fetishised.** Think Helsinki transit, Stockholm
tunnelbana, Copenhagen wayfinding, the IBM Plex / Söhne family of
design-system grotesks. Not Eater, not Infatuation, not a magazine. The
site should feel like **a beloved cultural utility for Minneapolis** — a
piece of civic infrastructure people quietly rely on, not a lifestyle
publication people scroll for entertainment.

**Right now** (spring/summer) the site should metabolize: warm pavement,
patio season, bikes, river walks, late sunsets, Northeast energy, baseball,
humid dusk, music spilling into the street. Avoid: dark noir clichés,
cinematic over-stylization, fake grit, luxury minimalism, boutique-hotel
energy.

---

## 1. What this site is

**bestofmpls.com** is an independent editorial guide to Minneapolis and
Saint Paul — restaurants, bars, music venues, museums, neighborhoods,
oddities. About thirty curated categories, roughly 1,500 entries, written
in a single editorial voice.

It is not a directory. It is not a review aggregator. It is not a deals
site. The closest peers are *Eater*, *The Infatuation*, and *Racket*, with
the editorial register of a city columnist who actually lives here.

The site competes on **trust, voice, and accuracy** — not on volume,
algorithmic ranking, or scale.

---

## 2. Six rules

Every page on the site should answer all six. If a change breaks one,
the change is wrong.

1. **Recommendation over categorization. Guidance over indexing.**
   This is the deepest rule. The site is a concierge, not an
   encyclopedia. The homepage opens with the **concierge** block —
   3–4 short, opinionated, contextual picks for tonight — not a
   directory of categories. Categories and indices live BELOW the
   recommendation layer as optional exploration. If you find yourself
   building a taxonomy as a first-class UI moment, stop. Build a
   recommendation surface instead.

2. **Every page answers one question.** Homepage = "what should I do
   tonight?" `/calendar/` = "what's on this week?" `/tonight/` = "what's
   happening tonight?" Category = "where's the good X?" Entry = "should
   I go to this place?" Pages that try to answer two questions get split.

3. **No forever scrolls.** Calendar caps at 21 days. Departed is
   chronological but bounded. If a list is genuinely long, paginate or
   filter — never let it just keep going.

4. **Dark mode is a first-class citizen.** Both modes look intentional.
   No accidental white slabs at the bottom of a scroll. No muddy text in
   light mode. Footer, banners, hero bands, newsletter capture all
   stay coherent in both. **Specifically: when an element uses `var(--ink)`
   as background it WILL flip white in dark mode — use hard hex colors
   (`#0A0A0A` / `#141414`) for dark surfaces meant to stay dark.**

5. **Editorial voice, not generic UI.** "Field notes from the metro," not
   "Subscribe." "Happening tonight," not "Tonight's Events." "Departed,"
   not "Closed Listings." "The list (coming soon)," not "Join Newsletter."
   Words first; UI follows.

6. **Never lie about live data.** If the scraper failed, say so. If a
   place closed, get it out of the directory within a day. If a winter
   event is six months away, hide it in May. Stale data is worse than no
   data. Honest "the list is starting; first dispatch lands this summer"
   beats fake "subscribe to our weekly newsletter."

---

## 3. Voice & language rules

### Yes
- Editorial, declarative, second-person sparingly
- Short sentences. Fragments are fine.
- Plain, specific nouns. Real addresses, real neighborhoods.
- "The metro" as shorthand for Minneapolis + Saint Paul
- Grounded Minnesota register: calm, understated, no superlatives, no
  "best-of" hyperbole even though the site is literally called bestofmpls
- Acknowledge constraints honestly ("if you can get in," "small room, walk
  in early," "closed Sundays")

### No
- **No em-dashes anywhere in prose.** Use commas, periods, or line breaks.
- No toxic positivity, no "amazing experiences," no "delightful," no
  "perfect."
- No fabricated geography. If unsure of a neighborhood or address, say
  "Minneapolis" or "Saint Paul" generically. Never invent a street name.
- No emojis in copy. (Custom SVG glyphs are used for zodiac, tool icons,
  navigation arrows.)
- No "fly-over country" framing.
- No mystical/woo language.
- No exclamation points except in quoted source material.

---

## 4. Visual language

### Typography
- **Marquee:** Archivo Narrow (700). The compressed grotesk reserved for
  page-title-level signage moments — cover headline, section title,
  cluster title, venue hero name, event hero name, feature-banner title.
  Set ALL CAPS with -0.02em tracking. Reads as actual civic signage,
  not a tasteful publication header. This is the "loudest" face on the
  site and only appears at the most-important display moments.
- **Display:** IBM Plex Sans (600, 700). Used for entry names, secondary
  headlines, UI face. Strong sans, slight humanist warmth. No italic —
  Plex italic is not loaded and we don't fake it via fallback. Headline
  emphasis happens through weight and tracking, not slant.
- **Body:** Source Sans 3 (400, 600). Used for descriptions, intros.
- **Label:** Archivo (500, 600, 700). All-caps, wide letter-spacing
  (0.10–0.20em). Used for eyebrows, metadata, chips, dates.
- **Mono:** IBM Plex Mono (500, 600). The signature surface for any
  numeric civic data — temperatures, times, dates, station-board
  readings. Always tabular-nums. This is what gives the site its
  "departure board" register. If a number can be in mono, it should be.
- **Retired:** Playfair Display. The italic-serif editorial register
  read as lifestyle-magazine, which the site is explicitly not.

### Color tokens

**Light mode (default):** Nordic municipal — cool paper, near-black,
flat signal red. Not cream, not magazine.
```
--paper     #F4F2EC   cool paper, slight warmth (NOT cream)
--paper-2   #ECE9E1   card surface
--paper-3   #E0DCD2   deeper block
--ink       #141414   near-black, neutral undertone
--ink-soft  #4A4A48   secondary text
--ink-faint #878683   metadata, captions
--clay      #C8200F   sign red — flat, matte, civic
--rule      #141414   borders, dividers
```

**Dark mode:** Concrete + steel + sodium-vapor accent. No warm tint.
```
--paper     #0E0E10
--paper-2   #18181B
--paper-3   #24242A
--ink       #F5F4F0
--ink-soft  #B8B8B4
--ink-faint #7A7A78
--clay      #FF3825
--rule      #F5F4F0
```

**Important:** in dark mode `--ink` becomes white. Any element that
should stay a dark slab (footer, feature banner, event hero) uses a
hard `#0A0A0A` or `#141414` instead, with a dark-mode override that
nudges to `#050505` or `#141414`. Don't reach for `var(--ink)` for a
"stays dark" surface.

### Layout
- `--gutter`: ~16–24px responsive
- Max content width ~880–960px (editorial measure)
- Generous vertical rhythm — `padding: 36px+` between major sections
- Borders are 1px solid `var(--rule)`, occasionally 2px on first-in-list

### Texture
- Very subtle SVG noise grain overlay on body (`opacity: 0.022` in
  light mode, **off** in dark). Reads as municipal poster paper, not
  printed-magazine. Dark mode is clean concrete; no grain.

---

## 5. Component patterns we've established

These are working well. Don't re-invent unless there's a real reason.

- **Sticky chip nav** for filter rows (used on calendar venue chips).
  Rounded pill buttons, `is-on` = inverted bg.
- **Date-range collapse** for multi-day runs (a four-night dance piece
  reads as one row "May 13–16 · 4 nights").
- **Civic eyebrow + display headline** pattern: small all-caps clay
  eyebrow (Archivo, wide tracking), large Plex Sans bold headline
  below. The signature page opening.
- **Signature numeral pattern**: any temperature, time, or count that
  matters is set in IBM Plex Mono, weight 500–600, tabular figures.
  Reads as a station-board reading. Used on the homepage right-now
  strip, the /tonight/ hero, every event time, every venue page date.
- **Neighborhood code tag** (the repeatable graphic signature): every
  neighborhood mention renders as a transit-station lockup — a 2–3
  letter Plex Mono code in a hard outlined box (NE, NL, DT, STP, LH,
  WB, LF, MG, etc.) followed by the full neighborhood name. Defined
  in `NEIGHBORHOOD_CODES` in build.js. Same shape and scale everywhere
  on the site (entry cards, calendar rows, venue pages, tonight, this
  weekend). The way subway-station codes tie a transit map together —
  this is what makes the site read as municipal infrastructure.
- **Cover band swap on weather mood**: homepage cover deck rewrites
  based on patio / brutal-cold / snow / rain. Reflects the day in copy.
- **Right-now strip**: thin band under the cover with sunset, weather,
  next 3 countdowns. The site's pulse.
- **Featured-event banner**: dark band between cover and right-now strip
  during an event window. Pulsing dot, eyebrow, headline, deck, dates,
  CTA. Hides automatically when the event ends.
- **Civic notice** (homepage): public-service-announcement block between
  the data strip and the tools grid. Hard top border, square red
  swatch, all-caps label ("NOTICE · THE METRO"), Plex Sans body line
  that rotates with weather mood and season, mono-stamped update time.
  The cultural-utility equivalent of a transit alert banner.
- **Newsletter capture**: prominent block at the bottom of homepage,
  every category, and event pages. Honest "launching this summer"
  framing while the list grows.
- **Per-entry detail pages**: hero with neighborhood + style, meta block
  with address (links to Google Maps), website, reservation button when
  present, mini-map (Leaflet) with single clay marker, related entries
  by neighborhood, schema.org JSON-LD.

---

## 6. What's deliberately NOT on the site

- No social media follow buttons
- No "share to" buttons (OG cards do that work)
- No popup overlays
- No newsletter modal
- No cookie banner (no behavioral tracking beyond GA4 pageviews)
- No comments
- No user accounts
- No ratings/star scores
- No "trending now"
- No "people also liked"

---

## 7. Architecture (just enough context)

Static site generated by `scripts/build.js` (vanilla Node + cheerio). All
content lives in `src/data/*.js` modules — one per category. Scrapers in
`scripts/scrapers/` pull events from ten venues four times daily. A
Cloudflare Worker (`worker/`) handles poll/tip/newsletter submissions
into a KV namespace. Built to `dist/`, deployed to GitHub Pages.

The build is fast (sub-second) and the output is plain HTML+CSS+a
minimum of JS. No framework, no client-side router, no bundler. The site
should still work if JavaScript fails — the `/tonight/` page has a
server-rendered fallback even though JS recomputes "today" on load.

---

## 8. Open aesthetic questions

Places where a fresh eye would help:

- **Homepage cover.** It works but the deck-swap copy is doing a lot.
  Is the hero too tall on mobile? Should the right-now strip live above
  the fold instead of below?
- **Tools strip.** Currently ~12 cards. Probably too many. What gets
  cut? What gets merged? Should it be horizontally scrolling on mobile
  instead of wrapping?
- **Category page density.** Some categories have 30+ entries. Do they
  need section headers ("Best for a Tuesday," "Worth the trip")? Are
  the entry cards the right shape?
- **`/calendar/` controls.** The venue filter chips can wrap onto three
  rows. Acceptable? Dropdown instead?
- **Mobile primary nav.** Currently a "Menu" overlay. Is the overlay
  organized intuitively?
- **Type scale on small screens.** Does the Playfair italic 900 still
  feel signature at 24px, or does it lose its register?
- **Color use of clay-red.** Used for accent, links, status, CTAs, eyebrows.
  Is it doing too much? Should there be a secondary accent for
  navigation/wayfinding distinct from action/CTA?
- **Dark mode noise grain.** The grain at `0.08` opacity is heavier in
  dark mode than light. Intentional, but right?

---

## 9. How to read the site to critique it

1. Hit `bestofmpls.com` in light mode. Walk the homepage, click into a
   category, click into an entry, hit `/calendar/`, hit `/tonight/`, hit
   `/this-weekend/`, hit `/art-a-whirl/` (featured event), hit
   `/calendar/venue/first-avenue/` (per-venue page).
2. Toggle to dark mode (button bottom-right of header) and repeat. Look
   especially at the footer, banners, and any large blocks.
3. Resize to mobile (~375px) and repeat.
4. Read the prose, not just look at the layout. The editorial voice IS
   the design.

If you're making changes, the cache buster `v=NN` on the stylesheet
import in `head()` needs to bump every time `src/style.css` changes.
