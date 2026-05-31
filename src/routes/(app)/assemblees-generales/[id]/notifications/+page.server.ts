// src/routes/(app)/assemblees-generales/[id]/notifications/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

const STATUS_ORDER: Record<string, number> = { pending: 0, failed: 1, sent: 2 };

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/');
	}

	const supabase = createServiceClient();

	const { data: ag } = await supabase
		.from('assembly')
		.select('id, title, status')
		.eq('id', params.id)
		.single();

	if (!ag) throw error(404, 'Assemblée introuvable');

	const { data: rows } = await supabase
		.from('assembly_notification')
		.select('id, email, first_name, last_name, status, error_msg, sent_at')
		.eq('assembly_id', params.id);

	const notifications = [...(rows ?? [])].sort((a, b) => {
		const sa = STATUS_ORDER[a.status] ?? 99;
		const sb = STATUS_ORDER[b.status] ?? 99;
		if (sa !== sb) return sa - sb;
		return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'fr');
	});

	const summary = {
		sent: notifications.filter((n) => n.status === 'sent').length,
		failed: notifications.filter((n) => n.status === 'failed').length,
		pending: notifications.filter((n) => n.status === 'pending').length
	};

	return { session: locals.session, profile: locals.profile, ag, notifications, summary };
};
