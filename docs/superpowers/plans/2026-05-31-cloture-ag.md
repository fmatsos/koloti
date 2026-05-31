# Clôture d'une Assemblée Générale — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'action `close` (open → closed) sur la page détail d'une AG, avec un bouton "Clôturer l'AG" réservé aux admins et une confirmation via le composant `Dialog` de Skeleton UI v4.

**Architecture:** Une action SvelteKit `close` est ajoutée dans `[id]/+page.server.ts`, calquée sur l'action `open` existante mais restreinte aux admins. Côté client, un composant `Dialog` de `@skeletonlabs/skeleton-svelte` remplace le pattern de modal natif pour rester cohérent avec la charte Skeleton UI v4 du projet.

**Tech Stack:** SvelteKit actions, Supabase (service client), `@skeletonlabs/skeleton-svelte` v4 (`Dialog`, `Portal`), Vitest (tests unitaires d'action), `$app/forms` `enhance`.

---

## Fichiers touchés

| Fichier | Rôle |
|---|---|
| `src/routes/(app)/assemblees-generales/[id]/+page.server.ts` | Ajouter l'action `close` |
| `src/routes/(app)/assemblees-generales/[id]/+page.svelte` | Ajouter bouton + Dialog + style |
| `src/tests/ag-close-action.test.ts` | Tests unitaires de l'action `close` |

---

## Task 1 : Tests de l'action `close`

**Files:**
- Create: `src/tests/ag-close-action.test.ts`

- [ ] **Step 1 : Écrire le fichier de test complet**

Le pattern suit exactement `src/tests/change-credentials-action.test.ts` : mock du client Supabase, import de l'action après le mock.

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockClient: any;

vi.mock('$lib/server/supabase', () => ({
  createServiceClient: () => mockClient
}));

vi.mock('$lib/server/audit', () => ({
  writeAuditLog: vi.fn(async () => {})
}));

import { actions } from '../routes/(app)/assemblees-generales/[id]/+page.server';

function buildMockClient(currentStatus: string, updateError: unknown = null) {
  const updates: Array<Record<string, unknown>> = [];

  const assemblyBuilder = {
    select: vi.fn(() => assemblyBuilder),
    update: vi.fn((payload: Record<string, unknown>) => {
      updates.push(payload);
      return { eq: vi.fn(async () => ({ error: updateError })) };
    }),
    eq: vi.fn(() => assemblyBuilder),
    single: vi.fn(async () => ({ data: { status: currentStatus }, error: null }))
  };

  return {
    client: { from: vi.fn(() => assemblyBuilder) },
    updates
  };
}

function buildLocals(role: string | null) {
  return {
    profile: role ? { id: 'profile-uuid', role } : null,
    session: null
  };
}

function buildParams(id = 'ag-uuid') {
  return { id };
}

describe('actions.close', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne 403 si non connecté', async () => {
    const { client } = buildMockClient('open');
    mockClient = client;
    const result = await actions.close({
      locals: buildLocals(null),
      params: buildParams(),
      request: new Request('http://localhost')
    } as never);
    expect(result).toMatchObject({ status: 403 });
  });

  it('retourne 403 si rôle editor', async () => {
    const { client } = buildMockClient('open');
    mockClient = client;
    const result = await actions.close({
      locals: buildLocals('editor'),
      params: buildParams(),
      request: new Request('http://localhost')
    } as never);
    expect(result).toMatchObject({ status: 403 });
  });

  it('retourne 400 si statut !== open', async () => {
    const { client } = buildMockClient('convened');
    mockClient = client;
    const result = await actions.close({
      locals: buildLocals('admin'),
      params: buildParams(),
      request: new Request('http://localhost')
    } as never);
    expect(result).toMatchObject({ status: 400 });
  });

  it('met à jour status=closed et closed_at si admin + statut open', async () => {
    const { client, updates } = buildMockClient('open');
    mockClient = client;
    const result = await actions.close({
      locals: buildLocals('admin'),
      params: buildParams(),
      request: new Request('http://localhost')
    } as never);
    expect(result).toMatchObject({ data: { success: true } });
    expect(updates[0]).toMatchObject({ status: 'closed' });
    expect(typeof updates[0].closed_at).toBe('string');
  });

  it('retourne 400 si la mise à jour DB échoue', async () => {
    const { client } = buildMockClient('open', { message: 'DB error' });
    mockClient = client;
    const result = await actions.close({
      locals: buildLocals('admin'),
      params: buildParams(),
      request: new Request('http://localhost')
    } as never);
    expect(result).toMatchObject({ status: 400 });
  });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
