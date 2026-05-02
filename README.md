# bestofmpls

The Twin Cities, curated. An independent guide to the best of Minneapolis & St. Paul.

## Stack

- Static site generator (vanilla Node, no framework)
- Data lives in `src/data/*.js` — one file per category
- Build emits to `dist/` — deploy-ready HTML/CSS
- Hosting: Cloudflare Pages (auto-deploy on git push)
- Domain: bestofmpls.com (currently on GoDaddy, migrate to Cloudflare DNS)

## Local development

```bash
npm run build      # generate dist/
npm run serve      # serve dist/ at http://localhost:47823
npm run dev        # build + serve in one shot
```

## Add a new category

1. Create `src/data/your-category.js` — copy the shape of `pizza.js`
2. Add `require('./data/your-category.js')` to the `categories` array in `scripts/build.js`
3. Run `npm run build`
4. New page lives at `/your-category/`

## Editorial standards

- No sponsored picks in editorial lists. Sponsored content is marked.
- Voice: opinionated, locally informed, not clickbait.
- Lists are usually 10–12 entries with 2–3 sentence descriptions.
- Cover the metro: include St. Paul, Northeast, suburbs where relevant.

## Deploy

### First deploy (one-time setup)

1. **Push to GitHub**
   ```bash
   gh repo create bestofmpls --private --source=. --remote=origin --push
   ```

2. **Connect Cloudflare Pages**
   - cloudflare.com → Workers & Pages → Create application → Pages → Connect to Git
   - Repo: `bestofmpls`
   - Framework preset: None
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment: production

3. **Custom domain** (after first deploy works on `bestofmpls.pages.dev`)
   - Cloudflare Pages → bestofmpls → Custom domains → Add `bestofmpls.com`
   - Cloudflare will give you nameservers
   - GoDaddy → My Products → bestofmpls.com → DNS → Nameservers → set to Cloudflare's
   - Wait 24–48 hr for propagation
   - SSL provisions automatically

4. **Email forwarding** (free)
   - Cloudflare → bestofmpls.com → Email → Email Routing
   - Add destination address (your gmail)
   - Add route: `hello@bestofmpls.com` → your gmail
   - Cloudflare adds the MX records automatically

### Ongoing

```bash
git add . && git commit -m "..." && git push
# Cloudflare Pages auto-deploys in ~30 seconds
```

## Roadmap

- [ ] Photography or commissioned illustration for hero entries
- [ ] Programmatic neighborhood pages (`/best-pizza/uptown`, etc.)
- [ ] Live scraped layer: "open right now," current happy hours, today's specials
- [ ] Newsletter (weekly Twin Cities digest)
- [ ] Annual community awards / "Best of Mpls 2026" voting
- [ ] AdSense placements once traffic > 5k/mo
- [ ] Restaurant affiliate (OpenTable, Resy)
