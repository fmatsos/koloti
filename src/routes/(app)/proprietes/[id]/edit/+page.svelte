<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const prop = $derived(data.prop);
</script>

<svelte:head><title>Modifier {prop.reference} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/proprietes/{prop.id}/view" class="back-link">← Vue de la propriété</a>
	<h1>Modifier {prop.reference}</h1>
</div>

{#if form?.success}<div class="alert alert-success">Modifications enregistrées.</div>{/if}
{#if form?.error}<div class="alert alert-error">{form.error}</div>{/if}

<div class="form-card">
	<form method="POST" action="?/update">
		<div class="field">
			<label for="reference">Référence *</label>
			<input
				id="reference"
				name="reference"
				type="text"
				value={prop.reference}
				required
				maxlength="100"
			/>
		</div>
		<div class="field-row">
			<div class="field">
				<label for="street_number">N° de voie</label>
				<input
					id="street_number"
					name="street_number"
					type="text"
					value={prop.street_number ?? ''}
					maxlength="20"
				/>
			</div>
			<div class="field field-grow">
				<label for="street_name">Voie</label>
				<input
					id="street_name"
					name="street_name"
					type="text"
					value={prop.street_name ?? ''}
					maxlength="200"
				/>
			</div>
		</div>
		<div class="field">
			<label for="cadastre_number">N° cadastral <span class="optional">(optionnel)</span></label>
			<input
				id="cadastre_number"
				name="cadastre_number"
				type="text"
				value={prop.cadastre_number ?? ''}
				maxlength="50"
			/>
		</div>
		<div class="form-actions">
			<button type="submit" class="btn-primary">Enregistrer</button>
			<a href="/proprietes/{prop.id}/view" class="btn-secondary">Annuler</a>
		</div>
	</form>
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.back-link {
		display: inline-block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		text-decoration: none;
		color: var(--color-text-muted, #6b7280);
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.form-card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.5rem;
		max-width: 560px;
	}
	.field {
		margin-bottom: 1rem;
	}
	.field-row {
		display: flex;
		gap: 0.75rem;
	}
	.field-grow {
		flex: 1;
	}
	label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}
	.optional {
		font-weight: 400;
		color: var(--color-text-muted, #6b7280);
	}
	input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
	}
	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}
	.btn-primary {
		padding: 0.625rem 1.25rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
	}
	.btn-secondary {
		padding: 0.625rem 1.25rem;
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		text-decoration: none;
	}
	.alert {
		padding: 0.75rem 1rem;
		border-radius: 0.25rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.alert-success {
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}
	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
</style>
