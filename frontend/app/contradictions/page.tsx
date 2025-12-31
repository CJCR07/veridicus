"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Link2, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCaseStore } from "@/store/use-case-store";

interface Contradiction {
  id: string;
  evidence_a_id: string;
  evidence_b_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamps: Record<string, string>;
  created_at: string;
}

const severityColors = {
  low: 'border-l-blue-400 bg-blue-50/50',
  medium: 'border-l-yellow-500 bg-yellow-50/50',
  high: 'border-l-orange-500 bg-orange-50/50',
  critical: 'border-l-red-600 bg-red-50/50',
};

const severityLabels = {
  low: 'Minor Discrepancy',
  medium: 'Notable Inconsistency',
  high: 'Significant Conflict',
  critical: 'Critical Contradiction',
};

export default function ContradictionMap() {
  const { currentCase } = useCaseStore();
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContradictions() {
      if (!currentCase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('contradictions')
        .select('*')
        .eq('case_id', currentCase.id)
        .order('created_at', { ascending: false });

      if (data) setContradictions(data as Contradiction[]);
      setLoading(false);
    }
    fetchContradictions();
  }, [currentCase]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ocean/20" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-ocean flex items-center gap-3">
          <ShieldAlert className="w-8 h-8" />
          Contradiction Map
        </h2>
        <p className="text-ocean/60 mt-1">
          Cross-referenced inconsistencies detected across the evidence corpus.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {contradictions.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`artifact-card p-8 relative overflow-hidden group hover:border-red-500/40 transition-all border-l-4 ${severityColors[item.severity]}`}
            >
              {/* Connection Line Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    item.severity === 'critical' ? 'text-red-600' :
                    item.severity === 'high' ? 'text-orange-500' :
                    item.severity === 'medium' ? 'text-yellow-600' : 'text-blue-500'
                  }`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ocean/60">
                    {severityLabels[item.severity]}
                  </span>
                </div>
                <span className="text-[10px] text-ocean/30 font-mono">
                  REF: {item.id.substring(0, 8)}
                </span>
              </div>

              <h3 className="text-2xl font-serif font-bold text-ocean mb-4 leading-tight">
                {item.description}
              </h3>

              <div className="space-y-4 relative mb-6">
                <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-beige/40" />

                <div className="flex items-start gap-4 pl-10 relative">
                  <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-ocean border-2 border-cream" />
                  <div>
                    <p className="text-[10px] font-bold text-ocean/40 uppercase mb-1">Source Exhibit Alpha</p>
                    <p className="text-sm text-ocean/80 font-medium font-mono">{item.evidence_a_id.substring(0, 8)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pl-10 relative">
                  <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-cream" />
                  <div>
                    <p className="text-[10px] font-bold text-ocean/40 uppercase mb-1">Conflicting Exhibit Beta</p>
                    <p className="text-sm text-ocean/80 font-medium font-mono">{item.evidence_b_id.substring(0, 8)}</p>
                  </div>
                </div>
              </div>

              {item.timestamps && (
                <div className="pt-4 border-t border-beige/40 flex items-center justify-between text-[11px] text-ocean/50 italic">
                  <span>Temporal alignment mismatch detected</span>
                  <div className="flex items-center gap-1 font-mono not-italic text-ocean/30">
                    <Link2 className="w-3 h-3" />
                    SIG_VERIFIED
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {contradictions.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-beige/40 rounded-3xl bg-beige/5">
          <Link2 className="w-16 h-16 text-ocean/5 mx-auto mb-6" />
          <p className="text-xl font-serif text-ocean/40 italic">No logical contradictions detected in the current record.</p>
          <p className="text-sm text-ocean/30 mt-2">Deductive synthesis required to generate contradiction maps.</p>
        </div>
      )}
    </div>
  );
}
