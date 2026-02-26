// Supabase Database type definitions
// These mirror the tables defined in supabase/schema.sql

export type SubscriptionTier =
  | "free"
  | "grower_monthly"
  | "commercial_monthly"
  | "lifetime";

export type GrowStage =
  | "germination"
  | "seedling"
  | "vegetative"
  | "flower"
  | "harvest"
  | "dry"
  | "cure";

export interface Database {
  // Required by @supabase/supabase-js v2.98+
  PostgrestVersion: "12";
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          subscription_tier: SubscriptionTier;
          trial_start_date: string | null;
          questions_today: number;
          last_question_date: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          subscription_tier?: SubscriptionTier;
          trial_start_date?: string | null;
          questions_today?: number;
          last_question_date?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_period_end?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      grow_calendars: {
        Row: {
          id: string;
          user_id: string;
          setup: Record<string, unknown>;
          weeks: Record<string, unknown>[];
          total_weeks: number;
          estimated_harvest_date: string;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          setup: Record<string, unknown>;
          weeks: Record<string, unknown>[];
          total_weeks: number;
          estimated_harvest_date: string;
          name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["grow_calendars"]["Insert"]>;
        Relationships: [];
      };
      grow_progress: {
        Row: {
          id: string;
          calendar_id: string;
          user_id: string;
          date: string;
          tasks_completed: string[];
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          calendar_id: string;
          user_id: string;
          date: string;
          tasks_completed?: string[];
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["grow_progress"]["Insert"]>;
        Relationships: [];
      };
      knowledge_sources: {
        Row: {
          id: string;
          title: string;
          source_type: "chapter" | "website" | "sop" | "pdf";
          content: string;
          embedding: number[] | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source_type: "chapter" | "website" | "sop" | "pdf";
          content: string;
          embedding?: number[] | null;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["knowledge_sources"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_knowledge: {
        Args: { query_embedding: number[]; match_count: number };
        Returns: Array<{
          id: string;
          title: string;
          content: string;
          similarity: number;
        }>;
      };
      check_trial_status: {
        Args: { user_id: string };
        Returns: {
          is_trial_active: boolean;
          hours_remaining: number;
          questions_remaining: number;
        };
      };
    };
  };
}
