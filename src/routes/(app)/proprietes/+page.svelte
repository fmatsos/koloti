<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Propriétés — Koloti</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="h3 font-bold">Propriétés</h1>
		<a href="/proprietes/new" class="btn preset-filled-primary-500 rounded-lg text-sm px-4 py-2">
			+ Nouvelle propriété
		</a>
	</div>

	<div
		class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 shadow-sm overflow-x-auto"
	>
		{#if data.proprietes.length === 0}
			<p class="text-surface-500 p-6 text-center">Aucune propriété.</p>
		{:else}
			<table class="table w-full text-sm">
				<thead>
					<tr class="border-b border-surface-200-800">
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-5 py-3"
							>Référence</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>N° voie</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Voie</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Cadastre</th
						>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-100-900">
					{#each data.proprietes as propriete (propriete.id)}
						<tr class="hover:bg-surface-100-900 transition-colors">
							<td class="px-5 py-3.5 font-medium">{propriete.reference}</td>
							<td class="px-4 py-3.5 text-surface-600-400">{propriete.street_number ?? '—'}</td>
							<td class="px-4 py-3.5">{propriete.street_name ?? '—'}</td>
							<td class="px-4 py-3.5 text-surface-500">{propriete.cadastre_number ?? '—'}</td>
							<td class="px-4 py-3.5">
								<a
									href="/proprietes/{propriete.id}/view"
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
