import { createServiceClient } from '$lib/server/supabase';
import type { Enums } from '$lib/types/database';
import type { PageServerLoad } from './$types';

const DOC_TYPES: Enums<'document_type'>[] = ['statuts', 'pv_ag', 'budget', 'facture', 'cahier_charges', 'convocation', 'courrier', 'autre'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = createServiceClient();

	const role = locals.profile?.role ?? 'member';
	const typeParam = url.searchParams.get('type') ?? '';
	const yearFilter = url.searchParams.get('year') ?? '';
	const typeFilter = DOC_TYPES.includes(typeParam as Enums<'document_type'>) ? (typeParam as Enums<'document_type'>) : null;

	const visibilities: Enums<'visibility_level'>[] =
		role === 'admin' ? ['members', 'editors', 'admin'] :
		role === 'editor' ? ['members', 'editors'] :
		['members'];

	let query = supabase
		.from('document')
		.select('id, title, type, year, size_bytes, created_at, visibility')
		.in('visibility', visibilities)
		.order('created_at', { ascending: false });

	if (typeFilter) query = query.eq('type', typeFilter);
	if (yearFilter) query = query.eq('year', parseInt(yearFilter));

	const { data: docs } = await query;

	return { session: locals.session, profile: locals.profile, docs: docs ?? [], typeFilter: typeParam, yearFilter };
};
