<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const qr = $derived(data.quorum);
</script>

<svelte:head><title>Quorum — {data.ag.title} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/assemblees-generales/{data.ag.id}" class="back-link">← {data.ag.title}</a>
	<h1>Quorum</h1>
</div>

<div class="card quorum-card {qr.reached ? 'reached' : 'not-reached'}">
	<div class="quorum-status">
		{#if qr.reached}
			<span class="icon">✓</span>
			<span class="label">Quorum atteint</span>
		{:else}
			<span class="icon">✗</span>
			<span class="label">Quorum non atteint</span>
		{/if}
	</div>
	<div class="quorum-fraction">{qr.presentWeight} / {qr.totalWeight} voix</div>
	<div class="quorum-pct">{qr.ratio.toFixed(1)} % (requis : {qr.quorumPct} %)</div>
	<div class="quorum-bar-bg">
		<div class="quorum-bar-fill" style="width: {Math.min(100, qr.ratio)}%"></div>
		<div class="quorum-threshold" style="left: {qr.quorumPct}%"></div>
	</div>
</div>

<div class="detail-grid">
	<div class="card">
		<h2>Répartition des présences</h2>
		<dl>
			<dt>Présents</dt>
			<dd>{data.byMode['present'] ?? 0} voix</dd>
			<dt>Représentés</dt>
			<dd>{data.byMode['represented'] ?? 0} voix</dd>
			<dt>Absents</dt>
			<dd>{data.byMode['absent'] ?? 0} voix</dd>
			<dt>Non renseigné</dt>
			<dd>
				{data.totalVoteWeight -
					(data.byMode['present'] ?? 0) -
					(data.byMode['represented'] ?? 0) -
					(data.byMode['absent'] ?? 0)} voix
			</dd>
		</dl>
	</div>
	<div class="card">
		<h2>Paramètres</h2>
		<dl>
			<dt>Seuil requis</dt>
			<dd>{qr.quorumPct} %</dd>
			<dt>Poids total</dt>
			<dd>{data.totalVoteWeight} voix</dd>
			<dt>Poids émargés</dt>
			<dd>{qr.presentWeight} voix</dd>
		</dl>
		{#if !qr.reached}
			<p class="hint">
				Manque {Math.ceil((qr.totalWeight * qr.quorumPct) / 100) - qr.presentWeight} voix pour atteindre
				le quorum.
			</p>
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
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
	}
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
	}
	.quorum-card {
		text-align: center;
		margin-bottom: 1rem;
	}
	.quorum-card.reached {
		border-color: #86efac;
		background: #f0fdf4;
	}
	.quorum-card.not-reached {
		border-color: #fde047;
		background: #fefce8;
	}
	.quorum-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.icon {
		font-size: 1.5rem;
	}
	.label {
		font-size: 1.125rem;
		font-weight: 600;
	}
	.quorum-fraction {
		font-size: 2rem;
		font-weight: 700;
	}
	.quorum-pct {
		font-size: 0.9375rem;
		color: var(--color-text-muted, #6b7280);
		margin-bottom: 1rem;
	}
	.quorum-bar-bg {
		position: relative;
		height: 12px;
		background: #e5e7eb;
		border-radius: 6px;
		overflow: visible;
	}
	.quorum-bar-fill {
		height: 100%;
		background: #16a34a;
		border-radius: 6px;
		transition: width 0.3s;
	}
	.quorum-threshold {
		position: absolute;
		top: -4px;
		bottom: -4px;
		width: 2px;
		background: #dc2626;
		transform: translateX(-1px);
	}
	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 640px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}
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
	.hint {
		font-size: 0.8125rem;
		color: #dc2626;
		margin: 0.75rem 0 0;
	}
</style>
