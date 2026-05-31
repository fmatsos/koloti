<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Accueil — Koloti</title>
</svelte:head>

<div class="home">
	<h1>Bienvenue{data.profile ? `, ${data.profile.first_name} ${data.profile.last_name}` : ''}</h1>
	<p class="subtitle">Espace ASL — plateforme de gestion du lotissement</p>

	<div class="shortcuts">
		<a href="/informations" class="card">
			<span class="card-icon">📢</span>
			<strong>Informations</strong>
			<span>Actualités et annonces</span>
		</a>
		<a href="/documents" class="card">
			<span class="card-icon">📄</span>
			<strong>Documents</strong>
			<span>Statuts, PV, budgets…</span>
		</a>
		<a href="/assemblees-generales" class="card">
			<span class="card-icon">🏛️</span>
			<strong>Assemblées générales</strong>
			<span>Convocations et émargement</span>
		</a>
	</div>
</div>

<style>
	.home {
		padding: 2rem 0;
	}

	h1 {
		font-size: 1.75rem;
		margin: 0 0 0.5rem;
	}

	.subtitle {
		color: var(--color-text-muted, #6b7280);
		margin: 0 0 2rem;
	}

	.shortcuts {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1.5rem;
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.15s;
	}

	.card:hover {
		box-shadow: var(--shadow, 0 2px 8px rgb(0 0 0 / 0.1));
	}

	.card-icon {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}

	.card strong {
		font-size: 1rem;
		color: var(--color-text, #111827);
	}

	.card span {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
	}
</style>
