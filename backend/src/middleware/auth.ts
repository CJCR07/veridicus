import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../services/supabase.js';

/**
 * Authentication middleware
 * Validates Bearer token and attaches user to request
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({ error: 'Missing authorization header' });
  }

  // Robust token extraction - handles both "Bearer token" and raw token formats
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token || token.length === 0) {
    return reply.status(401).send({ error: 'Invalid authorization header format' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  // Set user in request context for routes to use
  request.user = {
    id: user.id,
    email: user.email,
  };
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't reject if missing
 */
export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return; // Continue without user
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token || token.length === 0) {
    return; // Continue without user
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      request.user = {
        id: user.id,
        email: user.email,
      };
    }
  } catch {
    // Silently continue without user
  }
}
