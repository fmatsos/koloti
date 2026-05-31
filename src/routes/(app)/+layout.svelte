<script lang="ts">
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/toaster';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<!-- Toast notifications -->
<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast toast={toast} class="card shadow-lg p-4 rounded-xl flex items-start gap-3 max-w-sm">
			<div class="flex-1 min-w-0">
				{#if toast.title}
					<Toast.Title class="font-semibold text-sm">{toast.title}</Toast.Title>
				{/if}
				{#if toast.description}
					<Toast.Description class="text-xs text-surface-600-400 mt-0.5">{toast.description}</Toast.Description>
				{/if}
			</div>
			<Toast.CloseTrigger class="text-surface-400 hover:text-surface-700 transition-colors flex-shrink-0" aria-label="Fermer">
				✕
			</Toast.CloseTrigger>
		</Toast>
	{/snippet}
</Toast.Group>

<!-- App shell: sidebar + header + main + footer -->
<div class="grid grid-cols-[260px_1fr] grid-rows-[auto_1fr_auto] min-h-svh">
	<!-- Sidebar -->
	<aside class="col-start-1 row-start-1 row-span-3 overflow-y-auto sticky top-0 h-svh shadow-sm" aria-label="Navigation latérale">
		<AppSidebar profile={data.profile} />
	</aside>

	<!-- Header -->
	<header class="col-start-2 row-start-1 sticky top-0 z-10">
		<AppHeader profile={data.profile} />
	</header>

	<!-- Main content -->
	<main
		class="col-start-2 row-start-2 p-6 min-w-0"
		id="main-content"
		tabindex="-1"
	>
		{@render children()}
	</main>

	<!-- Footer -->
	<div class="col-start-2 row-start-3">
		<AppFooter />
	</div>
</div>
