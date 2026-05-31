import { randomBytes } from 'node:crypto';
import { createServiceClient } from '$lib/server/supabase';
import type { Database } from '$lib/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export const BOOTSTRAP_ADMIN_LOGIN = 'admin';
export const BOOTSTRAP_ADMIN_EMAIL = 'admin@koloti.local';
export const BOOTSTRAP_ADMIN_FULL_NAME = 'Administrateur';

const PASSWORD_BYTES = 18;

export type BootstrapResult =
	| {
			created: false;
			reason: 'admin_exists';
	  }
	| {
			created: true;
			login: string;
			password: string;
			email: string;
			profileId: string;
	  };

type BootstrapLogger = Pick<Console, 'log' | 'error' | 'warn'>;
type ServiceClient = SupabaseClient<Database>;

function generatePassword(): string {
	return randomBytes(PASSWORD_BYTES).toString('base64url');
}

async function findAuthUserByEmail(client: ServiceClient, email: string) {
	const { data, error } = await client.auth.admin.listUsers();

	if (error) {
		throw error;
	}

	return data.users.find((user) => user.email === email) ?? null;
}

export async function bootstrapAdminAccount(
	client: ServiceClient = createServiceClient(),
	logger: BootstrapLogger = console
): Promise<BootstrapResult> {
	const { data: existingAdmin, error: existingError } = await client
		.from('profile')
		.select('id')
		.eq('role', 'admin')
		.maybeSingle();

	if (existingError) {
		throw existingError;
	}

	if (existingAdmin) {
		return { created: false, reason: 'admin_exists' };
	}

	const password = generatePassword();
	const authUser = await findAuthUserByEmail(client, BOOTSTRAP_ADMIN_EMAIL);

	let authUserId = authUser?.id ?? null;
	let createdAuthUser = false;

	if (!authUserId) {
		const { data, error } = await client.auth.admin.createUser({
			email: BOOTSTRAP_ADMIN_EMAIL,
			password,
			email_confirm: true
		});

		if (error || !data.user) {
			throw error ?? new Error('Impossible de créer le compte auth bootstrap.');
		}

		authUserId = data.user.id;
		createdAuthUser = true;
	} else {
		const { error } = await client.auth.admin.updateUserById(authUserId, { password });

		if (error) {
			throw error;
		}
	}

	const { error: profileError } = await client.from('profile').insert({
		id: authUserId,
		email: BOOTSTRAP_ADMIN_EMAIL,
		first_name: BOOTSTRAP_ADMIN_FULL_NAME,
		last_name: '',
		role: 'admin',
		status: 'active',
		must_change_credentials: true
	});

	if (profileError) {
		if (createdAuthUser && authUserId) {
			await client.auth.admin.deleteUser(authUserId);
		}

		throw profileError;
	}

	const { error: credentialError } = await client.from('credential').insert({
		profile_id: authUserId,
		login: BOOTSTRAP_ADMIN_LOGIN
	});

	if (credentialError) {
		await client.from('profile').delete().eq('id', authUserId);

		if (createdAuthUser && authUserId) {
			await client.auth.admin.deleteUser(authUserId);
		}

		throw credentialError;
	}

	logger.log('Koloti bootstrap admin created');
	logger.log(`login: ${BOOTSTRAP_ADMIN_LOGIN}`);
	logger.log(`password: ${password}`);

	return {
		created: true,
		login: BOOTSTRAP_ADMIN_LOGIN,
		password,
		email: BOOTSTRAP_ADMIN_EMAIL,
		profileId: authUserId
	};
}
