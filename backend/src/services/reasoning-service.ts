import { supabase } from './supabase.js';

export async function executeForensicTool(name: string, args: any, caseId: string) {
  console.log(`🛠️ Executing forensic tool: ${name}`, args);

  switch (name) {
    case 'search_evidence': {
      const { query, fileType } = args;
      let dbQuery = supabase
        .from('evidence')
        .select('id, file_path, metadata')
        .eq('case_id', caseId);

      if (fileType) {
        dbQuery = dbQuery.eq('file_type', fileType);
      }

      const { data, error } = await dbQuery;
      if (error) return { error: error.message };

      const matches = ((data as any[]) || []).filter(e => 
        JSON.stringify(e.metadata).toLowerCase().includes(query.toLowerCase())
      );

      return {
        count: matches.length,
        results: matches.slice(0, 5).map(m => ({
          id: m.id,
          path: m.file_path,
          summary: (m.metadata as any)?.summary || 'No summary available'
        }))
      };
    }

    case 'get_evidence_metadata': {
      const { evidenceId } = args;
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .eq('id', evidenceId)
        .single();

      if (error) return { error: error.message };
      return data;
    }

    default:
      return { error: `Tool ${name} not found` };
  }
}
