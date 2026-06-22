# Link tagging (so you can see what works)

Every link you post off-site should carry a UTM tag. Then GA4 shows you exactly
which channel and which post drove traffic and newsletter signups. Without this,
all your social traffic just shows up as "direct" and you're flying blind.

## The formula
```
https://bestofmpls.com/?utm_source=SOURCE&utm_medium=social&utm_campaign=CAMPAIGN
```
- **utm_source** = where it's posted: `instagram`, `tiktok`, `threads`, `facebook`, `reddit`
- **utm_medium** = `social` (or `bio` for the link-in-bio, `newsletter` for the dispatch)
- **utm_campaign** = what the post is: `weekend`, `happyhour`, `neighborhood-ne`, `trucks`, `launch`

## Copy-paste starters
- Instagram bio link: `https://bestofmpls.com/?utm_source=instagram&utm_medium=bio&utm_campaign=profile`
- A weekend reel (IG): `https://bestofmpls.com/calendar/?utm_source=instagram&utm_medium=social&utm_campaign=weekend`
- A neighborhood post (TikTok): `https://bestofmpls.com/neighborhoods/?utm_source=tiktok&utm_medium=social&utm_campaign=neighborhood`
- Food trucks (any): `https://bestofmpls.com/food-trucks/?utm_source=instagram&utm_medium=social&utm_campaign=trucks`

## Why it matters
The site now fires a GA4 `newsletter_signup` event tagged with that source on
every signup. So in GA4 you'll see "12 signups from instagram, 3 from tiktok"
and know where to put your energy. That number is also what you show a sponsor.

Keep source/campaign names lowercase and consistent, or the reports fragment.
