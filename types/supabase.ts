// Supabase 데이터베이스 타입 정의
// SCHEMA.sql 기반 수동 작성. supabase gen types 로 자동 생성 가능.

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          picto_pin_hash: string;
          language: string;
          phone: string;
          birth_year: number | null;
          emergency_summary: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          picto_pin_hash: string;
          language?: string;
          phone: string;
          birth_year?: number | null;
          emergency_summary?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      prescriptions: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          ocr_text: string | null;
          ocr_confidence: number | null;
          pictogram_sequence: unknown | null;
          doctor_name: string | null;
          hospital: string | null;
          issued_date: string | null;
          note_voice_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>;
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          prescription_id: string | null;
          name: string;
          pictogram_morpheme_id: string | null;
          dosage_per_time: number;
          duration_days: number | null;
          remaining_count: number | null;
          started_at: string | null;
          ended_at: string | null;
          active: boolean;
          rxnorm_code: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['medications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['medications']['Insert']>;
      };
      medication_schedules: {
        Row: {
          id: string;
          medication_id: string;
          time_of_day: string;
          with_meal: 'before' | 'after' | 'with' | null;
          active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['medication_schedules']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['medication_schedules']['Insert']>;
      };
      medication_logs: {
        Row: {
          id: string;
          user_id: string;
          medication_id: string;
          schedule_id: string | null;
          taken_at: string;
          skipped: boolean;
          late_minutes: number | null;
          via: 'tap' | 'voice' | null;
        };
        Insert: Omit<Database['public']['Tables']['medication_logs']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['medication_logs']['Insert']>;
      };
      health_logs: {
        Row: {
          id: string;
          user_id: string;
          recorded_at: string;
          mood_level: number | null;
          pain_locations: unknown | null;
          symptoms: unknown | null;
          note_voice_url: string | null;
          related_medication_log_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['health_logs']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['health_logs']['Insert']>;
      };
      share_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          scope: Record<string, unknown>;
          expires_at: string;
          consumed_at: string | null;
          consumed_by_ip: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['share_tokens']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['share_tokens']['Insert']>;
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          relation: string | null;
          priority: number | null;
        };
        Insert: Omit<Database['public']['Tables']['emergency_contacts']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['emergency_contacts']['Insert']>;
      };
      alarm_schedules: {
        Row: {
          id: string;
          user_id: string;
          alarm_type: 'medication' | 'vaccine' | 'low_supply' | 'epidemic' | 'chronic_check';
          ref_id: string | null;
          trigger_at: string;
          payload: unknown | null;
          sent_at: string | null;
          dismissed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['alarm_schedules']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['alarm_schedules']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_share_token: {
        Args: { p_token: string; p_ip: string };
        Returns: Record<string, unknown>;
      };
    };
    Enums: Record<string, never>;
  };
}
