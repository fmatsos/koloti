# Koloti — Installation & Configuration Guide

This guide covers local development setup, Supabase project configuration, and Netlify deployment.

---

## Prerequisites

| Tool                                                 | Version | Notes                                  |
| ---------------------------------------------------- | ------- | -------------------------------------- |
| Node.js                                              | 22+     | See `.nvmrc`                           |
| npm                                                  | 10+     | Bundled with Node 22                   |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | latest  | `npm i -g supabase`                    |
| Docker                                               | latest  | Required by Supabase CLI for local dev |
| Git                                                  | 2.x+    |                                        |

---

## 1. Local development

### 1.1 Clone and install dependencies

```bash
git clone https://github.com/fmatsos/koloti.git
cd koloti
npm install
```

### 1.2 Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the values. See [Environment variables reference](#4-environment-variables-reference) below.  
For local development the Supabase values come from `supabase start` (step 1.4).

### 1.3 Start Supabase locally

Docker must be running before this step.

```bash
supabase start
```

This starts a local Postgres instance, Auth server, REST API, and Storage.  
At the end of the output, copy the printed `API URL`, `anon key`, and `service_role key` into your `.env`.

### 1.4 Apply database migrations

```bash
supabase db reset
```

This runs all migrations in `supabase/migrations/` in order:

| File                | Description                                     |
| ------------------- | ----------------------------------------------- |
| `0001_schema.sql`   | Full data model (all tables, enums, indexes)    |
| `0002_rls_base.sql` | RLS deny-by-default + baseline policies         |
| `0003_rls_lot1.sql` | RLS for `info_post`, `document`, `ownership`    |
| `0004_rls_lot2.sql` | RLS for `assembly`, `agenda_item`, `attendance` |

### 1.5 Generate TypeScript types

```bash
npm run gen:types
```

This regenerates `src/lib/types/database.ts` from the local Supabase schema. Re-run after every migration.

### 1.6 Start the dev server

```bash
npm run dev
```

App is available at `http://localhost:5173`.

---

## 2. Supabase — Production setup

### 2.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. **Region: Europe (eu-west-1 or eu-central-1)** — required for GDPR. This cannot be changed after creation.
3. Note your **Project URL** and **API keys** (anon + service_role) from **Project Settings → API**.

### 2.2 Link the CLI to your project

```bash
supabase login                        # authenticate with your Supabase account
supabase link --project-ref <ref>     # <ref> is the project ID in the URL
```

### 2.3 Apply migrations to production

```bash
supabase db push --linked
```

> **Never modify the production schema via the Supabase dashboard UI.**  
> Always go through versioned migrations.

### 2.4 Configure email (SMTP)

Supabase's built-in email has very low delivery limits on the free tier. Configure a custom SMTP provider instead:

1. In your Supabase dashboard: **Authentication → Settings → SMTP Settings**
2. Enable **Custom SMTP** and enter your provider credentials

