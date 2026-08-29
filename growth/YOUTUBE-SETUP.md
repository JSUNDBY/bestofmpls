# YouTube Shorts pipeline — setup

One-time setup, then `npm run shorts` renders and `npm run shorts:upload` posts a
private draft you publish by hand.

## Do you need a new YouTube account? No.

Do **not** make a second Google account. Create a **Brand Account channel** under
the Google account you already use:

1. youtube.com, signed in as yourself → avatar → **Switch account** → **All channels** → **Create a channel**
2. Name it `Best of MPLS`.

A Brand Account channel gets its own name, handle, and branding, is separate from
your personal channel, and can have extra managers added later without sharing
your password. Everything below attaches to that channel.

## The pieces

| Piece | What it's for |
|---|---|
| Brand Account channel | where the videos live |
| Google Cloud project | holds the API credentials |
| OAuth client | lets the script upload as that channel |
| YouTube API audit | the only way uploads stop being locked to private |

## 1. Google Cloud project

1. console.cloud.google.com → new project, `bestofmpls-youtube`. Keep it separate
   from the Maps/Places project so a quota or billing problem in one can't take
   out the other.
2. **APIs & Services → Library → YouTube Data API v3 → Enable.**

## 2. OAuth consent screen

**APIs & Services → OAuth consent screen.**

- User type: **External**
- App name: `Best of MPLS uploader`, your email for support and developer contact
- Scope: `https://www.googleapis.com/auth/youtube.upload`
- **Publishing status: change it to "In production."**

That last line is the one that quietly breaks everything if you skip it. While the
app sits in **Testing**, Google expires every refresh token after **7 days**, so a
weekly cron works once and then fails forever with `invalid_grant`. In production
the refresh token does not expire on a timer.

Because `youtube.upload` is a sensitive scope and the app is not verified, you
will see an "unverified app" interstitial the first time you consent. As the app's
own owner, click **Advanced → Go to Best of MPLS uploader (unsafe)**. That warning
is about strangers trusting your app, not about you using your own.

## 3. OAuth client

**APIs & Services → Credentials → Create credentials → OAuth client ID.**

- Type: **Desktop app** (loopback redirects are allowed automatically)
- If it ever rejects the callback, recreate it as **Web application** with the
  authorized redirect URI `http://localhost:47824`

Copy the client ID and secret.

## 4. Get a refresh token

```bash
cd ~/Code/sites/bestofmpls
export YT_CLIENT_ID='...'
export YT_CLIENT_SECRET='...'
npm run shorts:auth
```

It prints a URL. Open it **in a browser signed in to the Best of MPLS channel**,
consent, and the script catches the callback and prints `YT_REFRESH_TOKEN=...`.
Put all three values in your shell profile or a local `.env` (already gitignored).

## 5. Render and upload

```bash
npm run shorts
```

Writes `dist/shorts/<date>-live-music.mp4` plus a `.json` sidecar holding the
title, description, and tags. Takes about 30 seconds.

```bash
npm run shorts:upload
```

Uploads the newest render as **private** and prints the Studio link. Watch it,
then publish from Studio.

Optional music bed: `npm run shorts -- --audio path/to/bed.mp3`.

## 6. The API audit (do this early)

Until the Cloud project passes a **YouTube API compliance audit**, every video
uploaded through the API is **locked to private and cannot be appealed**. You can
still publish by hand from Studio, which is what this pipeline assumes.

Apply through the [YouTube API Services audit form](https://support.google.com/youtube/contact/yt_api_form).
It takes a few weeks, so start it before you need it.

Even after the audit clears, leave `privacyStatus: 'private'` in
`scripts/upload-short.js`. The one-click human publish is the project guardrail,
not a workaround.

## 7. Wiring it into the Monday cron (later)

`deploy.yml` already runs the newsletter and `social-ideas.js` on the Monday
schedule. Adding the Short means:

1. Repo secrets: `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`
2. `sudo apt-get install -y ffmpeg` (Chrome is already on `ubuntu-latest`)
3. `CHROME_BIN=/usr/bin/google-chrome node scripts/build-shorts.js && node scripts/upload-short.js`

Hold off until you have published a few by hand and like the format. An automated
pipeline that produces videos you don't want to post is worse than no pipeline.

## What the renderer will and won't claim

`build-shorts.js` reads `src/data/editorial-notes.json` and leads with acts that
the Sunday editorial pass web-verified. Those cards get the "why go" line.

If there aren't enough verified acts (the pass runs Sunday for the week ahead, so
by Thursday its notes can all be for shows that already happened), the remaining
cards fall back to **scraped facts only**: act name, venue, neighborhood. It never
writes a description of an act nobody confirmed. The console output marks verified
acts with `*`, and the sidecar JSON carries a `verified` count.

The practical consequence: **render the Short on Sunday or Monday**, right after
the editorial pass, or you get a factually safe but blander video.

## Known limits

- **No trending audio.** `videos.insert` has no field for YouTube's in-app audio
  library. An API-uploaded Short ships with whatever audio is in the file. If a
  trending sound matters for a given week, upload that one from the phone.
- **ffmpeg 2.8.1** is what's on the Mac. The renderer works around it (`zoompan`
  segfaults, so motion comes from an animated crop instead). If you ever upgrade
  ffmpeg, the drift filter still works, and `xfade` crossfades become available.
- **Text-card Shorts underperform** ones with real footage. This gets a correct,
  on-brand video out every week with zero effort. Dropping b-roll behind the cards
  in CapCut is still the upgrade when a week deserves it.
