<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Nouvelle AG — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/assemblees-generales" class="back-link">← Assemblées</a>
	<h1>Nouvelle assemblée générale</h1>
</div>

{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="form-card">
	<form method="POST">
		<div class="field">
			<label for="title">Titre *</label>
			<input
				id="title"
				name="title"
				type="text"
				required
				maxlength="255"
				placeholder="AG Ordinaire 2025"
			/>
		</div>
		<div class="field-row">
			<div class="field">
				<label for="type">Type *</label>
				<select id="type" name="type">
					<option value="ordinaire">Ordinaire (AGO)</option>
					<option value="extraordinaire">Extraordinaire (AGE)</option>
				</select>
			</div>
			<div class="field">
				<label for="mode">Mode *</label>
				<select id="mode" name="mode">
					<option value="presentiel">Présentiel</option>
					<option value="en_ligne">En ligne</option>
					<option value="hybride">Hybride</option>
				</select>
			</div>
		</div>
		<div class="field">
			<label for="scheduled_at">Date et heure *</label>
			<input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
		</div>
		<div class="field">
			<label for="location">Lieu</label>
			<input
				id="location"
				name="location"
				type="text"
				maxlength="300"
				placeholder="Salle commune, bâtiment A"
			/>
		</div>
		<div class="field">
			<label for="quorum_pct">Quorum (%) *</label>
			<input
				id="quorum_pct"
				name="quorum_pct"
				type="number"
				min="1"
				max="100"
				value="50"
				required
			/>
			<span class="hint">Pourcentage de voix requis pour la validité de l'AG.</span>
		</div>
		<div class="form-actions">
			<a href="/admin/assemblees-generales" class="btn-secondary">Annuler</a>
			<button type="submit" class="btn-primary">Créer</button>
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
		max-width: 600px;
	}
	.field {
		margin-bottom: 1rem;
	}
	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}
	input[type='text'],
	input[type='datetime-local'],
	input[type='number'],
	select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.9375rem;
		box-sizing: border-box;
	}
	.hint {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
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
		border-radius: var(--radius, 0.375rem);
		font-size: 0.9375rem;
		cursor: pointer;
	}
	.btn-secondary {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		background: white;
		color: var(--color-text, #111827);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		text-decoration: none;
		font-size: 0.9375rem;
	}
	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
</style>
