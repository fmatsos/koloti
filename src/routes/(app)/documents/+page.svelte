<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const typeLabels: Record<string, string> = {
		statuts: 'Statuts', pv_ag: 'PV AG', budget: 'Budget', facture: 'Facture',
		cahier_charges: 'Cahier des charges', convocation: 'Convocation', courrier: 'Courrier', autre: 'Autre'
	};
	function formatSize(bytes: number | null): string {
		if (!bytes) return '';
		if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} Ko`;
		return `${(bytes / 1048576).toFixed(1)} Mo`;
	}
</script>

<svelte:head><title>Documents — Koloti</title></svelte:head>

<div class="page-header">
	<h1>Documents</h1>
</div>

<div class="filters">
	<form method="GET">
		<select name="type" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}>
			<option value="">Tous types</option>
			{#each Object.entries(typeLabels) as [val, label]}
				<option value={val} selected={data.typeFilter === val}>{label}</option>
			{/each}
		</select>
		<input type="number" name="year" value={data.yearFilter} placeholder="Année" min="2000" max="2100" onchange={(e) => (e.currentTarget as HTMLInputElement).form?.submit()} />
	</form>
</div>

<div class="card">
	{#if data.docs.length === 0}
		<p class="empty">Aucun document disponible.</p>
	{:else}
		<ul class="doc-list">
			{#each data.docs as doc}
				<li class="doc-item">
					<div class="doc-info">
						<div class="doc-title">{doc.title}</div>
						<div class="doc-meta">
							{typeLabels[doc.type] ?? doc.type}
							{#if doc.year} · {doc.year}{/if}
							{#if doc.size_bytes} · {formatSize(doc.size_bytes)}{/if}
							· {new Date(doc.created_at).toLocaleDateString('fr-FR')}
						</div>
					</div>
					<a href="/app/documents/{doc.id}/download" class="btn-dl" target="_blank" rel="noopener">
						Télécharger
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.page-header { margin-bottom: 1rem; }
	h1 { margin: 0; font-size: 1.5rem; }
	.filters { margin-bottom: 1rem; }
	.filters form { display: flex; gap: 0.75rem; align-items: center; }
	.filters select, .filters input { padding: 0.4rem 0.625rem; border: 1px solid var(--color-border, #e5e7eb); border-radius: 0.25rem; font-size: 0.875rem; }
	.filters input { width: 100px; }
	.card { background: white; border-radius: var(--radius, 0.375rem); border: 1px solid var(--color-border, #e5e7eb); padding: 1.25rem; }
	.doc-list { list-style: none; margin: 0; padding: 0; }
	.doc-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; gap: 1rem; }
	.doc-title { font-size: 0.9375rem; font-weight: 500; }
	.doc-meta { font-size: 0.8125rem; color: var(--color-text-muted, #6b7280); margin-top: 0.125rem; }
	.btn-dl { padding: 0.3rem 0.75rem; background: var(--color-primary, #1a73e8); color: white; border-radius: 0.25rem; font-size: 0.8125rem; text-decoration: none; white-space: nowrap; flex-shrink: 0; }
	.empty { color: var(--color-text-muted, #6b7280); }
</style>