npx vitest run src/tests/ag-close-action.test.ts
```

Attendu : FAIL — `actions.close` n'existe pas encore.

- [ ] **Step 3 : Commit du fichier de test**

```bash
git add src/tests/ag-close-action.test.ts
git commit -m "test: add failing tests for AG close action"
```

---

## Task 2 : Action `close` dans le serveur

**Files:**
- Modify: `src/routes/(app)/assemblees-generales/[id]/+page.server.ts`

- [ ] **Step 1 : Ajouter l'action `close` après l'action `open` existante**

Ouvrir le fichier. À la fin du bloc `export const actions`, après la fermeture de l'action `open` (ligne ~105), ajouter :

```typescript
	close: async ({ locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data: current } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (current?.status !== 'open')
			return fail(400, { error: "L'AG doit être en cours pour être clôturée." });

		const { error: err } = await supabase
			.from('assembly')
			.update({
				status: 'closed',
				closed_at: new Date().toISOString()
			})
			.eq('id', params.id);

		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'assembly.close',
			entity: 'assembly',
			entityId: params.id,
			payload: {}
		});
		return { success: true };
	}
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils passent**

```bash
npx vitest run src/tests/ag-close-action.test.ts
```

Attendu : tous les tests PASS.

- [ ] **Step 3 : Vérifier que les autres tests du projet passent toujours**

```bash
npx vitest run
```

Attendu : aucune régression.

- [ ] **Step 4 : Commit**

```bash
git add src/routes/(app)/assemblees-generales/[id]/+page.server.ts
git commit -m "feat: add close action for AG (open → closed, admin only)"
```

---

## Task 3 : Bouton + Dialog sur la page détail

**Files:**
- Modify: `src/routes/(app)/assemblees-generales/[id]/+page.svelte`

- [ ] **Step 1 : Ajouter les imports dans le bloc `<script>`**

Dans le bloc `<script lang="ts">` existant (lignes 1-18), ajouter après la ligne `let { data, form } = $props()` :

```svelte
	import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { enhance } from '$app/forms';
```

- [ ] **Step 2 : Remplacer le bloc `{#if ag.status === 'open'}` dans la section Actions**

Trouver ce bloc (lignes 130-133) :

```svelte
				{#if ag.status === 'open'}
					<a href="/assemblees-generales/{ag.id}/emargement" class="btn-action">Émargement →</a>
					<a href="/assemblees-generales/{ag.id}/quorum" class="btn-action">Quorum →</a>
				{/if}
```

Le remplacer par :

```svelte
				{#if ag.status === 'open'}
					<a href="/assemblees-generales/{ag.id}/emargement" class="btn-action">Émargement →</a>
					<a href="/assemblees-generales/{ag.id}/quorum" class="btn-action">Quorum →</a>

					{#if data.profile?.role === 'admin'}
						<Dialog closeOnInteractOutside={false}>
							<Dialog.Trigger class="btn-action-danger w-full">Clôturer l'AG</Dialog.Trigger>
							<Portal>
								<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
								<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
									<Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-6 space-y-4 shadow-xl">
										<Dialog.Title class="text-lg font-bold">Clôturer l'assemblée générale</Dialog.Title>
										<Dialog.Description>
											Cette action est irréversible. L'AG passera au statut "Clôturée".
										</Dialog.Description>
										<footer class="flex justify-end gap-2">
											<Dialog.CloseTrigger class="btn preset-tonal">Annuler</Dialog.CloseTrigger>
											<form method="POST" action="?/close" use:enhance>
												<button type="submit" class="btn preset-filled-error-500">Clôturer</button>
											</form>
										</footer>
									</Dialog.Content>
								</Dialog.Positioner>
							</Portal>
						</Dialog>
					{/if}
				{/if}
```

- [ ] **Step 3 : Ajouter le style `.btn-action-danger` dans le bloc `<style>`**

À la fin du bloc `<style>` existant (avant la balise `</style>` de fermeture), ajouter :

```css
	.btn-action-danger {
		display: block;
		padding: 0.5rem 0.875rem;
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
		text-align: center;
	}
```

- [ ] **Step 4 : Vérifier la compilation**

```bash
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5
```

Attendu : `0 errors` (warnings éventuels sur des fichiers non touchés sont acceptables).

- [ ] **Step 5 : Commit**

```bash
git add src/routes/(app)/assemblees-generales/[id]/+page.svelte
git commit -m "feat: add close AG button with Skeleton UI Dialog confirmation"
```

---

## Self-Review

**Couverture spec :**
- ✅ Guard admin-only → Task 2 + testé Task 1
- ✅ Guard statut `open` → Task 2 + testé Task 1
- ✅ Mise à jour `status='closed'` + `closed_at` → Task 2 + testé Task 1
- ✅ Audit log `assembly.close` → Task 2
- ✅ Dialog Skeleton UI v4 avec `closeOnInteractOutside={false}` → Task 3
- ✅ Bouton visible uniquement si `admin` → Task 3
- ✅ Style `.btn-action-danger` → Task 3

**Placeholders :** aucun.

**Cohérence des types :** `fail(403, ...)` / `fail(400, ...)` / `{ success: true }` cohérents entre tests et implémentation. `data.profile?.role` correspond bien au type `locals.profile.role` exposé via `PageData`.
