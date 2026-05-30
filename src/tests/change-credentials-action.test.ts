import { beforeEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockClient: any;

vi.mock('$lib/server/supabase', () => ({
	createServiceClient: () => mockClient
}));

import { actions } from '../routes/(auth)/change-credentials/+page.server';

function buildMockClient() {
	const state = {
		currentLogin: 'admin',
		conflict: null as { profile_id: string } | null,
		loginUpdates: [] as Array<Record<string, unknown>>,
		profileUpdates: [] as Array<Record<string, unknown>>,
		passwordUpdates: [] as Array<Record<string, unknown>>
	};

	const credentialBuilder = {
		select: vi.fn(() => credentialBuilder),
		eq: vi.fn(() => credentialBuilder),
		neq: vi.fn(() => credentialBuilder),
		single: vi.fn(async () => ({ data: { login: state.currentLogin }, error: null })),
		maybeSingle: vi.fn(async () => ({ data: state.conflict, error: null })),
		update: vi.fn((payload: Record<string, unknown>) => {
			state.loginUpdates.push(payload);
			return {
				eq: vi.fn(async () => ({ error: null }))
			};
		})
	};

	const profileBuilder = {
		update: vi.fn((payload: Record<string, unknown>) => {
			state.profileUpdates.push(payload);
			return {
				eq: vi.fn(async () => ({ error: null }))
			};
		})
	};

	const auth = {
		admin: {
			updateUserById: vi.fn(async (_id: string, payload: Record<string, unknown>) => {
				state.passwordUpdates.push(payload);
				return { data: null, error: null };
			})
		}
	};

	const client = {
		from: vi.fn((table: string) => {
			if (table === 'credential') return credentialBuilder;
			if (table === 'profile') return profileBuilder;
			throw new Error(`Unexpected table ${table}`);
		}),
		auth
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return { client: client as any, state, auth };
}

beforeEach(() => {
	mockClient = buildMockClient().client;
});

describe('change credentials action', () => {
	it('rejects a password confirmation mismatch', async () => {
		mockClient = buildMockClient().client;

		const formData = new FormData();
		formData.set('login', 'admin2');
		formData.set('password', 'abcdefgh');
		formData.set('password_confirm', 'abcdxxxx');

		const result = (await actions.default({
			request: {
				formData: async () => formData
			} as Request,
			locals: {
				user: { id: 'user-id' },
				profile: { id: 'user-id', must_change_credentials: true }
			}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)) as any;

		expect(result.status).toBe(400);
		expect(result.data.error).toContain('correspondent pas');
	});

	it('updates the login, password and flag when valid', async () => {
		const mock = buildMockClient();
		mockClient = mock.client;

		const formData = new FormData();
		formData.set('login', 'admin2');
		formData.set('password', 'abcdefgh');
		formData.set('password_confirm', 'abcdefgh');

		await expect(
			actions.default({
				request: {
					formData: async () => formData
				} as Request,
				locals: {
					user: { id: 'user-id' },
					profile: { id: 'user-id', must_change_credentials: true }
				}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any)
		).rejects.toMatchObject({ status: 303 });

		expect(mock.state.loginUpdates).toEqual([{ login: 'admin2' }]);
		expect(mock.state.passwordUpdates).toEqual([{ password: 'abcdefgh' }]);
		expect(mock.state.profileUpdates).toEqual([{ must_change_credentials: false }]);
		expect(mock.auth.admin.updateUserById).toHaveBeenCalledWith('user-id', {
			password: 'abcdefgh'
		});
	});
});
