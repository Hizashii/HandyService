# Deploying Håndmatch

Håndmatch has two parts that deploy separately, both on Cloudflare and both free to start:

| Part | Where it runs | Needs |
| --- | --- | --- |
| **API** (`apps/api`) | Cloudflare Workers + D1 | a free Cloudflare account |
| **Web app** (`apps/mobile`, exported for web) | Cloudflare Pages | the same account |

Phones use the web app in their browser (and can add it to the home screen). A real App Store / Google Play build is a later step, once the accounts are worth paying for. See [Later: store apps](#later-store-apps).

> Nothing here was run against your real Cloudflare account by the author, so check each step's output as you go.

## 1. Deploy the API

### 1a. Log in and pick the database

```bash
cd apps/api
npx wrangler login               # opens the browser, one time
```

`apps/api/wrangler.jsonc` contains a `database_id` that belongs to **one specific Cloudflare account**. A database can only be used by the account that owns it, so decide which case you are in:

- **You are deploying from the account that already owns the `helpdk` database** (the one that created it). Nothing to change, go to 1b.
- **You are deploying from a different or new account.** Create your own database and point the config at it:

  ```bash
  npm run db:create              # prints a database_id
  ```

  Copy the printed `database_id` into `d1_databases[0].database_id` in `apps/api/wrangler.jsonc` and commit that change (everyone deploying to this account needs the same value). Keep the database name `helpdk`, because the migration scripts use it.

### 1b. Migrate and deploy

```bash
npm run db:migrate:remote        # applies every migration to the real database
npm run deploy
```

Wrangler prints the API address, for example `https://api.<your-subdomain>.workers.dev`. Check it:

```bash
curl https://api.<your-subdomain>.workers.dev/
# {"name":"Håndmatch API","ok":true}

curl "https://api.<your-subdomain>.workers.dev/api/providers?lat=55.4765&lng=8.4594&limit=3"
```

Notes:

- Run `npm run db:migrate:remote` again before any deploy that adds a migration.
- A brand-new area is fetched on the first search, so that search is slower once; later ones are cached.
- The free Workers plan limits CPU time and outbound requests per call. The provider search and website contact reading may hit those limits under real use. The Workers Paid plan (about $5/month) is the safe choice once people use it.
- Browsers may call the API from any address (`cors` is open). Tighten `origin` in `apps/api/src/index.ts` to your web address when you have a fixed domain.

## 2. Deploy the web app

The web build bakes the API address in at build time, so set it first:

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=https://api.<your-subdomain>.workers.dev npm run build:web
```

On Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL = "https://api.<your-subdomain>.workers.dev"
npm run build:web
```

This writes a static site to `apps/mobile/dist`. Publish it:

```bash
# first time only: create the Pages project
npx wrangler@4 pages project create haandmatch-web --production-branch main

EXPO_PUBLIC_API_URL=https://api.<your-subdomain>.workers.dev npm run deploy:web
```

> **Renamed from an earlier deploy?** The Pages project is now called `haandmatch-web` (it was `helpdk-web`). Cloudflare treats that as a new project with a new address, so run the `project create` line above once. The old `helpdk-web` project keeps running until you delete it in the Cloudflare dashboard.

`deploy:web` builds and uploads in one go. Wrangler prints the address, for example `https://haandmatch-web.pages.dev`. Open it on your computer and your phone.

Why it works as a plain static site: `apps/mobile/app.json` sets the web output to `single` (one page that handles all routes in the browser). Cloudflare Pages serves that page for deep links such as `/login`, so refreshing any screen works.

## 3. Use it on a phone

1. Open the Pages address in the phone's browser. It is served over HTTPS, which the browser needs before it will share the location.
2. Allow location when asked, or type a town.
3. Add it to the home screen for an app-like icon (iPhone: Share, then Add to Home Screen. Android Chrome: menu, then Install app or Add to Home screen).

It is a website, not a native app: no push notifications, and the browser decides how location and storage behave. For testing with real users it is enough.

## Updating

- API change: `cd apps/api && npm run deploy` (and `npm run db:migrate:remote` if there is a new migration).
- App change: rebuild and redeploy the web app with the command in step 2.

## Optional: your own domain

In the Cloudflare dashboard, add a custom domain to the Pages project (`haandmatch-web`) and, separately, a route or custom domain to the API Worker. Then set `EXPO_PUBLIC_API_URL` to the API's new address and redeploy the web app.

## Later: store apps

When there is a contract or payment to justify the accounts (Apple Developer about $99/year, Google Play about $25 once), the same code can be built into store apps with Expo EAS (`eas build`, `eas submit`). That needs bundle identifiers and an `eas.json`, which are not set up yet. The API deployment above stays the same.
