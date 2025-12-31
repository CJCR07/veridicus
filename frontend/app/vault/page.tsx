"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, FileVideo, FileAudio, Archive, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCaseStore } from "@/store/use-case-store";
import { Case, Evidence } from "@/../shared/types/database";
import { API_URL } from "@/lib/config";

export default function EvidenceVault() {
  const { currentCase, setCurrentCase } = useCaseStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [newCaseName, setNewCaseName] = useState("");

  // 1. Fetch Cases
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: casesData } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
      if (casesData) {
        setCases(casesData);
        if (casesData.length > 0 && !currentCase) {
          setCurrentCase(casesData[0] as any);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const fetchEvidence = async () => {
    if (currentCase) {
      const { data } = await supabase.from('evidence').select('*').eq('case_id', currentCase?.id as string).order('created_at', { ascending: false });
      if (data) setEvidence(data);
    }
  };

  const handleProcess = async (evidenceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_URL}/api/evidence/${evidenceId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      fetchEvidence();
    } catch (err) {
      console.error("Process trigger failed", err);
    }
  };

  // 2. Fetch Evidence for active case
  useEffect(() => {
    fetchEvidence();
  }, [currentCase]);

  // 3. Create Case
  const handleCreateCase = async () => {
    if (!newCaseName) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { data, error } = await supabase.from('cases').insert({ 
      name: newCaseName,
      user_id: userData.user.id
    } as any).select().single();

    if (data) {
      setCases([data, ...cases]);
      setCurrentCase(data);
      setNewCaseName("");
      setIsNewCaseModalOpen(false);
    }
  };

  // 4. Handle Upload
  const onDrop = async (acceptedFiles: File[]) => {
    if (!currentCase) return;

    for (const file of acceptedFiles) {
      const filePath = `cases/${currentCase.id}/${Date.now()}_${file.name}`;
      
      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);

      if (!uploadError) {
        // Create DB record
        const { data } = await supabase.from('evidence').insert({
          case_id: currentCase.id,
          file_path: filePath,
          file_type: file.type.split('/')[0],
          mime_type: file.type,
          metadata: { size: file.size, originalName: file.name }
        } as any).select().single();

        if (data) setEvidence([data, ...evidence]);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-ocean/20" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-ocean">Evidence Vault</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest">Active Corpus</span>
            <select 
              value={currentCase?.id || ''} 
              onChange={(e) => setCurrentCase(cases.find(c => c.id === e.target.value) as any || null)}
              className="bg-beige/20 border border-beige/40 px-3 py-1 rounded text-xs text-ocean font-bold outline-none"
            >
              {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button 
              onClick={() => setIsNewCaseModalOpen(true)}
              className="p-1.5 bg-ocean text-cream rounded-full hover:bg-ocean/90 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* New Case Modal Placeholder (Simple Overlay) */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 bg-ocean/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cream p-8 rounded-xl border border-beige shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-serif font-bold text-ocean mb-4">Initialize Investigation</h3>
            <input 
              autoFocus
              className="w-full bg-beige/10 border border-beige p-3 rounded-lg outline-none text-ocean font-medium focus:border-ocean transition-colors"
              placeholder="e.g., Project Bluebeam Forensics"
              value={newCaseName}
              onChange={(e) => setNewCaseName(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsNewCaseModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-ocean/60 hover:text-ocean"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCase}
                className="px-6 py-2 bg-ocean text-cream rounded-lg text-sm font-bold shadow-lg hover:shadow-ocean/20 transition-all"
              >
                Create Corpus
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
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-full bg-beige/30 flex items-center justify-center">
          <Upload className="w-8 h-8 text-ocean/60" />
        </div>
        <div className="text-center">
          <p className="font-bold text-ocean">Drop raw evidence here</p>
          <p className="text-xs text-ocean/60 mt-1">PDF, MP4, MP3, PNG (Up to 500MB per file)</p>
        </div>
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {evidence.map((item) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
              className="artifact-card p-5 group flex flex-col relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-beige/40 flex items-center justify-center">
                  {item.file_type === 'video' ? <FileVideo className="w-5 h-5 text-ocean" /> : 
                   item.file_type === 'audio' ? <FileAudio className="w-5 h-5 text-ocean" /> : 
                   <FileText className="w-5 h-5 text-ocean" />}
                </div>
              </div>

              <h3 className="font-bold text-ocean truncate mb-1">
                {(item.metadata as any)?.originalName || item.file_path.split('/').pop()}
              </h3>
              <p className="text-xs text-ocean/60 font-medium">Exhibit ID: {item.id.substring(0, 8)}</p>

              <div className="mt-3 flex-grow">
                {(item.metadata as any)?.processed ? (
                  <div className="bg-ocean/5 p-3 rounded-lg border border-ocean/10">
                    <p className="text-[10px] uppercase font-bold text-ocean/40 mb-1">Forensic Intelligence</p>
                    <p className="text-[11px] text-ocean/80 line-clamp-2 leading-relaxed italic">
                      "{(item.metadata as any)?.forensic?.summary || 'No summary available.'}"
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-beige py-2 px-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="uppercase tracking-widest">Awaiting Semantic Extraction...</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-beige/40 flex items-center justify-between">
                <span className="text-[10px] text-ocean/40 font-bold uppercase">
                  {(item.metadata as any)?.processed ? 'Intelligence Ready' : 'Raw Exhibit'}
                </span>
                <button 
                  onClick={() => handleProcess(item.id)}
                  className="text-[10px] font-bold text-ocean hover:underline uppercase tracking-tighter"
                >
                  {(item.metadata as any)?.processed ? 'Reprocess' : 'Process Now'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {evidence.length === 0 && (
        <div className="text-center py-20 border border-beige/40 rounded-xl bg-beige/10">
          <Archive className="w-12 h-12 text-ocean/20 mx-auto mb-4" />
          <p className="text-ocean/40 font-medium">No active exhibits in current corpus</p>
        </div>
      )}
    </div>
  );
}
