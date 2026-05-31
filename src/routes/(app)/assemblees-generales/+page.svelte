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

	type BadgePreset =
		| 'preset-tonal-warning'
		| 'preset-tonal-primary'
		| 'preset-tonal-success'
		| 'preset-filled-surface-200-800'
		| 'preset-tonal-surface';
	const statusPresets: Record<string, BadgePreset> = {
		draft: 'preset-tonal-warning',
		convened: 'preset-tonal-primary',
		open: 'preset-tonal-success',
		closed: 'preset-filled-surface-200-800',
		archived: 'preset-tonal-surface'
	};
</script>

<svelte:head><title>Assemblées générales — Koloti</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="h3 font-bold">Assemblées générales</h1>
		{#if data.isAdminOrEditor}
			<a
				href="/assemblees-generales/new"
				class="btn preset-filled-primary-500 rounded-lg text-sm px-4 py-2"
			>
				+ Nouvelle AG
			</a>
		{/if}
	</div>

	{#if data.assemblees.length === 0}
		<div class="card preset-filled-surface-100-900 rounded-xl p-8 text-center">
			<p class="text-surface-500">Aucune assemblée disponible.</p>
		</div>
	{:else}
		<div
			class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 shadow-sm overflow-x-auto"
		>
			<table class="table w-full text-sm">
				<thead>
					<tr class="border-b border-surface-200-800">
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-5 py-3"
							>Titre</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Type</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Statut</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Date</th
						>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-100-900">
					{#each data.assemblees as ag (ag.id)}
						<tr class="hover:bg-surface-100-900 transition-colors">
							<td class="px-5 py-3.5 font-medium">{ag.title}</td>
							<td class="px-4 py-3.5 text-surface-500">{ag.type === 'ordinaire' ? 'AGO' : 'AGE'}</td
							>
							<td class="px-4 py-3.5">
								<span
									class="badge {statusPresets[ag.status] ??
										'preset-tonal-surface'} text-xs rounded-full px-2.5 py-0.5"
								>
									{statusLabels[ag.status] ?? ag.status}
								</span>
							</td>
							<td class="px-4 py-3.5 text-surface-500">
								{ag.scheduled_at ? new Date(ag.scheduled_at).toLocaleDateString('fr-FR') : '—'}
							</td>
							<td class="px-4 py-3.5">
								<a
									href="/assemblees-generales/{ag.id}"
									class="text-primary-500 hover:underline text-xs font-medium"
								>
									Voir →
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
