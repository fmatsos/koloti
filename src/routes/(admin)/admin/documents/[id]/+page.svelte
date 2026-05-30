<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const doc = $derived(data.doc);

	const typeLabels: Record<string, string> = {
		statuts: 'Statuts',
		pv_ag: 'PV AG',
		budget: 'Budget',
		facture: 'Facture',
		cahier_charges: 'Cahier des charges',
		convocation: 'Convocation',
		courrier: 'Courrier',
		autre: 'Autre'
	};
	function formatSize(bytes: number | null): string {
		if (!bytes) return '—';
		if (bytes < 1024) return `${bytes} o`;
		if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
		return `${(bytes / 1048576).toFixed(1)} Mo`;
	}
</script>

<svelte:head><title>{doc.title} — Documents — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/documents" class="back-link">← Documents</a>
	<h1>{doc.title}</h1>
</div>

{#if form?.success && !form?.deleted}<div class="alert-success">Visibilité mise à jour.</div>{/if}
{#if form?.deleted}<div class="alert-success">Document supprimé.</div>{/if}
{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="detail-grid">
	<div class="card">
		<h2>Informations</h2>
		<dl>
			<dt>Type</dt>
			<dd>{typeLabels[doc.type] ?? doc.type}</dd>
			<dt>Année</dt>
			<dd>{doc.year ?? '—'}</dd>
			<dt>Taille</dt>
			<dd>{formatSize(doc.size_bytes)}</dd>
			<dt>MIME</dt>
			<dd class="muted">{doc.mime_type ?? '—'}</dd>
			<dt>Ajouté le</dt>
			<dd>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</dd>
			{#if doc.description}<dt>Description</dt>
				<dd>{doc.description}</dd>{/if}
		</dl>

		<a href="/documents/{doc.id}/download" class="btn-download" target="_blank" rel="noopener">
			Télécharger
		</a>
	</div>

	<div class="card">
		<h2>Visibilité</h2>
		<form method="POST" action="?/updateVisibility">
			<div class="field">
				<select name="visibility">
					<option value="members" selected={doc.visibility === 'members'}>Membres</option>
					<option value="editors" selected={doc.visibility === 'editors'}>Éditeurs et admins</option
					>
					<option value="admin" selected={doc.visibility === 'admin'}>Admins uniquement</option>
				</select>
			</div>
			<button type="submit" class="btn-sm">Enregistrer</button>
		</form>

		<div class="danger-zone">
			<form
				method="POST"
				action="?/delete"
				onsubmit={(e) => {
					if (!confirm('Supprimer définitivement ce document ?')) e.preventDefault();
				}}
			>
				<button type="submit" class="btn-danger">Supprimer</button>
			</form>
		</div>
	</div>
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
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
		word-break: break-word;
	}
	h2 {
		margin: 0 0 1rem;
		font-size: 1rem;
	}
	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 640px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}
	}
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 1rem;
		font-size: 0.875rem;
		margin: 0 0 1rem;
	}
	dt {
		font-weight: 500;
		color: var(--color-text-muted, #6b7280);
	}
	dd {
		margin: 0;
	}
	.muted {
		color: var(--color-text-muted, #6b7280);
	}
	.field {
		margin-bottom: 0.75rem;
	}
	select {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
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
	.btn-download {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.375rem 0.875rem;
		background: #16a34a;
		color: white;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		text-decoration: none;
	}
	.danger-zone {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #fee2e2;
	}
	.btn-danger {
		padding: 0.5rem 1rem;
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
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
</style>
