<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statusLabels = {
		pending: 'En attente',
		active: 'Actif',
		inactive: 'Inactif'
	};

	const roleLabels = {
		admin: 'Admin',
		editor: 'Éditeur',
		member: 'Membre'
	};

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Comptes — Administration Koloti</title>
</svelte:head>

<div class="page-header">
	<h1>Gestion des comptes</h1>
	<a href="/admin/comptes/nouveau" class="btn-primary">+ Nouveau compte</a>
</div>

<div class="filters">
	<form method="GET" class="filter-form">
		<input
			type="search"
			name="q"
			placeholder="Rechercher nom, email…"
			value={data.search}
			class="search-input"
		/>
		<select name="status" class="select-filter">
			<option value="all" selected={data.statusFilter === 'all'}>Tous les statuts</option>
			<option value="pending" selected={data.statusFilter === 'pending'}>En attente</option>
			<option value="active" selected={data.statusFilter === 'active'}>Actifs</option>
			<option value="inactive" selected={data.statusFilter === 'inactive'}>Inactifs</option>
		</select>
		<button type="submit" class="btn-secondary">Filtrer</button>
	</form>
	<p class="result-count">{data.comptes.length} compte(s)</p>
</div>

{#if data.error}
	<div class="alert alert-error">{data.error}</div>
{/if}

<div class="table-wrapper">
	<table class="data-table">
		<thead>
			<tr>
				<th>Identifiant</th>
				<th>Nom</th>
				<th>Email</th>
				<th>Rôle</th>
				<th>Statut</th>
				<th>Dernière connexion</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.comptes as compte (compte.id)}
				{@const cred = Array.isArray(compte.credential) ? compte.credential[0] : compte.credential}
				<tr class="status-{compte.status}">
					<td>
						<code class="login">{cred?.login ?? '—'}</code>
					</td>
					<td>{compte.full_name}</td>
					<td>{compte.email}</td>
					<td>
						<span class="badge badge-role-{compte.role}">
							{roleLabels[compte.role]}
						</span>
					</td>
					<td>
						<span class="badge badge-status-{compte.status}">
							{statusLabels[compte.status]}
						</span>
					</td>
					<td class="date-cell">
						{formatDate(compte.last_login_at)}
					</td>
					<td>
						<a href="/admin/comptes/{compte.id}" class="link-action">Gérer</a>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="empty-row">Aucun compte trouvé.</td>
				</tr>
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

	.filters {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.filter-form {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.search-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.875rem;
		min-width: 200px;
	}

	.select-filter {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.875rem;
		background: white;
	}

	.result-count {
		color: var(--color-text-muted, #6b7280);
		font-size: 0.875rem;
		margin: 0;
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
		white-space: nowrap;
	}

	.data-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f3f4f6;
		vertical-align: middle;
	}

	.data-table tr:last-child td {
		border-bottom: none;
	}

	.login {
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

	.badge-status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.badge-status-active {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-status-inactive {
		background: #f3f4f6;
		color: #6b7280;
	}

	.badge-role-admin {
		background: #ede9fe;
		color: #5b21b6;
	}

	.badge-role-editor {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-role-member {
		background: #f3f4f6;
		color: #374151;
	}

	.date-cell {
		white-space: nowrap;
		color: var(--color-text-muted, #6b7280);
	}

	.link-action {
		font-size: 0.875rem;
		text-decoration: none;
	}

	.empty-row {
		text-align: center;
		color: var(--color-text-muted, #6b7280);
		padding: 2rem !important;
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

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.875rem;
		cursor: pointer;
	}
</style>
