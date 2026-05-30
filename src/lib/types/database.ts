export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			activation_link: {
				Row: {
					created_at: string;
					created_by: string | null;
					expires_at: string;
					id: string;
					kind: Database['public']['Enums']['activation_kind'];
					profile_id: string;
					revoked: boolean;
					token_hash: string;
					used_at: string | null;
				};
				Insert: {
					created_at?: string;
					created_by?: string | null;
					expires_at: string;
					id?: string;
					kind?: Database['public']['Enums']['activation_kind'];
					profile_id: string;
					revoked?: boolean;
					token_hash: string;
					used_at?: string | null;
				};
				Update: {
					created_at?: string;
					created_by?: string | null;
					expires_at?: string;
					id?: string;
					kind?: Database['public']['Enums']['activation_kind'];
					profile_id?: string;
					revoked?: boolean;
					token_hash?: string;
					used_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'activation_link_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'activation_link_profile_id_fkey';
						columns: ['profile_id'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			agenda_item: {
				Row: {
					assembly_id: string;
					description: string | null;
					id: string;
					position: number;
					requires_vote: boolean;
					title: string;
				};
				Insert: {
					assembly_id: string;
					description?: string | null;
					id?: string;
					position: number;
					requires_vote?: boolean;
					title: string;
				};
				Update: {
					assembly_id?: string;
					description?: string | null;
					id?: string;
					position?: number;
					requires_vote?: boolean;
					title?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'agenda_item_assembly_id_fkey';
						columns: ['assembly_id'];
						isOneToOne: false;
						referencedRelation: 'assembly';
						referencedColumns: ['id'];
					}
				];
			};
			assembly: {
				Row: {
					closed_at: string | null;
					convened_at: string | null;
					created_at: string;
					created_by: string | null;
					id: string;
					location: string | null;
					mode: Database['public']['Enums']['assembly_mode'];
					opened_at: string | null;
					quorum_pct: number;
					scheduled_at: string;
					status: Database['public']['Enums']['assembly_status'];
					title: string;
					type: Database['public']['Enums']['assembly_type'];
				};
				Insert: {
					closed_at?: string | null;
					convened_at?: string | null;
					created_at?: string;
					created_by?: string | null;
					id?: string;
					location?: string | null;
					mode: Database['public']['Enums']['assembly_mode'];
					opened_at?: string | null;
					quorum_pct?: number;
					scheduled_at: string;
					status?: Database['public']['Enums']['assembly_status'];
					title: string;
					type: Database['public']['Enums']['assembly_type'];
				};
				Update: {
					closed_at?: string | null;
					convened_at?: string | null;
					created_at?: string;
					created_by?: string | null;
					id?: string;
					location?: string | null;
					mode?: Database['public']['Enums']['assembly_mode'];
					opened_at?: string | null;
					quorum_pct?: number;
					scheduled_at?: string;
					status?: Database['public']['Enums']['assembly_status'];
					title?: string;
					type?: Database['public']['Enums']['assembly_type'];
				};
				Relationships: [
					{
						foreignKeyName: 'assembly_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			attendance: {
				Row: {
					assembly_id: string;
					id: string;
					mode: Database['public']['Enums']['attendance_mode'];
					profile_id: string;
					property_id: string;
					recorded_at: string;
				};
				Insert: {
					assembly_id: string;
					id?: string;
					mode: Database['public']['Enums']['attendance_mode'];
					profile_id: string;
					property_id: string;
					recorded_at?: string;
				};
				Update: {
					assembly_id?: string;
					id?: string;
					mode?: Database['public']['Enums']['attendance_mode'];
					profile_id?: string;
					property_id?: string;
					recorded_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'attendance_assembly_id_fkey';
						columns: ['assembly_id'];
						isOneToOne: false;
						referencedRelation: 'assembly';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'attendance_profile_id_fkey';
						columns: ['profile_id'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'attendance_property_id_fkey';
						columns: ['property_id'];
						isOneToOne: false;
						referencedRelation: 'property';
						referencedColumns: ['id'];
					}
				];
			};
			audit_log: {
				Row: {
					action: string;
					actor_id: string | null;
					created_at: string;
					entity: string;
					entity_id: string | null;
					id: string;
					payload: Json | null;
				};
				Insert: {
					action: string;
					actor_id?: string | null;
					created_at?: string;
					entity: string;
					entity_id?: string | null;
					id?: string;
					payload?: Json | null;
				};
				Update: {
					action?: string;
					actor_id?: string | null;
					created_at?: string;
					entity?: string;
					entity_id?: string | null;
					id?: string;
					payload?: Json | null;
				};
				Relationships: [
					{
						foreignKeyName: 'audit_log_actor_id_fkey';
						columns: ['actor_id'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			ballot: {
				Row: {
					agenda_item_id: string;
					closed_at: string | null;
					id: string;
					majority_rule: Database['public']['Enums']['majority_rule'];
					opened_at: string | null;
					options: Json;
					question: string;
					status: Database['public']['Enums']['ballot_status'];
				};
				Insert: {
					agenda_item_id: string;
					closed_at?: string | null;
					id?: string;
					majority_rule?: Database['public']['Enums']['majority_rule'];
					opened_at?: string | null;
					options: Json;
					question: string;
					status?: Database['public']['Enums']['ballot_status'];
				};
				Update: {
					agenda_item_id?: string;
					closed_at?: string | null;
					id?: string;
					majority_rule?: Database['public']['Enums']['majority_rule'];
					opened_at?: string | null;
					options?: Json;
					question?: string;
					status?: Database['public']['Enums']['ballot_status'];
				};
				Relationships: [
					{
						foreignKeyName: 'ballot_agenda_item_id_fkey';
						columns: ['agenda_item_id'];
						isOneToOne: false;
						referencedRelation: 'agenda_item';
						referencedColumns: ['id'];
					}
				];
			};
			ballot_vote: {
				Row: {
					ballot_id: string;
					cast_at: string;
					choice: string;
					id: string;
					weight: number;
				};
				Insert: {
					ballot_id: string;
					cast_at?: string;
					choice: string;
					id?: string;
					weight?: number;
				};
				Update: {
					ballot_id?: string;
					cast_at?: string;
					choice?: string;
					id?: string;
					weight?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'ballot_vote_ballot_id_fkey';
						columns: ['ballot_id'];
						isOneToOne: false;
						referencedRelation: 'ballot';
						referencedColumns: ['id'];
					}
				];
			};
			credential: {
				Row: {
					created_at: string;
					id: string;
					login: string;
					profile_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					login: string;
					profile_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					login?: string;
					profile_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'credential_profile_id_fkey';
						columns: ['profile_id'];
						isOneToOne: true;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			document: {
				Row: {
					created_at: string;
					description: string | null;
					id: string;
					mime_type: string | null;
					size_bytes: number | null;
					storage_path: string;
					title: string;
					type: Database['public']['Enums']['document_type'];
					uploaded_by: string | null;
					visibility: Database['public']['Enums']['visibility_level'];
					year: number | null;
				};
				Insert: {
					created_at?: string;
					description?: string | null;
					id?: string;
					mime_type?: string | null;
					size_bytes?: number | null;
					storage_path: string;
					title: string;
					type: Database['public']['Enums']['document_type'];
					uploaded_by?: string | null;
					visibility?: Database['public']['Enums']['visibility_level'];
					year?: number | null;
				};
				Update: {
					created_at?: string;
					description?: string | null;
					id?: string;
					mime_type?: string | null;
					size_bytes?: number | null;
					storage_path?: string;
					title?: string;
					type?: Database['public']['Enums']['document_type'];
					uploaded_by?: string | null;
					visibility?: Database['public']['Enums']['visibility_level'];
					year?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: 'document_uploaded_by_fkey';
						columns: ['uploaded_by'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			fee_assignment: {
				Row: {
					amount_due: number;
					fee_call_id: string;
					id: string;
					paid_at: string | null;
					property_id: string;
					status: Database['public']['Enums']['fee_status'];
				};
				Insert: {
					amount_due: number;
					fee_call_id: string;
					id?: string;
					paid_at?: string | null;
					property_id: string;
					status?: Database['public']['Enums']['fee_status'];
				};
				Update: {
					amount_due?: number;
					fee_call_id?: string;
					id?: string;
					paid_at?: string | null;
					property_id?: string;
					status?: Database['public']['Enums']['fee_status'];
				};
				Relationships: [
					{
						foreignKeyName: 'fee_assignment_fee_call_id_fkey';
						columns: ['fee_call_id'];
						isOneToOne: false;
						referencedRelation: 'fee_call';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'fee_assignment_property_id_fkey';
						columns: ['property_id'];
						isOneToOne: false;
						referencedRelation: 'property';
						referencedColumns: ['id'];
					}
				];
			};
			fee_call: {
				Row: {
					amount: number;
					created_at: string;
					created_by: string | null;
					due_date: string;
					id: string;
					label: string;
				};
				Insert: {
					amount: number;
					created_at?: string;
					created_by?: string | null;
					due_date: string;
					id?: string;
					label: string;
				};
				Update: {
					amount?: number;
					created_at?: string;
					created_by?: string | null;
					due_date?: string;
					id?: string;
					label?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'fee_call_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			info_post: {
				Row: {
					author_id: string | null;
					body: string;
					category: string | null;
					created_at: string;
					id: string;
					is_published: boolean;
					published_at: string | null;
					title: string;
				};
				Insert: {
					author_id?: string | null;
					body: string;
					category?: string | null;
					created_at?: string;
					id?: string;
					is_published?: boolean;
					published_at?: string | null;
					title: string;
				};
				Update: {
					author_id?: string | null;
					body?: string;
					category?: string | null;
					created_at?: string;
					id?: string;
					is_published?: boolean;
					published_at?: string | null;
					title?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'info_post_author_id_fkey';
						columns: ['author_id'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			ownership: {
				Row: {
					end_date: string | null;
					id: string;
					is_primary: boolean;
					profile_id: string;
					property_id: string;
					start_date: string;
				};
				Insert: {
					end_date?: string | null;
					id?: string;
					is_primary?: boolean;
					profile_id: string;
					property_id: string;
					start_date: string;
				};
				Update: {
					end_date?: string | null;
					id?: string;
					is_primary?: boolean;
					profile_id?: string;
					property_id?: string;
					start_date?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'ownership_profile_id_fkey';
						columns: ['profile_id'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'ownership_property_id_fkey';
						columns: ['property_id'];
						isOneToOne: false;
						referencedRelation: 'property';
						referencedColumns: ['id'];
					}
				];
			};
			presidency: {
				Row: {
					end_date: string | null;
					id: string;
					profile_id: string;
					start_date: string;
				};
				Insert: {
					end_date?: string | null;
					id?: string;
					profile_id: string;
					start_date: string;
				};
				Update: {
					end_date?: string | null;
					id?: string;
					profile_id?: string;
					start_date?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'presidency_profile_id_fkey';
						columns: ['profile_id'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			profile: {
				Row: {
					activated_at: string | null;
					created_at: string;
					email: string;
					full_name: string;
					id: string;
					last_login_at: string | null;
					must_change_credentials: boolean;
					phone: string | null;
					role: Database['public']['Enums']['user_role'];
					status: Database['public']['Enums']['account_status'];
				};
				Insert: {
					activated_at?: string | null;
					created_at?: string;
					email: string;
					full_name: string;
					id: string;
					last_login_at?: string | null;
					must_change_credentials?: boolean;
					phone?: string | null;
					role?: Database['public']['Enums']['user_role'];
					status?: Database['public']['Enums']['account_status'];
				};
				Update: {
					activated_at?: string | null;
					created_at?: string;
					email?: string;
					full_name?: string;
					id?: string;
					last_login_at?: string | null;
					must_change_credentials?: boolean;
					phone?: string | null;
					role?: Database['public']['Enums']['user_role'];
					status?: Database['public']['Enums']['account_status'];
				};
				Relationships: [];
			};
			property: {
				Row: {
					cadastre_number: string | null;
					created_at: string;
					id: string;
					reference: string;
					street_name: string | null;
					street_number: string | null;
					vote_weight: number;
				};
				Insert: {
					cadastre_number?: string | null;
					created_at?: string;
					id?: string;
					reference: string;
					street_name?: string | null;
					street_number?: string | null;
					vote_weight?: number;
				};
				Update: {
					cadastre_number?: string | null;
					created_at?: string;
					id?: string;
					reference?: string;
					street_name?: string | null;
					street_number?: string | null;
					vote_weight?: number;
				};
				Relationships: [];
			};
			proxy: {
				Row: {
					assembly_id: string;
					created_at: string;
					grantor_profile: string;
					grantor_property: string;
					holder_profile: string;
					id: string;
					status: Database['public']['Enums']['proxy_status'];
				};
				Insert: {
					assembly_id: string;
					created_at?: string;
					grantor_profile: string;
					grantor_property: string;
					holder_profile: string;
					id?: string;
					status?: Database['public']['Enums']['proxy_status'];
				};
				Update: {
					assembly_id?: string;
					created_at?: string;
					grantor_profile?: string;
					grantor_property?: string;
					holder_profile?: string;
					id?: string;
					status?: Database['public']['Enums']['proxy_status'];
				};
				Relationships: [
					{
						foreignKeyName: 'proxy_assembly_id_fkey';
						columns: ['assembly_id'];
						isOneToOne: false;
						referencedRelation: 'assembly';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'proxy_grantor_profile_fkey';
						columns: ['grantor_profile'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'proxy_grantor_property_fkey';
						columns: ['grantor_property'];
						isOneToOne: false;
						referencedRelation: 'property';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'proxy_holder_profile_fkey';
						columns: ['holder_profile'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			push_subscription: {
				Row: {
					created_at: string;
					endpoint: string;
					id: string;
					keys: Json;
					profile_id: string;
					user_agent: string | null;
				};
				Insert: {
					created_at?: string;
					endpoint: string;
					id?: string;
					keys: Json;
					profile_id: string;
					user_agent?: string | null;
				};
				Update: {
					created_at?: string;
					endpoint?: string;
					id?: string;
					keys?: Json;
					profile_id?: string;
					user_agent?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'push_subscription_profile_id_fkey';
						columns: ['profile_id'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					}
				];
			};
			vote_log: {
				Row: {
					ballot_id: string;
					cast_at: string;
					cast_by: string;
					id: string;
					on_behalf_of: string | null;
					property_id: string;
				};
				Insert: {
					ballot_id: string;
					cast_at?: string;
					cast_by: string;
					id?: string;
					on_behalf_of?: string | null;
					property_id: string;
				};
				Update: {
					ballot_id?: string;
					cast_at?: string;
					cast_by?: string;
					id?: string;
					on_behalf_of?: string | null;
					property_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'vote_log_ballot_id_fkey';
						columns: ['ballot_id'];
						isOneToOne: false;
						referencedRelation: 'ballot';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'vote_log_cast_by_fkey';
						columns: ['cast_by'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'vote_log_on_behalf_of_fkey';
						columns: ['on_behalf_of'];
						isOneToOne: false;
						referencedRelation: 'profile';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'vote_log_property_id_fkey';
						columns: ['property_id'];
						isOneToOne: false;
						referencedRelation: 'property';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			get_my_role: {
				Args: never;
				Returns: Database['public']['Enums']['user_role'];
			};
			get_my_status: {
				Args: never;
				Returns: Database['public']['Enums']['account_status'];
			};
			is_active_member: { Args: never; Returns: boolean };
			is_admin: { Args: never; Returns: boolean };
			is_admin_or_editor: { Args: never; Returns: boolean };
		};
		Enums: {
			account_status: 'pending' | 'active' | 'inactive';
			activation_kind: 'standard' | 'extended';
			assembly_mode: 'presentiel' | 'en_ligne' | 'hybride';
			assembly_status: 'draft' | 'convened' | 'open' | 'closed' | 'archived';
			assembly_type: 'ordinaire' | 'extraordinaire';
			attendance_mode: 'present' | 'represented' | 'absent';
			ballot_status: 'pending' | 'open' | 'closed';
			document_type:
				| 'statuts'
				| 'pv_ag'
				| 'budget'
				| 'facture'
				| 'cahier_charges'
				| 'convocation'
				| 'courrier'
				| 'autre';
			fee_status: 'due' | 'paid' | 'partial' | 'overdue';
			majority_rule: 'simple' | 'absolue' | 'qualifiee_2_3';
			proxy_status: 'pending' | 'accepted' | 'revoked';
			user_role: 'admin' | 'editor' | 'member';
			visibility_level: 'members' | 'editors' | 'admin';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {}
	},
	public: {
		Enums: {
			account_status: ['pending', 'active', 'inactive'],
			activation_kind: ['standard', 'extended'],
			assembly_mode: ['presentiel', 'en_ligne', 'hybride'],
			assembly_status: ['draft', 'convened', 'open', 'closed', 'archived'],
			assembly_type: ['ordinaire', 'extraordinaire'],
			attendance_mode: ['present', 'represented', 'absent'],
			ballot_status: ['pending', 'open', 'closed'],
			document_type: [
				'statuts',
				'pv_ag',
				'budget',
				'facture',
				'cahier_charges',
				'convocation',
				'courrier',
				'autre'
			],
			fee_status: ['due', 'paid', 'partial', 'overdue'],
			majority_rule: ['simple', 'absolue', 'qualifiee_2_3'],
			proxy_status: ['pending', 'accepted', 'revoked'],
			user_role: ['admin', 'editor', 'member'],
			visibility_level: ['members', 'editors', 'admin']
		}
	}
} as const;
