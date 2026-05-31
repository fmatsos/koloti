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

<div class="page-header">
    <a href="/assemblees-generales/{ag.id}" class="back-link">← {ag.title}</a>
    <div class="header-row">
        <h1>Notifications d'ouverture</h1>
    </div>
</div>

<div class="summary-bar">
    <span class="chip chip-success">{summary.sent} envoyé{summary.sent !== 1 ? 's' : ''}</span>
    <span class="chip chip-error">{summary.failed} échec{summary.failed !== 1 ? 's' : ''}</span>
    <span class="chip chip-warning">{summary.pending} en attente</span>
    <form method="GET" class="refresh-form">
        <button type="submit" class="btn-sm">Rafraîchir</button>
    </form>
</div>

{#if notifications.length === 0}
    <div class="card mt">
        <p class="text-muted">Aucune notification enregistrée pour cette AG.</p>
    </div>
{:else}
    <div class="card mt">
        <table class="notif-table">
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
                        <td>{n.full_name}</td>
                        <td class="email-cell">{n.email}</td>
                        <td>
                            <span class="badge-notif badge-notif-{n.status}">
                                {statusLabel[n.status] ?? n.status}
                            </span>
                            {#if n.status === 'failed' && n.error_msg}
                                <span class="error-hint" title={n.error_msg}>ⓘ</span>
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
    .page-header { margin-bottom: 1.5rem; }
    .back-link {
        display: inline-block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        text-decoration: none;
        color: var(--color-text-muted, #6b7280);
    }
    .header-row { display: flex; align-items: center; gap: 0.75rem; }
    h1 { margin: 0; font-size: 1.5rem; }

    .summary-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }
    .chip {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .chip-success { background: #d1fae5; color: #065f46; }
    .chip-error   { background: #fee2e2; color: #991b1b; }
    .chip-warning { background: #fef9c3; color: #92400e; }

    .refresh-form { margin-left: auto; }

    .notif-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .notif-table th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--color-border, #e5e7eb);
        font-weight: 600;
        color: var(--color-text-muted, #6b7280);
    }
    .notif-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border-light, #f3f4f6); }
    .email-cell { color: var(--color-text-muted, #6b7280); font-size: 0.8rem; }

    .badge-notif {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .badge-notif-sent    { background: #d1fae5; color: #065f46; }
    .badge-notif-failed  { background: #fee2e2; color: #991b1b; }
    .badge-notif-pending { background: #fef9c3; color: #92400e; }

    .error-hint { cursor: help; color: #991b1b; margin-left: 0.25rem; }
    .text-muted { color: var(--color-text-muted, #6b7280); }
    .mt { margin-top: 1rem; }
</style>
