# AG Open Email Notification + Identifiant Oublié — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send fire-and-forget email notifications to all active members when an AG is opened, track delivery per recipient in `assembly_notification`, expose a detail page; and add a forgot-username flow at `/login/identifiant-oublie`.

**Architecture:** A new Supabase Edge Function `notify-assembly-open` is invoked without `await` from the `open` SvelteKit action — it inserts `pending` rows in `assembly_notification`, then updates each to `sent` / `failed` as SMTP calls complete. A new SvelteKit route reads this table and presents a per-member report. The forgot-username feature is a standalone SvelteKit route under `(auth)/login` that resolves an email to logins via the `credential` table and sends them via `sendMail`.

**Tech Stack:** SvelteKit 5, Supabase (Postgres + Edge Functions / Deno), Vitest, Skeleton UI (Tailwind preset classes), Zod v4, Nodemailer (`sendMail` helper), Brevo or Resend for email inside Edge Functions.

---

## File map

| Action | Path |
|--------|------|
| Create | `supabase/migrations/0008_assembly_notification.sql` |
| Create | `supabase/functions/notify-assembly-open/index.ts` |
| Modify | `src/routes/(app)/assemblees-generales/[id]/+page.server.ts` |
| Modify | `src/routes/(app)/assemblees-generales/[id]/+page.svelte` |
| Create | `src/routes/(app)/assemblees-generales/[id]/notifications/+page.server.ts` |
| Create | `src/routes/(app)/assemblees-generales/[id]/notifications/+page.svelte` |
| Create | `src/routes/(auth)/login/identifiant-oublie/+page.server.ts` |
| Create | `src/routes/(auth)/login/identifiant-oublie/+page.svelte` |
| Modify | `src/routes/(auth)/login/+page.svelte` |

---

## Task 1: SQL migration — table `assembly_notification`

**Files:**
- Create: `supabase/migrations/0008_assembly_notification.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/0008_assembly_notification.sql
create table public.assembly_notification (
  id           uuid primary key default gen_random_uuid(),
  assembly_id  uuid not null references public.assembly(id) on delete cascade,
  profile_id   uuid references public.profile(id) on delete set null,
  email        text not null,
  full_name    text not null,
  status       text not null default 'pending'
               check (status in ('pending', 'sent', 'failed')),
  error_msg    text,
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index on public.assembly_notification(assembly_id);
create index on public.assembly_notification(assembly_id, status);
```

- [ ] **Step 2: Apply the migration locally**

```bash
npx supabase db push
```

Expected output: migration `0008_assembly_notification` applied.

- [ ] **Step 3: Verify the table exists**

```bash
npx supabase db shell --command "\d public.assembly_notification"
```

Expected: table columns and constraints listed without error.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0008_assembly_notification.sql
git commit -m "feat: add assembly_notification table for open-AG email tracking"
```

---

## Task 2: Edge Function `notify-assembly-open`

**Files:**
- Create: `supabase/functions/notify-assembly-open/index.ts`

- [ ] **Step 1: Write the edge function**

```typescript
// supabase/functions/notify-assembly-open/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type, x-koloti-actor-id'
};

