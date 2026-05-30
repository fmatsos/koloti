<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statusLabels = { pending: 'En attente', active: 'Actif', inactive: 'Inactif' };
	const roleLabels = { admin: 'Admin', editor: 'Éditeur', member: 'Membre' };

	function fmt(date: string | null) {
		return date ? new Date(date).toLocaleDateString('fr-FR') : '—';
	}
</script>

<svelte:head><title>Comptes — Koloti</title></svelte:head>

<div class="page-header">
	<div class="header-row">
		<h1>Comptes</h1>
		<a href="/comptes/new" class="btn-sm">+ Nouveau compte</a>
	</div>
</div>

<form class="filters" method="GET">
	<input name="q" type="search" placeholder="Nom ou email..." value={data.search} />
	<select name="status">
		<option value="">Tous les statuts</option>
		<option value="pending" selected={data.statusFilter === 'pending'}>En attente</option>
		<option value="active" selected={data.statusFilter === 'active'}>Actifs</option>
		<option value="inactive" selected={data.statusFilter === 'inactive'}>Inactifs</option>
	</select>
	<button type="submit" class="btn-sm btn-outline">Filtrer</button>
</form>

<div class="card">
	{#if data.comptes.length === 0}
		<p class="empty">Aucun compte trouvé.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Login</th>
					<th>Nom</th>
					<th>Email</th>
					<th>Rôle</th>
					<th>Statut</th>
					<th>Dernière connexion</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.comptes as compte (compte.id)}
					{@const cred = Array.isArray(compte.credential) ? compte.credential[0] : compte.credential}
					<tr>
						<td><code>{cred?.login ?? '—'}</code></td>
						<td>{compte.full_name}</td>
						<td>{compte.email}</td>
						<td>{roleLabels[compte.role]}</td>
						<td><span class="badge badge-{compte.status}">{statusLabels[compte.status]}</span></td>
						<td class="muted">{fmt(compte.last_login_at)}</td>
						<td><a href="/comptes/{compte.id}/view" class="link-sm">Voir</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
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
	.filters {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}
	.filters input,
	.filters select {
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
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
		border-bottom: 2px solid var(--color-border, #e5e7eb);
		padding: 0.5rem 0.75rem;
	}
	td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #f3f4f6;
	}
	.muted,
	.empty {
		color: var(--color-text-muted, #6b7280);
	}
	code {
		background: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
	}
	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}
	.badge-pending {
		background: #fef3c7;
		color: #92400e;
	}
	.badge-active {
		background: #d1fae5;
		color: #065f46;
	}
	.badge-inactive {
		background: #f3f4f6;
		color: #6b7280;
	}
	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		cursor: pointer;
		text-decoration: none;
	}
	.btn-outline {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}
	.link-sm {
		font-size: 0.875rem;
		color: var(--color-primary, #1a73e8);
	}
</style>
