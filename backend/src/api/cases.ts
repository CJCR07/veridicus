import { FastifyInstance } from 'fastify';
import { supabase } from '../services/supabase.js';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { isValidUUID } from '../constants.js';

export default async function caseRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/cases
  fastify.get('/', async (request, reply) => {
    const user = request.user;
    
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return cases;
  });

  // GET /api/cases/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!isValidUUID(id)) {
      return reply.status(400).send({ error: 'Invalid case ID format' });
    }

    const { data: caseItem, error } = await supabase
      .from('cases')
      .select('*, evidence(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !caseItem) {
      return reply.status(404).send({ error: 'Case not found' });
    }
    return caseItem;
  });

  // POST /api/cases
  fastify.post('/', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    });

    try {
      const { name, description } = schema.parse(request.body);
      const user = request.user;

      const { data, error } = await supabase
        .from('cases')
        .insert([{ name, description, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return reply.status(201).send(data);
    } catch (err) {
      return reply.status(400).send({ error: err instanceof Error ? err.message : 'Invalid request' });
    }
  });

  // DELETE /api/cases/:id
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;

    if (!isValidUUID(id)) {
      return reply.status(400).send({ error: 'Invalid case ID format' });
    }

    // First verify case exists and belongs to user
    const { data: caseItem, error: checkError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !caseItem) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(204).send();
  });
}
