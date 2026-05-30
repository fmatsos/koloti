<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<Nav profile={data.profile} />

<main class="admin-main">
	<div class="admin-header">
		<span class="admin-badge">Administration</span>
	</div>
	{@render children()}
</main>

<style>
	.admin-main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	.admin-header {
		margin-bottom: 1.5rem;
	}

	.admin-badge {
		display: inline-block;
		background: #fff3cd;
		color: #856404;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid #ffc107;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
