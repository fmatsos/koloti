<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Informations — Page {data.currentPage} — Koloti</title></svelte:head>

<div class="page-header">
	<div class="header-row">
		<h1>Fil d'informations</h1>
		{#if data.isAdminOrEditor}
			<a href="/informations/new" class="btn-sm">+ Nouveau post</a>
		{/if}
	</div>
</div>

<div class="posts">
	{#each data.posts as post (post.id)}
		{@const author = Array.isArray(post.author) ? post.author[0] : post.author}
		<article class="post-card">
			<div class="post-header">
				<div class="title-row">
					<h2><a href="/informations/{post.id}/view">{post.title}</a></h2>
					{#if data.isAdminOrEditor && !post.is_published}<span class="badge-draft">Brouillon</span
						>{/if}
					{#if data.isAdminOrEditor}<a href="/informations/{post.id}/edit" class="edit-link"
							>Modifier</a
						>{/if}
				</div>
				<div class="meta">
					{#if post.published_at}
						<time datetime={post.published_at}
							>{new Date(post.published_at).toLocaleDateString('fr-FR', {
								day: '2-digit',
								month: 'long',
								year: 'numeric'
							})}</time
						>
					{/if}
					{#if author?.first_name || author?.last_name}<span class="author"
							>· {author?.first_name} {author?.last_name}</span
						>{/if}
				</div>
			</div>
			<div class="prose">{@html post.bodyPreviewHtml}</div>
			{#if post.isTruncated}
				<a href="/informations/{post.id}/view" class="read-more">Voir l'information complète →</a>
			{/if}
		</article>
	{/each}
</div>

<nav class="pagination">
	<a
		href={data.currentPage === 2 ? '/informations' : `/informations/page/${data.currentPage - 1}`}
		class="page-link">← Précédent</a
	>
	<span class="page-info">Page {data.currentPage} / {data.totalPages}</span>
	{#if data.currentPage < data.totalPages}
		<a href="/informations/page/{data.currentPage + 1}" class="page-link">Suivant →</a>
	{/if}
</nav>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
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
	.title-row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
		flex-wrap: wrap;
	}
	h2 {
		margin: 0;
		font-size: 1.125rem;
	}
	h2 a {
		color: inherit;
		text-decoration: none;
	}
	.edit-link,
	.read-more,
	.page-link {
		color: var(--color-primary, #1a73e8);
	}
	.edit-link {
		font-size: 0.75rem;
		margin-left: auto;
	}
	.read-more {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.875rem;
	}
	.badge-draft {
		display: inline-block;
		background: #fef9c3;
		color: #854d0e;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
	.meta,
	.page-info {
		font-size: 0.8125rem;
		color: var(--color-text-muted, #6b7280);
	}
	.author {
		margin-left: 0.25rem;
	}
	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.5rem;
		padding: 0.75rem 0;
		border-top: 1px solid var(--color-border, #e5e7eb);
		font-size: 0.875rem;
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
	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		text-decoration: none;
	}
</style>
