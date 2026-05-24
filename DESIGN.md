# bestofmpls — Design Brief

This is the canonical brief for anyone (human or AI) doing aesthetic, voice,
or UX work on the site. Read this first; it captures the decisions we've
already made and the lines we don't cross.

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

## 2. Five rules

Every page on the site should answer all five. If a change breaks one,
the change is wrong.

1. **Every page answers one question.** Homepage = "what is the city like
   today?" `/calendar/` = "what's on this week?" `/tonight/` = "what
   should I do tonight?" Category = "where's the good X?" Entry = "should
   I go to this place?" Pages that try to answer two questions get split.

2. **No forever scrolls.** Calendar caps at 21 days. Departed is
   chronological but bounded. If a list is genuinely long, paginate or
   filter — never let it just keep going.

3. **Dark mode is a first-class citizen.** Both modes look intentional.
   No accidental white slabs at the bottom of a scroll. No muddy text in
   light mode. Footer, banners, hero bands, newsletter capture all
   stay coherent in both. **Specifically: when an element uses `var(--ink)`
   as background it WILL flip white in dark mode — use hard hex colors
   (`#0A0A0A` / `#141414`) for dark surfaces meant to stay dark.**

4. **Editorial voice, not generic UI.** "Field notes from the metro," not
   "Subscribe." "Happening tonight," not "Tonight's Events." "Departed,"
   not "Closed Listings." "The list (coming soon)," not "Join Newsletter."
   Words first; UI follows.

5. **Never lie about live data.** If the scraper failed, say so. If a
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
- **Display:** Playfair Display (700, 900, 900 italic). Used for entry
  names, headlines, page titles. The italic 900 is the signature move.
- **Body:** Source Sans 3 (400, 600). Used for descriptions, intros.
- **Label:** Archivo (500, 600, 700). All-caps, wide letter-spacing
  (0.10–0.18em). Used for eyebrows, metadata, chips, dates.

### Color tokens

**Light mode (default):**
```
--paper     #FFFFFF   page background
--paper-2   #F5F2EC   warm-tinted block / elevated card
--paper-3   #ECE7DD   deeper warm block
--ink       #0A0A0A   text, footer, dark slabs
--ink-soft  #4A4A4A   secondary text
--ink-faint #7A7A7A   metadata, captions
--clay      #E11900   accent (bright editorial red)
--rule      #0A0A0A   borders, dividers
```

**Dark mode:**
```
--paper     #0A0A0A
--paper-2   #1A1A1A
--paper-3   #242424
--ink       #FFFFFF
--ink-soft  #B8B8B8
--ink-faint #7A7A7A
--clay      #FF3D26   (slightly punchier red on black)
--rule      #FFFFFF
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
- Subtle SVG noise grain overlay on body (`opacity: 0.045` light,
  `0.08` dark). Gives the page a printed-paper feel without being
  performative.

---

## 5. Component patterns we've established

These are working well. Don't re-invent unless there's a real reason.

- **Sticky chip nav** for filter rows (used on calendar venue chips).
  Rounded pill buttons, `is-on` = inverted bg.
- **Date-range collapse** for multi-day runs (a four-night dance piece
  reads as one row "May 13–16 · 4 nights").
- **Editorial eyebrow + display headline** pattern: small all-caps clay
  eyebrow, large italic Playfair headline below. The signature page
  opening.
- **Cover band swap on weather mood**: homepage cover deck rewrites
  based on patio / brutal-cold / snow / rain. Reflects the day in copy.
- **Right-now strip**: thin band under the cover with sunset, weather,
  next 3 countdowns. The site's pulse.
- **Featured-event banner**: dark band between cover and right-now strip
  during an event window. Pulsing dot, eyebrow, headline, deck, dates,
  CTA. Hides automatically when the event ends.
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
