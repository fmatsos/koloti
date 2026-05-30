<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mode = $state<'password' | 'magiclink'>('password');
	let login = $state('');
	let password = $state('');
	let loading = $state(false);

	const errorMessages: Record<string, string> = {
		account_inactive: "Votre compte est désactivé. Contactez l'administrateur.",
		forbidden: 'Accès non autorisé.'
	};

	const displayError = $derived(
		form?.error ?? (data.error ? (errorMessages[data.error] ?? data.error) : null)
	);
</script>

<svelte:head>
	<title>Connexion — Koloti</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>Koloti</h1>
		<p class="subtitle">Espace ASL — Connexion</p>

		{#if displayError}
			<div class="alert alert-error" role="alert">
				{displayError}
			</div>
		{/if}

		{#if form?.success}
			<div class="alert alert-success" role="status">
				Un lien de connexion vous a été envoyé par email. Vérifiez votre boîte de réception.
			</div>
		{:else}
			<div class="tabs" role="tablist">
				<button
					role="tab"
					aria-selected={mode === 'password'}
					class:active={mode === 'password'}
					onclick={() => (mode = 'password')}
				>
					Mot de passe
				</button>
				<button
					role="tab"
					aria-selected={mode === 'magiclink'}
					class:active={mode === 'magiclink'}
					onclick={() => (mode = 'magiclink')}
				>
					Lien magique
				</button>
			</div>

			{#if mode === 'password'}
				<form method="POST" action="?/password" onsubmit={() => (loading = true)}>
					<input type="hidden" name="redirectTo" value={data.redirectTo} />

					<div class="field">
						<label for="login-pwd">Identifiant</label>
						<input
							id="login-pwd"
							name="login"
							type="text"
							autocomplete="username"
							bind:value={login}
							required
							placeholder="ex. lot12"
						/>
					</div>

					<div class="field">
						<label for="password">Mot de passe</label>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							bind:value={password}
							required
						/>
					</div>

					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Connexion…' : 'Se connecter'}
					</button>
				</form>
			{:else}
				<form method="POST" action="?/magiclink" onsubmit={() => (loading = true)}>
					<input type="hidden" name="redirectTo" value={data.redirectTo} />

					<div class="field">
						<label for="login-magic">Identifiant</label>
						<input
							id="login-magic"
							name="login"
							type="text"
							autocomplete="username"
							bind:value={login}
							required
							placeholder="ex. lot12"
						/>
					</div>

					<p class="hint">
						Un lien de connexion sera envoyé à l'adresse email associée à votre identifiant.
					</p>

					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Envoi…' : 'Recevoir un lien'}
					</button>
				</form>
			{/if}
		{/if}
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
		max-width: 400px;
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
		margin: 0 0 1.5rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #eee;
	}

	.tabs button {
		background: none;
		border: none;
		padding: 0.5rem 1rem;
		cursor: pointer;
		color: #666;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
	}

	.tabs button.active {
		color: var(--color-primary, #1a73e8);
		border-bottom-color: var(--color-primary, #1a73e8);
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

	input[type='text'],
	input[type='password'] {
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

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	.alert-success {
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}

	.hint {
		font-size: 0.875rem;
		color: #666;
		margin: 0 0 1rem;
	}
</style>
