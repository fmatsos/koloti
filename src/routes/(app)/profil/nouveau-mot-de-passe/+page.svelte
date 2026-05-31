<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Nouveau mot de passe — Koloti</title>
</svelte:head>

<div class="page-header">
	<a href="/profil" class="back-link">← Mon profil</a>
	<h1>Définir un nouveau mot de passe</h1>
</div>

{#if form?.error}
	<div class="alert alert-error">{form.error}</div>
{/if}

<div class="card">
	<form method="POST">
		<div class="field">
			<label for="password">Nouveau mot de passe</label>
			<input
				id="password"
				name="password"
				type="password"
				minlength="8"
				maxlength="200"
				required
				autocomplete="new-password"
			/>
			<span class="hint">Au moins 8 caractères.</span>
		</div>
		<div class="field">
			<label for="password_confirm">Confirmer le mot de passe</label>
			<input
				id="password_confirm"
				name="password_confirm"
				type="password"
				minlength="8"
				maxlength="200"
				required
				autocomplete="new-password"
			/>
		</div>
		<button type="submit" class="btn">Enregistrer le nouveau mot de passe</button>
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
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
		max-width: 400px;
	}
	.field {
		margin-bottom: 0.75rem;
	}
	label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}
	input {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
	}
	.hint {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}
	.btn {
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
	}
	.alert {
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
</style>
