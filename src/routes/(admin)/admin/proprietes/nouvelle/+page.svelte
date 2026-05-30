<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Nouvelle propriété — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/proprietes" class="back-link">← Retour</a>
	<h1>Nouvelle propriété</h1>
</div>

{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="form-card">
	<form method="POST">
		<div class="field">
			<label for="reference">Référence <span class="req">*</span></label>
			<input id="reference" name="reference" type="text" required maxlength="100" placeholder="ex. Lot 12" />
		</div>
		<div class="field">
			<label for="address">Adresse</label>
			<input id="address" name="address" type="text" maxlength="300" placeholder="12 allée des Roses" />
		</div>
		<div class="field">
			<label for="vote_weight">Poids de vote <span class="req">*</span></label>
			<input id="vote_weight" name="vote_weight" type="number" min="1" max="100" value="1" required />
			<span class="hint">1 voix par propriété par défaut.</span>
		</div>
		<div class="form-actions">
			<a href="/admin/proprietes" class="btn-secondary">Annuler</a>
			<button type="submit" class="btn-primary">Créer</button>
		</div>
	</form>
</div>

<style>
	.page-header { margin-bottom: 1.5rem; }
	.back-link { display: inline-block; margin-bottom: 0.5rem; font-size: 0.875rem; text-decoration: none; color: var(--color-text-muted, #6b7280); }
	h1 { margin: 0; font-size: 1.5rem; }
	.form-card { background: white; border-radius: var(--radius, 0.375rem); border: 1px solid var(--color-border, #e5e7eb); padding: 1.5rem; max-width: 480px; }
	.field { margin-bottom: 1rem; }
	label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; }
	.req { color: #dc2626; }
	input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--color-border, #e5e7eb); border-radius: var(--radius, 0.375rem); font-size: 0.9375rem; box-sizing: border-box; }
	.hint { font-size: 0.75rem; color: var(--color-text-muted, #6b7280); }
	.form-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; }
	.btn-primary { padding: 0.625rem 1.25rem; background: var(--color-primary, #1a73e8); color: white; border: none; border-radius: var(--radius, 0.375rem); font-size: 0.9375rem; cursor: pointer; }
	.btn-secondary { display: inline-block; padding: 0.625rem 1.25rem; background: white; color: var(--color-text, #111827); border: 1px solid var(--color-border, #e5e7eb); border-radius: var(--radius, 0.375rem); text-decoration: none; font-size: 0.9375rem; }
	.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
</style>
