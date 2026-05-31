<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const typeLabels: Record<string, string> = {
		statuts: 'Statuts',
		pv_ag: 'PV AG',
		budget: 'Budget',
		facture: 'Facture',
		cahier_charges: 'Cahier des charges',
		convocation: 'Convocation',
		courrier: 'Courrier',
		autre: 'Autre'
	};
	const visLabels: Record<string, string> = {
		members: 'Membres',
		editors: 'Éditeurs',
		admin: 'Admins'
	};
	function formatSize(bytes: number | null): string {
		if (!bytes) return '';
		if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} Ko`;
		return `${(bytes / 1048576).toFixed(1)} Mo`;
	}
</script>

<svelte:head><title>Documents — Koloti</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="h3 font-bold">Documents</h1>
		{#if data.isAdminOrEditor}
			<a href="/documents/new" class="btn preset-filled-primary-500 rounded-lg text-sm px-4 py-2">
				+ Téléverser
			</a>
		{/if}
	</div>

	<!-- Filters -->
	<form method="GET" class="flex flex-wrap gap-3 items-center">
		<select
			name="type"
			class="select rounded-lg border border-surface-300-700 bg-surface-50-950 px-3 py-2 text-sm"
			onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}
		>
			<option value="">Tous types</option>
			{#each Object.entries(typeLabels) as [val, label] (val)}
				<option value={val} selected={data.typeFilter === val}>{label}</option>
			{/each}
		</select>
		<input
			type="number"
			name="year"
			value={data.yearFilter}
			placeholder="Année"
			min="2000"
			max="2100"
			class="input rounded-lg border border-surface-300-700 bg-surface-50-950 px-3 py-2 text-sm w-24"
			onchange={(e) => (e.currentTarget as HTMLInputElement).form?.submit()}
		/>
	</form>

	<div class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 shadow-sm overflow-hidden">
		{#if data.docs.length === 0}
			<p class="text-surface-500 p-6 text-center">Aucun document disponible.</p>
		{:else}
			<ul class="divide-y divide-surface-200-800">
				{#each data.docs as doc (doc.id)}
					<li class="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface-100-900 transition-colors">
						<div class="min-w-0">
							<p class="font-medium text-sm truncate">{doc.title}</p>
							<p class="text-xs text-surface-500 mt-0.5">
								{typeLabels[doc.type] ?? doc.type}
								{#if doc.year} · {doc.year}{/if}
								{#if doc.size_bytes} · {formatSize(doc.size_bytes)}{/if}
								{#if data.isAdminOrEditor} · {visLabels[doc.visibility] ?? doc.visibility}{/if}
								· {new Date(doc.created_at).toLocaleDateString('fr-FR')}
							</p>
						</div>
						<div class="flex items-center gap-3 flex-shrink-0">
							<a
								href="/documents/{doc.id}/download"
								class="btn preset-filled-primary-500 rounded-lg text-xs px-3 py-1.5"
								target="_blank"
								rel="noopener"
							>
								Télécharger
							</a>
							{#if data.isAdminOrEditor}
								<a href="/documents/{doc.id}/edit" class="text-xs text-primary-500 hover:underline">
									Modifier
								</a>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
