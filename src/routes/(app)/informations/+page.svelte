<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Informations — Koloti</title></svelte:head>

<div class="page-header">
	<h1>Fil d'informations</h1>
</div>

{#if data.posts.length === 0}
	<p class="empty">Aucune actualité publiée.</p>
{:else}
	<div class="posts">
		{#each data.posts as post (post.id)}
			{@const author = Array.isArray(post.author) ? post.author[0] : post.author}
			<article class="post-card">
				<div class="post-header">
					<h2>{post.title}</h2>
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
						{#if author?.full_name}
							<span class="author">· {author.full_name}</span>
						{/if}
					</div>
				</div>
				<div class="prose">{@html post.bodyHtml}</div>
			</article>
		{/each}
	</div>
{/if}

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.empty {
		color: var(--color-text-muted, #6b7280);
	}
	.posts {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.post-card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.5rem;
	}
	.post-header {
		margin-bottom: 1rem;
	}
	h2 {
		margin: 0 0 0.25rem;
		font-size: 1.125rem;
	}
	.meta {
		font-size: 0.8125rem;
		color: var(--color-text-muted, #6b7280);
	}
	.author {
		margin-left: 0.25rem;
	}
	.prose {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--color-text, #111827);
	}
	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3) {
		margin: 1rem 0 0.5rem;
		font-size: 1rem;
	}
	.prose :global(p) {
		margin: 0 0 0.75rem;
	}
	.prose :global(ul),
	.prose :global(ol) {
		margin: 0 0 0.75rem;
		padding-left: 1.5rem;
	}
	.prose :global(blockquote) {
		border-left: 3px solid var(--color-border, #e5e7eb);
		margin: 0 0 0.75rem;
		padding: 0.25rem 0 0.25rem 1rem;
		color: var(--color-text-muted, #6b7280);
	}
	.prose :global(pre) {
		background: #f3f4f6;
		border-radius: 0.25rem;
		padding: 0.75rem;
		overflow-x: auto;
		font-size: 0.875rem;
		margin: 0 0 0.75rem;
	}
	.prose :global(code) {
		background: #f3f4f6;
		padding: 0.1rem 0.3rem;
		border-radius: 0.2rem;
		font-size: 0.875rem;
	}
	.prose :global(a) {
		color: var(--color-primary, #1a73e8);
	}
</style>
