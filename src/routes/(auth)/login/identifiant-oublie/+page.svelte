<!-- src/routes/(auth)/login/identifiant-oublie/+page.svelte -->
<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
	let emailError = $state('');
</script>

<svelte:head>
	<title>Identifiant oublié — Koloti</title>
</svelte:head>

<div class="min-h-dvh flex items-center justify-center p-4 bg-surface-100-900">
	<div
		class="card preset-filled-surface-50-950 rounded-2xl p-8 w-full max-w-md shadow-xl border border-surface-200-800"
	>
		<div class="text-center mb-6">
			<div class="text-4xl mb-2" aria-hidden="true">🏡</div>
			<h1 class="h2 font-bold text-surface-900-100">Koloti</h1>
			<p class="text-surface-500 text-sm mt-1">Récupération d'identifiant</p>
		</div>

		{#if form?.success}
			<div class="card preset-tonal-success rounded-xl p-3.5 text-sm mb-4" role="status">
				Si cette adresse est connue de notre système, un email vous a été envoyé.
			</div>
			<a
				href="/login"
				class="btn preset-tonal w-full rounded-lg py-2.5 text-sm font-semibold text-center block mt-4"
			>
				Retour à la connexion
			</a>
		{:else}
			<p class="text-sm text-surface-500 mb-6">
				Saisissez votre adresse email pour recevoir la liste de vos identifiants associés.
			</p>
			<form
				method="POST"
				onsubmit={() => {
					const emailInput = document.getElementById('email') as HTMLInputElement | null;
					if (!emailInput?.value.includes('@')) {
						emailError = 'Veuillez entrer une adresse email valide.';
						return;
					}
					emailError = '';
					loading = true;
				}}
				class="space-y-4"
			>
				{#if emailError}
					<div class="card preset-tonal-error rounded-xl p-3.5 text-sm mb-4" role="alert">
						{emailError}
					</div>
				{/if}
				<label for="email" class="label block">
					<span class="text-sm font-medium text-surface-700-300 block mb-1.5"> Adresse email </span>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						placeholder="votre@email.com"
						class="input w-full rounded-lg border border-surface-300-700 bg-surface-100-900 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
					/>
				</label>
				<button
					type="submit"
					class="btn preset-filled-primary-500 w-full rounded-lg py-2.5 text-sm font-semibold mt-2 transition-all duration-150 hover:opacity-90 disabled:opacity-50"
					disabled={loading}
				>
					{loading ? 'Envoi…' : 'Recevoir mes identifiants'}
				</button>
			</form>
			<div class="mt-6 text-center">
				<a href="/login" class="text-xs text-surface-500 hover:text-surface-700-300">
					← Retour à la connexion
				</a>
			</div>
		{/if}
	</div>
</div>
