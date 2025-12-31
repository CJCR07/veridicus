"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Calendar, FileText, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useCaseStore } from "@/store/use-case-store";
import { supabase } from "@/lib/supabase";

export default function AdaptiveTimeline() {
  const { currentCase } = useCaseStore();

  const { data: events, isLoading } = useQuery({
    queryKey: ['timeline', currentCase?.id],
    enabled: !!currentCase,
    queryFn: async () => {
      if (!currentCase?.id) return [];
      
      const [evidenceRes, analysisRes] = await Promise.all([
        supabase.from('evidence').select('*').eq('case_id', currentCase.id),
        supabase.from('analyses').select('*').eq('case_id', currentCase.id)
      ]);

      const evidenceEvents = ((evidenceRes.data || []) as any[]).map(e => ({
        type: 'ingestion',
        title: `Exhibit Ingested: ${e.file_path.split('/').pop()}`,
        date: new Date(e.created_at),
        id: e.id,
        severity: 'low'
      }));

      const analysisEvents = ((analysisRes.data || []) as any[]).map(a => ({
        type: 'analysis',
        title: `Reasoning Cycle: "${a.query.substring(0, 40)}..."`,
        date: new Date(a.created_at),
        id: a.id,
        severity: (a as any).result?.contradictions?.length > 0 ? 'high' : 'medium'
      }));

      return [...evidenceEvents, ...analysisEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
    }
  });

  if (!currentCase) return <div className="p-8 text-ocean/40 italic">Select a case to view timeline.</div>;
  if (isLoading) return <div className="p-8 text-ocean/40">Reconstructing timeline...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div>
        <h2 className="text-3xl font-serif font-bold text-ocean flex items-center gap-3">
          <Clock className="w-8 h-8" />
          Adaptive Timeline
        </h2>
        <p className="text-ocean/60 mt-1">Chronological reconstruction of forensic ingestion and deductive cycles.</p>
      </div>

      <div className="relative border-l-2 border-beige/40 ml-4 space-y-8 pl-8">
        {events?.map((event, idx) => (
          <motion.div
            key={`${event.type}-${event.id}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] top-1 w-4 h-4 rounded-full border-2 border-cream shadow-sm ${
              event.type === 'ingestion' ? 'bg-blue-400' : 'bg-ocean'
            }`} />

            <div className="artifact-card p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest flex items-center gap-1">
                  {event.type === 'ingestion' ? <FileText className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                  {event.type}
                </span>
                <span className="text-[10px] text-ocean/60 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {event.date.toLocaleString()}
                </span>
              </div>
              
              <h4 className="text-lg font-serif font-bold text-ocean">{event.title}</h4>
              
              {event.type === 'analysis' && event.severity === 'high' && (
                <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-bold w-fit">
                  <AlertCircle className="w-3 h-3" />
                  Anomalies detected in this cycle
                </div>
              )}

              {event.type === 'ingestion' && (
                <div className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold w-fit">
                  <CheckCircle2 className="w-3 h-3" />
                  Audit log immutable record created
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {(!events || events.length === 0) && (
          <div className="py-20 text-center text-ocean/30 italic">
            No events recorded in this investigation timeline.
          </div>
        )}
      </div>
    </div>
  );
}
