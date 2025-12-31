import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../services/supabase.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  // Set user ID in request context for routes to use
  (request as any).user = user;
}
