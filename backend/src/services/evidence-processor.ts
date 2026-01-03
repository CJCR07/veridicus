import { generateWithThinking } from '../gemini/gemini-client.js';
import { supabase, logAction } from './supabase.js';

/**
 * Downloads a file from Supabase Storage as a Buffer
 */
async function downloadFile(path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from('evidence')
    .download(path);

  if (error || !data) throw new Error(`Failed to download file: ${error?.message}`);
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Processes evidence using Gemini to extract forensic metadata
 */
export async function processEvidenceMetadata(evidenceId: string) {
  // 1. Get evidence details with case ownership info
  const { data: evidence, error } = await supabase
    .from('evidence')
    .select('*, cases(name, user_id)')
    .eq('id', evidenceId)
    .single();

  if (error || !evidence) throw new Error('Evidence not found');

  // Type the evidence data properly
  interface EvidenceWithCase {
    id: string;
    case_id: string;
    file_path: string;
    file_type: string;
    mime_type: string;
    metadata: Record<string, unknown>;
    cases: { name: string; user_id: string } | null;
  }

  try {
    const evidenceData = evidence as EvidenceWithCase;
    // 2. Download file for Gemini
    const buffer = await downloadFile(evidenceData.file_path);
    const base64Data = buffer.toString('base64');

    // 3. Extract metadata using Gemini
    const caseName = evidenceData.cases?.name || 'Unknown Case';
    const prompt = `Analyze this forensic evidence file for the case "${caseName}". 
    Perform a deep forensic analysis. 
    Return ONLY a JSON object with:
    {
      "summary": "Brief forensic summary",
      "entities": ["Person A", "Org B"],
      "findings": ["Finding 1", "Finding 2"],
      "dates": ["YYYY-MM-DD"],
      "confidence": 0.95
    }`;

    const result = await generateWithThinking(prompt, [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: evidenceData.mime_type,
              data: base64Data,
            },
          },
        ],
      },
    ]);

    let metadata = {};
    try {
      metadata = JSON.parse(result.text);
    } catch (e) {
      metadata = { raw_output: result.text };
    }

    // 4. Update evidence metadata in DB
    await supabase
      .from('evidence')
      .update({
        metadata: {
          ...(evidenceData.metadata as object),
          forensic: metadata,
          analysis_at: new Date().toISOString(),
          processed: true,
        },
        token_count: result.usage.inputTokens + result.usage.outputTokens,
      })
      .eq('id', evidenceId);

    // 5. Audit Logging
    if (evidenceData.cases?.user_id) {
      await logAction(
        evidenceData.case_id,
        evidenceData.cases.user_id,
        'evidence_processed',
        { evidence_id: evidenceId, summary: (metadata as { summary?: string })?.summary }
      );
    }

    return metadata;
  } catch (err) {
    const evidenceData = evidence as { metadata: Record<string, unknown>; case_id: string };
    console.error(`Metadata extraction failed for ${evidenceId}:`, err);
    await supabase
      .from('evidence')
      .update({
        metadata: {
          ...(evidenceData.metadata as object),
          processing_error: err instanceof Error ? err.message : 'Unknown error',
          processed: false,
        }
      })
      .eq('id', evidenceId);
    throw err;
  }
}
