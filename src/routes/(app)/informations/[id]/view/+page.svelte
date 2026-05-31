<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const post = $derived(data.post);
	const author = $derived(Array.isArray(post.author) ? post.author[0] : post.author);
</script>

<svelte:head><title>{post.title} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/informations" class="back-link">← Fil d'informations</a>
	<div class="header-row">
		<h1>{post.title}</h1>
		{#if data.isAdminOrEditor}
			<a href="/informations/{post.id}/edit" class="btn-sm btn-outline">Modifier</a>
		{/if}
	</div>
	<div class="meta">
		{#if post.published_at}
			<time datetime={post.published_at}>
				{new Date(post.published_at).toLocaleDateString('fr-FR', {
					day: '2-digit',
					month: 'long',
					year: 'numeric'
				})}
			</time>
		{/if}
		{#if author?.first_name || author?.last_name}<span>· {author?.first_name} {author?.last_name}</span>{/if}
		{#if !post.is_published}<span class="badge-draft">Brouillon</span>{/if}
	</div>
</div>

<article class="post-card">
	<div class="prose">{@html post.bodyHtml}</div>
</article>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.back-link {
		display: inline-block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		text-decoration: none;
		color: var(--color-text-muted, #6b7280);
	}
	.header-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.meta {
		font-size: 0.8125rem;
		color: var(--color-text-muted, #6b7280);
		margin-top: 0.25rem;
	}
	.badge-draft {
		display: inline-block;
		background: #fef9c3;
		color: #854d0e;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
		margin-left: 0.5rem;
	}
	.post-card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.5rem;
	}
	.btn-sm {
		padding: 0.375rem 0.875rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		text-decoration: none;
	}
	.btn-outline {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}
	.prose {
		font-size: 0.9375rem;
		line-height: 1.6;
	}
	.prose :global(p) {
		margin: 0 0 0.75rem;
	}
	.prose :global(ul),
	.prose :global(ol) {
		margin: 0 0 0.75rem;
		padding-left: 1.5rem;
	}
	.prose :global(a) {
		color: var(--color-primary, #1a73e8);
	}
	.prose :global(pre) {
		background: #f3f4f6;
		border-radius: 0.25rem;
		padding: 0.75rem;
		overflow-x: auto;
		font-size: 0.875rem;
	}
</style>
