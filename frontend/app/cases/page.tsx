"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, Search, Plus, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCaseStore } from "@/store/use-case-store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { Case } from "@/../shared/types/database";

export default function CasesDashboard() {
  const { setCurrentCase } = useCaseStore();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const { data: cases, isLoading, refetch } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${API_URL}/api/cases`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      
      return response.json() as Promise<Case[]>;
    }
  });

  const createCase = async () => {
    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/api/cases`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          name: `Case-${Math.floor(Math.random() * 10000)}`,
          description: 'New forensic investigation.'
        })
      });
      if (response.ok) {
        await refetch();
      }
    } catch (err) {
      console.error("Failed to create case:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const selectCase = (caseItem: Case) => {
    setCurrentCase(caseItem);
    router.push('/vault');
  };

  if (isLoading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-ocean/20" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-ocean">Investigation Archive</h2>
          <p className="text-ocean/60 mt-1">High-level overview of all active and inactive forensic dossiers.</p>
        </div>
        <button 
          onClick={createCase}
          disabled={isCreating}
          className="bg-ocean text-cream px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-ocean/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {isCreating ? 'Initializing...' : 'Open New Dossier'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!cases || cases.length === 0) ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-beige/40 rounded-3xl bg-beige/5">
            <Search className="w-16 h-16 text-ocean/5 mx-auto mb-6" />
            <p className="text-xl font-serif text-ocean/40 italic">No forensic dossiers found in the current archive.</p>
            <p className="text-sm text-ocean/30 mt-2">Initialize a new investigation to begin processing evidence.</p>
          </div>
        ) : (
          cases.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ y: -4 }}
              className="artifact-card p-6 cursor-pointer group hover:border-ocean/40 transition-all"
              onClick={() => selectCase(c)}
            >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-beige/20 rounded-lg group-hover:bg-ocean/10 transition-colors">
                <FileText className="w-6 h-6 text-ocean" />
              </div>
              <span className="text-[10px] font-bold text-ocean/30 uppercase tracking-widest">
                ID: {c.id.substring(0, 8)}
              </span>
            </div>
            
            <h3 className="text-xl font-serif font-bold text-ocean mb-2">{c.name}</h3>
            <p className="text-sm text-ocean/60 line-clamp-2 mb-6">
              {c.description || 'No specialized description provided for this forensic dossier.'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-beige/40">
              <div className="flex items-center gap-2 text-[11px] text-ocean/40">
                <Calendar className="w-3 h-3" />
                {new Date(c.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-ocean/60 uppercase group-hover:text-ocean transition-colors">
                Initialize <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        )))}
      </div>
    </div>
  );
}
