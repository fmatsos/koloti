<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<Nav profile={data.profile} />

<main class="app-main">
	{@render children()}
</main>

<style>
	.app-main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}
</style>
