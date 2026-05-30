<script lang="ts">
	import type { Database } from '$lib/types/database';

	let { profile }: { profile: Database['public']['Tables']['profile']['Row'] | null } = $props();

	const isAdmin = $derived(profile?.role === 'admin');
	const isAdminOrEditor = $derived(profile?.role === 'admin' || profile?.role === 'editor');
</script>

<nav class="app-nav" aria-label="Navigation principale">
	<a href="/app/" class="nav-brand">Koloti</a>

	<ul class="nav-links" role="list">
		<li><a href="/app/info">Informations</a></li>
		<li><a href="/app/documents">Documents</a></li>
		<li><a href="/app/ag">Assemblées</a></li>

		{#if isAdminOrEditor}
			<li class="nav-separator" aria-hidden="true"></li>
			<li>
				<a href="/admin/comptes" class="nav-admin">Comptes</a>
			</li>
			<li>
				<a href="/admin/proprietes" class="nav-admin">Propriétés</a>
			</li>
			<li>
				<a href="/admin/documents/nouveau" class="nav-admin">+ Document</a>
			</li>
			<li>
				<a href="/admin/ag/nouvelle" class="nav-admin">+ AG</a>
			</li>
		{/if}
	</ul>

	<div class="nav-user">
		{#if profile}
			<span class="nav-username" title={`Rôle : ${profile.role}`}>{profile.full_name}</span>
			<form method="POST" action="/logout">
				<button type="submit" class="nav-logout">Déconnexion</button>
			</form>
		{/if}
	</div>
</nav>

<style>
	.app-nav {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.5rem;
		background: white;
		border-bottom: 1px solid #e5e7eb;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.nav-brand {
		font-weight: 700;
		font-size: 1.25rem;
		color: var(--color-primary, #1a73e8);
		text-decoration: none;
		white-space: nowrap;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		list-style: none;
		margin: 0;
		padding: 0;
		flex: 1;
	}

	.nav-links a {
		display: block;
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		text-decoration: none;
		color: #374151;
		font-size: 0.875rem;
		transition: background 0.1s;
	}

	.nav-links a:hover,
	.nav-links a:focus {
		background: #f3f4f6;
	}

	.nav-links .nav-admin {
		color: #1a73e8;
	}

	.nav-separator {
		width: 1px;
		height: 1.5rem;
		background: #e5e7eb;
		margin: 0 0.25rem;
	}

	.nav-user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-left: auto;
		flex-shrink: 0;
	}

	.nav-username {
		font-size: 0.875rem;
		color: #6b7280;
		white-space: nowrap;
	}

	.nav-logout {
		background: none;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		padding: 0.25rem 0.75rem;
		font-size: 0.8125rem;
		color: #374151;
		cursor: pointer;
	}

	.nav-logout:hover {
		background: #f3f4f6;
	}

	@media (max-width: 640px) {
		.app-nav {
			flex-wrap: wrap;
			padding: 0.5rem 1rem;
		}

		.nav-links {
			order: 3;
			flex-wrap: wrap;
			width: 100%;
		}
	}
</style>
