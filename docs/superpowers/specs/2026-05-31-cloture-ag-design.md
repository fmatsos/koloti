# Design : Clôture d'une Assemblée Générale

**Date :** 2026-05-31
**Statut :** Approuvé

## Contexte

Le cycle de vie d'une AG est `draft → convened → open → closed → archived`. Les transitions `open` (convened → open) et les étapes antérieures sont implémentées. La transition `close` (open → closed) manque.

La clôture est la première étape d'un flux plus large :
1. **Clôturer** — passer statut à `closed` + horodater `closed_at` ← ce spec
2. Rédaction du PV/CR en PDF (futur)
3. Envoi email aux membres une fois le PV disponible (futur)

Le schéma DB est déjà prêt : enum `closed` et colonne `closed_at` (timestamptz nullable) existent.

## Backend

**Fichier :** `src/routes/(app)/assemblees-generales/[id]/+page.server.ts`

Ajouter une action `close` dans `export const actions` :

```
close: async ({ locals, params }) => {
  // Guard 1 : admin uniquement (pas editor)
  if (!locals.profile || locals.profile.role !== 'admin')
    return fail(403, { error: 'Non autorisé.' })

  // Guard 2 : AG doit être en statut 'open'
  const { data: current } = await supabase.from('assembly').select('status').eq('id', params.id).single()
  if (current?.status !== 'open')
    return fail(400, { error: "L'AG doit être en cours pour être clôturée." })

  // Mise à jour
  await supabase.from('assembly').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', params.id)

  // Audit log
  await writeAuditLog({ action: 'assembly.close', entity: 'assembly', entityId: params.id, payload: {} })

  return { success: true }
}
```

Pattern identique à l'action `open` existante, mais garde `admin` seul (pas `editor`).

## Frontend

**Fichier :** `src/routes/(app)/assemblees-generales/[id]/+page.svelte`

### Imports à ajouter

```svelte
import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
import { enhance } from '$app/forms';
```

### Structure du modal

Dans le bloc `{#if ag.status === 'open'}` de la section Actions, remplacer le bloc existant par :

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

`closeOnInteractOutside={false}` pour éviter une clôture accidentelle. `use:enhance` gère le rechargement automatique après succès.

### Styles à ajouter (custom CSS du fichier)

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

## Périmètre

- **Dans ce spec :** action `close`, bouton, modal de confirmation
- **Hors périmètre :** rédaction PV/CR, génération PDF, envoi email membres (futurs specs)

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/routes/(app)/assemblees-generales/[id]/+page.server.ts` | Ajouter action `close` |
| `src/routes/(app)/assemblees-generales/[id]/+page.svelte` | Bouton + modal + styles |
