<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const prop = $derived(data.prop);
	const ownershipsActifs = $derived(
		(Array.isArray(prop.ownership) ? prop.ownership : []).filter((o: { end_date: string | null }) => !o.end_date)
	);
</script>

<svelte:head><title>{prop.reference} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/proprietes" class="back-link">← Retour</a>
	<h1>{prop.reference}</h1>
</div>

{#if form?.success}<div class="alert-success">Modifications enregistrées.</div>{/if}
{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="detail-grid">
	<div class="card">
		<h2>Modifier</h2>
		<form method="POST" action="?/update">
			<div class="field">
				<label for="reference">Référence *</label>
				<input id="reference" name="reference" type="text" value={prop.reference} required />
			</div>
			<div class="field">
				<label for="address">Adresse</label>
				<input id="address" name="address" type="text" value={prop.address ?? ''} />
			</div>
			<div class="field">
				<label for="vote_weight">Poids de vote *</label>
				<input id="vote_weight" name="vote_weight" type="number" min="1" max="100" value={prop.vote_weight} required />
			</div>
			<button type="submit" class="btn-sm">Enregistrer</button>
		</form>
	</div>

	<div class="card">
		<h2>Propriétaires actuels</h2>
		{#if ownershipsActifs.length === 0}
			<p class="empty">Aucun propriétaire enregistré.</p>
		{:else}
			<ul class="owner-list">
				{#each ownershipsActifs as o}
					{@const profile = Array.isArray(o.profile) ? o.profile[0] : o.profile}
					<li>
						<strong>{profile?.full_name ?? '—'}</strong>
						{#if o.is_primary}<span class="badge-primary">Principal</span>{/if}
						<br /><small>{profile?.email ?? ''} · depuis {o.start_date}</small>
					</li>
				{/each}
			</ul>
		{/if}
		<a href="/admin/proprietes/{prop.id}/owners" class="link-sm">Gérer les propriétaires →</a>
	</div>
</div>

<style>
	.page-header { margin-bottom: 1.5rem; }
	.back-link { display: inline-block; margin-bottom: 0.5rem; font-size: 0.875rem; text-decoration: none; color: var(--color-text-muted, #6b7280); }
	h1 { margin: 0; font-size: 1.5rem; }
	h2 { margin: 0 0 1rem; font-size: 1rem; }
	.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
	@media (max-width: 640px) { .detail-grid { grid-template-columns: 1fr; } }
	.card { background: white; border-radius: var(--radius, 0.375rem); border: 1px solid var(--color-border, #e5e7eb); padding: 1.25rem; }
	.field { margin-bottom: 0.75rem; }
	label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 0.25rem; }
	input { width: 100%; padding: 0.4rem 0.625rem; border: 1px solid var(--color-border, #e5e7eb); border-radius: 0.25rem; font-size: 0.875rem; box-sizing: border-box; }
	.btn-sm { padding: 0.375rem 0.875rem; background: var(--color-primary, #1a73e8); color: white; border: none; border-radius: 0.25rem; font-size: 0.8125rem; cursor: pointer; }
	.owner-list { list-style: none; margin: 0 0 0.75rem; padding: 0; }
	.owner-list li { padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; }
	.badge-primary { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 9999px; margin-left: 0.5rem; }
	.empty { color: var(--color-text-muted, #6b7280); font-size: 0.875rem; }
	.link-sm { font-size: 0.875rem; }
	.alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
	.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
</style>
