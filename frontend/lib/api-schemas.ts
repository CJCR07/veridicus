/**
 * API Response Validation Schemas
 * Using Zod for runtime type checking of API responses
 */

import { z } from 'zod';

// Severity level enum
export const SeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

// Case schema
export const CaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  cache_id: z.string().nullable(),
  cache_expires_at: z.string().nullable(),
  user_id: z.string().uuid(),
});

export const CaseArraySchema = z.array(CaseSchema);

// Evidence schema
export const EvidenceMetadataSchema = z.object({
  originalName: z.string().optional(),
  processed: z.boolean().optional(),
  forensic: z.object({
    summary: z.string().optional(),
    entities: z.array(z.string()).optional(),
    findings: z.array(z.string()).optional(),
    dates: z.array(z.string()).optional(),
    confidence: z.number().optional(),
  }).optional(),
  processing_error: z.string().optional(),
  analysis_at: z.string().optional(),
}).passthrough();

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  file_path: z.string(),
  file_type: z.string(),
  mime_type: z.string(),
  file_size: z.number().nullable(),
  token_count: z.number().nullable(),
  metadata: z.record(z.unknown()),
  created_at: z.string(),
});

export const EvidenceArraySchema = z.array(EvidenceSchema);

// Analysis schema
export const AnalysisResultSchema = z.object({
  text: z.string().optional(),
  contradictions: z.array(z.object({
    description: z.string(),
    severity: SeveritySchema,
  })).optional(),
}).passthrough();

export const AnalysisSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  query: z.string(),
  thought_signature: z.string().nullable(),
  thoughts: z.array(z.string()).nullable(),
  result: z.record(z.unknown()),
  citations: z.array(z.record(z.unknown())),
  token_usage: z.record(z.unknown()).nullable(),
  created_at: z.string(),
});

export const AnalysisArraySchema = z.array(AnalysisSchema);

// Contradiction schema
export const ContradictionSchema = z.object({
  id: z.string().uuid(),
  analysis_id: z.string().uuid(),
  case_id: z.string().uuid(),
  evidence_a_id: z.string().uuid(),
  evidence_b_id: z.string().uuid(),
  description: z.string(),
  severity: SeveritySchema,
  timestamps: z.record(z.unknown()),
  created_at: z.string(),
});

export const ContradictionArraySchema = z.array(ContradictionSchema);

// API Error schema
export const ApiErrorSchema = z.object({
  error: z.string(),
});

/**
 * Safe parse helper that returns typed data or throws
 */
export async function parseApiResponse<T>(
  response: Response,
  schema: z.ZodSchema<T>
): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    const error = ApiErrorSchema.safeParse(errorData);
    throw new Error(error.success ? error.data.error : 'Request failed');
  }
  
  const data = await response.json();
  const result = schema.safeParse(data);
  
  if (!result.success) {
    console.error('API response validation failed:', result.error.issues);
    throw new Error('Invalid API response format');
  }
  
  return result.data;
}

// Type exports from schemas
export type ValidatedCase = z.infer<typeof CaseSchema>;
export type ValidatedEvidence = z.infer<typeof EvidenceSchema>;
export type ValidatedAnalysis = z.infer<typeof AnalysisSchema>;
export type ValidatedContradiction = z.infer<typeof ContradictionSchema>;