Recommended providers: **[Brevo](https://brevo.com)** (free tier: 300 emails/day) or **[Resend](https://resend.com)**.

| Brevo SMTP setting | Value                                    |
| ------------------ | ---------------------------------------- |
| Host               | `smtp-relay.brevo.com`                   |
| Port               | `587`                                    |
| User               | Your Brevo account login                 |
| Password           | SMTP API key (not your account password) |

> ⚠️ Email reliability is critical — all access flows (activation, magic link, convocations) go through email.

### 2.5 Configure Supabase Auth

In **Authentication → Settings**:

- **Site URL**: your Netlify app URL (e.g. `https://mon-asl.netlify.app`)
- **Redirect URLs**: add `https://mon-asl.netlify.app/**`
- **JWT expiry**: 3600 s (1 hour) recommended
- Disable **Email confirmations** — account activation is handled by the custom flow (activation links)

### 2.6 Create the Storage bucket

In **Storage → New bucket**:

- Name: `documents`
- **Private bucket** (no public access — downloads use signed URLs)
- Max file size: `20 MB`
- Allowed MIME types: `application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.*`

### 2.7 Deploy Edge Functions

```bash
supabase functions deploy issue-activation-link
supabase functions deploy issue-extended-link
supabase functions deploy welcome-sheet
supabase functions deploy convene-assembly
```

Set Edge Function secrets (they are separate from project env vars):

```bash
supabase secrets set PUBLIC_APP_URL=https://mon-asl.netlify.app
supabase secrets set BREVO_API_KEY=<your-key>      # or RESEND_API_KEY
supabase secrets set SMTP_FROM=noreply@mon-asl.fr
supabase secrets set SMTP_FROM_NAME="ASL Koloti"
```

---

## 3. Netlify — Deployment

### 3.1 Create a Netlify site

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project**
2. Connect your GitHub repository
3. Build settings are pre-configured in `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `.netlify/v1/functions` (managed by `adapter-netlify`)

### 3.2 Set environment variables in Netlify

In **Site settings → Environment variables**, add all variables from the [reference table](#4-environment-variables-reference):

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

### 3.3 Configure GitHub Actions secrets

For automated CI/CD (`.github/workflows/deploy.yml`), add the following **repository secrets** in GitHub → Settings → Secrets:

| Secret                                                | Description                                          |
| ----------------------------------------------------- | ---------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`                                 | Supabase project URL                                 |
| `PUBLIC_SUPABASE_ANON_KEY`                            | Supabase anon key                                    |
| `SUPABASE_SERVICE_ROLE_KEY`                           | Supabase service_role key                            |
| `SUPABASE_ACCESS_TOKEN`                               | Supabase CLI access token (`supabase login` → token) |
| `SUPABASE_DB_PASSWORD`                                | Supabase database password                           |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP credentials                                     |
| `SMTP_FROM` / `SMTP_FROM_NAME`                        | Sender address                                       |
| `PUBLIC_APP_URL`                                      | Public app URL                                       |
| `NETLIFY_AUTH_TOKEN`                                  | Netlify personal access token                        |
| `NETLIFY_SITE_ID`                                     | Netlify site ID (from site settings)                 |
| `APP_URL`                                             | App URL for the health-check ping cron               |
| `SUPABASE_ANON_KEY`                                   | Supabase anon key (used by ping cron)                |
| `SUPABASE_URL`                                        | Supabase project URL (used by ping cron)             |

### 3.4 Anti-pause cron (free tier)

Supabase free-tier projects pause after 7 days of inactivity. The workflow `.github/workflows/ping-supabase.yml` runs every 3 days to keep the project awake. It requires the `APP_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` secrets above and **no additional configuration** — it runs automatically once the secrets are set.

---

## 4. Environment variables reference

| Variable                    | Scope           | Required | Description                                               |
| --------------------------- | --------------- | -------- | --------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`       | Client + Server | ✅       | Supabase project URL                                      |
| `PUBLIC_SUPABASE_ANON_KEY`  | Client + Server | ✅       | Supabase anon (public) key                                |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | ✅       | Service role key — bypasses RLS, never expose client-side |
| `SMTP_HOST`                 | Server          | ✅       | SMTP server hostname                                      |
| `SMTP_PORT`                 | Server          | ✅       | SMTP port (587 for STARTTLS)                              |
| `SMTP_USER`                 | Server          | ✅       | SMTP username                                             |
| `SMTP_PASS`                 | Server          | ✅       | SMTP password or API key                                  |
| `SMTP_FROM`                 | Server          | ✅       | Sender email address                                      |
| `SMTP_FROM_NAME`            | Server          | ✅       | Sender display name                                       |
| `PUBLIC_APP_URL`            | Client + Server | ✅       | Public app URL without trailing slash                     |
| `NODE_ENV`                  | Server          | —        | `development` or `production`                             |

---

## 5. Available scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run check        # TypeScript / svelte-check
npm run lint         # Prettier + ESLint
npm run format       # Auto-format code
npm run test         # Unit tests (Vitest)
npm run gen:types    # Regenerate src/lib/types/database.ts from local Supabase
```

---

## 6. First admin account

After deploying and applying migrations, there is no admin account yet. Create the first one directly in Supabase:

1. In the Supabase dashboard → **Table editor → `profile`**, insert a row with `role = 'admin'`, `status = 'active'`
2. In **Authentication → Users**, create a user with the same email and note the UUID
3. Update the `profile` row with the correct `id` (matching the Auth user UUID)

Alternatively, run this SQL in the **SQL Editor**:

```sql
-- 1. Create the auth user (replace values)
select auth.create_user(
  uid := gen_random_uuid(),
  email := 'admin@mon-asl.fr',
  password := 'change-me-immediately',
  email_confirm := true
);

-- 2. The profile row is created automatically by the auth trigger.
--    Promote it to admin:
update profile
set role = 'admin', status = 'active'
where email = 'admin@mon-asl.fr';
```

---

## 7. Supabase migration workflow

```bash
# Create a new migration
supabase migration new <name>

# Apply locally
supabase db reset

# Apply to production (linked project)
supabase db push --linked

# Regenerate TypeScript types after migration
npm run gen:types
```
