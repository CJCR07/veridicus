/**
 * Veridicus Database Types
 * Auto-generated from Supabase schema
 */

export interface Database {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          cache_id: string | null;
          cache_expires_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          cache_id?: string | null;
          cache_expires_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          cache_id?: string | null;
          cache_expires_at?: string | null;
          user_id?: string;
        };
      };
      evidence: {
        Row: {
          id: string;
          case_id: string;
          file_path: string;
          file_type: string;
          mime_type: string;
          token_count: number | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          file_path: string;
          file_type: string;
          mime_type: string;
          token_count?: number | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          file_path?: string;
          file_type?: string;
          mime_type?: string;
          token_count?: number | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          case_id: string;
          query: string;
          thought_signature: string | null;
          result: Record<string, unknown>;
          citations: Record<string, unknown>[];
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          query: string;
          thought_signature?: string | null;
          result?: Record<string, unknown>;
          citations?: Record<string, unknown>[];
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          query?: string;
          thought_signature?: string | null;
          result?: Record<string, unknown>;
          citations?: Record<string, unknown>[];
          created_at?: string;
        };
      };
      contradictions: {
        Row: {
          id: string;
          analysis_id: string;
          evidence_a_id: string;
          evidence_b_id: string;
          description: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          timestamps: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          evidence_a_id: string;
          evidence_b_id: string;
          description: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          timestamps?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          evidence_a_id?: string;
          evidence_b_id?: string;
          description?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          timestamps?: Record<string, unknown>;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          action: string;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          action: string;
          details?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string;
          action?: string;
          details?: Record<string, unknown>;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience type exports
export type Case = Database['public']['Tables']['cases']['Row'];
export type Evidence = Database['public']['Tables']['evidence']['Row'];
export type Analysis = Database['public']['Tables']['analyses']['Row'];
export type Contradiction = Database['public']['Tables']['contradictions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
