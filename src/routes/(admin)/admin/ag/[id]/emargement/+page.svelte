<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const qr = $derived(data.quorum);
</script>

<svelte:head><title>Émargement — {data.ag.title} — Koloti</title></svelte:head>

<div class="page-header">
	<a href="/admin/ag/{data.ag.id}" class="back-link">← {data.ag.title}</a>
	<h1>Émargement</h1>
</div>

{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

<!-- Bandeau quorum -->
<div class="quorum-bar {qr.reached ? 'reached' : 'pending'}">
	<span>Quorum : {qr.presentWeight} / {qr.totalWeight} voix ({qr.ratio.toFixed(1)} %) — requis {qr.quorumPct} %</span>
	{#if qr.reached}
		<strong>✓ Quorum atteint</strong>
	{:else}
		<strong>✗ Quorum non atteint</strong>
	{/if}
</div>

<div class="card">
	<table>
		<thead>
			<tr>
				<th>Lot</th>
				<th>Propriétaire</th>
				<th>Voix</th>
				<th>Présence</th>
			</tr>
		</thead>
		<tbody>
			{#each data.props as prop}
				<tr class={prop.attendance ? prop.attendance.mode : ''}>
					<td>{prop.reference}</td>
					<td>{prop.ownerName}</td>
					<td class="center">{prop.vote_weight}</td>
					<td>
						{#if prop.ownerId}
							<form method="POST" class="inline-form">
								<input type="hidden" name="property_id" value={prop.id} />
								<input type="hidden" name="profile_id" value={prop.ownerId} />
								<select name="mode" onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.submit()}>
									<option value="" selected={!prop.attendance}>— non renseigné —</option>
									<option value="present" selected={prop.attendance?.mode === 'present'}>Présent</option>
									<option value="represented" selected={prop.attendance?.mode === 'represented'}>Représenté</option>
									<option value="absent" selected={prop.attendance?.mode === 'absent'}>Absent</option>
								</select>
							</form>
						{:else}
							<span class="muted">—</span>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.page-header { margin-bottom: 1rem; }
	.back-link { display: inline-block; margin-bottom: 0.5rem; font-size: 0.875rem; text-decoration: none; color: var(--color-text-muted, #6b7280); }
	h1 { margin: 0; font-size: 1.5rem; }
	.quorum-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.9rem; }
	.quorum-bar.reached { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
	.quorum-bar.pending { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
	.card { background: white; border-radius: var(--radius, 0.375rem); border: 1px solid var(--color-border, #e5e7eb); padding: 1.25rem; overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
	th { text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted, #6b7280); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; padding: 0.5rem 0.75rem; }
	td { padding: 0.4rem 0.75rem; border-bottom: 1px solid #f3f4f6; }
	tr.present td { background: #f0fdf4; }
	tr.represented td { background: #eff6ff; }
	tr.absent td { background: #fafafa; opacity: 0.65; }
	.center { text-align: center; }
	.muted { color: var(--color-text-muted, #6b7280); }
	.inline-form select { padding: 0.25rem 0.5rem; border: 1px solid var(--color-border, #e5e7eb); border-radius: 0.25rem; font-size: 0.8125rem; }
	.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 0.75rem 1rem; border-radius: var(--radius, 0.375rem); margin-bottom: 1rem; font-size: 0.875rem; }
</style>
