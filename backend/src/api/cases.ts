import { FastifyInstance } from 'fastify';
import { supabase } from '../services/supabase.js';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';

export default async function caseRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/cases
  fastify.get('/', async (request, reply) => {
    const user = (request as any).user;
    
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) return reply.status(500).send(error);
    return cases;
  });

  // GET /api/cases/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data: caseItem, error } = await supabase
      .from('cases')
      .select('*, evidence(*)')
      .eq('id', id)
      .single();

    if (error) return reply.status(404).send({ error: 'Case not found' });
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
      const user = (request as any).user;

      const { data, error } = await supabase
        .from('cases')
        .insert([{ name, description, user_id: user.id }] as any)
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
    const { error } = await supabase.from('cases').delete().eq('id', id);

    if (error) return reply.status(500).send(error);
    return reply.status(204).send();
  });
}
