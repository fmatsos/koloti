<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Informations — Koloti</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="h3 font-bold">Fil d'informations</h1>
		{#if data.isAdminOrEditor}
			<a href="/informations/new" class="btn preset-filled-primary-500 rounded-lg text-sm px-4 py-2">
				+ Nouveau post
			</a>
		{/if}
	</div>

	{#if data.posts.length === 0}
		<div class="card preset-filled-surface-100-900 rounded-xl p-8 text-center">
			<p class="text-surface-500">Aucune actualité publiée.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each data.posts as post (post.id)}
				{@const author = Array.isArray(post.author) ? post.author[0] : post.author}
				<article class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 p-6 shadow-sm transition-shadow hover:shadow-md">
					<div class="flex flex-wrap items-baseline gap-2 mb-1">
						<h2 class="h5 font-semibold">
							<a href="/informations/{post.id}/view" class="hover:text-primary-500 transition-colors">
								{post.title}
							</a>
						</h2>
						{#if data.isAdminOrEditor && !post.is_published}
							<span class="badge preset-tonal-warning text-xs rounded-full px-2 py-0.5">Brouillon</span>
						{/if}
						{#if data.isAdminOrEditor}
							<a href="/informations/{post.id}/edit" class="text-xs text-primary-500 hover:underline ml-auto">
								Modifier
							</a>
						{/if}
					</div>
					<div class="flex items-center gap-2 text-xs text-surface-500 mb-3">
						{#if post.published_at}
							<time datetime={post.published_at}>
								{new Date(post.published_at).toLocaleDateString('fr-FR', {
									day: '2-digit',
									month: 'long',
									year: 'numeric'
								})}
							</time>
						{/if}
						{#if author?.first_name || author?.last_name}
							<span>·</span>
							<span>{author?.first_name} {author?.last_name}</span>
						{/if}
					</div>
					<div class="prose prose-sm text-surface-700-300 text-sm leading-relaxed">{@html post.bodyPreviewHtml}</div>
					{#if post.isTruncated}
						<a href="/informations/{post.id}/view" class="inline-block mt-3 text-sm text-primary-500 hover:underline">
							Voir l'information complète →
						</a>
					{/if}
				</article>
			{/each}
		</div>

		{#if data.totalPages > 1}
			<nav class="flex items-center justify-between pt-4 border-t border-surface-200-800 text-sm" aria-label="Pagination">
				<span class="text-surface-500">Page {data.currentPage} / {data.totalPages}</span>
				{#if data.currentPage < data.totalPages}
					<a href="/informations/page/{data.currentPage + 1}" class="btn preset-tonal-primary rounded-lg px-4 py-1.5 text-sm">
						Page suivante →
					</a>
				{/if}
			</nav>
		{/if}
	{/if}
</div>
