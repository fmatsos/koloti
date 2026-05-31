import { beforeEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockClient: any;
let mockSupabaseAuth: { resetPasswordForEmail: ReturnType<typeof vi.fn> };

vi.mock('$lib/server/supabase', () => ({
	createServiceClient: () => mockClient
}));

vi.mock('$env/static/public', () => ({
	PUBLIC_APP_URL: 'http://localhost:5173'
}));

vi.mock('$lib/server/audit', () => ({
	writeAuditLog: vi.fn(async () => {})
}));

import { actions } from '../routes/(app)/profil/+page.server';

function buildMockClient() {
	const state = {
		profileUpdates: [] as Array<Record<string, unknown>>
	};

	const profileBuilder = {
		update: vi.fn((payload: Record<string, unknown>) => {
			state.profileUpdates.push(payload);
			return { eq: vi.fn(async () => ({ error: null })) };
		}),
		select: vi.fn(() => profileBuilder),
		eq: vi.fn(() => profileBuilder),
		neq: vi.fn(() => profileBuilder),
		maybeSingle: vi.fn(async () => ({ data: null, error: null }))
	};

	mockSupabaseAuth = {
		resetPasswordForEmail: vi.fn(async () => ({ error: null }))
	};

	const client = {
		from: vi.fn((table: string) => {
			if (table === 'profile') return profileBuilder;
			throw new Error(`Unexpected table: ${table}`);
		}),
		auth: { admin: { updateUserById: vi.fn(async () => ({ data: null, error: null })) } }
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return { client: client as any, state };
}

const baseLocals = {
	user: { id: 'user-id', email: 'user@example.com' },
	profile: { id: 'user-id', first_name: 'Jean', last_name: 'Dupont', email: 'user@example.com' },
	supabase: null as unknown
};

beforeEach(() => {
	const mock = buildMockClient();
	mockClient = mock.client;
});

describe('profil : updateIdentity', () => {
	it('rejette si prénom manquant', async () => {
		const formData = new FormData();
		formData.set('first_name', '');
		formData.set('last_name', 'Dupont');

		const result = (await actions.updateIdentity({
			request: { formData: async () => formData } as Request,
			locals: { ...baseLocals, supabase: { auth: mockSupabaseAuth } }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)) as any;

		expect(result.status).toBe(400);
		expect(result.data.error).toBeTruthy();
	});

	it('met à jour first_name et last_name', async () => {
		const mock = buildMockClient();
		mockClient = mock.client;

		const formData = new FormData();
		formData.set('first_name', 'Marie');
		formData.set('last_name', 'Curie');

		const result = (await actions.updateIdentity({
			request: { formData: async () => formData } as Request,
			locals: { ...baseLocals, supabase: { auth: mockSupabaseAuth } }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)) as any;

		expect(result).toEqual({ success: true, action: 'identity' });
		expect(mock.state.profileUpdates).toEqual([{ first_name: 'Marie', last_name: 'Curie' }]);
	});
});

describe('profil : updateEmail', () => {
	it('rejette un email invalide', async () => {
		const formData = new FormData();
		formData.set('email', 'pas-un-email');

		const result = (await actions.updateEmail({
			request: { formData: async () => formData } as Request,
			locals: { ...baseLocals, supabase: { auth: mockSupabaseAuth } }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)) as any;

		expect(result.status).toBe(400);
		expect(result.data.error).toBeTruthy();
	});

	it('retourne succès pour un email valide sans conflit', async () => {
		const mock = buildMockClient();
		mockClient = mock.client;

		const formData = new FormData();
		formData.set('email', 'nouvelle@example.com');

		const result = (await actions.updateEmail({
			request: { formData: async () => formData } as Request,
			locals: { ...baseLocals, supabase: { auth: mockSupabaseAuth } }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)) as any;

		expect(result).toEqual({ success: true, action: 'email' });
	});
});

describe('profil : requestPasswordChange', () => {
	it("retourne toujours succès (pas d'énumération)", async () => {
		const supabaseMock = {
			auth: { resetPasswordForEmail: vi.fn(async () => ({ error: null })) }
		};

		const result = (await actions.requestPasswordChange({
			request: { formData: async () => new FormData() } as Request,
			locals: { ...baseLocals, supabase: supabaseMock }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)) as any;

		expect(result).toEqual({ success: true, action: 'password_reset_sent' });
		expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalledWith(
			'user@example.com',
			expect.objectContaining({
				redirectTo: expect.stringContaining('/profil/nouveau-mot-de-passe')
			})
		);
	});
});
