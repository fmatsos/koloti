<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const statusLabels: Record<string, string> = {
		draft: 'Brouillon',
		convened: 'Convoquée',
		open: 'En cours',
		closed: 'Clôturée',
		archived: 'Archivée'
	};
	const statusColors: Record<string, string> = {
		draft: 'badge-draft',
		convened: 'badge-convened',
		open: 'badge-open',
		closed: 'badge-closed',
		archived: 'badge-archived'
	};
</script>

<svelte:head><title>Assemblées générales — Koloti</title></svelte:head>

<div class="page-header">
	<div class="header-row">
		<h1>Assemblées générales</h1>
		{#if data.isAdminOrEditor}
			<a href="/assemblees-generales/new" class="btn-sm">+ Nouvelle AG</a>
		{/if}
	</div>
</div>

{#if data.assemblees.length === 0}
	<p class="empty">Aucune assemblée disponible.</p>
{:else}
	<div class="card">
		<table>
			<thead>
				<tr>
					<th>Titre</th>
					<th>Type</th>
					<th>Statut</th>
					<th>Date</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.assemblees as ag (ag.id)}
					<tr>
						<td>{ag.title}</td>
						<td class="muted">{ag.type === 'ordinaire' ? 'AGO' : 'AGE'}</td>
						<td>
							<span class={statusColors[ag.status] ?? ''}>
								{statusLabels[ag.status] ?? ag.status}
							</span>
						</td>
						<td class="muted">
							{ag.scheduled_at ? new Date(ag.scheduled_at).toLocaleDateString('fr-FR') : '—'}
						</td>
						<td><a href="/assemblees-generales/{ag.id}" class="link">Voir</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.empty {
		color: var(--color-text-muted, #6b7280);
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
	}
	.muted {
		color: var(--color-text-muted, #6b7280);
	}
	.link {
		font-size: 0.875rem;
		color: var(--color-primary, #1a73e8);
	}
	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		text-decoration: none;
	}
	.badge-draft {
		display: inline-block;
		background: #fef9c3;
		color: #854d0e;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
	.badge-convened {
		display: inline-block;
		background: #dbeafe;
		color: #1e40af;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
	.badge-open {
		display: inline-block;
		background: #dcfce7;
		color: #15803d;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
	.badge-closed {
		display: inline-block;
		background: #f3f4f6;
		color: #374151;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
	.badge-archived {
		display: inline-block;
		background: #f3f4f6;
		color: #9ca3af;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
</style>
