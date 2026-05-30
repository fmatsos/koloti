<script lang="ts">
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Relancer comptes — {data.ag.title} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/ag/{data.ag.id}" class="back-link">← {data.ag.title}</a>
	<h1>Relancer les comptes en attente</h1>
</div>

{#if form?.success}
	<div class="alert-success">
		{form.sent} lien(s) d'activation envoyé(s).{#if form.errors?.length}
			{form.errors.length} erreur(s).{/if}
	</div>
{/if}
{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="form-card">
	{#if data.pending.length === 0}
		<p class="empty">Aucun compte en attente d'activation.</p>
	{:else}
		<p class="info">
			Les {data.pending.length} comptes suivants n'ont pas encore activé leur compte. Un nouveau lien
			d'activation leur sera envoyé (le précédent sera invalidé).
		</p>
		<ul class="account-list">
			{#each data.pending as p (p.id)}
				<li><strong>{p.full_name}</strong> <span class="muted">— {p.email}</span></li>
			{/each}
		</ul>

		<div class="warning">
			<strong>Confirmation requise :</strong> Cette action enverra un email à chacun de ces {data
				.pending.length} compte(s). Les liens précédents seront révoqués.
		</div>

		<form method="POST">
			<div class="form-actions">
				<a href="/admin/ag/{data.ag.id}" class="btn-secondary">Annuler</a>
				<button type="submit" class="btn-primary">Envoyer les liens ({data.pending.length})</button>
			</div>
		</form>
	{/if}
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
	.form-card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.5rem;
		max-width: 600px;
	}
	.info {
		font-size: 0.9375rem;
		margin: 0 0 1rem;
	}
	.account-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1.25rem;
		font-size: 0.875rem;
	}
	.account-list li {
		padding: 0.375rem 0;
		border-bottom: 1px solid #f3f4f6;
	}
	.muted {
		color: var(--color-text-muted, #6b7280);
	}
	.warning {
		background: #fefce8;
		border: 1px solid #fde047;
		border-radius: 0.375rem;
		padding: 0.875rem 1rem;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
		color: #78350f;
	}
	.form-actions {
		display: flex;
		gap: 0.75rem;
	}
	.btn-primary {
		padding: 0.625rem 1.25rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: var(--radius, 0.375rem);
		font-size: 0.9375rem;
		cursor: pointer;
	}
	.btn-secondary {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		background: white;
		color: var(--color-text, #111827);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		text-decoration: none;
		font-size: 0.9375rem;
	}
	.empty {
		color: var(--color-text-muted, #6b7280);
	}
	.alert-success {
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
</style>
