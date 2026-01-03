import { FastifyInstance } from 'fastify';
import { supabase } from '../services/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { isValidUUID } from '../constants.js';

export default async function analysesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/analyses/case/:caseId
  fastify.get('/case/:caseId', async (request, reply) => {
    const { caseId } = request.params as { caseId: string };
    const user = request.user;

    if (!isValidUUID(caseId)) {
      return reply.status(400).send({ error: 'Invalid case ID format' });
    }

    // Verify case ownership
    const { data: caseItem, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single();

    if (caseError || !caseItem) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return analyses;
  });

  // GET /api/analyses/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;

    if (!isValidUUID(id)) {
      return reply.status(400).send({ error: 'Invalid analysis ID format' });
    }

    // Fetch analysis with case ownership check
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*, cases!inner(user_id)')
      .eq('id', id)
      .single();

    if (error || !analysis) {
      return reply.status(404).send({ error: 'Analysis not found' });
    }

    // Verify ownership
    interface AnalysisWithCase {
      cases: { user_id: string };
      [key: string]: unknown;
    }
    const data = analysis as unknown as AnalysisWithCase;
    
    if (data.cases.user_id !== user.id) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    // Remove the nested cases object before returning
    const { cases: _, ...result } = analysis;
    return result;
  });
}

