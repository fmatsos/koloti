<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Fil d'informations — Admin — Koloti</title></svelte:head>

<div class="page-header">
	<div class="header-row">
		<h1>Fil d'informations</h1>
		<a href="/admin/info/nouvelle" class="btn-sm">+ Nouveau post</a>
	</div>
</div>

<div class="card">
	{#if data.posts.length === 0}
		<p class="empty">Aucun post.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Titre</th>
					<th>Statut</th>
					<th>Auteur</th>
					<th>Date</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.posts as post (post.id)}
					{@const author = Array.isArray(post.author) ? post.author[0] : post.author}
					<tr>
						<td>{post.title}</td>
						<td>
							{#if post.is_published}
								<span class="badge-pub">Publié</span>
							{:else}
								<span class="badge-draft">Brouillon</span>
							{/if}
						</td>
						<td>{author?.full_name ?? '—'}</td>
						<td class="muted"
							>{post.published_at
								? new Date(post.published_at).toLocaleDateString('fr-FR')
								: new Date(post.created_at).toLocaleDateString('fr-FR')}</td
						>
						<td><a href="/admin/info/{post.id}" class="link-sm">Modifier</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

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
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	th {
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 2px solid #e5e7eb;
		padding: 0.5rem 0.75rem;
	}
	td {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #f3f4f6;
	}
	.muted {
		color: var(--color-text-muted, #6b7280);
	}
	.badge-pub {
		display: inline-block;
		background: #dcfce7;
		color: #15803d;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
	.badge-draft {
		display: inline-block;
		background: #fef9c3;
		color: #854d0e;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
	}
	.empty {
		color: var(--color-text-muted, #6b7280);
		font-size: 0.875rem;
	}
	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		text-decoration: none;
	}
	.link-sm {
		font-size: 0.875rem;
		color: var(--color-primary, #1a73e8);
	}
</style>
