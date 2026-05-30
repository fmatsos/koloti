<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Propriétés — Administration Koloti</title></svelte:head>

<div class="page-header">
	<h1>Propriétés / Lots</h1>
	<a href="/admin/proprietes/nouvelle" class="btn-primary">+ Nouvelle propriété</a>
</div>

<div class="table-wrapper">
	<table class="data-table">
		<thead>
			<tr>
				<th>Référence</th>
				<th>Adresse</th>
				<th>Poids de vote</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.proprietes as p (p.id)}
				<tr>
					<td><strong>{p.reference}</strong></td>
					<td>{p.address ?? '—'}</td>
					<td>{p.vote_weight}</td>
					<td><a href="/admin/proprietes/{p.id}">Gérer</a></td>
				</tr>
			{:else}
				<tr><td colspan="4" class="empty">Aucune propriété.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.table-wrapper {
		overflow-x: auto;
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
	}
	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	.data-table th {
		text-align: left;
		padding: 0.75rem 1rem;
		border-bottom: 2px solid var(--color-border, #e5e7eb);
		font-weight: 600;
		color: var(--color-text-muted, #6b7280);
	}
	.data-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f3f4f6;
	}
	.data-table tr:last-child td {
		border-bottom: none;
	}
	.empty {
		text-align: center;
		color: var(--color-text-muted, #6b7280);
		padding: 2rem !important;
	}
	.btn-primary {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		text-decoration: none;
		border-radius: var(--radius, 0.375rem);
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
