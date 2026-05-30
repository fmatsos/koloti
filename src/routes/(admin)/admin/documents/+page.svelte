<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

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
	const visLabels: Record<string, string> = {
		members: 'Membres',
		editors: 'Éditeurs',
		admin: 'Admins'
	};

	function formatSize(bytes: number | null): string {
		if (!bytes) return '—';
		if (bytes < 1024) return `${bytes} o`;
		if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
		return `${(bytes / 1048576).toFixed(1)} Mo`;
	}
</script>

<svelte:head><title>Documents — Admin — Koloti</title></svelte:head>

<div class="page-header">
	<div class="header-row">
		<h1>Documents</h1>
		<a href="/admin/documents/new" class="btn-sm">+ Téléverser</a>
	</div>
</div>

<div class="filters card">
	<form method="GET">
		<select name="type" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}>
			<option value="">Tous types</option>
			{#each Object.entries(typeLabels) as [val, label] (val)}
				<option value={val} selected={data.typeFilter === val}>{label}</option>
			{/each}
		</select>
		<input
			type="number"
			name="year"
			value={data.yearFilter}
			placeholder="Année"
			min="2000"
			max="2100"
			onchange={(e) => (e.currentTarget as HTMLInputElement).form?.submit()}
		/>
	</form>
</div>

<div class="card">
	{#if data.docs.length === 0}
		<p class="empty">Aucun document.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Titre</th>
					<th>Type</th>
					<th>Visibilité</th>
					<th>Année</th>
					<th>Taille</th>
					<th>Date</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.docs as doc (doc.id)}
					<tr>
						<td>{doc.title}</td>
						<td>{typeLabels[doc.type] ?? doc.type}</td>
						<td>{visLabels[doc.visibility] ?? doc.visibility}</td>
						<td class="center">{doc.year ?? '—'}</td>
						<td class="right muted">{formatSize(doc.size_bytes)}</td>
						<td class="muted">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</td>
						<td><a href="/admin/documents/{doc.id}" class="link-sm">Gérer</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.page-header {
		margin-bottom: 1rem;
	}
	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
		overflow-x: auto;
	}
	.filters {
		margin-bottom: 1rem;
	}
	.filters form {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}
	.filters select,
	.filters input {
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}
	.filters input {
		width: 100px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	th {
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 2px solid #e5e7eb;
		padding: 0.5rem 0.75rem;
	}
	td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #f3f4f6;
	}
	.center {
		text-align: center;
	}
	.right {
		text-align: right;
	}
	.muted {
		color: var(--color-text-muted, #6b7280);
	}
	.empty {
		color: var(--color-text-muted, #6b7280);
		font-size: 0.875rem;
	}
	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		text-decoration: none;
	}
	.link-sm {
		font-size: 0.875rem;
		color: var(--color-primary, #1a73e8);
	}
</style>
