/**
 * Veridicus Database Types
 * Single source of truth - used by both frontend and backend
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
          updated_at: string;
          cache_id: string | null;
          cache_expires_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          cache_id?: string | null;
          cache_expires_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
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
          file_size: number | null;
          token_count: number | null;
          metadata: Record<string, unknown>;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          file_path: string;
          file_type: string;
          mime_type: string;
          file_size?: number | null;
          token_count?: number | null;
          metadata?: Record<string, unknown>;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          file_path?: string;
          file_type?: string;
          mime_type?: string;
          file_size?: number | null;
          token_count?: number | null;
          metadata?: Record<string, unknown>;
          embedding?: number[] | null;
          created_at?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          case_id: string;
          query: string;
          thought_signature: string | null;
          thoughts: string[] | null;
          result: Record<string, unknown>;
          citations: Record<string, unknown>[];
          token_usage: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          query: string;
          thought_signature?: string | null;
          thoughts?: string[] | null;
          result?: Record<string, unknown>;
          citations?: Record<string, unknown>[];
          token_usage?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          query?: string;
          thought_signature?: string | null;
          thoughts?: string[] | null;
          result?: Record<string, unknown>;
          citations?: Record<string, unknown>[];
          token_usage?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      contradictions: {
        Row: {
          id: string;
          analysis_id: string;
          case_id: string;
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
          case_id: string;
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
          case_id?: string;
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
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          action: string;
          details?: Record<string, unknown>;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string;
          action?: string;
          details?: Record<string, unknown>;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience type exports
export type Case = Database['public']['Tables']['cases']['Row'];
export type CaseInsert = Database['public']['Tables']['cases']['Insert'];
export type CaseUpdate = Database['public']['Tables']['cases']['Update'];

export type Evidence = Database['public']['Tables']['evidence']['Row'];
export type EvidenceInsert = Database['public']['Tables']['evidence']['Insert'];
export type EvidenceUpdate = Database['public']['Tables']['evidence']['Update'];

export type Analysis = Database['public']['Tables']['analyses']['Row'];
export type AnalysisInsert = Database['public']['Tables']['analyses']['Insert'];
export type AnalysisUpdate = Database['public']['Tables']['analyses']['Update'];

export type Contradiction = Database['public']['Tables']['contradictions']['Row'];
export type ContradictionInsert = Database['public']['Tables']['contradictions']['Insert'];
export type ContradictionUpdate = Database['public']['Tables']['contradictions']['Update'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update'];

/**
 * Helper types for Supabase operations
 */
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

/**
 * Helper type for evidence metadata
 */
export interface EvidenceMetadata {
  originalName?: string;
  processed?: boolean;
  forensic?: {
    summary?: string;
    entities?: string[];
    findings?: string[];
    dates?: string[];
    confidence?: number;
  };
  processing_error?: string;
  analysis_at?: string;
}

/**
 * Helper type for analysis result
 */
export interface AnalysisResult {
  text?: string;
  contradictions?: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

/**
 * Severity levels for contradictions
 */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
