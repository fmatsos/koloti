<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(:root) {
		--color-primary: #1a73e8;
		--color-primary-dark: #1558b0;
		--color-danger: #dc2626;
		--color-success: #16a34a;
		--color-warning: #d97706;
		--color-bg: #f9fafb;
		--color-surface: #ffffff;
		--color-border: #e5e7eb;
		--color-text: #111827;
		--color-text-muted: #6b7280;
		--radius: 0.375rem;
		--shadow-sm: 0 1px 3px rgb(0 0 0 / 0.1);
		--shadow: 0 2px 8px rgb(0 0 0 / 0.1);
	}

	:global(body) {
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
		background: var(--color-bg);
		color: var(--color-text);
		line-height: 1.5;
	}

	:global(a) {
		color: var(--color-primary);
	}

	:global(a:hover) {
		color: var(--color-primary-dark);
	}

	:global(h1, h2, h3, h4) {
		margin: 0 0 0.5rem;
		line-height: 1.3;
	}

	:global(p) {
		margin: 0 0 1rem;
	}

	:global(button) {
		font-family: inherit;
	}
</style>
