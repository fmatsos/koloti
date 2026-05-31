<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Erreur {page.status} — Koloti</title>
</svelte:head>

<div class="error-container">
	<div class="error-card">
		<div class="error-code">{page.status}</div>
		<h1 class="error-title">
			{#if page.status === 404}
				Page introuvable
			{:else if page.status === 403}
				Accès non autorisé
			{:else if page.status === 401}
				Authentification requise
			{:else if page.status >= 500}
				Erreur serveur
			{:else}
				Une erreur s'est produite
			{/if}
		</h1>
		<p class="error-message">
			{page.error?.message ?? "Une erreur inattendue s'est produite."}
		</p>
		<div class="error-actions">
			<a href="/" class="btn">Retour à l'accueil</a>
			<a href="/login" class="btn btn-secondary">Connexion</a>
		</div>
	</div>
</div>

<style>
	.error-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: var(--color-bg, #f9fafb);
	}

	.error-card {
		background: white;
		border-radius: 0.5rem;
		padding: 3rem 2rem;
		max-width: 480px;
		width: 100%;
		text-align: center;
		box-shadow: var(--shadow, 0 2px 8px rgb(0 0 0 / 0.1));
	}

	.error-code {
		font-size: 5rem;
		font-weight: 700;
		color: #e5e7eb;
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.error-title {
		font-size: 1.5rem;
		color: var(--color-text, #111827);
		margin: 0 0 1rem;
	}

	.error-message {
		color: var(--color-text-muted, #6b7280);
		margin: 0 0 2rem;
	}

	.error-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.btn {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		text-decoration: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.btn-secondary {
		background: white;
		color: var(--color-text, #111827);
		border: 1px solid var(--color-border, #e5e7eb);
	}
</style>
