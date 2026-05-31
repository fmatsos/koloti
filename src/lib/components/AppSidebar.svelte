<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/stores';
	import type { Database } from '$lib/types/database';

	let { profile }: { profile: Database['public']['Tables']['profile']['Row'] | null } = $props();

	const isAdminOrEditor = $derived(profile?.role === 'admin' || profile?.role === 'editor');

	function isActive(href: string): boolean {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}

	const mainLinks = [
		{ href: '/', label: 'Tableau de bord', icon: '⊞' },
		{ href: '/informations', label: 'Informations', icon: '📢' },
		{ href: '/documents', label: 'Documents', icon: '📄' },
		{ href: '/assemblees-generales', label: 'Assemblées générales', icon: '🏛️' }
	];

	const adminLinks = [
		{ href: '/comptes', label: 'Comptes', icon: '👥' },
		{ href: '/proprietes', label: 'Propriétés', icon: '🏘️' },
		{ href: '/etat-nominatif', label: 'État nominatif', icon: '📊' }
	];
</script>

<Navigation layout="sidebar" class="flex flex-col h-full bg-surface-100-900 border-r border-surface-300-700">
	<Navigation.Header class="p-4 border-b border-surface-300-700">
		<a
			href="/"
			class="flex items-center gap-2 text-primary-500 font-bold text-xl hover:text-primary-400 transition-colors"
			aria-label="Koloti — Tableau de bord"
		>
			<span class="text-2xl">🏡</span>
			<span>Koloti</span>
		</a>
		<p class="text-xs text-surface-500 mt-0.5">Espace ASL</p>
	</Navigation.Header>

	<Navigation.Content class="flex-1 overflow-y-auto p-3">
		<Navigation.Group>
			<Navigation.Label class="text-xs font-semibold uppercase tracking-widest text-surface-400 px-3 py-1.5">
				Navigation
			</Navigation.Label>
			{#each mainLinks as link}
				<Navigation.TriggerAnchor
					href={link.href}
					aria-current={isActive(link.href) ? 'page' : undefined}
					class="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
						{isActive(link.href)
						? 'bg-primary-500 text-white shadow-sm'
						: 'text-surface-700-300 hover:bg-surface-200-800 hover:text-surface-900-100'}"
				>
					<span class="text-base">{link.icon}</span>
					<Navigation.TriggerText>{link.label}</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
			{/each}
		</Navigation.Group>

		{#if isAdminOrEditor}
			<Navigation.Group class="mt-4">
				<Navigation.Label class="text-xs font-semibold uppercase tracking-widest text-surface-400 px-3 py-1.5">
					Administration
				</Navigation.Label>
				{#each adminLinks as link}
					<Navigation.TriggerAnchor
						href={link.href}
						aria-current={isActive(link.href) ? 'page' : undefined}
						class="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
							{isActive(link.href)
							? 'bg-primary-500 text-white shadow-sm'
							: 'text-surface-700-300 hover:bg-surface-200-800 hover:text-surface-900-100'}"
					>
						<span class="text-base">{link.icon}</span>
						<Navigation.TriggerText>{link.label}</Navigation.TriggerText>
					</Navigation.TriggerAnchor>
				{/each}
			</Navigation.Group>
		{/if}
	</Navigation.Content>

	<Navigation.Footer class="p-3 border-t border-surface-300-700">
		<form method="POST" action="/logout">
			<button
				type="submit"
				class="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600-400 hover:bg-error-50-950 hover:text-error-500 transition-all duration-150"
				aria-label="Se déconnecter"
			>
				<span class="text-base">🚪</span>
				<span>Déconnexion</span>
			</button>
		</form>
	</Navigation.Footer>
</Navigation>
