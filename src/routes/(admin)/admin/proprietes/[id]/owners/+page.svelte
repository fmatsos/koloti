<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	const today = new Date().toISOString().split('T')[0];
</script>

<svelte:head><title>Propriétaires — {data.prop.reference} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/proprietes/{data.prop.id}" class="back-link">← {data.prop.reference}</a>
	<h1>Propriétaires</h1>
</div>

{#if form?.success}<div class="alert-success">Opération effectuée.</div>{/if}
{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="detail-grid">
	<!-- Liste historique -->
	<div class="card">
		<h2>Historique</h2>
		{#if data.ownerships.length === 0}
			<p class="empty">Aucun propriétaire.</p>
		{:else}
			{#each data.ownerships as o}
				{@const profile = Array.isArray(o.profile) ? o.profile[0] : o.profile}
				<div class="ownership-row {o.end_date ? 'past' : 'current'}">
					<div>
						<strong>{profile?.full_name ?? '—'}</strong>
						{#if o.is_primary}<span class="badge">Principal</span>{/if}
						<br /><small>{profile?.email ?? ''}</small><br />
						<small>Du {o.start_date}{o.end_date ? ` au ${o.end_date}` : ' (en cours)'}</small>
					</div>
					{#if !o.end_date}
						<form method="POST" action="?/end" class="end-form">
							<input type="hidden" name="ownership_id" value={o.id} />
							<input type="date" name="end_date" value={today} required />
							<button type="submit" class="btn-danger-sm">Clore</button>
						</form>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Ajouter un propriétaire -->
	<div class="card">
		<h2>Ajouter un propriétaire</h2>
		<form method="POST" action="?/add">
			<div class="field">
				<label for="profile_id">Coloti *</label>
				<select id="profile_id" name="profile_id" required>
					<option value="">— Choisir —</option>
					{#each data.profiles as p}
						<option value={p.id}>{p.full_name} ({p.email})</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="start_date">Date d'entrée *</label>
				<input id="start_date" name="start_date" type="date" value={today} required />
			</div>
			<div class="field-check">
				<input id="is_primary" name="is_primary" type="checkbox" value="true" checked />
				<label for="is_primary">Contact principal (indivision)</label>
			</div>
			<button type="submit" class="btn-sm">Ajouter</button>
		</form>
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
	.ownership-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; gap: 0.75rem; }
	.ownership-row.past { opacity: 0.5; }
	.end-form { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
	.end-form input[type="date"] { padding: 0.3rem 0.5rem; border: 1px solid var(--color-border, #e5e7eb); border-radius: 0.25rem; font-size: 0.8125rem; }
	.badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 9999px; margin-left: 0.375rem; }
	.field { margin-bottom: 0.75rem; }
	.field-check { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.875rem; }
	label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 0.25rem; }
	input[type="date"], select { width: 100%; padding: 0.4rem 0.625rem; border: 1px solid var(--color-border, #e5e7eb); border-radius: 0.25rem; font-size: 0.875rem; box-sizing: border-box; }
	.btn-sm { padding: 0.375rem 0.875rem; background: var(--color-primary, #1a73e8); color: white; border: none; border-radius: 0.25rem; font-size: 0.8125rem; cursor: pointer; }
	.btn-danger-sm { padding: 0.25rem 0.625rem; background: #dc2626; color: white; border: none; border-radius: 0.25rem; font-size: 0.75rem; cursor: pointer; white-space: nowrap; }
	.empty { color: var(--color-text-muted, #6b7280); font-size: 0.875rem; }
	.alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
	.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
</style>
