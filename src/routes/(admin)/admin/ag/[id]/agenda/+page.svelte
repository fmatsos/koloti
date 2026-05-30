<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const ag = $derived(data.ag);
	const items = $derived(data.items);
	const editable = $derived(ag.status === 'draft');
	let editingId = $state<string | null>(null);
</script>

<svelte:head><title>Ordre du jour — {ag.title} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/ag/{ag.id}" class="back-link">← {ag.title}</a>
	<h1>Ordre du jour</h1>
</div>

{#if form?.success}<div class="alert-success">Opération effectuée.</div>{/if}
{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

{#if !editable}
	<div class="alert-info">L'ordre du jour ne peut être modifié que si l'AG est en brouillon.</div>
{/if}

<div class="card">
	{#if items.length === 0}
		<p class="empty">Aucun point à l'ordre du jour.</p>
	{:else}
		<ol class="agenda-list">
			{#each items as item (item.id)}
				<li class="agenda-item">
					{#if editingId === item.id}
						<form method="POST" action="?/update" class="edit-form">
							<input type="hidden" name="item_id" value={item.id} />
							<input name="title" type="text" value={item.title} required />
							<textarea name="description" rows="2">{item.description ?? ''}</textarea>
							<div class="field-check">
								<input
									id="rv-{item.id}"
									name="requires_vote"
									type="checkbox"
									value="true"
									checked={item.requires_vote}
								/>
								<label for="rv-{item.id}">Nécessite un vote</label>
							</div>
							<div class="edit-actions">
								<button type="submit" class="btn-sm">Enregistrer</button>
								<button type="button" class="btn-ghost" onclick={() => (editingId = null)}
									>Annuler</button
								>
							</div>
						</form>
					{:else}
						<div class="item-content">
							<div>
								<strong>{item.title}</strong>
								{#if item.requires_vote}<span class="badge-vote">Vote</span>{/if}
								{#if item.description}<p class="item-desc">{item.description}</p>{/if}
							</div>
							{#if editable}
								<div class="item-actions">
									<form method="POST" action="?/move" style="display:inline">
										<input type="hidden" name="item_id" value={item.id} />
										<input type="hidden" name="direction" value="up" />
										<button type="submit" class="btn-icon" title="Monter">↑</button>
									</form>
									<form method="POST" action="?/move" style="display:inline">
										<input type="hidden" name="item_id" value={item.id} />
										<input type="hidden" name="direction" value="down" />
										<button type="submit" class="btn-icon" title="Descendre">↓</button>
									</form>
									<button
										type="button"
										class="btn-icon"
										onclick={() => (editingId = item.id)}
										title="Modifier">✎</button
									>
									<form method="POST" action="?/delete" style="display:inline">
										<input type="hidden" name="item_id" value={item.id} />
										<button type="submit" class="btn-icon-danger" title="Supprimer">✕</button>
									</form>
								</div>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}

	{#if editable}
		<div class="add-section">
			<h3>Ajouter un point</h3>
			<form method="POST" action="?/add">
				<div class="field">
					<input name="title" type="text" placeholder="Titre du point *" required maxlength="255" />
				</div>
				<div class="field">
					<textarea
						name="description"
						rows="2"
						placeholder="Description (facultatif)"
						maxlength="2000"
					></textarea>
				</div>
				<div class="field-check">
					<input id="requires_vote_new" name="requires_vote" type="checkbox" value="true" />
					<label for="requires_vote_new">Nécessite un vote</label>
				</div>
				<button type="submit" class="btn-sm">Ajouter</button>
			</form>
		</div>
	{/if}
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.back-link {
		display: inline-block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		text-decoration: none;
		color: var(--color-text-muted, #6b7280);
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h3 {
		font-size: 0.9375rem;
		margin: 0 0 0.75rem;
	}
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
		max-width: 720px;
	}
	.agenda-list {
		list-style: none;
		counter-reset: agenda;
		padding: 0;
		margin: 0 0 1.5rem;
	}
	.agenda-item {
		counter-increment: agenda;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f3f4f6;
	}
	.agenda-item::before {
		content: counter(agenda) '. ';
		font-weight: 600;
		color: var(--color-text-muted, #6b7280);
	}
	.item-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.item-desc {
		margin: 0.25rem 0 0;
		color: var(--color-text-muted, #6b7280);
		font-size: 0.8125rem;
	}
	.item-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}
	.btn-icon {
		padding: 0.2rem 0.4rem;
		background: #f3f4f6;
		border: none;
		border-radius: 0.2rem;
		font-size: 0.875rem;
		cursor: pointer;
	}
	.btn-icon-danger {
		padding: 0.2rem 0.4rem;
		background: #fee2e2;
		color: #dc2626;
		border: none;
		border-radius: 0.2rem;
		font-size: 0.875rem;
		cursor: pointer;
	}
	.badge-vote {
		display: inline-block;
		background: #ede9fe;
		color: #6d28d9;
		font-size: 0.7rem;
		padding: 0.1rem 0.4rem;
		border-radius: 9999px;
		margin-left: 0.375rem;
	}
	.edit-form {
		padding-top: 0.25rem;
	}
	.edit-form input[type='text'] {
		width: 100%;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
		margin-bottom: 0.375rem;
	}
	.edit-form textarea {
		width: 100%;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
		margin-bottom: 0.375rem;
		resize: vertical;
	}
	.edit-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.375rem;
	}
	.add-section {
		border-top: 1px solid #e5e7eb;
		padding-top: 1.25rem;
	}
	.field {
		margin-bottom: 0.5rem;
	}
	.field-check {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}
	.add-section input[type='text'] {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
	}
	.add-section textarea {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
		resize: vertical;
	}
	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.btn-ghost {
		padding: 0.375rem 0.875rem;
		background: none;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.empty {
		color: var(--color-text-muted, #6b7280);
		font-size: 0.875rem;
	}
	.alert-success {
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.alert-info {
		background: #eff6ff;
		color: #1e40af;
		border: 1px solid #bfdbfe;
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
</style>
