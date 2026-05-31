<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statusLabels = { pending: 'En attente', active: 'Actif', inactive: 'Inactif' };
	const roleLabels = { admin: 'Admin', editor: 'Éditeur', member: 'Membre' };

	type StatusKey = 'pending' | 'active' | 'inactive';
	const statusPresets: Record<StatusKey, string> = {
		pending: 'preset-tonal-warning',
		active: 'preset-tonal-success',
		inactive: 'preset-tonal-surface'
	};

	function fmt(date: string | null) {
		return date ? new Date(date).toLocaleDateString('fr-FR') : '—';
	}
</script>

<svelte:head><title>Comptes — Koloti</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="h3 font-bold">Comptes</h1>
		<a href="/comptes/new" class="btn preset-filled-primary-500 rounded-lg text-sm px-4 py-2">
			+ Nouveau compte
		</a>
	</div>

	<form class="flex flex-wrap gap-3 items-center" method="GET">
		<input
			name="q"
			type="search"
			placeholder="Nom ou email..."
			value={data.search}
			class="input rounded-lg border border-surface-300-700 bg-surface-50-950 px-3 py-2 text-sm"
		/>
		<select
			name="status"
			class="select rounded-lg border border-surface-300-700 bg-surface-50-950 px-3 py-2 text-sm"
		>
			<option value="">Tous les statuts</option>
			<option value="pending" selected={data.statusFilter === 'pending'}>En attente</option>
			<option value="active" selected={data.statusFilter === 'active'}>Actifs</option>
			<option value="inactive" selected={data.statusFilter === 'inactive'}>Inactifs</option>
		</select>
		<button type="submit" class="btn preset-tonal-surface rounded-lg text-sm px-4 py-2">
			Filtrer
		</button>
	</form>

	<div
		class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 shadow-sm overflow-x-auto"
	>
		{#if data.comptes.length === 0}
			<p class="text-surface-500 p-6 text-center">Aucun compte trouvé.</p>
		{:else}
			<table class="table w-full text-sm">
				<thead>
					<tr class="border-b border-surface-200-800">
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-5 py-3"
							>Login</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Nom</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Email</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Rôle</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Statut</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Dernière connexion</th
						>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-100-900">
					{#each data.comptes as compte (compte.id)}
						{@const cred = Array.isArray(compte.credential)
							? compte.credential[0]
							: compte.credential}
						<tr class="hover:bg-surface-100-900 transition-colors">
							<td class="px-5 py-3.5">
								<code class="bg-surface-200-800 px-1.5 py-0.5 rounded text-xs"
									>{cred?.login ?? '—'}</code
								>
							</td>
							<td class="px-4 py-3.5 font-medium">{compte.first_name} {compte.last_name}</td>
							<td class="px-4 py-3.5 text-surface-600-400">{compte.email}</td>
							<td class="px-4 py-3.5 text-surface-600-400"
								>{roleLabels[compte.role as keyof typeof roleLabels]}</td
							>
							<td class="px-4 py-3.5">
								<span
									class="badge {statusPresets[compte.status as StatusKey] ??
										'preset-tonal-surface'} text-xs rounded-full px-2.5 py-0.5"
								>
									{statusLabels[compte.status as StatusKey]}
								</span>
							</td>
							<td class="px-4 py-3.5 text-surface-500 text-xs">{fmt(compte.last_login_at)}</td>
							<td class="px-4 py-3.5">
								<a
									href="/comptes/{compte.id}/view"
									class="text-primary-500 hover:underline text-xs font-medium">Voir →</a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
