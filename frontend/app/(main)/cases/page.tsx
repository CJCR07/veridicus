"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, Search, Plus, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCaseStore } from "@/store/use-case-store";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { API_URL, DEV_BYPASS_AUTH } from "@/lib/config";
import { Case } from "@/../shared/types/database";

const supabase = createClient();

export default function CasesDashboard() {
  const { setCurrentCase } = useCaseStore();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const { data: cases, isLoading, refetch } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      // Dev bypass mode - skip auth for testing
      if (DEV_BYPASS_AUTH) {
        console.log('[CASES] ⚠️ DEV BYPASS MODE - Skipping auth');
        const response = await fetch(`${API_URL}/api/cases`);
        if (!response.ok) {
          throw new Error('Failed to fetch cases');
        }
        return response.json() as Promise<Case[]>;
      }

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

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const createCase = async () => {
    setIsCreating(true);
    try {
      // Dev bypass mode - skip auth for testing
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (!DEV_BYPASS_AUTH) {
        const { data: authData } = await supabase.auth.getSession();
        if (authData.session?.access_token) {
          headers['Authorization'] = `Bearer ${authData.session.access_token}`;
        }
      }

      const response = await fetch(`${API_URL}/api/cases`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          name: `Case-${Math.floor(Math.random() * 10000)}`,
          description: 'New forensic investigation dossier.'
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const headers: Record<string, string> = {};
      if (!DEV_BYPASS_AUTH) {
        const { data: authData } = await supabase.auth.getSession();
        if (authData.session?.access_token) {
          headers['Authorization'] = `Bearer ${authData.session.access_token}`;
        }
      }

      await fetch(`${API_URL}/api/cases/${deleteId}`, {
        method: 'DELETE',
        headers
      });
      await refetch();
    } catch (err) {
      console.error("Failed to delete case:", err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const selectCase = (caseItem: Case) => {
    setCurrentCase(caseItem);
    router.push('/vault');
  };

  if (isLoading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500/20" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-charcoal border border-red-500/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold text-alabaster mb-2">Purge Forensic Dossier?</h2>
              <p className="text-powder/40 text-sm mb-8">
                This action is irreversible. All evidence, analyses, and contradictions associated with this case will be permanently deleted from the workstation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-carbon/50 hover:bg-carbon text-powder/60 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-alabaster italic">Investigation Archive</h2>
          <p className="text-pacific mt-1 lowercase font-medium">High-level repository of all active forensic dossiers.</p>
        </div>
        <button 
          onClick={createCase}
          disabled={isCreating}
          className="bg-pacific text-carbon px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-pacific/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {isCreating ? 'Initializing...' : 'Open New Dossier'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!cases || cases.length === 0) ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-charcoal rounded-3xl bg-charcoal/10">
            <Search className="w-16 h-16 text-charcoal/40 mx-auto mb-6" />
            <p className="text-xl font-serif text-powder/40 italic">No forensic dossiers found in the current archive.</p>
            <p className="text-sm text-powder/20 mt-2 lowercase">Initialize a new investigation to begin processing evidence.</p>
          </div>
        ) : (
          cases.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ y: -4 }}
              className="bg-charcoal/20 border border-charcoal rounded-2xl p-6 cursor-pointer group hover:border-pacific/30 transition-all backdrop-blur-sm relative overflow-hidden"
              onClick={() => selectCase(c)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-charcoal/50 rounded-lg group-hover:bg-pacific/10 transition-colors">
                  <FileText className="w-6 h-6 text-pacific" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleDelete(e, c.id)}
                    className="p-1.5 text-powder/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                  <span className="text-[10px] font-bold text-powder/20 uppercase tracking-widest pt-1">
                    ID: {c.id.substring(0, 8)}
                  </span>
                </div>
              </div>
              
              <h3 className="text-xl font-serif font-bold text-alabaster mb-2 truncate">{c.name}</h3>
              <p className="text-sm text-powder/40 line-clamp-2 mb-6 h-10">
                {c.description || 'No specialized description provided for this forensic dossier.'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-charcoal">
                <div className="flex items-center gap-2 text-[11px] text-powder/40">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-powder/20 uppercase group-hover:text-pacific transition-colors">
                  Review <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          )))}
      </div>
    </div>
  );
}
