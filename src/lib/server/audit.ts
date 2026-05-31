import { createServiceClient } from '$lib/server/supabase';
import type { Database, Json } from '$lib/types/database';

type AuditInsert = Database['public']['Tables']['audit_log']['Insert'];

export interface AuditEntry {
	actorId?: string | null;
	action: string;
	entity: string;
	entityId?: string | null;
	payload?: Json | null;
}

// Écrit une entrée dans audit_log via service_role (append-only).
// SERVEUR UNIQUEMENT — ne jamais importer côté client.
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
	const supabase = createServiceClient();

	const row: AuditInsert = {
		actor_id: entry.actorId ?? null,
		action: entry.action,
		entity: entry.entity,
		entity_id: entry.entityId ?? null,
		payload: entry.payload ?? null
	};

	const { error } = await supabase.from('audit_log').insert(row);

	if (error) {
		// On loggue l'erreur mais on ne propage pas — l'audit ne doit pas faire échouer l'action principale
		console.error(`[audit_log] Erreur d'écriture (${entry.action}):`, error.message);
	}
}
