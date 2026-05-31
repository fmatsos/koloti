<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Nouveau post — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/informations" class="back-link">← Fil d'informations</a>
	<h1>Nouveau post</h1>
</div>

{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="form-card">
	<form method="POST">
		<div class="field">
			<label for="title">Titre *</label>
			<input id="title" name="title" type="text" required maxlength="255" />
		</div>
		<div class="field">
			<label for="body">Contenu (Markdown) *</label>
			<textarea id="body" name="body" rows="12" required maxlength="50000"></textarea>
		</div>
		<div class="field-check">
			<input id="is_published" name="is_published" type="checkbox" value="true" />
			<label for="is_published">Publier immédiatement</label>
		</div>
		<div class="form-actions">
			<a href="/informations" class="btn-secondary">Annuler</a>
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
		max-width: 720px;
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
	.field-check {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	input[type='text'] {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.9375rem;
		box-sizing: border-box;
	}
	textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.9375rem;
		font-family: monospace;
		box-sizing: border-box;
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
