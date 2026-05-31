<script lang="ts">
	import { page } from '$app/state';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const passwordChanged = $derived(page.url.searchParams.get('password_changed') === '1');
</script>

<svelte:head>
	<title>Mon profil — Koloti</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="h3 font-bold">Mon profil</h1>

	{#if form?.error}
		<div class="card preset-tonal-error rounded-xl p-4 text-sm" role="alert">{form.error}</div>
	{/if}

	{#if passwordChanged || form?.success}
		<div class="card preset-tonal-success rounded-xl p-4 text-sm" role="status">
			{#if passwordChanged}Mot de passe modifié avec succès.
			{:else if form?.action === 'identity'}Identité mise à jour.
			{:else if form?.action === 'email'}Email mis à jour.
			{:else if form?.action === 'password_reset_sent'}Un lien de changement de mot de passe vous a
				été envoyé par email.
			{/if}
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
		<!-- Identité -->
		<div
			class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 p-5 shadow-sm"
		>
			<h2 class="h6 font-semibold mb-4">Identité</h2>
			<form method="POST" action="?/updateIdentity" class="space-y-4">
				<label class="label">
					<span class="text-sm font-medium text-surface-700-300">Prénom</span>
					<input
						id="first_name"
						name="first_name"
						type="text"
						value={data.profile?.first_name ?? ''}
						maxlength="100"
						required
						class="input w-full rounded-lg border border-surface-300-700 bg-surface-50-950 px-3 py-2 text-sm mt-1"
					/>
				</label>
				<label class="label">
					<span class="text-sm font-medium text-surface-700-300">Nom</span>
					<input
						id="last_name"
						name="last_name"
						type="text"
						value={data.profile?.last_name ?? ''}
						maxlength="100"
						required
						class="input w-full rounded-lg border border-surface-300-700 bg-surface-50-950 px-3 py-2 text-sm mt-1"
					/>
				</label>
				<button
					type="submit"
					class="btn preset-filled-primary-500 rounded-lg text-sm px-4 py-2 w-full"
				>
					Enregistrer
				</button>
			</form>
		</div>

		<!-- Email -->
		<div
			class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 p-5 shadow-sm"
		>
			<h2 class="h6 font-semibold mb-4">Adresse email</h2>
			<form method="POST" action="?/updateEmail" class="space-y-4">
				<label class="label">
					<span class="text-sm font-medium text-surface-700-300">Nouvel email</span>
					<input
						id="email"
						name="email"
						type="email"
						value={data.profile?.email ?? ''}
						maxlength="254"
						required
						class="input w-full rounded-lg border border-surface-300-700 bg-surface-50-950 px-3 py-2 text-sm mt-1"
					/>
				</label>
				<button
					type="submit"
					class="btn preset-filled-primary-500 rounded-lg text-sm px-4 py-2 w-full"
				>
					Enregistrer
				</button>
			</form>
		</div>

		<!-- Mot de passe -->
		<div
			class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 p-5 shadow-sm"
		>
			<h2 class="h6 font-semibold mb-4">Mot de passe</h2>
			<p class="text-xs text-surface-500 mb-4">
				Pour changer votre mot de passe, cliquez sur le bouton ci-dessous. Vous recevrez un email
				avec un lien sécurisé.
			</p>
			<form method="POST" action="?/requestPasswordChange">
				<button type="submit" class="btn preset-tonal-primary rounded-lg text-sm px-4 py-2 w-full">
					Recevoir un lien de changement
				</button>
			</form>
		</div>
	</div>
</div>
