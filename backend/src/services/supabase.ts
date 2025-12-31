import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

// Typed helper for authenticated client
export function getAuthenticatedClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// ----- CASES -----

export interface Case {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  cache_id: string | null;
  cache_expires_at: string | null;
  user_id: string;
}

export async function createCase(userId: string, name: string, description?: string): Promise<Case> {
  const { data, error } = await supabase
    .from('cases')
    .insert({ name, description, user_id: userId } as any)
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
  return data || [];
}

export async function updateCaseCache(
  caseId: string,
  cacheId: string,
  expiresAt: Date
): Promise<void> {
  const { error } = await (supabase
    .from('cases') as any)
    .update({
      cache_id: cacheId,
      cache_expires_at: expiresAt.toISOString(),
    })
    .eq('id', caseId);

  if (error) throw error;
}

// ----- EVIDENCE -----

export interface Evidence {
  id: string;
  case_id: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  token_count: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function addEvidence(
  caseId: string,
  filePath: string,
  fileType: string,
  mimeType: string,
  metadata: Record<string, unknown> = {}
): Promise<Evidence> {
  const { data, error } = await (supabase
    .from('evidence') as any)
    .insert({
      case_id: caseId,
      file_path: filePath,
      file_type: fileType,
      mime_type: mimeType,
      metadata: metadata || {},
    })
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
  return data || [];
}

// ----- AUDIT LOGS -----

export interface AuditLog {
  id: string;
  case_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export async function logAction(
  caseId: string,
  userId: string,
  action: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    case_id: caseId,
    user_id: userId,
    action,
    details,
  } as any);

  if (error) throw error;
}

export async function getAuditLogsByCase(caseId: string): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
