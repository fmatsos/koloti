<!-- src/routes/(app)/assemblees-generales/[id]/notifications/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const { ag, notifications, summary } = $derived(data);

	const statusLabel: Record<string, string> = {
		pending: 'En attente',
		sent: 'Envoyé',
		failed: 'Échec'
	};

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head><title>Notifications — {ag.title} — Koloti</title></svelte:head>

<div class="mb-6">
	<a
		href="/assemblees-generales/{ag.id}"
		class="inline-block mb-2 text-xs no-underline text-surface-500">← {ag.title}</a
	>
	<div class="flex items-center gap-3">
		<h1 class="m-0 text-2xl">Notifications d'ouverture</h1>
	</div>
</div>

<div class="flex items-center gap-3 flex-wrap mb-4">
	<span class="badge preset-tonal-success text-xs rounded-full px-2 py-0.5"
		>{summary.sent} envoyé{summary.sent !== 1 ? 's' : ''}</span
	>
	<span class="badge preset-tonal-error text-xs rounded-full px-2 py-0.5"
		>{summary.failed} échec{summary.failed !== 1 ? 's' : ''}</span
	>
	<span class="badge preset-tonal-warning text-xs rounded-full px-2 py-0.5"
		>{summary.pending} en attente</span
	>
	<form method="GET" class="ml-auto">
		<button type="submit" class="btn-sm">Rafraîchir</button>
	</form>
</div>

{#if notifications.length === 0}
	<div
		class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 shadow-sm mt"
		role="status"
	>
		<p class="text-surface-500">Aucune notification enregistrée pour cette AG.</p>
	</div>
{:else}
	<div
		class="card preset-filled-surface-50-950 rounded-xl border border-surface-200-800 shadow-sm mt"
	>
		<table class="table w-full text-sm">
			<thead>
				<tr>
					<th>Membre</th>
					<th>Email</th>
					<th>Statut</th>
					<th>Envoyé le</th>
				</tr>
			</thead>
			<tbody>
				{#each notifications as n (n.id)}
					<tr>
						<td>{n.first_name} {n.last_name}</td>
						<td class="text-surface-500 text-xs">{n.email}</td>
						<td>
							<span
								class="badge text-xs rounded px-1.5 py-0.5"
								class:preset-tonal-success={n.status === 'sent'}
								class:preset-tonal-error={n.status === 'failed'}
								class:preset-tonal-warning={n.status === 'pending'}
							>
								{statusLabel[n.status] ?? n.status}
							</span>
							{#if n.status === 'failed' && n.error_msg}
								<span class="text-error-600 cursor-help ml-1" title={n.error_msg}>ⓘ</span>
							{/if}
						</td>
						<td>{formatDate(n.sent_at)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.mt {
		margin-top: 1rem;
	}
</style>
