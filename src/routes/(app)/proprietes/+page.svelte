<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Propriétés — Koloti</title></svelte:head>

<div class="page-header">
	<div class="header-row">
		<h1>Propriétés</h1>
		<a href="/proprietes/new" class="btn-sm">+ Nouvelle propriété</a>
	</div>
</div>

<div class="card">
	{#if data.proprietes.length === 0}
		<p class="empty">Aucune propriété.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Référence</th>
					<th>N° voie</th>
					<th>Voie</th>
					<th>Cadastre</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.proprietes as propriete (propriete.id)}
					<tr>
						<td>{propriete.reference}</td>
						<td>{propriete.street_number ?? '—'}</td>
						<td>{propriete.street_name ?? '—'}</td>
						<td class="muted">{propriete.cadastre_number ?? '—'}</td>
						<td><a href="/proprietes/{propriete.id}/view" class="link-sm">Voir</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.page-header { margin-bottom: 1.5rem; }
	.header-row { display: flex; align-items: center; justify-content: space-between; }
	h1 { margin: 0; font-size: 1.5rem; }
	.card { background: white; border-radius: var(--radius, 0.375rem); border: 1px solid var(--color-border, #e5e7eb); padding: 1.25rem; overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
	th { text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted, #6b7280); text-transform: uppercase; border-bottom: 2px solid var(--color-border, #e5e7eb); padding: 0.5rem 0.75rem; }
	td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
	.muted, .empty { color: var(--color-text-muted, #6b7280); }
	.btn-sm { padding: 0.375rem 0.875rem; background: var(--color-primary, #1a73e8); color: white; border-radius: 0.25rem; font-size: 0.8125rem; text-decoration: none; }
	.link-sm { font-size: 0.875rem; color: var(--color-primary, #1a73e8); }
</style>
