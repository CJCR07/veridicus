"use client";

import { useState } from "react";
import { Brain, Sparkles, Send, ShieldAlert, FileText, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCaseStore } from "@/store/use-case-store";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/lib/config";

export default function ReasoningEngine() {
  const { currentCase } = useCaseStore();
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thoughts, setThoughts] = useState<any[]>([]);

  const handleReason = async () => {
    if (!query || !currentCase) return;
    setIsThinking(true);
    
    // Add user query to stream
    const userMessage = { role: "user", text: query };
    setThoughts(prev => [...prev, userMessage]);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_URL}/api/analysis/query`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          caseId: currentCase.id,
          query: query
        })
      });

      if (!response.ok) throw new Error('Reasoning engine offline');
      
      const data = await response.json();
      
      setThoughts(prev => [...prev, { 
        role: "engine", 
        text: data.result.text,
        trace: data.thoughts || []
      }]);
    } catch (err) {
      setThoughts(prev => [...prev, { 
        role: "engine", 
        text: "Error: Deductive synthesis failed. Verify backend connectivity." 
      }]);
    } finally {
      setIsThinking(false);
      setQuery("");
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto gap-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-ocean flex items-center gap-3">
          <Brain className="w-8 h-8" />
          Reasoning Engine
        </h2>
        <p className="text-ocean/60 mt-1">Autonomous deductive synthesis powered by Gemini Thinking Mode.</p>
      </div>

      {/* Thought Stream */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
        <AnimatePresence>
          {thoughts.map((thought, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${thought.role === 'user' ? 'justify-end' : ''}`}
            >
              {thought.role === 'engine' && (
                <div className="w-8 h-8 rounded bg-ocean flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 text-cream" />
                </div>
              )}
              
              <div className={`p-4 rounded-xl max-w-[80%] ${
                thought.role === 'user' 
                  ? 'bg-ocean text-cream' 
                  : 'bg-beige/20 border border-beige/40 text-ocean'
              }`}>
                <p className="text-sm leading-relaxed">{thought.text}</p>
                
                {thought.trace && (
                  <div className="mt-4 pt-4 border-t border-beige/40">
                    <p className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Thought Trace
                    </p>
                    <div className="space-y-1">
                      {thought.trace.map((step: string, sIdx: number) => (
                        <div key={sIdx} className="flex items-center gap-2 text-[11px] text-ocean/60">
                          <ChevronRight className="w-2 h-2" />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded bg-ocean flex items-center justify-center animate-pulse">
              <Brain className="w-4 h-4 text-cream" />
            </div>
            <div className="p-4 bg-beige/10 border border-dashed border-beige/40 rounded-xl text-xs text-ocean/40 italic flex items-center gap-3">
              <span className="animate-bounce">...</span> 
              Engine is synthesizing forensic data...
            </div>
          </div>
        )}

        {thoughts.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
            <ShieldAlert className="w-16 h-16 mb-4" />
            <p className="font-serif text-xl italic">Ready for deductive inquiry.</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
          <button className="p-1 hover:bg-beige/20 rounded text-ocean/40 transition-colors">
            <FileText className="w-4 h-4" />
          </button>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter forensic hypothesis or query..."
          className="w-full bg-cream border-2 border-beige/40 rounded-2xl py-4 pl-12 pr-16 text-ocean placeholder:text-ocean/20 focus:border-ocean outline-none transition-all resize-none min-h-[60px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleReason();
            }
          }}
        />
        <button 
          onClick={handleReason}
          disabled={!query || isThinking}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-ocean text-cream rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
