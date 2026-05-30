<script lang="ts">
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Convoquer — {data.ag.title} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/ag/{data.ag.id}" class="back-link">← {data.ag.title}</a>
	<h1>Convoquer l'assemblée</h1>
</div>

{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<div class="form-card">
	<div class="summary">
		<p><strong>{data.ag.title}</strong></p>
		<p>Prévue le {new Date(data.ag.scheduled_at).toLocaleString('fr-FR')}</p>
		<p>{data.itemCount} point(s) à l'ordre du jour</p>
	</div>

	<div class="warning">
		<strong>Attention :</strong> Cette action est irréversible. Un email de convocation avec le PDF de l'ordre du jour sera envoyé à tous les colotis actifs. L'AG passera en statut <em>Convoquée</em>.
	</div>

	<form method="POST">
		<div class="form-actions">
			<a href="/admin/ag/{data.ag.id}" class="btn-secondary">Annuler</a>
			<button type="submit" class="btn-danger">Convoquer et envoyer les emails</button>
		</div>
	</form>
</div>

<style>
	.page-header { margin-bottom: 1.5rem; }
	.back-link { display: inline-block; margin-bottom: 0.5rem; font-size: 0.875rem; text-decoration: none; color: var(--color-text-muted, #6b7280); }
	h1 { margin: 0; font-size: 1.5rem; }
	.form-card { background: white; border-radius: var(--radius, 0.375rem); border: 1px solid var(--color-border, #e5e7eb); padding: 1.5rem; max-width: 540px; }
	.summary { font-size: 0.9375rem; margin-bottom: 1.25rem; }
	.summary p { margin: 0.25rem 0; }
	.warning { background: #fefce8; border: 1px solid #fde047; border-radius: 0.375rem; padding: 0.875rem 1rem; font-size: 0.875rem; margin-bottom: 1.5rem; color: #78350f; }
	.form-actions { display: flex; gap: 0.75rem; }
	.btn-danger { padding: 0.625rem 1.25rem; background: #dc2626; color: white; border: none; border-radius: var(--radius, 0.375rem); font-size: 0.9375rem; cursor: pointer; }
	.btn-secondary { display: inline-block; padding: 0.625rem 1.25rem; background: white; color: var(--color-text, #111827); border: 1px solid var(--color-border, #e5e7eb); border-radius: var(--radius, 0.375rem); text-decoration: none; font-size: 0.9375rem; }
	.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
</style>
