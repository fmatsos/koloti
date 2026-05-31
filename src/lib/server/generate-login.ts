import type { SupabaseClient } from '@supabase/supabase-js';

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const LOGIN_LENGTH = 6;

export function generateLogin(): string {
	let result = '';
	const array = new Uint8Array(LOGIN_LENGTH);
	crypto.getRandomValues(array);
	for (const byte of array) {
		result += CHARS[byte % CHARS.length];
	}
	return result;
}

export async function generateUniqueLogin(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: SupabaseClient<any>
): Promise<string> {
	for (let i = 0; i < 10; i++) {
		const login = generateLogin();
		const { data } = await supabase
			.from('credential')
			.select('login')
			.eq('login', login)
			.maybeSingle();
		if (!data) return login;
	}
	throw new Error('Impossible de générer un login unique après 10 tentatives.');
}
