<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const isAdminOrEditor = $derived(
		data.profile?.role === 'admin' || data.profile?.role === 'editor'
	);

	const shortcuts = [
		{
			href: '/informations',
			icon: '📢',
			label: 'Informations',
			description: "Actualités et annonces de l'ASL",
			color: 'preset-tonal-primary'
		},
		{
			href: '/documents',
			icon: '📄',
			label: 'Documents',
			description: 'Statuts, PV, budgets et courriers',
			color: 'preset-tonal-secondary'
		},
		{
			href: '/assemblees-generales',
			icon: '🏛️',
			label: 'Assemblées générales',
			description: 'Convocations, quorum et émargement',
			color: 'preset-tonal-tertiary'
		}
	];

	const adminShortcuts = [
		{
			href: '/comptes',
			icon: '👥',
			label: 'Comptes',
			description: 'Gestion des membres et accès',
			color: 'preset-tonal-success'
		},
		{
			href: '/proprietes',
			icon: '🏘️',
			label: 'Propriétés',
			description: 'Lots et propriétaires',
			color: 'preset-tonal-warning'
		},
		{
			href: '/etat-nominatif',
			icon: '📊',
			label: 'État nominatif',
			description: 'Rapport et export CSV',
			color: 'preset-tonal-error'
		}
	];
</script>

<svelte:head>
	<title>Tableau de bord — Koloti</title>
</svelte:head>

<div class="space-y-8">
	<!-- Welcome banner -->
	<div class="card preset-filled-surface-100-900 rounded-2xl p-6 shadow-sm flex items-center gap-4">
		<div
			class="w-14 h-14 rounded-full preset-filled-primary-500 flex items-center justify-center text-2xl font-bold text-white shadow-md flex-shrink-0"
			aria-hidden="true"
		>
			{data.profile?.first_name?.charAt(0)?.toUpperCase() ?? '?'}
		</div>
		<div>
			<h1 class="h3 font-bold text-surface-900-100">
				Bonjour, {data.profile?.first_name ?? 'vous'} 👋
			</h1>
			<p class="text-surface-500 text-sm mt-0.5">
				Bienvenue sur votre espace de gestion ASL — Koloti
			</p>
		</div>
	</div>

	<!-- Main shortcuts -->
	<section aria-labelledby="nav-heading">
		<h2 id="nav-heading" class="h5 font-semibold text-surface-700-300 mb-4 uppercase tracking-wider text-xs">
			Accès rapide
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each shortcuts as s}
				<a
					href={s.href}
					class="card {s.color} rounded-xl p-5 flex flex-col gap-3 no-underline transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
				>
					<span class="text-3xl" aria-hidden="true">{s.icon}</span>
					<div>
						<p class="font-semibold text-base">{s.label}</p>
						<p class="text-sm opacity-80 mt-0.5">{s.description}</p>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- Admin shortcuts -->
	{#if isAdminOrEditor}
		<section aria-labelledby="admin-heading">
			<h2 id="admin-heading" class="h5 font-semibold text-surface-700-300 mb-4 uppercase tracking-wider text-xs">
				Administration
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each adminShortcuts as s}
					<a
						href={s.href}
						class="card {s.color} rounded-xl p-5 flex flex-col gap-3 no-underline transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
					>
						<span class="text-3xl" aria-hidden="true">{s.icon}</span>
						<div>
							<p class="font-semibold text-base">{s.label}</p>
							<p class="text-sm opacity-80 mt-0.5">{s.description}</p>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
