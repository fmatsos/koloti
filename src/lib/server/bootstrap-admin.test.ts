import { describe, expect, it, vi } from 'vitest';
import {
	BOOTSTRAP_ADMIN_EMAIL,
	BOOTSTRAP_ADMIN_FULL_NAME,
	BOOTSTRAP_ADMIN_LOGIN,
	bootstrapAdminAccount
} from './bootstrap-admin';

function createMockClient(options?: {
	existingAdmin?: { id: string } | null;
	authUsers?: Array<{ id: string; email: string | null }>;
	createUserError?: Error | null;
	updateUserError?: Error | null;
	profileInsertError?: Error | null;
	credentialInsertError?: Error | null;
}) {
	const state = {
		existingAdmin: options?.existingAdmin ?? null,
		authUsers: options?.authUsers ?? [],
		createUserError: options?.createUserError ?? null,
		updateUserError: options?.updateUserError ?? null,
		profileInsertError: options?.profileInsertError ?? null,
		credentialInsertError: options?.credentialInsertError ?? null,
		profileDeletes: 0,
		profileInsertRows: [] as Array<Record<string, unknown>>,
		credentialInsertRows: [] as Array<Record<string, unknown>>
	};

	const profileBuilder = {
		select: vi.fn(() => profileBuilder),
		eq: vi.fn(() => profileBuilder),
		maybeSingle: vi.fn(async () => ({ data: state.existingAdmin, error: null })),
		insert: vi.fn(async (row: Record<string, unknown>) => {
			state.profileInsertRows.push(row);
			return { error: state.profileInsertError };
		}),
		delete: vi.fn(() => {
			state.profileDeletes += 1;
			return profileBuilder;
		}),
		update: vi.fn(() => profileBuilder)
	};

	const credentialBuilder = {
		select: vi.fn(() => credentialBuilder),
		eq: vi.fn(() => credentialBuilder),
		neq: vi.fn(() => credentialBuilder),
		maybeSingle: vi.fn(async () => ({ data: null, error: null })),
		insert: vi.fn(async (row: Record<string, unknown>) => {
			state.credentialInsertRows.push(row);
			return { error: state.credentialInsertError };
		}),
		update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
		delete: vi.fn(() => credentialBuilder)
	};

	const auth = {
		admin: {
			listUsers: vi.fn(async () => ({ data: { users: state.authUsers }, error: null })),
			createUser: vi.fn(async () => ({
				data: { user: { id: 'new-auth-user' } },
				error: state.createUserError
			})),
			updateUserById: vi.fn(async () => ({ data: null, error: state.updateUserError })),
			deleteUser: vi.fn(async () => ({ data: null, error: null }))
		}
	};

	const client = {
		from: vi.fn((table: string) => {
			if (table === 'profile') return profileBuilder;
			if (table === 'credential') return credentialBuilder;
			throw new Error(`Unexpected table ${table}`);
		}),
		auth
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return { client: client as any, state, auth, profileBuilder, credentialBuilder };
}

describe('bootstrapAdminAccount', () => {
	it('crée le compte bootstrap avec login admin et mot de passe aléatoire', async () => {
		const { client, state, auth } = createMockClient();
		const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn() };

		const result = await bootstrapAdminAccount(client, logger);

		expect(result.created).toBe(true);
		if (result.created) {
			expect(result.login).toBe(BOOTSTRAP_ADMIN_LOGIN);
			expect(result.email).toBe(BOOTSTRAP_ADMIN_EMAIL);
			expect(result.password.length).toBeGreaterThan(10);
		}

		expect(auth.admin.createUser).toHaveBeenCalledWith({
			email: BOOTSTRAP_ADMIN_EMAIL,
			password: expect.any(String),
			email_confirm: true
		});
		expect(state.profileInsertRows).toEqual([
			expect.objectContaining({
				email: BOOTSTRAP_ADMIN_EMAIL,
				full_name: BOOTSTRAP_ADMIN_FULL_NAME,
				role: 'admin',
				status: 'active',
				must_change_credentials: true
			})
		]);
		expect(state.credentialInsertRows).toEqual([
			expect.objectContaining({
				login: BOOTSTRAP_ADMIN_LOGIN
			})
		]);
		expect(logger.log).toHaveBeenCalledWith('Koloti bootstrap admin created');
		expect(logger.log).toHaveBeenCalledWith(`login: ${BOOTSTRAP_ADMIN_LOGIN}`);
		expect(logger.log).toHaveBeenCalledWith(expect.stringMatching(/^password: /));
	});

	it('ne fait rien si un admin existe déjà', async () => {
		const { client, auth } = createMockClient({ existingAdmin: { id: 'profile-id' } });
		const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn() };

		const result = await bootstrapAdminAccount(client, logger);

		expect(result).toEqual({ created: false, reason: 'admin_exists' });
		expect(auth.admin.listUsers).not.toHaveBeenCalled();
		expect(auth.admin.createUser).not.toHaveBeenCalled();
		expect(logger.log).not.toHaveBeenCalled();
	});

	it('supprime le compte auth si la création du profil échoue', async () => {
		const { client, auth } = createMockClient({ profileInsertError: new Error('profile failed') });
		const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn() };

		await expect(bootstrapAdminAccount(client, logger)).rejects.toThrow('profile failed');
		expect(auth.admin.deleteUser).toHaveBeenCalledWith('new-auth-user');
		expect(logger.log).not.toHaveBeenCalled();
	});

	it('supprime le profil si la création du credential échoue', async () => {
		const { client, auth, state } = createMockClient({
			credentialInsertError: new Error('credential failed')
		});
		const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn() };

		await expect(bootstrapAdminAccount(client, logger)).rejects.toThrow('credential failed');
		expect(state.profileDeletes).toBe(1);
		expect(auth.admin.deleteUser).toHaveBeenCalledWith('new-auth-user');
		expect(logger.log).not.toHaveBeenCalled();
	});
});
