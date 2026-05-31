<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/stores';
	import { buildBreadcrumbs } from '$lib/breadcrumbs';
	import type { Database } from '$lib/types/database';

	let { profile }: { profile: Database['public']['Tables']['profile']['Row'] | null } = $props();

	const crumbs = $derived(buildBreadcrumbs($page.url.pathname));
</script>

<AppBar class="bg-surface-50-950 border-b border-surface-200-800 shadow-sm px-4 py-2.5">
	<AppBar.Lead>
		<nav aria-label="Fil d'ariane" class="flex items-center gap-1 text-sm min-w-0">
			{#each crumbs as crumb, i}
				{#if i > 0}
					<span class="text-surface-400 mx-0.5 select-none" aria-hidden="true">/</span>
				{/if}
				{#if i === crumbs.length - 1}
					<span class="text-surface-900-100 font-medium truncate" aria-current="page">
						{crumb.label}
					</span>
				{:else}
					<a
						href={crumb.href}
						class="text-surface-500 hover:text-primary-500 transition-colors truncate"
					>
						{crumb.label}
					</a>
				{/if}
			{/each}
		</nav>
	</AppBar.Lead>

	<AppBar.Trail>
		{#if profile}
			<div class="flex items-center gap-3">
				<span class="text-sm text-surface-600-400 hidden sm:inline">
					Bonjour <strong class="text-surface-900-100 font-semibold">{profile.first_name}</strong>
				</span>
				<a
					href="/profil"
					class="btn btn-sm preset-tonal-primary text-xs px-3 py-1.5 rounded-lg transition-all duration-150 hover:scale-105"
					aria-label="Accéder à mon profil"
				>
					Mon profil
				</a>
			</div>
		{/if}
	</AppBar.Trail>
</AppBar>
