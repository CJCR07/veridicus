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
      const user = request.user;

      // 1. Check if case exists and user owns it
      const { data: caseItem, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .eq('user_id', user.id)
        .single();

      if (caseError || !caseItem) {
        return reply.status(404).send({ error: 'Case not found' });
      }

      // 2. Perform reasoning
      let result;
      const caseData = caseItem;
      if (caseData.cache_id && caseData.cache_expires_at && new Date(caseData.cache_expires_at) > new Date()) {
        // Use cached context (4x cheaper processing)
        result = await generateWithCache(caseData.cache_id, query, { caseId, userId: user.id });
      } else {
        // Fallback to direct thinking (or trigger cache creation)
        result = await generateWithThinking(query, [], { caseId, userId: user.id });
      }

      // 3. Log the analysis
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert([{
          case_id: caseId,
          query,
          thought_signature: null,
          thoughts: result.thoughts,
          result: { text: result.text },
          citations: 'citations' in result ? result.citations : [],
          token_usage: {
            input: result.usage.inputTokens,
            output: result.usage.outputTokens,
          },
        }])
        .select()
        .single();

      if (analysisError) throw analysisError;

      // 4. Store contradictions if any were detected
      if (result.contradictions && result.contradictions.length > 0 && analysis) {
        await supabase
          .from('contradictions')
          .insert(result.contradictions.map((c) => ({
            analysis_id: analysis.id,
            case_id: caseId,
            description: c.description,
            severity: c.severity || 'medium',
            evidence_a_id: c.evidence_a_id,
            evidence_b_id: c.evidence_b_id,
            timestamps: c.timestamps || {}
          })));
      }

      return { ...(analysis || {}), contradictions: result.contradictions || [] };
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : 'Analysis failed' });
    }
  });
}
