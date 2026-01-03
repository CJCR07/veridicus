"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Calendar, FileText, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCaseStore } from "@/store/use-case-store";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/lib/config";
import { Evidence, Analysis, AnalysisResult } from "@/../shared/types/database";

interface TimelineEvent {
  type: 'ingestion' | 'analysis';
  title: string;
  date: Date;
  id: string;
  severity: 'low' | 'medium' | 'high';
}

export default function AdaptiveTimeline() {
  const { currentCase } = useCaseStore();

  const fetchTimelineEvents = useCallback(async (): Promise<TimelineEvent[]> => {
    if (!currentCase?.id) return [];
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return [];

    // Fetch evidence and analyses via backend API
    const [evidenceRes, analysesRes] = await Promise.all([
      fetch(`${API_URL}/api/evidence/case/${currentCase.id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      }),
      fetch(`${API_URL}/api/analyses/case/${currentCase.id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
    ]);

    const evidenceData: Evidence[] = evidenceRes.ok ? await evidenceRes.json() : [];
    const analysisData: Analysis[] = analysesRes.ok ? await analysesRes.json() : [];

    const evidenceEvents: TimelineEvent[] = evidenceData.map(e => ({
      type: 'ingestion' as const,
      title: `Exhibit Ingested: ${e.file_path.split('/').pop()}`,
      date: new Date(e.created_at),
      id: e.id,
      severity: 'low' as const
    }));

    const analysisEvents: TimelineEvent[] = analysisData.map((a: Analysis) => {
      const result = a.result as AnalysisResult | null;
      return {
        type: 'analysis' as const,
        title: `Reasoning Cycle: "${a.query.substring(0, 40)}..."`,
        date: new Date(a.created_at),
        id: a.id,
        severity: (result?.contradictions?.length ?? 0) > 0 ? 'high' as const : 'medium' as const
      };
    });

    return [...evidenceEvents, ...analysisEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [currentCase?.id]);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['timeline', currentCase?.id],
    enabled: !!currentCase?.id,
    queryFn: fetchTimelineEvents,
  });

  if (!currentCase) {
    return (
      <div className="p-8 text-ocean/40 italic" role="status">
        Select a case to view timeline.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-ocean/40">
        <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading timeline" />
        Reconstructing timeline...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500/60" role="alert">
        Failed to load timeline. Please try again.
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto space-y-12 pb-20" role="main" aria-labelledby="page-title">
      <header>
        <h1 id="page-title" className="text-3xl font-serif font-bold text-ocean flex items-center gap-3">
          <Clock className="w-8 h-8" aria-hidden="true" />
          Adaptive Timeline
        </h1>
        <p className="text-ocean/60 mt-1">Chronological reconstruction of forensic ingestion and deductive cycles.</p>
      </header>

      <ol 
        className="relative border-l-2 border-beige/40 ml-4 space-y-8 pl-8"
        aria-label="Timeline events"
      >
        {events?.map((event, idx) => (
          <motion.li
            key={`${event.type}-${event.id}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div 
              className={`absolute -left-[41px] top-1 w-4 h-4 rounded-full border-2 border-cream shadow-sm ${
                event.type === 'ingestion' ? 'bg-blue-400' : 'bg-ocean'
              }`}
              aria-hidden="true"
            />

            <article className="artifact-card p-5" aria-labelledby={`event-${event.id}-title`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest flex items-center gap-1">
                  {event.type === 'ingestion' ? (
                    <FileText className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <Info className="w-3 h-3" aria-hidden="true" />
                  )}
                  {event.type}
                </span>
                <time 
                  dateTime={event.date.toISOString()}
                  className="text-[10px] text-ocean/60 flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  {event.date.toLocaleString()}
                </time>
              </div>
              
              <h2 id={`event-${event.id}-title`} className="text-lg font-serif font-bold text-ocean">
                {event.title}
              </h2>
              
              {event.type === 'analysis' && event.severity === 'high' && (
                <div 
                  className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-bold w-fit"
                  role="status"
                >
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  Anomalies detected in this cycle
                </div>
              )}

              {event.type === 'ingestion' && (
                <div 
                  className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold w-fit"
                  role="status"
                >
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  Audit log immutable record created
                </div>
              )}
            </article>
          </motion.li>
        ))}

        {(!events || events.length === 0) && (
          <li 
            className="py-20 text-center text-ocean/30 italic"
            role="status"
            aria-live="polite"
          >
            No events recorded in this investigation timeline.
          </li>
        )}
      </ol>
    </main>
  );
}
