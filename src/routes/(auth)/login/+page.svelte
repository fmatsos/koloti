<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mode = $state<'password' | 'magiclink'>('password');
	let login = $state('');
	let password = $state('');
	let loading = $state(false);

	const errorMessages: Record<string, string> = {
		account_inactive: "Votre compte est désactivé. Contactez l'administrateur.",
		account_pending: "Votre compte est en attente d'activation. Consultez votre email.",
		forbidden: 'Accès non autorisé.'
	};

	const displayError = $derived(
		form?.error ?? (data.error ? (errorMessages[data.error] ?? data.error) : null)
	);
</script>

<svelte:head>
	<title>Connexion — Koloti</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4 bg-surface-100-900">
	<div
		class="card preset-filled-surface-50-950 rounded-2xl p-8 w-full max-w-md shadow-xl border border-surface-200-800"
	>
		<!-- Logo + title -->
		<div class="text-center mb-6">
			<div class="text-4xl mb-2" aria-hidden="true">🏡</div>
			<h1 class="h2 font-bold text-surface-900-100">Koloti</h1>
			<p class="text-surface-500 text-sm mt-1">Espace ASL — Connexion</p>
		</div>

		{#if displayError}
			<div class="card preset-tonal-error rounded-xl p-3.5 text-sm mb-4" role="alert">
				{displayError}
			</div>
		{/if}

		{#if form?.success}
			<div class="card preset-tonal-success rounded-xl p-3.5 text-sm mb-4" role="status">
				Un lien de connexion vous a été envoyé par email. Vérifiez votre boîte de réception.
			</div>
		{:else}
			<!-- Mode tabs -->
			<div class="flex gap-1 p-1 bg-surface-200-800 rounded-xl mb-6" role="tablist">
				<button
					role="tab"
					aria-selected={mode === 'password'}
					class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150
						{mode === 'password'
						? 'bg-surface-50-950 text-surface-900-100 shadow-sm'
						: 'text-surface-500 hover:text-surface-700-300'}"
					onclick={() => (mode = 'password')}
				>
					Mot de passe
				</button>
				<button
					role="tab"
					aria-selected={mode === 'magiclink'}
					class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150
						{mode === 'magiclink'
						? 'bg-surface-50-950 text-surface-900-100 shadow-sm'
						: 'text-surface-500 hover:text-surface-700-300'}"
					onclick={() => (mode = 'magiclink')}
				>
					Lien magique
				</button>
			</div>

			{#if mode === 'password'}
				<form method="POST" action="?/password" onsubmit={() => (loading = true)} class="space-y-4">
					<input type="hidden" name="redirectTo" value={data.redirectTo} />

					<label class="label block">
						<span class="text-sm font-medium text-surface-700-300 block mb-1.5">Identifiant</span>
						<input
							id="login-pwd"
							name="login"
							type="text"
							autocomplete="username"
							bind:value={login}
							required
							placeholder="ex. lot12"
							class="input w-full rounded-lg border border-surface-300-700 bg-surface-100-900 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
						/>
					</label>

					<label class="label block">
						<span class="text-sm font-medium text-surface-700-300 block mb-1.5">Mot de passe</span>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							bind:value={password}
							required
							class="input w-full rounded-lg border border-surface-300-700 bg-surface-100-900 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
						/>
					</label>

					<button
						type="submit"
						class="btn preset-filled-primary-500 w-full rounded-lg py-2.5 text-sm font-semibold mt-2 transition-all duration-150 hover:opacity-90 disabled:opacity-50"
						disabled={loading}
					>
						{loading ? 'Connexion…' : 'Se connecter'}
					</button>

					<div class="mt-3 text-center">
						<a href="/login/identifiant-oublie" class="text-xs text-surface-500 hover:text-surface-700-300">
							Identifiant oublié ?
						</a>
					</div>
				</form>
			{:else}
				<form
					method="POST"
					action="?/magiclink"
					onsubmit={() => (loading = true)}
					class="space-y-4"
				>
					<input type="hidden" name="redirectTo" value={data.redirectTo} />

					<label class="label block">
						<span class="text-sm font-medium text-surface-700-300 block mb-1.5">Identifiant</span>
						<input
							id="login-magic"
							name="login"
							type="text"
							autocomplete="username"
							bind:value={login}
							required
							placeholder="ex. lot12"
							class="input w-full rounded-lg border border-surface-300-700 bg-surface-100-900 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
						/>
					</label>

					<p class="text-xs text-surface-500">
						Un lien de connexion sera envoyé à l'adresse email associée à votre identifiant.
					</p>

					<button
						type="submit"
						class="btn preset-filled-primary-500 w-full rounded-lg py-2.5 text-sm font-semibold mt-2 transition-all duration-150 hover:opacity-90 disabled:opacity-50"
						disabled={loading}
					>
						{loading ? 'Envoi…' : 'Recevoir un lien'}
					</button>

					<div class="mt-3 text-center">
						<a href="/login/identifiant-oublie" class="text-xs text-surface-500 hover:text-surface-700-300">
							Identifiant oublié ?
						</a>
					</div>
				</form>
			{/if}
		{/if}
	</div>
</div>
