import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			profile: Database['public']['Tables']['profile']['Row'] | null;
		}
		interface PageData {
			session: Session | null;
			profile: Database['public']['Tables']['profile']['Row'] | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