async function sendEmail(opts: {
	from: string;
	fromName: string;
	to: string;
	subject: string;
	html: string;
	text: string;
}): Promise<void> {
	const brevoApiKey = Deno.env.get('BREVO_API_KEY');
	if (brevoApiKey) {
		await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sender: { name: opts.fromName, email: opts.from },
				to: [{ email: opts.to }],
				subject: opts.subject,
				htmlContent: opts.html,
				textContent: opts.text
			})
		});
		return;
	}
	const resendApiKey = Deno.env.get('RESEND_API_KEY');
	if (resendApiKey) {
		await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: `${opts.fromName} <${opts.from}>`,
				to: opts.to,
				subject: opts.subject,
				html: opts.html,
				text: opts.text
			})
		});
		return;
	}
	console.warn('[notify-assembly-open] Aucun provider email configuré — email non envoyé à', opts.to);
}

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

	try {
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
		const appUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'http://localhost:5173';
		const smtpFrom = Deno.env.get('SMTP_FROM') ?? 'noreply@koloti.app';
		const smtpFromName = Deno.env.get('SMTP_FROM_NAME') ?? 'Koloti';

		const authHeader = req.headers.get('Authorization');
		if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const body = await req.json();
		const assemblyId = body?.assembly_id as string | undefined;
		if (!assemblyId) {
			return new Response(JSON.stringify({ error: 'assembly_id requis' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const adminClient = createClient(supabaseUrl, serviceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false }
		});

		// Fetch AG details
		const { data: ag } = await adminClient
			.from('assembly')
			.select('id, title, type, scheduled_at')
			.eq('id', assemblyId)
			.single();

		if (!ag) {
			return new Response(JSON.stringify({ error: 'AG introuvable' }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Fetch all active profiles
		const { data: profiles } = await adminClient
			.from('profile')
			.select('id, email, first_name, last_name')
			.eq('status', 'active');

		const activeProfiles = profiles ?? [];

		// Bulk insert pending rows
		if (activeProfiles.length > 0) {
			await adminClient.from('assembly_notification').insert(
				activeProfiles.map((p) => ({
					assembly_id: assemblyId,
					profile_id: p.id,
					email: p.email,
					full_name: `${p.first_name} ${p.last_name}`,
					status: 'pending'
				}))
			);
		}

		const dateStr = new Date(ag.scheduled_at).toLocaleString('fr-FR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
		const typeLabel =
			ag.type === 'ordinaire' ? 'Assemblée Générale Ordinaire' : 'Assemblée Générale Extraordinaire';
		const agUrl = `${appUrl}/assemblees-generales/${ag.id}`;

		let sent = 0;
		let failed = 0;

		for (const profile of activeProfiles) {
			const text =
				`Bonjour ${profile.first_name} ${profile.last_name},\n\n` +
				`La séance "${ag.title}" (${typeLabel}, le ${dateStr}) est désormais ouverte.\n\n` +
				`Accédez à l'AG : ${agUrl}`;

			const html =
				`<p>Bonjour ${profile.first_name} ${profile.last_name},</p>` +
				`<p>La séance <strong>${ag.title}</strong> (${typeLabel}, le ${dateStr}) est désormais ouverte.</p>` +
				`<p><a href="${agUrl}">Accédez à l'AG</a></p>`;

			try {
				await sendEmail({
					from: smtpFrom,
					fromName: smtpFromName,
					to: profile.email,
					subject: `L'AG "${ag.title}" est maintenant ouverte`,
					text,
					html
				});

				await adminClient
					.from('assembly_notification')
					.update({ status: 'sent', sent_at: new Date().toISOString() })
					.eq('assembly_id', assemblyId)
					.eq('profile_id', profile.id);

				sent++;
			} catch (e) {
				const errorMsg = e instanceof Error ? e.message : String(e);
				console.error('[notify-assembly-open] Erreur envoi à', profile.email, errorMsg);

				await adminClient
					.from('assembly_notification')
					.update({ status: 'failed', error_msg: errorMsg })
					.eq('assembly_id', assemblyId)
					.eq('profile_id', profile.id);

				failed++;
			}
		}

		return new Response(
			JSON.stringify({ success: true, sent, failed, total: activeProfiles.length }),
			{ status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		console.error('[notify-assembly-open] Erreur inattendue:', err);
		return new Response(JSON.stringify({ error: 'Erreur interne' }), {
			status: 500,
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		});
	}
});
```

- [ ] **Step 2: Start the edge function locally to verify it loads without syntax errors**

```bash
npx supabase functions serve notify-assembly-open --no-verify-jwt
```

Expected: Deno server starts on port 54321 without import errors. Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/notify-assembly-open/index.ts
git commit -m "feat: add notify-assembly-open edge function"
```

---

## Task 3: Fire-and-forget invoke in the `open` action

**Files:**
- Modify: `src/routes/(app)/assemblees-generales/[id]/+page.server.ts` — action `open` (lines 74–105)

- [ ] **Step 1: Add the fire-and-forget call after `writeAuditLog` in the `open` action**

In `src/routes/(app)/assemblees-generales/[id]/+page.server.ts`, replace the `open` action body so it reads:

```typescript
open: async ({ locals, params }) => {
    if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
        return fail(403, { error: 'Non autorisé.' });

    const supabase = createServiceClient();
    const { data: current } = await supabase
        .from('assembly')
        .select('status')
        .eq('id', params.id)
        .single();
    if (current?.status !== 'convened')
        return fail(400, { error: "L'AG doit être convoquée avant d'être ouverte." });

    const { error: err } = await supabase
        .from('assembly')
        .update({
            status: 'open',
            opened_at: new Date().toISOString()
        })
        .eq('id', params.id);

    if (err) return fail(400, { error: err.message });

    await writeAuditLog({
        actorId: locals.profile.id,
        action: 'assembly.open',
        entity: 'assembly',
        entityId: params.id,
        payload: {}
    });

    // Fire-and-forget: do not await, failure must not affect the action
    supabase.functions.invoke('notify-assembly-open', {
        body: { assembly_id: params.id }
    }).catch((e) => console.error('[notify-assembly-open] invoke error:', e));

    return { success: true };
},
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/assemblees-generales/\[id\]/+page.server.ts
git commit -m "feat: fire-and-forget notify-assembly-open on AG open"
```

---

## Task 4: "Voir les notifications" link on the AG page

**Files:**
- Modify: `src/routes/(app)/assemblees-generales/[id]/+page.svelte`

- [ ] **Step 1: Add the link inside the `{#if ag.status === 'open'}` block**

In `src/routes/(app)/assemblees-generales/[id]/+page.svelte`, find the `{#if ag.status === 'open'}` block (around line 132) and add the link as the first item:

```svelte
{#if ag.status === 'open'}
    <a href="/assemblees-generales/{ag.id}/notifications" class="btn-action">
        Notifications d'ouverture →
    </a>
    <a href="/assemblees-generales/{ag.id}/emargement" class="btn-action">Émargement →</a>
    <a href="/assemblees-generales/{ag.id}/quorum" class="btn-action">Quorum →</a>
    <!-- ... rest unchanged ... -->
{/if}
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/assemblees-generales/\[id\]/+page.svelte
git commit -m "feat: add notifications link on open AG page"
```

---

## Task 5: Notifications page — server load

**Files:**
- Create: `src/routes/(app)/assemblees-generales/[id]/notifications/+page.server.ts`

- [ ] **Step 1: Write the load function**

```typescript
// src/routes/(app)/assemblees-generales/[id]/notifications/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

const STATUS_ORDER: Record<string, number> = { pending: 0, failed: 1, sent: 2 };

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
        throw redirect(303, '/');
    }

    const supabase = createServiceClient();

    const { data: ag } = await supabase
        .from('assembly')
        .select('id, title, status')
        .eq('id', params.id)
        .single();

    if (!ag) throw error(404, 'Assemblée introuvable');

    const { data: rows } = await supabase
        .from('assembly_notification')
        .select('id, email, full_name, status, error_msg, sent_at')
        .eq('assembly_id', params.id);

    const notifications = [...(rows ?? [])].sort((a, b) => {
        const sa = STATUS_ORDER[a.status] ?? 99;
        const sb = STATUS_ORDER[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        return a.full_name.localeCompare(b.full_name, 'fr');
    });

    const summary = {
        sent: notifications.filter((n) => n.status === 'sent').length,
        failed: notifications.filter((n) => n.status === 'failed').length,
        pending: notifications.filter((n) => n.status === 'pending').length
    };

    return { session: locals.session, profile: locals.profile, ag, notifications, summary };
};
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no errors. (The `assembly_notification` type will be inferred from Supabase generated types — if types are not regenerated yet, the query still compiles as `any`; run `npx supabase gen types typescript` if strict types are needed.)

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/assemblees-generales/\[id\]/notifications/+page.server.ts
git commit -m "feat: add notifications page load for AG open email report"
```

---

## Task 6: Notifications page — Svelte component

**Files:**
- Create: `src/routes/(app)/assemblees-generales/[id]/notifications/+page.svelte`

- [ ] **Step 1: Write the page**

```svelte
<!-- src/routes/(app)/assemblees-generales/[id]/notifications/+page.svelte -->
<script lang="ts">
    import type { PageData } from './$types';
    let { data }: { data: PageData } = $props();
    const { ag, notifications, summary } = $derived(data);

    const statusLabel: Record<string, string> = {
        pending: 'En attente',
        sent: 'Envoyé',
        failed: 'Échec'
    };

    function formatDate(iso: string | null): string {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
</script>

<svelte:head><title>Notifications — {ag.title} — Koloti</title></svelte:head>

<div class="page-header">
    <a href="/assemblees-generales/{ag.id}" class="back-link">← {ag.title}</a>
    <div class="header-row">
        <h1>Notifications d'ouverture</h1>
    </div>
</div>

<div class="summary-bar">
    <span class="chip chip-success">{summary.sent} envoyé{summary.sent !== 1 ? 's' : ''}</span>
    <span class="chip chip-error">{summary.failed} échec{summary.failed !== 1 ? 's' : ''}</span>
    <span class="chip chip-warning">{summary.pending} en attente</span>
    <form method="GET" class="refresh-form">
        <button type="submit" class="btn-sm">Rafraîchir</button>
    </form>
</div>

{#if notifications.length === 0}
    <div class="card mt">
        <p class="text-muted">Aucune notification enregistrée pour cette AG.</p>
    </div>
{:else}
    <div class="card mt">
        <table class="notif-table">
            <thead>
                <tr>
                    <th>Membre</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Envoyé le</th>
                </tr>
            </thead>
            <tbody>
                {#each notifications as n (n.id)}
                    <tr>
                        <td>{n.full_name}</td>
                        <td class="email-cell">{n.email}</td>
                        <td>
                            <span class="badge-notif badge-notif-{n.status}">
                                {statusLabel[n.status] ?? n.status}
                            </span>
                            {#if n.status === 'failed' && n.error_msg}
                                <span class="error-hint" title={n.error_msg}>ⓘ</span>
                            {/if}
                        </td>
                        <td>{formatDate(n.sent_at)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

<style>
    .page-header { margin-bottom: 1.5rem; }
    .back-link {
        display: inline-block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        text-decoration: none;
        color: var(--color-text-muted, #6b7280);
    }
    .header-row { display: flex; align-items: center; gap: 0.75rem; }
    h1 { margin: 0; font-size: 1.5rem; }

    .summary-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }
    .chip {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .chip-success { background: #d1fae5; color: #065f46; }
    .chip-error   { background: #fee2e2; color: #991b1b; }
    .chip-warning { background: #fef9c3; color: #92400e; }

    .refresh-form { margin-left: auto; }

    .notif-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .notif-table th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--color-border, #e5e7eb);
        font-weight: 600;
        color: var(--color-text-muted, #6b7280);
    }
    .notif-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border-light, #f3f4f6); }
    .email-cell { color: var(--color-text-muted, #6b7280); font-size: 0.8rem; }

    .badge-notif {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .badge-notif-sent    { background: #d1fae5; color: #065f46; }
    .badge-notif-failed  { background: #fee2e2; color: #991b1b; }
    .badge-notif-pending { background: #fef9c3; color: #92400e; }

    .error-hint { cursor: help; color: #991b1b; margin-left: 0.25rem; }
    .text-muted { color: var(--color-text-muted, #6b7280); }
    .mt { margin-top: 1rem; }
</style>
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(app\)/assemblees-generales/\[id\]/notifications/+page.svelte
git commit -m "feat: add notifications detail page for AG open email report"
```

---

## Task 7: Identifiant oublié — server action

**Files:**
- Create: `src/routes/(auth)/login/identifiant-oublie/+page.server.ts`

- [ ] **Step 1: Write the server file**

```typescript
// src/routes/(auth)/login/identifiant-oublie/+page.server.ts
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { sendMail } from '$lib/server/email';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    return { session: locals.session, profile: locals.profile };
};

const schema = z.object({
    email: z.email()
});

export const actions: Actions = {
    default: async ({ request }) => {
        const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
        // Always return success — no account enumeration, not even for invalid email format
        if (!parsed.success) return { success: true };

        const { email } = parsed.data;
        const serviceClient = createServiceClient();

        // email is not unique — a single address can map to multiple profiles (family lots)
        const { data: profiles } = await serviceClient
            .from('profile')
            .select('first_name, last_name, credential(login)')
            .eq('email', email)
            .eq('status', 'active');

        const logins: string[] = [];
        for (const p of profiles ?? []) {
            const creds = Array.isArray(p.credential) ? p.credential : [];
            for (const c of creds) {
                if (c.login) logins.push(c.login);
            }
        }

        if (logins.length > 0) {
            const listText = logins.map((l) => `  • ${l}`).join('\n');
            const listHtml = logins.map((l) => `<li><strong>${l}</strong></li>`).join('');

            try {
                await sendMail({
                    to: email,
                    subject: 'Vos identifiants Koloti',
                    text:
                        `Bonjour,\n\n` +
                        `Voici les identifiants associés à votre adresse :\n\n${listText}\n\n` +
                        `Connectez-vous sur : ${PUBLIC_APP_URL}/login`,
                    html:
                        `<p>Bonjour,</p>` +
                        `<p>Voici les identifiants associés à votre adresse :</p>` +
                        `<ul>${listHtml}</ul>` +
                        `<p>Connectez-vous sur : <a href="${PUBLIC_APP_URL}/login">${PUBLIC_APP_URL}/login</a></p>`
                });
            } catch (e) {
                console.error('[identifiant-oublie] sendMail error:', e);
            }
        }

        return { success: true };
    }
};
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all existing tests pass (no new unit tests needed — the action is a thin coordinator with no extractable pure logic).

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(auth\)/login/identifiant-oublie/+page.server.ts
git commit -m "feat: add forgot-username server action"
```

---

## Task 8: Identifiant oublié — Svelte page

**Files:**
- Create: `src/routes/(auth)/login/identifiant-oublie/+page.svelte`

- [ ] **Step 1: Write the page**

```svelte
<!-- src/routes/(auth)/login/identifiant-oublie/+page.svelte -->
<script lang="ts">
    import type { ActionData } from './$types';
    let { form }: { form: ActionData } = $props();
    let loading = $state(false);
</script>

<svelte:head>
    <title>Identifiant oublié — Koloti</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4 bg-surface-100-900">
    <div
        class="card preset-filled-surface-50-950 rounded-2xl p-8 w-full max-w-md shadow-xl border border-surface-200-800"
    >
        <div class="text-center mb-6">
            <div class="text-4xl mb-2" aria-hidden="true">🏡</div>
            <h1 class="h2 font-bold text-surface-900-100">Koloti</h1>
            <p class="text-surface-500 text-sm mt-1">Récupération d'identifiant</p>
        </div>

        {#if form?.success}
            <div class="card preset-tonal-success rounded-xl p-3.5 text-sm mb-4" role="status">
                Si cette adresse est connue de notre système, un email vous a été envoyé.
            </div>
            <a
                href="/login"
                class="btn preset-tonal w-full rounded-lg py-2.5 text-sm font-semibold text-center block mt-4"
            >
                Retour à la connexion
            </a>
        {:else}
            <p class="text-sm text-surface-500 mb-6">
                Saisissez votre adresse email pour recevoir la liste de vos identifiants associés.
            </p>
            <form method="POST" onsubmit={() => (loading = true)} class="space-y-4">
                <label class="label block">
                    <span class="text-sm font-medium text-surface-700-300 block mb-1.5">
                        Adresse email
                    </span>
                    <input
                        name="email"
                        type="email"
                        autocomplete="email"
                        required
                        placeholder="votre@email.com"
                        class="input w-full rounded-lg border border-surface-300-700 bg-surface-100-900 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    />
                </label>
                <button
                    type="submit"
                    class="btn preset-filled-primary-500 w-full rounded-lg py-2.5 text-sm font-semibold mt-2 transition-all duration-150 hover:opacity-90 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Envoi…' : 'Recevoir mes identifiants'}
                </button>
            </form>
            <div class="mt-6 text-center">
                <a href="/login" class="text-xs text-surface-500 hover:text-surface-700-300">
                    ← Retour à la connexion
                </a>
            </div>
        {/if}
    </div>
</div>
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\(auth\)/login/identifiant-oublie/+page.svelte
git commit -m "feat: add forgot-username Svelte page"
```

---

## Task 9: Login page — "Identifiant oublié ?" link

**Files:**
- Modify: `src/routes/(auth)/login/+page.svelte`

- [ ] **Step 1: Add the link under the submit button in the `password` form block**

In `src/routes/(auth)/login/+page.svelte`, find the password form block (around line 75–112). After the submit `<button>`, add:

```svelte
<div class="mt-3 text-center">
    <a href="/login/identifiant-oublie" class="text-xs text-surface-500 hover:text-surface-700-300">
        Identifiant oublié ?
    </a>
</div>
```

- [ ] **Step 2: Add the same link under the submit button in the `magiclink` form block**

In the magiclink form block (around line 114–147), after the submit `<button>`, add the same markup:

```svelte
<div class="mt-3 text-center">
    <a href="/login/identifiant-oublie" class="text-xs text-surface-500 hover:text-surface-700-300">
        Identifiant oublié ?
    </a>
</div>
```

- [ ] **Step 3: Run type check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/\(auth\)/login/+page.svelte
git commit -m "feat: add Identifiant oublié link on login page"
```

---

## Task 10: Deploy edge function and end-to-end verification

- [ ] **Step 1: Deploy the edge function to Supabase**

```bash
npx supabase functions deploy notify-assembly-open
```

Expected: function deployed successfully.

- [ ] **Step 2: Verify Feature 1 — AG open email**

1. Open an AG in status `convened` via the UI → action returns immediately with "Opération effectuée"
2. Navigate to `/assemblees-generales/[id]/notifications` → rows appear with `pending` status
3. Refresh after a few seconds → rows update to `sent` (or `failed` if SMTP is not configured)
4. Check Mailpit (dev) or inbox (prod): each active member received an email with the AG title and link

- [ ] **Step 3: Verify Feature 2 — Identifiant oublié**

1. Go to `/login` → verify "Identifiant oublié ?" link appears under both forms
2. Click the link → lands on `/login/identifiant-oublie`
3. Enter a known email → success message displayed; check Mailpit for email listing the correct logins
4. Enter an unknown email → success message displayed; no email in Mailpit

- [ ] **Step 4: Final commit if any loose ends**

```bash
git status
# commit anything not yet committed
```
