# Best of MPLS: how to operate it

One page. What runs itself, what Josh does, and the commands behind everything. The full brand rules live in the `bestofmpls-agency` skill; this is the daily driver's view.

## What runs without you

| When | What | Where it lands |
|---|---|---|
| 4x daily | Event scrape (43 sources) + site rebuild + deploy | bestofmpls.com |
| Weekdays 7:30am | Daily short generated (day's recipe + rotating music lane) | your chat, awaiting "go" |
| Mondays 7:30am | Week Ahead IG carousel alongside the video | your chat |
| Sunday 6pm | Ping: 30 seconds for your human paragraph | your chat |
| Sunday 10:30pm | Your note becomes the email's opening, committed | your chat shows the paragraph |
| Sunday ~11:47pm | Monday newsletter sends itself (Kit) | subscriber inboxes |

## Your day (about 30 minutes)

1. Morning: watch the daily short (20 seconds). Reply **go** to publish, or give a note.
2. Post the reel to Instagram from `~/Desktop/bestofmpls-posts/` (it's already the right file). Tag the venues in the picks. Monday: post the carousel too.
3. Reply to anything in hello@ — newsletter replies are giveaway entries and future partners.

## Your week (about 90 minutes)

- **Sunday, 30 seconds:** when the 6pm ping arrives, drop a voice memo (`~/Desktop/IN/bomm*.m4a`) or two typed sentences (`~/Desktop/IN/bomm-note.txt`). That's the email's one human paragraph. Skip it and the email goes out clean — it is never faked.
- **Friday, ~1 hour, the sales block:** send or follow up partner pitches. Ready-to-send giveaway pitches: `~/Desktop/bestofmpls-posts/giveaway-pitches.md`.
- **One night out as the face.** Ten seconds of vertical video from a real room beats an hour of desk work.
- **Shoot as you go.** `docs/PHOTO-SHOTLIST.md` ranks every place that needs a photo, grouped by neighborhood. Save each shot with the exact filename shown into `public/img/places/`, tell Claude "commit the photos" (or commit yourself), and the next build puts it on the entry page automatically. Say "shotlist" to Claude for a fresh list anytime.

## Say-it-to-Claude commands (any session)

- "go" — publish the pending daily short to YouTube.
- "giveaway: [show] at [venue], [date]" — puts the giveaway block in Monday's email (writes `src/data/giveaway.json`).
- "hold this week's giveaway" — removes it.
- "add [venue]" — new scraper investigation (VenuePilot venues take minutes).
- "make a spot for [event]" — bespoke wildcard video through the same review gate.

## The email (what subscribers get and why it works)

Opening: your human paragraph (Sunday ritual) → their lane first (the signup asks "lead with my thing": music/art/food/stages/free — Kit Liquid swaps the first card per reader) → the week by scene → art week → happy hour → horoscope → giveaway when live (reply to enter). One email a week. Real reply-to. Never blast.

## Commands reference (when you want to drive manually)

```bash
# Daily video by hand (day = mon|tue|wed|thu|fri)
cd ~/Code/sites/bestofmpls && node scripts/shorts-data.js /tmp tue
cd ~/Code/remotion-studio && npx remotion render list-short /tmp/out.mp4 --props=/tmp/tue.json

# Carousel from any day's data
node scripts/carousel.js /tmp/mon.json ~/Desktop/bestofmpls-posts/carousel-week

# Newsletter preview (renders as next Monday)
NEWSLETTER_TODAY=<next-monday> node scripts/send-newsletter.js --preview
# → growth/newsletter-preview.html

# YouTube
node scripts/youtube/cli.js upload <file> --title "..." --desc "..."
node scripts/youtube/cli.js publish <id>
node scripts/youtube/cli.js list
```

## Guardrails (non-negotiable)

- Nothing publishes, posts, or emails a human without your word. The Monday newsletter's automated send is the one carve-out you approved.
- The human paragraph is never fabricated. No note, no paragraph.
- Deleting anything anywhere is yours alone.
- Scraped text never hits a screen raw; messy titles lose their slot.

## The scoreboard

Newsletter subscribers. Everything above exists to move that number. Check it at app.kit.com → Subscribers, filtered by the `bestofmpls-monday` tag.
