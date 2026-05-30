<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let fullName = $state('');
	let email = $state('');
	let phone = $state('');
	let role = $state('member');
</script>

<svelte:head>
	<title>Nouveau compte — Administration Koloti</title>
</svelte:head>

<div class="page-header">
	<a href="/admin/comptes" class="back-link">← Retour aux comptes</a>
	<h1>Créer un compte</h1>
</div>

{#if form?.error}
	<div class="alert alert-error">{form.error}</div>
{/if}

<div class="form-card">
	<form method="POST">
		<div class="field">
			<label for="full_name">Nom complet <span class="required">*</span></label>
			<input
				id="full_name"
				name="full_name"
				type="text"
				required
				maxlength="100"
				bind:value={fullName}
				placeholder="Prénom Nom"
			/>
		</div>

		<div class="field">
			<label for="email">Email <span class="required">*</span></label>
			<input
				id="email"
				name="email"
				type="email"
				required
				maxlength="200"
				bind:value={email}
				placeholder="email@exemple.fr"
			/>
			<span class="hint">Le lien d'activation sera envoyé à cette adresse.</span>
		</div>

		<div class="field">
			<label for="phone">Téléphone</label>
			<input
				id="phone"
				name="phone"
				type="tel"
				maxlength="20"
				bind:value={phone}
				placeholder="+33 6 00 00 00 00"
			/>
		</div>

		<div class="field">
			<label for="role">Rôle <span class="required">*</span></label>
			<select id="role" name="role" bind:value={role}>
				<option value="member">Membre (coloti)</option>
				<option value="editor">Éditeur (membre du syndicat)</option>
				<option value="admin">Admin (président)</option>
			</select>
		</div>

		<div class="info-box">
			<strong>À noter :</strong> Le compte sera créé en statut <em>En attente</em>. Un lien
			d'activation (valable 72h) sera automatiquement envoyé à l'email renseigné. L'identifiant de
			connexion (login) sera généré automatiquement.
		</div>

		<div class="form-actions">
			<a href="/admin/comptes" class="btn-secondary">Annuler</a>
			<button type="submit" class="btn-primary">Créer le compte</button>
		</div>
	</form>
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
		max-width: 560px;
	}

	.field {
		margin-bottom: 1.25rem;
	}

	label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.375rem;
	}

	.required {
		color: var(--color-danger, #dc2626);
	}

	input[type='text'],
	input[type='email'],
	input[type='tel'],
	select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.9375rem;
		box-sizing: border-box;
	}

	.hint {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
		margin-top: 0.25rem;
	}

	.info-box {
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: var(--radius, 0.375rem);
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		color: #0369a1;
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
		font-weight: 500;
		cursor: pointer;
	}

	.btn-secondary {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		background: white;
		color: var(--color-text, #111827);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: var(--radius, 0.375rem);
		font-size: 0.9375rem;
		text-decoration: none;
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
