import { createServiceClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		return new Response('Non autorisé', { status: 403 });
	}

	const supabase = createServiceClient();
	const { data: rows } = await supabase
		.from('property')
		.select(
			'id, reference, street_number, street_name, cadastre_number, vote_weight, ownership(id, start_date, end_date, is_primary, profile:profile_id(full_name, email, phone))'
		)
		.order('reference');

	const lines: string[] = [
		'Référence;Adresse;Poids de vote;Propriétaire;Email;Téléphone;Entrée;Principal'
	];

	for (const prop of rows ?? []) {
		const ownerships = Array.isArray(prop.ownership) ? prop.ownership : [];
		const active = ownerships.filter((o) => !o.end_date);
		const formattedAddress = [prop.street_number, prop.street_name].filter(Boolean).join(' ');

		if (active.length === 0) {
			lines.push(
				[prop.reference, formattedAddress, prop.vote_weight, '', '', '', '', ''].join(';')
			);
		} else {
			for (const o of active) {
				const profile = Array.isArray(o.profile) ? o.profile[0] : o.profile;
				lines.push(
					[
						prop.reference,
						formattedAddress,
						prop.vote_weight,
						profile?.full_name ?? '',
						profile?.email ?? '',
						(profile as { phone?: string | null })?.phone ?? '',
						o.start_date,
						o.is_primary ? 'Oui' : 'Non'
					].join(';')
				);
			}
		}
	}

	const csv = lines.join('\r\n');
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="etat-nominatif.csv"',
			'Cache-Control': 'no-store'
		}
	});
};
