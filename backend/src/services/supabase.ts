import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database, Case, Evidence, AuditLog, CaseInsert, EvidenceInsert, AuditLogInsert } from '../../../shared/types/database.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must be defined.');
}

/**
 * Admin Supabase client with service role key
 * Use for server-side operations that bypass RLS
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Creates an authenticated Supabase client for user-scoped operations
 * This respects RLS policies
 */
export function getAuthenticatedClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// ----- CASES -----

export async function createCase(userId: string, name: string, description?: string): Promise<Case> {
  const insertData: CaseInsert = { name, description, user_id: userId };
  
  const { data, error } = await supabase
    .from('cases')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCasesByUser(userId: string): Promise<Case[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateCaseCache(
  caseId: string,
  cacheId: string,
  expiresAt: Date
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      cache_id: cacheId,
      cache_expires_at: expiresAt.toISOString(),
    })
    .eq('id', caseId);

  if (error) throw error;
}

// ----- EVIDENCE -----

export async function addEvidence(
  caseId: string,
  filePath: string,
  fileType: string,
  mimeType: string,
  metadata: Record<string, unknown> = {}
): Promise<Evidence> {
  const insertData: EvidenceInsert = {
    case_id: caseId,
    file_path: filePath,
    file_type: fileType,
    mime_type: mimeType,
    metadata: metadata || {},
  };

  const { data, error } = await supabase
    .from('evidence')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getEvidenceByCase(caseId: string): Promise<Evidence[]> {
  const { data, error } = await supabase
    .from('evidence')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ----- AUDIT LOGS -----

export async function logAction(
  caseId: string,
  userId: string,
  action: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const insertData: AuditLogInsert = {
    case_id: caseId,
    user_id: userId,
    action,
    details,
  };

  const { error } = await supabase
    .from('audit_logs')
    .insert(insertData);

  if (error) throw error;
}

export async function getAuditLogsByCase(caseId: string): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Re-export types for convenience
export type { Case, Evidence, AuditLog };
