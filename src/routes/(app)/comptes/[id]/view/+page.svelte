<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const compte = $derived(data.compte);
	const cred = $derived(
		Array.isArray(compte.credential) ? compte.credential[0] : compte.credential
	);
	const activeOwn = $derived(data.ownerships.filter((ownership) => !ownership.end_date));

	const statusLabels = { pending: 'En attente', active: 'Actif', inactive: 'Inactif' };
	const roleLabels = { admin: 'Admin', editor: 'Éditeur', member: 'Membre' };

	function fmt(date: string | null) {
		return date
			? new Date(date).toLocaleDateString('fr-FR', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			: '—';
	}

	let dialog: HTMLDialogElement;
	$effect(() => {
		if (form?.needsConfirmation && dialog) dialog.showModal();
	});
</script>

<svelte:head><title>{compte.full_name} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/comptes" class="back-link">← Retour aux comptes</a>
	<div class="header-row">
		<h1>{compte.full_name}</h1>
		<a href="/comptes/{compte.id}/edit" class="btn-sm btn-outline">Modifier</a>
	</div>
</div>

{#if data.created}<div class="alert alert-success">
		Compte créé. Le lien d'activation a été envoyé.
	</div>{/if}
{#if form?.attachSuccess}<div class="alert alert-success">
		Propriété rattachée avec succès.
	</div>{/if}
{#if form?.error}<div class="alert alert-error">{form.error}</div>{/if}

<div class="detail-grid">
	<div class="card">
		<h2>Informations</h2>
		<dl class="info-list">
			<dt>Login</dt>
			<dd><code>{cred?.login ?? '—'}</code></dd>
			<dt>Email</dt>
			<dd>{compte.email}</dd>
			<dt>Téléphone</dt>
			<dd>{compte.phone ?? '—'}</dd>
			<dt>Rôle</dt>
			<dd>{roleLabels[compte.role]}</dd>
			<dt>Statut</dt>
			<dd><span class="badge badge-{compte.status}">{statusLabels[compte.status]}</span></dd>
			<dt>Créé le</dt>
			<dd>{fmt(compte.created_at)}</dd>
			<dt>Activé le</dt>
			<dd>{fmt(compte.activated_at)}</dd>
			<dt>Dernière connexion</dt>
			<dd>{fmt(compte.last_login_at)}</dd>
		</dl>
	</div>

	<div class="card">
		<h2>Propriétés liées</h2>
		{#if activeOwn.length === 0}
			<p class="empty">Aucune propriété rattachée.</p>
		{:else}
			<ul class="prop-list">
				{#each activeOwn as ownership (ownership.id)}
					{@const prop = Array.isArray(ownership.property)
						? ownership.property[0]
						: ownership.property}
					<li>
						<a href="/proprietes/{prop?.id}/view">{prop?.reference ?? '—'}</a>
						{#if prop?.street_number || prop?.street_name}
							<small class="muted"> — {prop?.street_number ?? ''} {prop?.street_name ?? ''}</small>
						{/if}
						<br /><small class="muted">depuis {ownership.start_date}</small>
					</li>
				{/each}
			</ul>
		{/if}

		<hr />
		<h3>Rattacher une propriété</h3>
		<form method="POST" action="?/findProperty">
			<div class="field">
				<label for="property_reference">Référence</label>
				<input
					id="property_reference"
					name="property_reference"
					type="text"
					required
					placeholder="ex. LOT-12"
				/>
			</div>
			<button type="submit" class="btn-sm">Rechercher</button>
		</form>

		{#if form?.needsDirectAttach}
			<div class="confirm-box">
				<p>Propriété <strong>{form.property?.reference}</strong> disponible.</p>
				<form method="POST" action="?/attachDirect">
					<input type="hidden" name="property_id" value={form.property?.id} />
					<div class="field">
						<label for="entry_date">Date d'entrée</label>
						<input id="entry_date" name="entry_date" type="date" required />
					</div>
					<button type="submit" class="btn-sm">Confirmer</button>
				</form>
			</div>
		{/if}
	</div>
</div>

<dialog bind:this={dialog}>
	<h2>Confirmer le transfert</h2>
	<p>
		La propriété <strong>{form?.property?.reference}</strong> est actuellement liée à
		<strong>{form?.currentOwnerName}</strong>.
	</p>
	<form method="POST" action="?/confirmTransfer">
		<input type="hidden" name="property_id" value={form?.property?.id} />
		<div class="field">
			<label for="exit_date">Date de sortie de l'ancien propriétaire</label>
			<input id="exit_date" name="exit_date" type="date" required />
		</div>
		<div class="field">
			<label for="entry_date_t">Date d'entrée du nouveau propriétaire</label>
			<input id="entry_date_t" name="entry_date" type="date" required />
		</div>
		<div class="dialog-actions">
			<button type="button" onclick={() => dialog.close()} class="btn-outline btn-sm"
				>Annuler</button
			>
			<button type="submit" class="btn-sm">Confirmer le transfert</button>
		</div>
	</form>
</dialog>

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
	h2,
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
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
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
	code {
		background: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
	}
	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}
	.badge-pending {
		background: #fef3c7;
		color: #92400e;
	}
	.badge-active {
		background: #d1fae5;
		color: #065f46;
	}
	.badge-inactive {
		background: #f3f4f6;
		color: #6b7280;
	}
	.prop-list {
		list-style: none;
		margin: 0 0 1rem;
		padding: 0;
		font-size: 0.875rem;
	}
	.prop-list li {
		padding: 0.3rem 0;
		border-bottom: 1px solid #f3f4f6;
	}
	.muted,
	.empty {
		color: var(--color-text-muted, #6b7280);
	}
	hr {
		border: none;
		border-top: 1px solid var(--color-border, #e5e7eb);
		margin: 1rem 0;
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
	input[type='text'],
	input[type='date'] {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
	}
	.confirm-box {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 0.25rem;
	}
	dialog {
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.5rem;
		max-width: 480px;
		width: 90%;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.4);
	}
	.dialog-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}
	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		cursor: pointer;
		text-decoration: none;
	}
	.btn-outline {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
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
