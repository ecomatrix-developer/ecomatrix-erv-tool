/**
 * Hand-written to match supabase/schema.sql. If you run `supabase gen types typescript`
 * against your live project later, that generated file can replace this one directly --
 * the shape (Database.public.Tables.projects / .scenarios) is the same.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string | null;
          is_active: boolean | null;
          created_at: string;
          last_login: string | null;
          password_changed_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          full_name?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          last_login?: string | null;
          password_changed_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          full_name?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          last_login?: string | null;
          password_changed_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scenarios: {
        Row: {
          id: string;
          project_id: string;
          label: string;
          position: number;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputs: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outputs: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          label: string;
          position: number;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputs: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outputs?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          label?: string;
          position?: number;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inputs?: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outputs?: any;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      custom_weather_files: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          source_filename: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dbt: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rh: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          source_filename: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dbt: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rh: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          source_filename?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dbt?: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rh?: any;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
