<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mode = $state<'password' | 'magiclink'>('password');
	let password = $state('');
	let passwordConfirm = $state('');
	let loading = $state(false);

	const reasonMessages = {
		invalid: "Ce lien d'activation est invalide.",
		revoked: "Ce lien a été annulé. Demandez un nouveau lien à l'administrateur.",
		used: 'Ce lien a déjà été utilisé. Connectez-vous directement.',
		expired: "Ce lien a expiré (validité 72h). Demandez un nouveau lien à l'administrateur."
	};
</script>

<svelte:head>
	<title>Activation du compte — Koloti</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>Koloti</h1>

		{#if !data.valid}
			<div class="alert alert-error" role="alert">
				{reasonMessages[data.reason ?? 'invalid']}
			</div>
			<p><a href="/login">Retour à la connexion</a></p>
		{:else}
			<h2>Activer votre compte</h2>
			{#if data.fullName}
				<p class="welcome">Bienvenue, <strong>{data.fullName}</strong> !</p>
			{/if}

			{#if form?.error}
				<div class="alert alert-error" role="alert">{form.error}</div>
			{/if}

			<div class="tabs" role="tablist">
				<button
					role="tab"
					aria-selected={mode === 'password'}
					class:active={mode === 'password'}
					onclick={() => (mode = 'password')}
				>
					Définir un mot de passe
				</button>
				<button
					role="tab"
					aria-selected={mode === 'magiclink'}
					class:active={mode === 'magiclink'}
					onclick={() => (mode = 'magiclink')}
				>
					Lien magique uniquement
				</button>
			</div>

			<form method="POST" action="?/activate" onsubmit={() => (loading = true)}>
				<input type="hidden" name="token" value={data.token ?? ''} />
				<input type="hidden" name="link_id" value={data.linkId ?? ''} />
				<input type="hidden" name="mode" value={mode} />

				{#if mode === 'password'}
					<div class="field">
						<label for="password">Mot de passe <span class="required">*</span></label>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="new-password"
							bind:value={password}
							minlength="8"
							required
						/>
						<span class="hint">Minimum 8 caractères</span>
					</div>

					<div class="field">
						<label for="password-confirm"
							>Confirmer le mot de passe <span class="required">*</span></label
						>
						<input
							id="password-confirm"
							name="password_confirm"
							type="password"
							autocomplete="new-password"
							bind:value={passwordConfirm}
							required
						/>
					</div>
				{:else}
					<div class="info-box">
						<p>
							Vous pourrez vous connecter par lien magique envoyé à votre adresse email. Aucun mot
							de passe ne sera défini.
						</p>
					</div>
				{/if}

				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Activation…' : 'Activer mon compte'}
				</button>
			</form>
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
		max-width: 420px;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
	}

	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.75rem;
		text-align: center;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		text-align: center;
	}

	.welcome {
		text-align: center;
		margin: 0 0 1.5rem;
		color: #444;
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
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		color: #666;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		font-size: 0.875rem;
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

	.required {
		color: #dc2626;
	}

	input[type='password'] {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.hint {
		font-size: 0.75rem;
		color: #888;
	}

	.info-box {
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 0.25rem;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #0369a1;
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
</style>
