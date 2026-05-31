const LABELS: Record<string, string> = {
	informations: 'Informations',
	documents: 'Documents',
	'assemblees-generales': 'Assemblées générales',
	comptes: 'Comptes',
	proprietes: 'Propriétés',
	profil: 'Mon profil',
	'etat-nominatif': 'État nominatif',
	new: 'Nouveau',
	edit: 'Modifier',
	view: 'Détail',
	agenda: 'Ordre du jour',
	quorum: 'Quorum',
	emargement: 'Émargement',
	convoquer: 'Convoquer',
	relancer: 'Relancer',
	'nouveau-mot-de-passe': 'Changer le mot de passe',
	owners: 'Propriétaires'
};

const UUID_PATTERN = /^[0-9a-f-]{36}$/i;
const NUM_PATTERN = /^\d+$/;

export interface BreadcrumbItem {
	label: string;
	href: string;
}

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
	const crumbs: BreadcrumbItem[] = [{ label: 'Koloti', href: '/' }];

	if (pathname === '/') return crumbs;

	const segments = pathname.split('/').filter(Boolean);
	let currentPath = '';

	for (const segment of segments) {
		currentPath += `/${segment}`;

		if (UUID_PATTERN.test(segment) || NUM_PATTERN.test(segment)) continue;

		const label = LABELS[segment];
		if (label) {
			crumbs.push({ label, href: currentPath });
		}
	}

	return crumbs;
}
