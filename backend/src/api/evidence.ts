import { FastifyInstance } from 'fastify';
import { supabase, logAction } from '../services/supabase.js';
import { processEvidenceMetadata } from '../services/evidence-processor.js';
import { authenticate } from '../middleware/auth.js';

export default async function evidenceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/cases/:caseId/evidence
  fastify.get('/case/:caseId', async (request, reply) => {
    const { caseId } = request.params as { caseId: string };
    
    const { data: evidence, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) return reply.status(500).send(error);
    return evidence;
  });

  // POST /api/evidence/upload
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const caseId = (request.query as any).caseId;
    if (!caseId) return reply.status(400).send({ error: 'caseId is required' });

    const buffer = await data.toBuffer();
    
    // 1. Upload to Supabase Storage
    const fileName = `${caseId}/${Date.now()}-${data.filename}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('evidence')
      .upload(fileName, buffer, {
        contentType: data.mimetype,
      });

    if (storageError) return reply.status(500).send(storageError);

    // 2. Add record to database
    const { data: evidence, error: dbError } = await supabase
      .from('evidence')
      .insert([{
        case_id: caseId,
        file_path: storageData.path,
        file_type: data.mimetype.split('/')[0],
        mime_type: data.mimetype,
        file_size: buffer.length,
        metadata: {
          originalName: data.filename,
          processed: false,
        },
      }] as any)
      .select()
      .single();

    if (dbError) return reply.status(500).send(dbError);

    // 3. Audit Logging (Ingestion)
    await logAction(caseId, 'anonymous', 'evidence_upload', {
      filename: data.filename,
      size: buffer.length,
      mime: data.mimetype
    });

    // 4. Trigger automated processing (background)
    processEvidenceMetadata((evidence as any).id).catch(console.error);

    return reply.status(201).send(evidence);
  });

  // POST /api/evidence/:evidenceId/process
  fastify.post('/:evidenceId/process', async (request, reply) => {
    const { evidenceId } = request.params as { evidenceId: string };
    try {
      const result = await processEvidenceMetadata(evidenceId);
      return result;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : 'Processing failed' });
    }
  });
}
