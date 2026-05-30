<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>État nominatif — Koloti</title></svelte:head>

<div class="page-header">
	<div class="header-row">
		<h1>État nominatif</h1>
		<a href="/etat-nominatif/export.csv" class="btn-export" download>Exporter CSV</a>
	</div>
</div>

<div class="card">
	{#if data.properties.length === 0}
		<p class="empty">Aucune propriété enregistrée.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Référence</th>
					<th>Adresse</th>
					<th>Poids</th>
					<th>Propriétaire(s) actuel(s)</th>
				</tr>
			</thead>
			<tbody>
				{#each data.properties as prop (prop.id)}
					{#if prop.activeOwnerships.length === 0}
						<tr>
							<td><a href="/proprietes/{prop.id}/view">{prop.reference}</a></td>
							<td>{prop.formattedAddress || '—'}</td>
							<td class="center">{prop.vote_weight}</td>
							<td class="empty-cell">—</td>
						</tr>
					{:else}
						{#each prop.activeOwnerships as o, i (o.id)}
							{@const profile = Array.isArray(o.profile) ? o.profile[0] : o.profile}
							<tr class={i > 0 ? 'continuation' : ''}>
								{#if i === 0}
									<td rowspan={prop.activeOwnerships.length}>
										<a href="/proprietes/{prop.id}/view">{prop.reference}</a>
									</td>
									<td rowspan={prop.activeOwnerships.length}>{prop.formattedAddress || '—'}</td>
									<td rowspan={prop.activeOwnerships.length} class="center">{prop.vote_weight}</td>
								{/if}
								<td>
									{profile?.full_name ?? '—'}
									{#if o.is_primary}<span class="badge">Principal</span>{/if}
									<br /><small class="muted">{profile?.email ?? ''}</small>
								</td>
							</tr>
						{/each}
					{/if}
				{/each}
			</tbody>
		</table>
		<p class="count">
			{data.properties.length} propriété(s) · {data.properties.reduce(
				(s, p) => s + p.activeOwnerships.length,
				0
			)} propriétaire(s) actif(s)
		</p>
	{/if}
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.header-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.btn-export {
		padding: 0.375rem 0.875rem;
		background: #16a34a;
		color: white;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		text-decoration: none;
		white-space: nowrap;
	}
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
		overflow-x: auto;
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
		vertical-align: top;
	}
	.continuation td {
		border-top: none;
	}
	.center {
		text-align: center;
	}
	.empty-cell {
		color: var(--color-text-muted, #6b7280);
	}
	.badge {
		display: inline-block;
		background: #dbeafe;
		color: #1e40af;
		font-size: 0.7rem;
		padding: 0.1rem 0.4rem;
		border-radius: 9999px;
		margin-left: 0.375rem;
	}
	.muted {
		color: var(--color-text-muted, #6b7280);
	}
	.empty {
		color: var(--color-text-muted, #6b7280);
		font-size: 0.875rem;
	}
	.count {
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted, #6b7280);
		text-align: right;
	}
	a {
		color: var(--color-primary, #1a73e8);
	}
</style>
