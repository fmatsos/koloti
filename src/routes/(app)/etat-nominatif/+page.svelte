<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>État nominatif — Koloti</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="h3 font-bold">État nominatif</h1>
		<a
			href="/etat-nominatif/export.csv"
			class="btn preset-tonal-success rounded-lg text-sm px-4 py-2"
			download
		>
			Exporter CSV
		</a>
	</div>

	<div
		class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 shadow-sm overflow-x-auto"
	>
		{#if data.properties.length === 0}
			<p class="text-surface-500 p-6 text-center">Aucune propriété enregistrée.</p>
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
							>Adresse</th
						>
						<th
							class="text-center text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Poids</th
						>
						<th
							class="text-left text-xs font-semibold uppercase tracking-wider text-surface-500 px-4 py-3"
							>Propriétaire(s) actuel(s)</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-100-900">
					{#each data.properties as prop (prop.id)}
						{#if prop.activeOwnerships.length === 0}
							<tr class="hover:bg-surface-100-900 transition-colors">
								<td class="px-5 py-3 font-medium">
									<a href="/proprietes/{prop.id}/view" class="text-primary-500 hover:underline"
										>{prop.reference}</a
									>
								</td>
								<td class="px-4 py-3 text-surface-600-400">{prop.formattedAddress || '—'}</td>
								<td class="px-4 py-3 text-center text-surface-600-400">{prop.vote_weight}</td>
								<td class="px-4 py-3 text-surface-400">—</td>
							</tr>
						{:else}
							{#each prop.activeOwnerships as o, i (o.id)}
								{@const profile = Array.isArray(o.profile) ? o.profile[0] : o.profile}
								<tr class="hover:bg-surface-100-900 transition-colors {i > 0 ? 'border-t-0' : ''}">
									{#if i === 0}
										<td
											class="px-5 py-3 font-medium align-top"
											rowspan={prop.activeOwnerships.length}
										>
											<a href="/proprietes/{prop.id}/view" class="text-primary-500 hover:underline"
												>{prop.reference}</a
											>
										</td>
										<td
											class="px-4 py-3 text-surface-600-400 align-top"
											rowspan={prop.activeOwnerships.length}
										>
											{prop.formattedAddress || '—'}
										</td>
										<td
											class="px-4 py-3 text-center text-surface-600-400 align-top"
											rowspan={prop.activeOwnerships.length}
										>
											{prop.vote_weight}
										</td>
									{/if}
									<td class="px-4 py-3">
										<span class="font-medium">
											{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}
										</span>
										{#if o.is_primary}
											<span class="badge preset-tonal-primary text-xs rounded-full px-2 py-0.5 ml-1"
												>Principal</span
											>
										{/if}
										<br />
										<small class="text-surface-500 text-xs">{profile?.email ?? ''}</small>
									</td>
								</tr>
							{/each}
						{/if}
					{/each}
				</tbody>
			</table>
			<p class="text-xs text-surface-500 text-right px-5 py-3 border-t border-surface-200-800">
				{data.properties.length} propriété(s) · {data.properties.reduce(
					(s, p) => s + p.activeOwnerships.length,
					0
				)} propriétaire(s) actif(s)
			</p>
		{/if}
	</div>
</div>
