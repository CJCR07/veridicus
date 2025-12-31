import { FastifyInstance } from 'fastify';
import { generateWithThinking, generateWithCache } from '../gemini/gemini-client.js';
import { supabase } from '../services/supabase.js';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';

export default async function analysisRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  // POST /api/analysis/query
  fastify.post('/query', async (request, reply) => {
    const schema = z.object({
      caseId: z.string().uuid(),
      query: z.string().min(1),
    });

    try {
      const { caseId, query } = schema.parse(request.body);

      // 1. Check if case has a valid context cache
      const { data: caseItem, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) throw new Error('Case not found');

      // 2. Perform reasoning
      let result;
      const caseData = caseItem as any;
      if (caseData.cache_id && new Date(caseData.cache_expires_at!) > new Date()) {
        // Use cached context (4x cheaper processing)
        result = await generateWithCache(caseData.cache_id, query, { caseId } as any);
      } else {
        // Fallback to direct thinking (or trigger cache creation)
        result = await generateWithThinking(query);
      }

      // 3. Log the analysis
      const { data: analysis, error: analysisError } = await (supabase
        .from('analyses') as any)
        .insert([{
          case_id: caseId,
          query,
          thought_signature: null,
          thoughts: result.thoughts,
          result: { text: result.text },
          citations: 'citations' in result ? (result as any).citations : [],
        }])
        .select()
        .single();

      if (analysisError) throw analysisError;

      // 4. Store contradictions if any were detected
      if (result.contradictions && result.contradictions.length > 0) {
        await (supabase
          .from('contradictions') as any)
          .insert((result as any).contradictions.map((c: any) => ({
            analysis_id: (analysis as any).id,
            case_id: caseId,
            description: c.description,
            severity: c.severity || 'medium',
            evidence_a_id: c.evidence_a_id,
            evidence_b_id: c.evidence_b_id,
            timestamps: c.timestamps || {}
          })) as any);
      }

      return { ...((analysis as any) || {}), contradictions: (result as any).contradictions || [] };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : 'Analysis failed' });
    }
  });
}
