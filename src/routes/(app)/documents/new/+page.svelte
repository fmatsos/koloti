<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Nouveau document — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/documents" class="back-link">← Documents</a>
	<h1>Téléverser un document</h1>
</div>

{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="form-card">
	<form method="POST" enctype="multipart/form-data">
		<div class="field">
			<label for="file">Fichier * <span class="hint">(max 20 Mo)</span></label>
			<input id="file" name="file" type="file" required />
		</div>
		<div class="field">
			<label for="title">Titre *</label>
			<input id="title" name="title" type="text" required maxlength="255" />
		</div>
		<div class="field">
			<label for="type">Type *</label>
			<select id="type" name="type" required>
				<option value="">— Choisir —</option>
				<option value="statuts">Statuts</option>
				<option value="pv_ag">PV d'AG</option>
				<option value="budget">Budget</option>
				<option value="facture">Facture</option>
				<option value="cahier_charges">Cahier des charges</option>
				<option value="convocation">Convocation</option>
				<option value="courrier">Courrier</option>
				<option value="autre">Autre</option>
			</select>
		</div>
		<div class="field">
			<label for="visibility">Visibilité *</label>
			<select id="visibility" name="visibility">
				<option value="members">Tous les membres</option>
				<option value="editors">Éditeurs et admins</option>
				<option value="admin">Admins uniquement</option>
			</select>
		</div>
		<div class="field">
			<label for="year">Année</label>
			<input id="year" name="year" type="number" min="2000" max="2100" placeholder="ex. 2024" />
		</div>
		<div class="field">
			<label for="description">Description</label>
			<textarea id="description" name="description" rows="3" maxlength="1000"></textarea>
		</div>
		<div class="form-actions">
			<a href="/documents" class="btn-secondary">Annuler</a>
			<button type="submit" class="btn-primary">Téléverser</button>
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
	label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}
	.hint {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--color-text-muted, #6b7280);
	}
	input[type='text'],
	input[type='number'],
	select,
	textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.9375rem;
		box-sizing: border-box;
	}
	input[type='file'] {
		width: 100%;
		font-size: 0.875rem;
	}
	textarea {
		resize: vertical;
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
