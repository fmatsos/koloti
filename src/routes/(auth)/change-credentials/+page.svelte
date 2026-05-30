<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Changer les identifiants — Koloti</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>Koloti</h1>
		<p class="subtitle">Mise à jour obligatoire des identifiants</p>

		{#if form?.error}
			<div class="alert alert-error" role="alert">{form.error}</div>
		{/if}

		<p class="hint">
			Vous devez remplacer le login bootstrap et définir un nouveau mot de passe avant de continuer.
		</p>

		<form method="POST">
			<div class="field">
				<label for="login">Nouveau login</label>
				<input
					id="login"
					name="login"
					type="text"
					autocomplete="username"
					value={data.currentLogin}
					required
				/>
			</div>

			<div class="field">
				<label for="password">Nouveau mot de passe</label>
				<input id="password" name="password" type="password" autocomplete="new-password" required />
			</div>

			<div class="field">
				<label for="password_confirm">Confirmation</label>
				<input
					id="password_confirm"
					name="password_confirm"
					type="password"
					autocomplete="new-password"
					required
				/>
			</div>

			<button type="submit" class="btn-primary">Valider</button>
		</form>
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: var(--color-bg, #f5f5f5);
	}

	.auth-card {
		background: white;
		border-radius: 0.5rem;
		padding: 2rem;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
	}

	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.75rem;
		text-align: center;
	}

	.subtitle {
		text-align: center;
		color: #666;
		margin: 0 0 1rem;
	}

	.hint {
		font-size: 0.875rem;
		color: #666;
		margin: 0 0 1rem;
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

	input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.btn-primary {
		width: 100%;
		padding: 0.75rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 1rem;
		cursor: pointer;
		margin-top: 0.5rem;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 0.25rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
</style>
