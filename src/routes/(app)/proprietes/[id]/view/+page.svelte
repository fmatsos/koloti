<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const prop = $derived(data.prop);
	const current = $derived(data.ownerships.filter((ownership) => !ownership.end_date));
	const past = $derived(data.ownerships.filter((ownership) => !!ownership.end_date));
</script>

<svelte:head><title>{prop.reference} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/proprietes" class="back-link">← Propriétés</a>
	<div class="header-row">
		<h1>{prop.reference}</h1>
		<a href="/proprietes/{prop.id}/edit" class="btn-sm btn-outline">Modifier</a>
	</div>
</div>

<div class="detail-grid">
	<div class="card">
		<h2>Informations</h2>
		<dl class="info-list">
			<dt>Référence</dt>
			<dd>{prop.reference}</dd>
			<dt>N° de voie</dt>
			<dd>{prop.street_number ?? '—'}</dd>
			<dt>Voie</dt>
			<dd>{prop.street_name ?? '—'}</dd>
			<dt>N° cadastral</dt>
			<dd>{prop.cadastre_number ?? '—'}</dd>
		</dl>
	</div>

	<div>
		<div class="card">
			<h2>Propriétaires actuels</h2>
			{#if current.length === 0}
				<p class="empty">Aucun propriétaire enregistré.</p>
			{:else}
				<ul class="owner-list">
					{#each current as ownership (ownership.id)}
						{@const profile = Array.isArray(ownership.profile)
							? ownership.profile[0]
							: ownership.profile}
						<li>
							<strong><a href="/comptes/{profile?.id}/view">{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</a></strong>
							{#if ownership.is_primary}<span class="badge-primary">Principal</span>{/if}
							<br /><small class="muted"
								>{profile?.email ?? ''} · depuis {ownership.start_date}</small
							>
						</li>
					{/each}
				</ul>
			{/if}
			<a href="/proprietes/{prop.id}/owners" class="link-sm">Gérer les propriétaires →</a>
		</div>

		{#if past.length > 0}
			<div class="card history-card">
				<h2>Historique des propriétaires</h2>
				<ul class="owner-list">
					{#each past as ownership (ownership.id)}
						{@const profile = Array.isArray(ownership.profile)
							? ownership.profile[0]
							: ownership.profile}
						<li>
							<strong>{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</strong>
							<br /><small class="muted">{ownership.start_date} → {ownership.end_date}</small>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

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
		align-items: center;
		justify-content: space-between;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h2 {
		margin: 0 0 1rem;
		font-size: 1rem;
	}
	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 640px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}
	}
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
	}
	.history-card {
		margin-top: 1rem;
	}
	.info-list {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
		margin: 0;
		font-size: 0.875rem;
	}
	dt {
		color: var(--color-text-muted, #6b7280);
		font-weight: 500;
	}
	dd {
		margin: 0;
	}
	.owner-list {
		list-style: none;
		margin: 0 0 0.75rem;
		padding: 0;
	}
	.owner-list li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.875rem;
	}
	.badge-primary {
		display: inline-block;
		background: #dbeafe;
		color: #1e40af;
		font-size: 0.7rem;
		padding: 0.1rem 0.4rem;
		border-radius: 9999px;
		margin-left: 0.5rem;
	}
	.muted,
	.empty {
		color: var(--color-text-muted, #6b7280);
	}
	.link-sm {
		font-size: 0.875rem;
		color: var(--color-primary, #1a73e8);
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
</style>
