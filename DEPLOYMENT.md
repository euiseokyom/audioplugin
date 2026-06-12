# Deployment & Domain — PluginBargains

Production stack: **Vercel** (Next.js app) + **Railway** (scraper worker) + **MongoDB Atlas** + **Discord** alerts.

Worker repo: `audioplugin-worker` (sibling directory). See [Worker deployment](#worker-railway) below.

---

## Architecture

```
Users → pluginbargains.com (Vercel)
Railway cron → audioplugin-worker → MongoDB Atlas
Both app + worker → Discord webhook (alerts)
```

---

## Domain purchase & DNS

**Recommended domain:** `pluginbargains.com` (matches app branding). Fallback: `pluginbargains.net`.

Buy at [Porkbun](https://porkbun.com), [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/), or Namecheap.

### **[MANUAL STEP] 1 — Purchase domain**

Register `pluginbargains.com` (and optionally `pluginbargains.net` as backup).

### **[MANUAL STEP] 2 — Add domain in Vercel**

1. Vercel → your project → **Settings → Domains**
2. Add `pluginbargains.com`
3. Add `www.pluginbargains.com`
4. Set **pluginbargains.com** as primary domain
5. Enable redirect: `www` → apex (301)

### **[MANUAL STEP] 3 — Configure DNS**

At your registrar (or Cloudflare DNS):

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | `@`  | `76.76.21.21` (Vercel)   |
| CNAME | `www`| `cname.vercel-dns.com`   |

Alternatively, use Vercel nameservers if your registrar supports it.

Wait for DNS propagation (usually minutes, up to 48h). Vercel shows a green check when verified.

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` for local dev. **Never commit real secrets.**

### Vercel (main app)

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | Recommended | `https://pluginbargains.com` |
| `NEXTAUTH_URL` | Yes (prod) | `https://pluginbargains.com` — must match deployed origin |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `MONGODB_URI` | Yes | Same Atlas URI as worker |
| `GOOGLE_CLIENT_ID` | Yes | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | From Google Cloud Console |
| `ADMIN_EMAILS` | Yes | Comma-separated admin Google emails |
| `DISCORD_WEBHOOK_URL` | Optional | Only if app sends Discord alerts |

Set variables in **Vercel → Settings → Environment Variables**. Apply to Production (and Preview if desired).

### Railway (worker)

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `MONGODB_URI` | Yes | Same as Vercel |
| `NODE_ENV` | Recommended | `production` |
| `APP_URL` | Recommended | `https://pluginbargains.com` — Discord admin links |
| `DISCORD_WEBHOOK_URL` | Recommended | Same webhook as local |
| `SCRAPE_CONCURRENCY` | Optional | `1` (default) |
| `RETAILER_TIMEOUT_MS` | Optional | `0` = off |

See worker `docs/railway.md` for cron setup.

### Managing vars across environments

| Environment | Where to set |
|-------------|--------------|
| Local dev | `.env.local` (gitignored) |
| Vercel prod | Vercel dashboard → Environment Variables |
| Railway worker | Railway dashboard → Variables |

**Rule:** Use the same `MONGODB_URI` and `DISCORD_WEBHOOK_URL` everywhere. Set `NEXT_PUBLIC_SITE_URL` (Vercel) and `APP_URL` (Railway) to the same production URL.

---

## Google OAuth

### **[MANUAL STEP] 4 — Add production redirect URI**

Google Cloud Console → APIs & Services → Credentials → your OAuth client:

Add authorized redirect URI:

```
https://pluginbargains.com/api/auth/callback/google
```

Keep `http://localhost:3000/api/auth/callback/google` for local dev.

---

## MongoDB Atlas

### **[MANUAL STEP] 5 — Network access**

Atlas → Network Access → allow `0.0.0.0/0` (required for Vercel serverless + Railway).

### **[MANUAL STEP] 6 — Backups**

On M10+ clusters: enable **Continuous Cloud Backup** and **Point-in-Time Recovery**.

Free tier (M0): daily snapshots only — acceptable for launch, upgrade before relying on PITR.

### **[MANUAL STEP] 7 — Create indexes**

After first deploy (or schema changes), run once against production:

```bash
npm run indexes
```

This syncs indexes on Product, PriceEntry, ScraperLog, and Alert collections.

---

## How to deploy changes

### Main app (Vercel)

1. Push to the connected Git branch
2. Vercel auto-builds and deploys
3. Verify with `npm run check:prod` locally before pushing (lint + build + env validation)

### Worker (Railway)

1. Push to the worker repo's connected branch
2. Railway auto-deploys
3. Cron command should be: `npm run catalog:scrape` (or `npm run cron`)

No separate build step needed for `tsx`-based cron scripts.

---

## Post-deployment verification

### **[MANUAL STEP] 8 — Smoke test**

- [ ] `GET https://pluginbargains.com/api/health` → `"status": "ok"`, `"database": { "ok": true }`
- [ ] Homepage loads with deal sections
- [ ] Product detail page loads (`/products/<slug>`)
- [ ] Google sign-in works on production domain
- [ ] `/admin` accessible when signed in with an `ADMIN_EMAILS` account
- [ ] Manual scrape trigger creates a `pending` ScraperLog
- [ ] Worker picks up pending job on next cron cycle
- [ ] Discord alert fires with admin dashboard link
- [ ] `www.pluginbargains.com` redirects to apex

---

## Post-launch monitoring

Daily / after cron runs:

1. Check `/admin` — system health banner, retailer grid
2. Hit `/api/health` (or configure an uptime monitor on it)
3. Watch Discord for failed/partial scrape alerts
4. Spot-check a few product pages for fresh prices
5. Review **Vercel Analytics** (Project → Analytics) for traffic and page views — enabled via `@vercel/analytics` in the root layout; no extra env vars required on Vercel

---

## Worker (Railway)

Repo: `audioplugin-worker`

**Cron command:** `npm run catalog:scrape`

**Manual jobs:** Admin dashboard creates `ScraperLog` with `status: pending` → worker processes on next cycle.

**Health locally:** `npm run health` (reads last run from logs)

Worker env validation runs at cron startup. Missing `APP_URL` logs a warning (Discord links omitted).

---

## Local development

```bash
cp .env.example .env.local   # fill in values
npm install
npm run dev
```

Validate env:

```bash
tsx scripts/validate-env.ts
```

Pre-deploy check:

```bash
npm run check:prod
```
