import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Authenticated user information set by auth middleware
     */
    user: {
      /** User's unique identifier */
      id: string;
      /** User's email address */
      email?: string;
      /** Additional user properties */
      [key: string]: unknown;
    };
  }
}
