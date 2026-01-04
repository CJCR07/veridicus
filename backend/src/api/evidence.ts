import { FastifyInstance } from 'fastify';
import { supabase, logAction } from '../services/supabase.js';
import { processEvidenceMetadata } from '../services/evidence-processor.js';
import { authenticate } from '../middleware/auth.js';
import { isValidUUID } from '../constants.js';

export default async function evidenceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/evidence/case/:caseId
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
    
    const { data: evidence, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) return reply.status(500).send({ error: error.message });
    return evidence;
  });

  // POST /api/evidence/upload
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const caseId = (request.query as { caseId?: string }).caseId;
    if (!caseId) return reply.status(400).send({ error: 'caseId is required' });

    if (!isValidUUID(caseId)) {
      return reply.status(400).send({ error: 'Invalid case ID format' });
    }

    const user = request.user;

    // Verify case ownership before upload
    const { data: caseItem, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single();

    if (caseError || !caseItem) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    const buffer = await data.toBuffer();
    
    // Forensic: Validate file type via magic bytes (basic check for PDF, PNG, JPG)
    const isPDF = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47; // .PNG
    const isJPG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF; // JPG
    
    if (!isPDF && !isPNG && !isJPG && data.mimetype !== 'application/octet-stream') {
      console.warn(`[UPLOAD] ⚠️ Blocked potentially unsafe file upload: ${data.filename} (${data.mimetype})`);
      return reply.status(415).send({ error: 'Unsupported forensic file format. please upload PDF or Image' });
    }
    
    // 1. Upload to Supabase Storage
    const fileName = `${caseId}/${Date.now()}-${data.filename}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('evidence')
      .upload(fileName, buffer, {
        contentType: data.mimetype,
      });

    if (storageError) return reply.status(500).send({ error: storageError.message });

    // 2. Add record to database
    const { data: evidence, error: dbError } = await (supabase.from('evidence') as any)
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
      }])
      .select()
      .single();

    if (dbError) return reply.status(500).send({ error: dbError.message });

    // 3. Audit Logging (Ingestion)
    await logAction(caseId, user.id, 'evidence_upload', {
      filename: data.filename,
      size: buffer.length,
      mime: data.mimetype
    });

    // 4. Trigger automated processing (background)
    if (evidence?.id) {
      // Forensic: Log evidence upload
      await logAction(caseId, (request.user as any).id, 'evidence_uploaded', { 
        evidenceId: evidence.id, 
        filename: data.filename 
      });

      processEvidenceMetadata(evidence.id).catch((err) => {
        console.error(`[PROCESS] ❌ Background evidence processing failed for ${evidence.id}:`, err);
        // We could update the evidence status to 'failed' here
      });
    }

    return reply.status(201).send(evidence);
  });

  // POST /api/evidence/:evidenceId/process
  fastify.post('/:evidenceId/process', async (request, reply) => {
    const { evidenceId } = request.params as { evidenceId: string };
    const user = request.user;

    if (!isValidUUID(evidenceId)) {
      return reply.status(400).send({ error: 'Invalid evidence ID format' });
    }

    try {
      // Verify evidence ownership through case
      const { data: evidence, error: evidenceError } = await supabase
        .from('evidence')
        .select('id, case_id, cases!inner(user_id)')
        .eq('id', evidenceId)
        .single();

      if (evidenceError || !evidence) {
        return reply.status(404).send({ error: 'Evidence not found' });
      }

      // Check case ownership - properly type the nested relation
      interface EvidenceWithCase {
        id: string;
        case_id: string;
        cases: { user_id: string };
      }
      const evidenceData = evidence as unknown as EvidenceWithCase;
      
      if (evidenceData.cases.user_id !== user.id) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const result = await processEvidenceMetadata(evidenceId);
      return result;
    } catch (err) {
      return reply.status(500).send({ error: err instanceof Error ? err.message : 'Processing failed' });
    }
  });
}
