import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetUser: () => Promise<User | null>;
			session: null;
			user: User | null;
			profile: Database['public']['Tables']['profile']['Row'] | null;
		}
		interface PageData {
			session?: null;
			user?: User | null;
			profile: Database['public']['Tables']['profile']['Row'] | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
