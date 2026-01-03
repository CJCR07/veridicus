"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, FileVideo, FileAudio, Archive, Plus, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCaseStore } from "@/store/use-case-store";
import { Case, Evidence, EvidenceMetadata } from "@/../shared/types/database";
import { API_URL } from "@/lib/config";

export default function EvidenceVault() {
  const { currentCase, setCurrentCase } = useCaseStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [newCaseName, setNewCaseName] = useState("");
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Memoized fetch evidence function to use in useEffect
  const fetchEvidence = useCallback(async (caseId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`${API_URL}/api/evidence/case/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch evidence');
      }

      const data = await response.json() as Evidence[];
      setEvidence(data);
    } catch (err) {
      console.error("Failed to fetch evidence:", err);
    }
  }, []);

  // 1. Fetch Cases via Backend API
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (isMounted) setError("Please sign in to access the Evidence Vault.");
          return;
        }

        const response = await fetch(`${API_URL}/api/cases`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cases');
        }

        const casesData = await response.json() as Case[];
        if (isMounted) {
          setCases(casesData);
          if (casesData.length > 0 && !currentCase) {
            setCurrentCase(casesData[0]);
          }
        }
      } catch (err) {
        console.error("Fetch cases failed:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dossiers.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [currentCase, setCurrentCase]);

  // 2. Fetch Evidence for active case
  useEffect(() => {
    if (currentCase?.id) {
      fetchEvidence(currentCase.id);
    } else {
      setEvidence([]);
    }
  }, [currentCase?.id, fetchEvidence]);

  const handleProcess = useCallback(async (evidenceId: string) => {
    setProcessingIds(prev => new Set(prev).add(evidenceId));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_URL}/api/evidence/${evidenceId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (currentCase?.id) {
        await fetchEvidence(currentCase.id);
      }
    } catch (err) {
      console.error("Process trigger failed", err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(evidenceId);
        return next;
      });
    }
  }, [currentCase?.id, fetchEvidence]);

  // 3. Create Case via Backend API
  const handleCreateCase = useCallback(async () => {
    if (!newCaseName || isCreatingCase) return;
    setIsCreatingCase(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`${API_URL}/api/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          name: newCaseName,
          description: 'New forensic investigation.'
        })
      });

      if (!response.ok) throw new Error('Failed to create case');

      const data = await response.json() as Case;
      setCases(prev => [data, ...prev]);
      setCurrentCase(data);
      setNewCaseName("");
      setIsNewCaseModalOpen(false);
    } catch (err) {
      console.error("Failed to create case:", err);
    } finally {
      setIsCreatingCase(false);
    }
  }, [newCaseName, isCreatingCase, setCurrentCase]);

  // 4. Handle Upload via Backend API
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!currentCase) return;

    for (const file of acceptedFiles) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/api/evidence/upload?caseId=${currentCase.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json() as Evidence;
        setEvidence(prev => [data, ...prev]);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  }, [currentCase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCaseSelect = useCallback((caseId: string) => {
    const selected = cases.find(c => c.id === caseId);
    setCurrentCase(selected || null);
  }, [cases, setCurrentCase]);

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-ocean/20" aria-label="Loading vault" />
    </div>
  );

  if (error) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-center p-8" role="alert">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
        <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-serif font-bold text-ocean">Investigation Interrupted</h2>
      <p className="text-ocean/60 max-w-md">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-2 bg-ocean text-cream rounded-lg font-bold hover:opacity-90 transition-all"
      >
        Retry Initialization
      </button>
    </div>
  );

  return (
    <main className="space-y-8" role="main" aria-labelledby="page-title">
      <header className="flex items-center justify-between">
        <div>
          <h1 id="page-title" className="text-3xl font-serif font-bold text-ocean">Evidence Vault</h1>
          <div className="flex items-center gap-2 mt-2">
            <label htmlFor="case-select" className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest">
              Active Corpus
            </label>
            <select 
              id="case-select"
              value={currentCase?.id || ''} 
              onChange={(e) => handleCaseSelect(e.target.value)}
              className="bg-beige/20 border border-beige/40 px-3 py-1 rounded text-xs text-ocean font-bold outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              aria-label="Select active case"
            >
              {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button 
              onClick={() => setIsNewCaseModalOpen(true)}
              className="p-1.5 bg-ocean text-cream rounded-full hover:bg-ocean/90 transition-colors focus:ring-2 focus:ring-ocean/40"
              aria-label="Create new case"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* New Case Modal */}
      {isNewCaseModalOpen && (
        <div 
          className="fixed inset-0 bg-ocean/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-cream p-8 rounded-xl border border-beige shadow-2xl w-full max-w-md">
            <h2 id="modal-title" className="text-xl font-serif font-bold text-ocean mb-4">
              Initialize Investigation
            </h2>
            <label htmlFor="case-name" className="sr-only">Case name</label>
            <input 
              id="case-name"
              autoFocus
              className="w-full bg-beige/10 border border-beige p-3 rounded-lg outline-none text-ocean font-medium focus:border-ocean focus:ring-2 focus:ring-ocean/20 transition-colors"
              placeholder="e.g., Project Bluebeam Forensics"
              value={newCaseName}
              onChange={(e) => setNewCaseName(e.target.value)}
              disabled={isCreatingCase}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCaseName) {
                  handleCreateCase();
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsNewCaseModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-ocean/60 hover:text-ocean"
                disabled={isCreatingCase}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCase}
                disabled={isCreatingCase || !newCaseName}
                className="px-6 py-2 bg-ocean text-cream rounded-lg text-sm font-bold shadow-lg hover:shadow-ocean/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isCreatingCase && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {isCreatingCase ? 'Creating...' : 'Create Corpus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4
          ${isDragActive ? 'border-ocean bg-ocean/5 bg-opacity-10 scale-[1.01]' : 'border-beige hover:border-ocean/40'}`}
        role="button"
        aria-label="Drop files here or click to upload evidence"
        tabIndex={0}
      >
        <input {...getInputProps()} aria-label="File upload" />
        <div className="w-16 h-16 rounded-full bg-beige/30 flex items-center justify-center" aria-hidden="true">
          <Upload className="w-8 h-8 text-ocean/60" />
        </div>
        <div className="text-center">
          <p className="font-bold text-ocean">Drop raw evidence here</p>
          <p className="text-xs text-ocean/60 mt-1">PDF, MP4, MP3, PNG (Up to 500MB per file)</p>
        </div>
      </div>

      {/* Evidence Grid */}
      <section aria-label="Evidence items">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {evidence.map((item) => (
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="artifact-card p-5 group flex flex-col relative overflow-hidden"
                aria-labelledby={`evidence-${item.id}-title`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-beige/40 flex items-center justify-center" aria-hidden="true">
                    {item.file_type === 'video' ? <FileVideo className="w-5 h-5 text-ocean" /> : 
                     item.file_type === 'audio' ? <FileAudio className="w-5 h-5 text-ocean" /> : 
                     <FileText className="w-5 h-5 text-ocean" />}
                  </div>
                </div>

                {(() => {
                  const metadata = item.metadata as EvidenceMetadata;
                  return (
                    <>
                      <h3 id={`evidence-${item.id}-title`} className="font-bold text-ocean truncate mb-1">
                        {metadata?.originalName || item.file_path.split('/').pop()}
                      </h3>
                      <p className="text-xs text-ocean/60 font-medium">Exhibit ID: {item.id.substring(0, 8)}</p>

                      <div className="mt-3 flex-grow">
                        {metadata?.processed ? (
                          <div className="bg-ocean/5 p-3 rounded-lg border border-ocean/10">
                            <p className="text-[10px] uppercase font-bold text-ocean/40 mb-1">Forensic Intelligence</p>
                            <p className="text-[11px] text-ocean/80 line-clamp-2 leading-relaxed italic">
                              &quot;{metadata?.forensic?.summary || 'No summary available.'}&quot;
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-beige py-2 px-1" role="status">
                            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            <span className="uppercase tracking-widest">Awaiting Semantic Extraction...</span>
                          </div>
                        )}
                      </div>

                      <footer className="mt-4 pt-4 border-t border-beige/40 flex items-center justify-between">
                        <span className="text-[10px] text-ocean/40 font-bold uppercase">
                          {metadata?.processed ? 'Intelligence Ready' : 'Raw Exhibit'}
                        </span>
                        <button 
                          onClick={() => handleProcess(item.id)}
                          disabled={processingIds.has(item.id)}
                          className="text-[10px] font-bold text-ocean hover:underline uppercase tracking-tighter flex items-center gap-1 disabled:no-underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ocean/40 rounded px-1"
                          aria-label={`${metadata?.processed ? 'Reprocess' : 'Process'} ${metadata?.originalName || 'evidence'}`}
                        >
                          {processingIds.has(item.id) && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
                          {processingIds.has(item.id) ? 'Extracting...' : (metadata?.processed ? 'Reprocess' : 'Process Now')}
                        </button>
                      </footer>
                    </>
                  );
                })()}
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </section>
      
      {evidence.length === 0 && (
        <div 
          className="text-center py-20 border border-beige/40 rounded-xl bg-beige/10"
          role="status"
          aria-live="polite"
        >
          <Archive className="w-12 h-12 text-ocean/20 mx-auto mb-4" aria-hidden="true" />
          <p className="text-ocean/40 font-medium">No active exhibits in current corpus</p>
        </div>
      )}
    </main>
  );
}
