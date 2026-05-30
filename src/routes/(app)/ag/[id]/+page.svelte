<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const ag = $derived(data.ag);

	const statusLabels: Record<string, string> = {
		draft: 'En préparation',
		convened: 'Convoquée',
		open: 'En cours',
		closed: 'Clôturée',
		archived: 'Archivée'
	};
	const modeLabels: Record<string, string> = {
		presentiel: 'Présentiel',
		en_ligne: 'En ligne',
		hybride: 'Hybride'
	};
</script>

<svelte:head><title>{ag.title} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/app" class="back-link">← Accueil</a>
	<h1>{ag.title}</h1>
	<span class="badge badge-{ag.status}">{statusLabels[ag.status] ?? ag.status}</span>
</div>

<div class="detail-grid">
	<div class="card">
		<h2>Informations</h2>
		<dl>
			<dt>Type</dt>
			<dd>
				{ag.type === 'ordinaire'
					? 'Assemblée Générale Ordinaire'
					: 'Assemblée Générale Extraordinaire'}
			</dd>
			<dt>Date</dt>
			<dd>
				{new Date(ag.scheduled_at).toLocaleString('fr-FR', {
					day: '2-digit',
					month: 'long',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})}
			</dd>
			<dt>Mode</dt>
			<dd>{modeLabels[ag.mode] ?? ag.mode}</dd>
			{#if ag.location}<dt>Lieu</dt>
				<dd>{ag.location}</dd>{/if}
		</dl>
	</div>

	{#if data.quorum && ag.status === 'open'}
		<div class="card quorum-card {data.quorum.reached ? 'reached' : 'pending'}">
			<h2>Quorum</h2>
			<div class="quorum-fraction">{data.quorum.presentWeight} / {data.quorum.totalWeight}</div>
			<div class="quorum-label">
				{data.quorum.ratio.toFixed(1)} % (requis : {data.quorum.quorumPct} %)
			</div>
			<div class="quorum-bar-bg">
				<div class="quorum-bar-fill" style="width: {Math.min(100, data.quorum.ratio)}%"></div>
				<div class="quorum-threshold" style="left: {data.quorum.quorumPct}%"></div>
			</div>
			{#if data.quorum.reached}
				<p class="status-ok">✓ Quorum atteint</p>
			{:else}
				<p class="status-ko">✗ Quorum non atteint</p>
			{/if}
		</div>
	{/if}
</div>

{#if data.agendaItems.length > 0}
	<div class="card mt">
		<h2>Ordre du jour</h2>
		<ol class="agenda-list">
			{#each data.agendaItems as item (item.id)}
				<li>
					<strong>{item.title}</strong>
					{#if item.requires_vote}<span class="badge-vote">Vote</span>{/if}
					{#if item.description}<p class="item-desc">{item.description}</p>{/if}
				</li>
			{/each}
		</ol>
	</div>
{/if}

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
	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
	}
	.badge {
		display: inline-block;
		font-size: 0.75rem;
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
	}
	.badge-draft {
		background: #fef9c3;
		color: #854d0e;
	}
	.badge-convened {
		background: #dbeafe;
		color: #1e40af;
	}
	.badge-open {
		background: #dcfce7;
		color: #15803d;
	}
	.badge-closed,
	.badge-archived {
		background: #f3f4f6;
		color: #6b7280;
	}
	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
		margin-bottom: 1rem;
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
	.mt {
		margin-top: 1rem;
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 1rem;
		font-size: 0.875rem;
		margin: 0;
	}
	dt {
		font-weight: 500;
		color: var(--color-text-muted, #6b7280);
	}
	dd {
		margin: 0;
	}
	.quorum-card.reached {
		border-color: #86efac;
		background: #f0fdf4;
	}
	.quorum-card.pending {
		border-color: #fde047;
		background: #fefce8;
	}
	.quorum-fraction {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0.5rem 0 0;
	}
	.quorum-label {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
		margin-bottom: 0.75rem;
	}
	.quorum-bar-bg {
		position: relative;
		height: 10px;
		background: #e5e7eb;
		border-radius: 5px;
	}
	.quorum-bar-fill {
		height: 100%;
		background: #16a34a;
		border-radius: 5px;
	}
	.quorum-threshold {
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 2px;
		background: #dc2626;
		transform: translateX(-1px);
	}
	.status-ok {
		color: #15803d;
		font-weight: 600;
		font-size: 0.875rem;
		margin: 0.5rem 0 0;
	}
	.status-ko {
		color: #b45309;
		font-weight: 600;
		font-size: 0.875rem;
		margin: 0.5rem 0 0;
	}
	.agenda-list {
		padding-left: 1.25rem;
		margin: 0;
		font-size: 0.9375rem;
	}
	.agenda-list li {
		padding: 0.375rem 0;
	}
	.item-desc {
		margin: 0.125rem 0 0;
		color: var(--color-text-muted, #6b7280);
		font-size: 0.875rem;
	}
	.badge-vote {
		display: inline-block;
		background: #ede9fe;
		color: #6d28d9;
		font-size: 0.7rem;
		padding: 0.1rem 0.4rem;
		border-radius: 9999px;
		margin-left: 0.375rem;
	}
</style>
