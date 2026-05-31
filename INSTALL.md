# Koloti — Installation & Configuration Guide

> **Koloti** is a SvelteKit 5 PWA for managing an ASL *(Association Syndicale Libre)*.
> Stack: **SvelteKit · Supabase · Netlify · Tailwind CSS · Skeleton UI**

---

## Table of Contents

- [Architecture overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick start (dev)](#quick-start-dev)
- [1 · Local development — detailed steps](#1--local-development--detailed-steps)
- [2 · Supabase — Production setup](#2--supabase--production-setup)
- [3 · Netlify — Deployment](#3--netlify--deployment)
- [4 · GitHub CI/CD](#4--github-cicd)
- [5 · Environment variables reference](#5--environment-variables-reference)
- [6 · Database migrations](#6--database-migrations)
- [7 · Edge Functions](#7--edge-functions)
- [8 · First admin account](#8--first-admin-account)
- [9 · Available scripts](#9--available-scripts)
- [10 · Troubleshooting](#10--troubleshooting)

---

## Architecture overview

```
Browser  ←→  SvelteKit (Netlify Functions)  ←→  Supabase (Postgres + Auth + Storage + Edge Functions)
                                             ←→  SMTP relay (Brevo / Resend)
```

| Layer | Technology | Notes |
|---|---|---|
| Frontend | SvelteKit 5 + Tailwind 4 + Skeleton UI | Runes mode, PWA |
| Backend | SvelteKit SSR — Netlify adapter | Server-side rendering + API routes |
| Database | Supabase (Postgres 17) | RLS on all tables |
| Auth | Supabase Auth | Magic links, custom activation flow |
| Storage | Supabase Storage | Private bucket, signed URLs |
| Serverless | Supabase Edge Functions (Deno 2) | Email workflows |
| CI/CD | GitHub Actions | Lint → Test → Build → Deploy |

---

## Prerequisites

Install these tools before starting.

| Tool | Version | Install |
|---|---|---|
| **Node.js** | 22 (see `.nvmrc`) | [nodejs.org](https://nodejs.org) or `nvm install` |
| **npm** | 10+ | Bundled with Node 22 |
| **Docker** | latest | [docker.com](https://www.docker.com) — required for local Supabase |
| **Supabase CLI** | latest | `npm install -g supabase` |
| **Git** | 2.x+ | [git-scm.com](https://git-scm.com) |

> **nvm users:** run `nvm install` at the project root. The `.nvmrc` file pins the correct Node version.

---

## Quick start (dev)

```bash
git clone https://github.com/fmatsos/koloti.git
cd koloti
npm install
cp .env.example .env          # fill in SMTP and APP_URL values
npm run dev                   # starts Supabase, generates .env.development, starts Vite
```

`npm run dev` is the only command you need. It:
1. Starts local Supabase (Docker).
2. Reads `supabase status` and **auto-generates `.env.development`** with the local API URL and keys.
3. Starts the Vite dev server.

The app is available at **`http://localhost:5173`**.

> **First run only:** after `npm run dev` completes the first time, run `supabase db reset` in a separate terminal to apply all migrations.

---

## 1 · Local development — detailed steps

### 1.1 Clone and install

```bash
git clone https://github.com/fmatsos/koloti.git
cd koloti
npm install
```

### 1.2 Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set the values marked with `<...>`. See [§5 — Environment variables reference](#5--environment-variables-reference).

For local development, **Supabase values are auto-populated** by `npm run dev` into `.env.development`. You only need to set SMTP and `PUBLIC_APP_URL` manually.

> `.env` is git-ignored. Never commit it.

### 1.3 Start local Supabase

Make sure **Docker is running**, then:

```bash
supabase start
```

This starts a local stack:

| Service | Local URL |
|---|---|
| REST API | `http://127.0.0.1:54321` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Email UI (Inbucket) | `http://127.0.0.1:54324` |
| SMTP (for dev) | `127.0.0.1:54325` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

> All outgoing emails during local development are **captured** by Inbucket — nothing is sent. Open `http://127.0.0.1:54324` to inspect emails.

### 1.4 Apply database migrations

```bash
supabase db reset
```

This drops and recreates the local database, then runs all migrations in order. See [§6 — Database migrations](#6--database-migrations).

### 1.5 Generate TypeScript types

```bash
npm run gen:types
```

This regenerates `src/lib/types/database.ts` from the live local schema.

> Re-run this command **after every migration**.

### 1.6 Start the dev server

```bash
npm run dev
```

This runs `scripts/supabase-dev.js` (auto-generates `.env.development`) then starts Vite.

If Supabase is already running, the script detects it via `supabase status` and skips the start phase.

---

## 2 · Supabase — Production setup

> Do this **once**, before the first production deployment.

### 2.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose a **region in Europe** (`eu-west-1` or `eu-central-1`).  
   ⚠️ This is required for GDPR. **The region cannot be changed after creation.**
3. Note your **Project URL** and **API keys** from **Project Settings → API**:
   - `Project URL`
   - `anon` key (Publishable)
   - `service_role` key (Secret)

### 2.2 Link the CLI to your project

```bash
supabase login                          # opens browser for authentication
supabase link --project-ref <ref>       # <ref> = the ID in your project URL
```

The project `ref` is the string in `https://supabase.com/dashboard/project/<ref>`.

### 2.3 Apply migrations to production

```bash
supabase db push --linked
```

> **Rule:** never modify the production schema via the Supabase dashboard UI.  
> Always use versioned migrations. See [§6](#6--database-migrations).

### 2.4 Configure email (SMTP)

Supabase's built-in email has very low delivery limits on the free tier. Use a custom SMTP provider.

**Recommended providers:**

| Provider | Free tier | Notes |
|---|---|---|
| [Brevo](https://brevo.com) | 300 emails/day | Easy setup |
| [Resend](https://resend.com) | 100 emails/day | Developer-friendly |

**In the Supabase dashboard:** Authentication → Settings → SMTP Settings → enable **Custom SMTP**.

Brevo settings:

| Field | Value |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | Your Brevo account email |
| Password | SMTP API key — **not** your account password |

> ⚠️ Email reliability is critical. All access flows (account activation, magic links, assembly notifications) go through email.

### 2.5 Configure Supabase Auth

In **Authentication → Settings**:

| Setting | Value |
|---|---|
| Site URL | `https://your-app.netlify.app` |
| Redirect URLs | `https://your-app.netlify.app/**` |
| JWT expiry | `3600` seconds (1 hour) |
| Email confirmations | **Disabled** — activation is handled by the custom flow |

### 2.6 Create the Storage bucket

In **Storage → New bucket**:

| Field | Value |
|---|---|
| Name | `documents` |
| Access | **Private** (downloads use signed URLs) |
| Max file size | `20 MB` |
| Allowed MIME types | `application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*` |

### 2.7 Deploy Edge Functions

```bash
supabase functions deploy issue-activation-link
supabase functions deploy issue-extended-link
supabase functions deploy welcome-sheet
supabase functions deploy convene-assembly
supabase functions deploy notify-assembly-open
```

Then set the required secrets for Edge Functions:

```bash
supabase secrets set PUBLIC_APP_URL=https://your-app.netlify.app
supabase secrets set BREVO_API_KEY=<your-key>        # or RESEND_API_KEY
supabase secrets set SMTP_FROM=noreply@your-domain.fr
supabase secrets set SMTP_FROM_NAME="ASL Koloti"
```

> Edge Function secrets are **separate** from project environment variables. They are set with `supabase secrets set`, not in the dashboard.

---

## 3 · Netlify — Deployment

### 3.1 Create a Netlify site

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
2. Connect your GitHub repository.
3. Build settings are pre-configured in `netlify.toml`:
   - **Build command:** `npm run build`
   - **Node version:** `22`
   - **Publish directory:** managed by `@sveltejs/adapter-netlify`

### 3.2 Set environment variables in Netlify

In **Site settings → Environment variables**, add all variables from [§5](#5--environment-variables-reference):

```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
SMTP_FROM_NAME
PUBLIC_APP_URL
NODE_ENV=production
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. Never expose it client-side.

### 3.3 Security headers

`netlify.toml` includes security headers applied globally on all routes:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS, 1 year)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (blocks camera, microphone, geolocation)

Static assets under `/_app/immutable/*` are served with `Cache-Control: immutable` for maximum CDN performance.

---

## 4 · GitHub CI/CD

### 4.1 Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push to `main` or `claude/**`, PR to `main` | Lint → TypeScript check → Unit tests → Build |
| `deploy.yml` | Push to `main`, manual | Build → Apply Supabase migrations → Deploy to Netlify |
| `ping-supabase.yml` | Every 3 days (cron) | Pings `/api/health` to keep the free-tier project awake |

### 4.2 Required repository secrets

Go to **GitHub → Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (Publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role (Secret) key |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI token — run `supabase login` and copy the token |
| `SUPABASE_DB_PASSWORD` | Database password — set when you created the project |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually `587`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password or API key |
| `SMTP_FROM` | Sender email address |
| `SMTP_FROM_NAME` | Sender display name |
| `PUBLIC_APP_URL` | Public app URL (no trailing slash) |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token |
| `NETLIFY_SITE_ID` | Netlify site ID (Site settings → General) |
| `APP_URL` | App URL used by the health-check cron |
| `SUPABASE_URL` | Supabase project URL (used by ping cron) |
| `SUPABASE_ANON_KEY` | Supabase anon key (used by ping cron) |

### 4.3 Anti-pause cron (free tier)

Supabase free-tier projects **pause after 7 days of inactivity**.

The workflow `ping-supabase.yml` runs every 3 days and pings `/api/health`. No extra configuration is needed beyond setting the secrets above.

---

## 5 · Environment variables reference

| Variable | Scope | Required | Description |
|---|---|---|---|
| `PUBLIC_SUPABASE_URL` | Client + Server | ✅ | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Client + Server | ✅ | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | ✅ | Service role key — bypasses RLS, **never expose client-side** |
| `SMTP_HOST` | Server | ✅ | SMTP server hostname |
| `SMTP_PORT` | Server | ✅ | SMTP port (`587` for STARTTLS) |
| `SMTP_USER` | Server | ✅ | SMTP username |
| `SMTP_PASS` | Server | ✅ | SMTP password or API key |
| `SMTP_FROM` | Server | ✅ | Sender email address |
| `SMTP_FROM_NAME` | Server | ✅ | Sender display name |
| `PUBLIC_APP_URL` | Client + Server | ✅ | Public app URL — no trailing slash |
| `NODE_ENV` | Server | — | `development` or `production` |

**Local dev note:** `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are **auto-generated** into `.env.development` by `npm run dev`. You do not need to set them manually for local development.

---

## 6 · Database migrations

Migrations live in `supabase/migrations/` and are applied in order.

| File | Description |
|---|---|
| `0001_schema.sql` | Complete schema — enums, all tables, indexes, RLS helpers, and all RLS policies |

### Development seed

`supabase db reset` automatically runs `supabase/seed.sql` after migrations.

It creates 10 accounts, 8 lots, 5 assemblies at every lifecycle stage, attendance records, documents, and more. Password for all accounts: **`Dev1234!`**

| Email | Login | Role | Notes |
|---|---|---|---|
| `admin@koloti.local` | `admin` | admin | Bernard Martin, current president |
| `syndic@koloti.local` | `marie` | editor | Marie Dupont, syndic |
| `jplefebvre@example.com` | `jplef01` | member | LOT-01 |
| `smoreau@example.com` | `smor02` | member | LOT-02 |
| `abenali@example.com` | `abena03` | member | LOT-03 (×2 votes) |
| `iroux@example.com` | `iroux04` | member | LOT-04 |
| `fpetit@example.com` | `fpeti05` | member | LOT-05 (ex-LOT-03) |
| `nsimon@example.com` | `nsimo06` | member | LOT-06 |
| `tlaurent@example.com` | `tlau07` | member, **pending** | LOT-07 — activation URL below |
| `cdubois@example.com` | `cdubo08` | member, **inactive** | ex-LOT-08, sold property |

Pending activation URL for Thomas Laurent:
```
http://localhost:5173/activate/000000000000000000000000000000000000000000000000000000000000cafe
```

### Migration workflow

```bash
# 1. Create a new migration
supabase migration new <descriptive-name>

# 2. Write SQL in the generated file (supabase/migrations/<timestamp>_<name>.sql)

# 3. Apply locally
supabase db reset

# 4. Regenerate TypeScript types
npm run gen:types

# 5. Apply to production (after merging to main, or manually)
supabase db push --linked
```

> Always regenerate types (`npm run gen:types`) after applying migrations.  
> The `deploy.yml` workflow runs `supabase db push --linked` automatically on every push to `main`.

---

## 7 · Edge Functions

Edge Functions run on Deno 2 in Supabase's infrastructure. They handle all email workflows.

| Function | Purpose |
|---|---|
| `issue-activation-link` | Sends the initial account activation email |
| `issue-extended-link` | Sends an extended-access link |
| `welcome-sheet` | Sends the welcome document to a new member |
| `convene-assembly` | Sends assembly convocation emails |
| `notify-assembly-open` | Notifies members when an assembly opens |

### Deploy all functions at once

```bash
for fn in issue-activation-link issue-extended-link welcome-sheet convene-assembly notify-assembly-open; do
  supabase functions deploy "$fn"
done
```

### Local testing of Edge Functions

```bash
supabase functions serve <function-name>
```

Emails sent by local Edge Functions are captured by Inbucket at `http://127.0.0.1:54324`.

---

## 8 · First admin account

There is no manual bootstrap step.

On the first request against an **empty database**, Koloti automatically:
1. Detects there is no admin account.
2. Creates a default account with login `admin` and a **random password**.
3. Prints the credentials **once** to stdout.

Find the credentials in:
- **Local dev:** in the terminal where `npm run dev` is running.
- **Production:** in Netlify runtime logs on the first request after deployment.

On first login, a **mandatory credential change** is enforced. The admin must choose a new login and password before accessing the app.

---

## 9 · Available scripts

```bash
npm run dev          # Start Supabase (if needed), generate .env.development, start Vite
npm run build        # Production build
npm run preview      # Preview the production build locally
npm run check        # TypeScript + svelte-check
npm run check:watch  # Same, in watch mode
npm run lint         # Prettier check + ESLint
npm run format       # Auto-format all files
npm run test         # Unit tests (Vitest, single run)
npm run gen:types    # Regenerate src/lib/types/database.ts from local Supabase schema
```

---

## 10 · Troubleshooting

### `supabase start` fails

- Make sure **Docker is running**.
- Run `docker ps` to verify Docker is accessible.
- If a previous run crashed, try `supabase stop --no-backup` then `supabase start`.

### `npm run dev` cannot parse `supabase status`

The script `scripts/supabase-dev.js` reads `supabase status`. If Supabase did not start cleanly, the output may be empty.

```bash
supabase stop --no-backup
supabase start
npm run dev
```

### TypeScript errors after a migration

The types in `src/lib/types/database.ts` are stale. Regenerate them:

```bash
npm run gen:types
```

### Emails not received in production

1. Check that **Custom SMTP is enabled** in Authentication → Settings.
2. Verify SMTP credentials with your provider's dashboard (check sending logs).
3. Confirm `SMTP_FROM` matches a verified sender domain.
4. Check Supabase Auth logs in the dashboard.

### Supabase project is paused (free tier)

Go to your Supabase dashboard and click **Restore project**. The anti-pause cron (`ping-supabase.yml`) prevents this during normal operation, but a first-time setup or long inactivity may require a manual restore.

### Production build fails in CI

The build requires all environment variables to be set. Check that all secrets listed in [§4.2](#42-required-repository-secrets) exist in GitHub → Settings → Secrets.
