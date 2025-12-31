import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { config } from 'dotenv';

// Load environment variables
config();

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://veridicus.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
});

await fastify.register(websocket, {
  options: { maxPayload: 1048576 * 10 }, // 10MB for audio chunks
});

await fastify.register(multipart, {
  limits: {
    fileSize: 1024 * 1024 * 500, // 500MB max file size
  },
});

// Health check endpoint
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };
});

// API routes
await fastify.register(import('./api/cases.js'), { prefix: '/api/cases' });
await fastify.register(import('./api/evidence.js'), { prefix: '/api/evidence' });
await fastify.register(import('./api/analysis.js'), { prefix: '/api/analysis' });

// WebSocket routes for Live API
await fastify.register(import('./websocket/live-audio.js'));

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Veridicus Backend running at http://${host}:${port}`);
    console.log(`📡 WebSocket ready for Live Audio connections`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
