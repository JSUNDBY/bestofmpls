# Search Console reporting (unattended)

`scripts/gsc-report.js` pulls bestofmpls.com's Search Analytics (last 28 days)
and prints top queries, top pages, the neighborhood long-tail pages, and a
low-CTR flag. It authenticates with a **service account** so it runs with no
browser and no login — good for the scheduled SEO check.

## One-time setup (~10 min, you do this in your browser)

You need a Google Cloud service account and to grant it read access to the
Search Console property. None of this touches the live site.

1. **Create / pick a Google Cloud project** — https://console.cloud.google.com/projectcreate
   (any project works; name it e.g. `bestofmpls`).

2. **Enable the Search Console API** — https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
   → Enable (make sure the right project is selected, top bar).

3. **Create a service account** — https://console.cloud.google.com/iam-admin/serviceaccounts
   → Create service account → name `gsc-reader` → Done (no roles needed; access
   is granted in Search Console, not IAM).

4. **Make a key** — click the new service account → **Keys** tab → Add key →
   Create new key → **JSON** → it downloads a `*.json` file. Copy its
   `client_email` value (looks like `gsc-reader@<project>.iam.gserviceaccount.com`).

5. **Grant it access in Search Console** — https://search.google.com/search-console
   → pick `bestofmpls.com` → Settings → **Users and permissions** → Add user →
   paste the `client_email` → permission **Restricted** (read is enough) → Add.

6. **Drop the key where the script looks for it:**
   ```bash
   mkdir -p ~/.config/bestofmpls
   mv ~/Downloads/<that-file>.json ~/.config/bestofmpls/gsc-service-account.json
   ```
   (Kept outside the repo on purpose. The repo's .gitignore also blocks
   `gsc-service-account.json` as a backstop.)

## Run it

```bash
cd ~/Code/sites/bestofmpls
node scripts/gsc-report.js
```

If you put the key somewhere else, point at it with `GSC_KEY_FILE=/path/to/key.json node scripts/gsc-report.js`.

## Notes

- The property is treated as a **URL-prefix** property (`https://bestofmpls.com/`).
  If yours is a **Domain** property instead, change `SITE_URL` in the script to
  `sc-domain:bestofmpls.com`.
- A 403 / permission error almost always means step 5 was skipped or the email
  was mistyped.
- The same recipe works for any other property (e.g. twincitycannabis) — add the
  service-account email as a user there too and copy the script.
