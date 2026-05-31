<script lang="ts">
	import { page } from '$app/state';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const passwordChanged = $derived(page.url.searchParams.get('password_changed') === '1');
</script>

<svelte:head>
	<title>Mon profil — Koloti</title>
</svelte:head>

<div class="page-header">
	<h1>Mon profil</h1>
</div>

{#if form?.error}
	<div class="alert alert-error">{form.error}</div>
{/if}

{#if passwordChanged}
	<div class="alert alert-success">Mot de passe modifié avec succès.</div>
{:else if form?.success}
	<div class="alert alert-success">
		{#if form.action === 'identity'}Identité mise à jour.
		{:else if form.action === 'email'}Email mis à jour.
		{:else if form.action === 'password_reset_sent'}Un lien de changement de mot de passe vous a été envoyé par email.
		{/if}
	</div>
{/if}

<div class="profile-grid">
	<!-- Identité -->
	<div class="card">
		<h3>Identité</h3>
		<form method="POST" action="?/updateIdentity">
			<div class="field">
				<label for="first_name">Prénom</label>
				<input
					id="first_name"
					name="first_name"
					type="text"
					value={data.profile?.first_name ?? ''}
					maxlength="100"
					required
				/>
			</div>
			<div class="field">
				<label for="last_name">Nom</label>
				<input
					id="last_name"
					name="last_name"
					type="text"
					value={data.profile?.last_name ?? ''}
					maxlength="100"
					required
				/>
			</div>
			<button type="submit" class="btn-sm">Enregistrer</button>
		</form>
	</div>

	<!-- Email -->
	<div class="card">
		<h3>Adresse email</h3>
		<form method="POST" action="?/updateEmail">
			<div class="field">
				<label for="email">Nouvel email</label>
				<input
					id="email"
					name="email"
					type="email"
					value={data.profile?.email ?? ''}
					maxlength="254"
					required
				/>
			</div>
			<button type="submit" class="btn-sm">Enregistrer</button>
		</form>
	</div>

	<!-- Mot de passe -->
	<div class="card">
		<h3>Mot de passe</h3>
		<p class="hint">Pour changer votre mot de passe, cliquez sur le bouton ci-dessous. Vous recevrez un email avec un lien sécurisé.</p>
		<form method="POST" action="?/requestPasswordChange">
			<button type="submit" class="btn-sm">Recevoir un lien de changement</button>
		</form>
	</div>
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
	}

	.profile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		align-items: start;
	}

	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
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
		margin: 0 0 0.75rem;
	}

	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
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
