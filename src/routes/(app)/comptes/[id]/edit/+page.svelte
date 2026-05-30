<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const compte = $derived(data.compte);
	const cred = $derived(
		Array.isArray(compte.credential) ? compte.credential[0] : compte.credential
	);
</script>

<svelte:head>
	<title>Modifier {compte.full_name} — Koloti</title>
</svelte:head>

<div class="page-header">
	<a href="/comptes/{compte.id}/view" class="back-link">← Vue du compte</a>
	<h1>Modifier {compte.full_name}</h1>
</div>

{#if form?.success}
	<div class="alert alert-success">
		{#if form.action === 'email'}Email mis à jour.
		{:else if form.action === 'role'}Rôle mis à jour.
		{:else if form.action === 'status'}Statut mis à jour.
		{:else if form.action === 'reissue'}Nouveau lien d'activation envoyé.
		{:else if form.action === 'login'}Login mis à jour.{compte.status === 'active' ? " L'utilisateur a été notifié par email." : ''}
		{/if}
	</div>
{/if}

{#if form?.error}
	<div class="alert alert-error">{form.error}</div>
{/if}

<div class="detail-grid">
	<div class="actions-col">
		<!-- Modifier le login -->
		<div class="card">
			<h3>Modifier le login</h3>
			<form method="POST" action="?/updateLogin">
				<div class="field">
					<label for="login">Identifiant</label>
					<input
						id="login"
						name="login"
						type="text"
						value={cred?.login ?? ''}
						pattern="[a-z0-9]+"
						minlength="3"
						maxlength="20"
						required
					/>
					<span class="hint">3–20 caractères alphanumériques minuscules (a-z, 0-9).</span>
				</div>
				<div class="login-actions">
					<button type="submit" class="btn-sm">Enregistrer</button>
					<button
						type="submit"
						form="regenerate-form"
						class="btn-sm btn-secondary-outline"
					>Régénérer (6 car.)</button>
				</div>
			</form>
			<form id="regenerate-form" method="POST" action="?/regenerateLogin" style="display:none"></form>
		</div>

		<!-- Modifier email -->
		<div class="card">
			<h3>Modifier l'email</h3>
			<form method="POST" action="?/updateEmail">
				<div class="field">
					<label for="email">Nouvel email</label>
					<input id="email" name="email" type="email" value={compte.email} required />
					<span class="hint">Le login reste inchangé.</span>
				</div>
				<button type="submit" class="btn-sm">Enregistrer</button>
			</form>
		</div>

		<!-- Modifier rôle -->
		<div class="card">
			<h3>Modifier le rôle</h3>
			<form method="POST" action="?/updateRole">
				<div class="field">
					<label for="role">Rôle</label>
					<select id="role" name="role">
						<option value="member" selected={compte.role === 'member'}>Membre</option>
						<option value="editor" selected={compte.role === 'editor'}>Éditeur</option>
						<option value="admin" selected={compte.role === 'admin'}>Admin</option>
					</select>
				</div>
				<button type="submit" class="btn-sm">Enregistrer</button>
			</form>
		</div>

		<!-- Activer/désactiver -->
		<div class="card">
			<h3>Statut du compte</h3>
			<form method="POST" action="?/toggleStatus">
				{#if compte.status === 'inactive'}
					<input type="hidden" name="status" value="active" />
					<button type="submit" class="btn-sm btn-success">Réactiver</button>
				{:else}
					<input type="hidden" name="status" value="inactive" />
					<button type="submit" class="btn-sm btn-danger">Désactiver</button>
					<p class="hint">Le compte est conservé (historique préservé).</p>
				{/if}
			</form>
		</div>

		<!-- Réémettre lien d'activation -->
		{#if compte.status === 'pending'}
			<div class="card">
				<h3>Lien d'activation</h3>
				<form method="POST" action="?/reissueLink">
					<p class="hint">Renvoie un nouveau lien d'activation (72h). Invalide le précédent.</p>
					<button type="submit" class="btn-sm">Réémettre le lien</button>
				</form>
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
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h3 {
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

	.actions-col {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
	}

	.field {
		margin-bottom: 0.75rem;
	}
	label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}
	input,
	select {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
	}
	.hint {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
		margin: 0.25rem 0 0;
	}

	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.btn-success {
		background: #16a34a;
	}
	.btn-danger {
		background: #dc2626;
	}
	.btn-secondary-outline {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}
	.login-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.alert-success {
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}
	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
</style>
