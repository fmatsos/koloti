<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const ag = $derived(data.ag);
	const agendaItems = $derived(Array.isArray(ag.agenda_item) ? ag.agenda_item : []);

	const statusLabels: Record<string, string> = {
		draft: 'Brouillon', convened: 'Convoquée', open: 'En cours', closed: 'Clôturée', archived: 'Archivée'
	};

	function formatDatetimeLocal(iso: string): string {
		return iso.slice(0, 16);
	}
</script>

<svelte:head><title>{ag.title} — AG — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/ag" class="back-link">← Assemblées</a>
	<div class="header-row">
		<h1>{ag.title}</h1>
		<span class="badge-status badge-{ag.status}">{statusLabels[ag.status] ?? ag.status}</span>
	</div>
</div>

{#if form?.success}<div class="alert-success">Opération effectuée.</div>{/if}
{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="detail-grid">
	<!-- Édition (draft seulement) -->
	<div class="card">
		<h2>Paramètres</h2>
		{#if ag.status === 'draft'}
			<form method="POST" action="?/update">
				<div class="field">
					<label for="title">Titre *</label>
					<input id="title" name="title" type="text" value={ag.title} required maxlength="255" />
				</div>
				<div class="field-row">
					<div class="field">
						<label for="type">Type *</label>
						<select id="type" name="type">
							<option value="ordinaire" selected={ag.type === 'ordinaire'}>Ordinaire</option>
							<option value="extraordinaire" selected={ag.type === 'extraordinaire'}>Extraordinaire</option>
						</select>
					</div>
					<div class="field">
						<label for="mode">Mode *</label>
						<select id="mode" name="mode">
							<option value="presentiel" selected={ag.mode === 'presentiel'}>Présentiel</option>
							<option value="en_ligne" selected={ag.mode === 'en_ligne'}>En ligne</option>
							<option value="hybride" selected={ag.mode === 'hybride'}>Hybride</option>
						</select>
					</div>
				</div>
				<div class="field">
					<label for="scheduled_at">Date et heure *</label>
					<input id="scheduled_at" name="scheduled_at" type="datetime-local" value={formatDatetimeLocal(ag.scheduled_at)} required />
				</div>
				<div class="field">
					<label for="location">Lieu</label>
					<input id="location" name="location" type="text" value={ag.location ?? ''} maxlength="300" />
				</div>
				<div class="field">
					<label for="quorum_pct">Quorum (%)</label>
					<input id="quorum_pct" name="quorum_pct" type="number" min="1" max="100" value={ag.quorum_pct} required />
				</div>
				<button type="submit" class="btn-sm">Enregistrer</button>
			</form>
		{:else}
			<dl>
				<dt>Type</dt><dd>{ag.type === 'ordinaire' ? 'Ordinaire' : 'Extraordinaire'}</dd>
				<dt>Mode</dt><dd>{ag.mode}</dd>
				<dt>Date</dt><dd>{new Date(ag.scheduled_at).toLocaleString('fr-FR')}</dd>
				<dt>Lieu</dt><dd>{ag.location ?? '—'}</dd>
				<dt>Quorum</dt><dd>{ag.quorum_pct} %</dd>
			</dl>
		{/if}
	</div>

	<!-- Actions de workflow -->
	<div class="card">
		<h2>Actions</h2>
		<div class="action-list">
			<a href="/admin/ag/{ag.id}/agenda" class="btn-action">Ordre du jour →</a>

			{#if ag.status === 'draft'}
				<a href="/admin/ag/{ag.id}/convoquer" class="btn-action">Convoquer l'AG →</a>
			{/if}

			{#if ag.status === 'convened'}
				<form method="POST" action="?/open">
					<button type="submit" class="btn-action-green">Ouvrir l'AG (marquer en cours)</button>
				</form>
				<a href="/admin/ag/{ag.id}/relancer" class="btn-action">Relancer comptes pending →</a>
			{/if}

			{#if ag.status === 'open'}
				<a href="/admin/ag/{ag.id}/emargement" class="btn-action">Émargement →</a>
				<a href="/admin/ag/{ag.id}/quorum" class="btn-action">Quorum →</a>
			{/if}
		</div>
	</div>
</div>

<!-- Ordre du jour (résumé) -->
{#if agendaItems.length > 0}
	<div class="card mt">
		<h2>Ordre du jour</h2>
		<ol class="agenda-list">
			{#each agendaItems as item}
				<li>
					<strong>{item.title}</strong>
					{#if item.requires_vote}<span class="badge-vote">Vote</span>{/if}
					{#if item.description}<p class="item-desc">{item.description}</p>{/if}
				</li>
			{/each}
		</ol>
	</div>
{/if}

<style>
	.page-header { margin-bottom: 1.5rem; }
	.back-link { display: inline-block; margin-bottom: 0.5rem; font-size: 0.875rem; text-decoration: none; color: var(--color-text-muted, #6b7280); }
	.header-row { display: flex; align-items: center; gap: 0.75rem; }
	h1 { margin: 0; font-size: 1.5rem; }
	h2 { margin: 0 0 1rem; font-size: 1rem; }
	.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
	@media (max-width: 640px) { .detail-grid { grid-template-columns: 1fr; } }
	.card { background: white; border-radius: var(--radius, 0.375rem); border: 1px solid var(--color-border, #e5e7eb); padding: 1.25rem; }
	.mt { margin-top: 1rem; }
	.field { margin-bottom: 0.75rem; }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
	label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 0.25rem; }
	input[type="text"], input[type="datetime-local"], input[type="number"], select { width: 100%; padding: 0.4rem 0.625rem; border: 1px solid var(--color-border, #e5e7eb); border-radius: 0.25rem; font-size: 0.875rem; box-sizing: border-box; }
	.btn-sm { padding: 0.375rem 0.875rem; background: var(--color-primary, #1a73e8); color: white; border: none; border-radius: 0.25rem; font-size: 0.8125rem; cursor: pointer; }
	dl { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; font-size: 0.875rem; margin: 0; }
	dt { font-weight: 500; color: var(--color-text-muted, #6b7280); }
	dd { margin: 0; }
	.action-list { display: flex; flex-direction: column; gap: 0.5rem; }
	.btn-action { display: block; padding: 0.5rem 0.875rem; background: #f3f4f6; color: var(--color-text, #111827); border-radius: 0.25rem; font-size: 0.875rem; text-decoration: none; text-align: center; }
	.btn-action-green { width: 100%; padding: 0.5rem 0.875rem; background: #16a34a; color: white; border: none; border-radius: 0.25rem; font-size: 0.875rem; cursor: pointer; }
	.badge-status { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 9999px; }
	.badge-draft { background: #fef9c3; color: #854d0e; }
	.badge-convened { background: #dbeafe; color: #1e40af; }
	.badge-open { background: #dcfce7; color: #15803d; }
	.badge-closed, .badge-archived { background: #f3f4f6; color: #6b7280; }
	.agenda-list { padding-left: 1.25rem; margin: 0; font-size: 0.875rem; }
	.agenda-list li { padding: 0.375rem 0; }
	.item-desc { margin: 0.125rem 0 0; color: var(--color-text-muted, #6b7280); font-size: 0.8125rem; }
	.badge-vote { display: inline-block; background: #ede9fe; color: #6d28d9; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 9999px; margin-left: 0.375rem; }
	.alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
	.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
</style>
