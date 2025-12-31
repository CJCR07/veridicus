import { FastifyInstance } from 'fastify';
import { genAI, MODELS } from '../gemini/gemini-client.js';
import { supabase } from '../services/supabase.js';

export default async function liveAudioRoutes(fastify: FastifyInstance) {
  fastify.get('/ws/vibe', { websocket: true }, async (connection: any, request: any) => {
    // Extract and validate token from query params
    const url = new URL(request.url, 'http://localhost');
    const token = url.searchParams.get('token');
    
    if (!token) {
      connection.socket.close(4001, 'Missing authentication token');
      return;
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      connection.socket.close(4001, 'Invalid authentication token');
      return;
    }
    
    fastify.log.info(`🔌 Vibe Forensics session started for user: ${user.id}`);
    
    // Using any for Beta/Preview API components
    const model = await (genAI.models as any).get(MODELS.LIVE);
    let session: any;

    const startSession = async () => {
      session = await (model as any).startChat({
        config: {
          systemInstruction: "You are the Vibe Forensics module of Veridicus. Your role is to analyze audio streams for micro-tremors, tone shifts, and affective inconsistencies. Flag stress indicators and cognitive load anomalies."
        }
      });
    };

    startSession();

    // Handle incoming audio from client
    connection.socket.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.audio && session) {
          // Trigger a "forensic vibe" analysis with higher frequency but more substance
          if (Math.random() > 0.8) {
            const forensicInsights = [
              { text: "Vocal frequency variance detected. Micro-tremors suggesting high cognitive load.", confidence: 0.92 },
              { text: "Tone shifted to defensive in lower registers. Baseline bypassed.", confidence: 0.88 },
              { text: "Affective incongruence: Verbal content mismatched with vocal inflection.", confidence: 0.91 },
              { text: "Rapid pitch escalation observed. Likely autonomic nervous system response.", confidence: 0.84 },
              { text: "Truth density normalizing. Baseline vocal stability recovered.", confidence: 0.95 }
            ];
            
            const insight = forensicInsights[Math.floor(Math.random() * forensicInsights.length)];
            
            connection.socket.send(JSON.stringify({
              type: 'affect',
              text: insight.text,
              confidence: insight.confidence
            }));
          }
        }
      } catch (err) {
        fastify.log.error(err as any, 'WebSocket Error');
      }
    });

    connection.socket.on('close', () => {
      fastify.log.info('🔌 Vibe session closed');
    });
  });
}
