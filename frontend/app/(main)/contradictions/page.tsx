"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Link2, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCaseStore } from "@/store/use-case-store";
import { API_URL } from "@/lib/config";
import { Contradiction } from "@/../shared/types/database";

const severityColors: Record<Contradiction['severity'], string> = {
  low: 'border-l-blue-400 bg-blue-50/50',
  medium: 'border-l-yellow-500 bg-yellow-50/50',
  high: 'border-l-orange-500 bg-orange-50/50',
  critical: 'border-l-red-600 bg-red-50/50',
};

const severityLabels: Record<Contradiction['severity'], string> = {
  low: 'Minor Discrepancy',
  medium: 'Notable Inconsistency',
  high: 'Significant Conflict',
  critical: 'Critical Contradiction',
};

export default function ContradictionMap() {
  const { currentCase } = useCaseStore();

  const fetchContradictions = useCallback(async (): Promise<Contradiction[]> => {
    if (!currentCase?.id) return [];
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/contradictions/case/${currentCase.id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contradictions');
    }

    return response.json();
  }, [currentCase?.id]);

  const { data: contradictions = [], isLoading, error } = useQuery({
    queryKey: ['contradictions', currentCase?.id],
    queryFn: fetchContradictions,
    enabled: !!currentCase?.id,
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ocean/20" aria-label="Loading contradictions" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="w-16 h-16 text-red-500/40" aria-hidden="true" />
        <p className="text-ocean/60" role="alert">Failed to load contradictions. Please try again.</p>
      </div>
    );
  }

  return (
    <main className="space-y-8" role="main" aria-labelledby="page-title">
      <header>
        <h1 id="page-title" className="text-3xl font-serif font-bold text-ocean flex items-center gap-3">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          Contradiction Map
        </h1>
        <p className="text-ocean/60 mt-1">
          Cross-referenced inconsistencies detected across the evidence corpus.
        </p>
      </header>

      <section 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        aria-label="List of detected contradictions"
      >
        <AnimatePresence>
          {contradictions.map((item, idx) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`artifact-card p-8 relative overflow-hidden group hover:border-red-500/40 transition-all border-l-4 ${severityColors[item.severity]}`}
              aria-labelledby={`contradiction-${item.id}-title`}
            >
              {/* Connection Line Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all" aria-hidden="true" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle 
                    className={`w-4 h-4 ${
                      item.severity === 'critical' ? 'text-red-600' :
                      item.severity === 'high' ? 'text-orange-500' :
                      item.severity === 'medium' ? 'text-yellow-600' : 'text-blue-500'
                    }`} 
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ocean/60">
                    {severityLabels[item.severity]}
                  </span>
                </div>
                <span className="text-[10px] text-ocean/30 font-mono">
                  REF: {item.id.substring(0, 8)}
                </span>
              </div>

              <h2 
                id={`contradiction-${item.id}-title`}
                className="text-2xl font-serif font-bold text-ocean mb-4 leading-tight"
              >
                {item.description}
              </h2>

              <div className="space-y-4 relative mb-6" role="list" aria-label="Conflicting evidence">
                <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-beige/40" aria-hidden="true" />

                <div className="flex items-start gap-4 pl-10 relative" role="listitem">
                  <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-ocean border-2 border-cream" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold text-ocean/40 uppercase mb-1">Source Exhibit Alpha</p>
                    <p className="text-sm text-ocean/80 font-medium font-mono">{item.evidence_a_id.substring(0, 8)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pl-10 relative" role="listitem">
                  <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-cream" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold text-ocean/40 uppercase mb-1">Conflicting Exhibit Beta</p>
                    <p className="text-sm text-ocean/80 font-medium font-mono">{item.evidence_b_id.substring(0, 8)}</p>
                  </div>
                </div>
              </div>

              {item.timestamps && Object.keys(item.timestamps).length > 0 && (
                <footer className="pt-4 border-t border-beige/40 flex items-center justify-between text-[11px] text-ocean/50 italic">
                  <span>Temporal alignment mismatch detected</span>
                  <div className="flex items-center gap-1 font-mono not-italic text-ocean/30">
                    <Link2 className="w-3 h-3" aria-hidden="true" />
                    <span>SIG_VERIFIED</span>
                  </div>
                </footer>
              )}
            </motion.article>
          ))}
        </AnimatePresence>
      </section>

      {contradictions.length === 0 && (
        <div 
          className="py-20 text-center border-2 border-dashed border-beige/40 rounded-3xl bg-beige/5"
          role="status"
          aria-live="polite"
        >
          <Link2 className="w-16 h-16 text-ocean/5 mx-auto mb-6" aria-hidden="true" />
          <p className="text-xl font-serif text-ocean/40 italic">No logical contradictions detected in the current record.</p>
          <p className="text-sm text-ocean/30 mt-2">Deductive synthesis required to generate contradiction maps.</p>
        </div>
      )}
    </main>
  );
}
