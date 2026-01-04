"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Brain, Sparkles, Send, ShieldAlert, FileText, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCaseStore } from "@/store/use-case-store";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/lib/config";

interface Thought {
  role: 'user' | 'engine';
  text: string;
  trace?: string[];
  id: string;
}

export default function ReasoningEngine() {
  const { currentCase } = useCaseStore();
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [error, setError] = useState<string | null>(null);
  const thoughtsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new thoughts are added
  useEffect(() => {
    thoughtsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thoughts]);

  const handleReason = useCallback(async () => {
    if (!query.trim() || !currentCase) return;
    
    setIsThinking(true);
    setError(null);
    
    // Add user query to stream
    const userMessage: Thought = { role: "user", text: query, id: `user-${Date.now()}` };
    setThoughts(prev => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    
    try {
      const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
      let session = null;

      if (!DEV_BYPASS_AUTH) {
        const { data: authData } = await supabase.auth.getSession();
        session = authData.session;
        if (!session?.access_token) {
          throw new Error('Please sign in to use the reasoning engine');
        }
      }
      
      if (!session) {
        throw new Error('Authorization session lost. Please sign in again.');
      }
      
      const response = await fetch(`${API_URL}/api/analysis/query`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          caseId: currentCase.id,
          query: currentQuery
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Reasoning engine offline');
      }
      
      const data = await response.json();
      
      setThoughts(prev => [...prev, { 
        role: "engine", 
        text: data.result?.text || 'Analysis complete.',
        trace: data.thoughts || [],
        id: `engine-${Date.now()}`
      }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deductive synthesis failed';
      setError(errorMessage);
      setThoughts(prev => [...prev, { 
        role: "engine", 
        text: `Error: ${errorMessage}. Verify backend connectivity.`,
        id: `error-${Date.now()}`
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [query, currentCase]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReason();
    }
  }, [handleReason]);

  if (!currentCase) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8" role="status">
        <Brain className="w-16 h-16 text-ocean/20 mb-4" aria-hidden="true" />
        <p className="text-ocean/60 font-serif text-lg italic">Please select a case to begin reasoning.</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-full max-w-5xl mx-auto gap-8" role="main" aria-labelledby="page-title">
      <header>
        <h1 id="page-title" className="text-3xl font-serif font-bold text-ocean flex items-center gap-3">
          <Brain className="w-8 h-8" aria-hidden="true" />
          Reasoning Engine
        </h1>
        <p className="text-ocean/60 mt-1">Autonomous deductive synthesis powered by Gemini Thinking Mode.</p>
      </header>

      {/* Thought Stream */}
      <section 
        className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar" 
        aria-label="Conversation history"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {thoughts.map((thought) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${thought.role === 'user' ? 'justify-end' : ''}`}
              role="article"
              aria-label={thought.role === 'user' ? 'Your query' : 'Engine response'}
            >
              {thought.role === 'engine' && (
                <div className="w-8 h-8 rounded bg-ocean flex items-center justify-center shrink-0" aria-hidden="true">
                  <Brain className="w-4 h-4 text-cream" />
                </div>
              )}
              
              <div className={`p-4 rounded-xl max-w-[80%] ${
                thought.role === 'user' 
                  ? 'bg-ocean text-cream' 
                  : 'bg-beige/20 border border-beige/40 text-ocean'
              }`}>
                <p className="text-sm leading-relaxed">{thought.text}</p>
                
                {thought.trace && thought.trace.length > 0 && (
                  <details className="mt-4 pt-4 border-t border-beige/40">
                    <summary className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest mb-2 flex items-center gap-1 cursor-pointer hover:text-ocean/60">
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      Thought Trace ({thought.trace.length} steps)
                    </summary>
                    <ol className="space-y-1" aria-label="Reasoning steps">
                      {thought.trace.map((step: string, sIdx: number) => (
                        <li key={sIdx} className="flex items-center gap-2 text-[11px] text-ocean/60">
                          <ChevronRight className="w-2 h-2" aria-hidden="true" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <div className="flex gap-4" role="status" aria-live="polite">
            <div className="w-8 h-8 rounded bg-ocean flex items-center justify-center animate-pulse" aria-hidden="true">
              <Brain className="w-4 h-4 text-cream" />
            </div>
            <div className="p-4 bg-beige/10 border border-dashed border-beige/40 rounded-xl text-xs text-ocean/40 italic flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Engine is synthesizing forensic data...
            </div>
          </div>
        )}

        {thoughts.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20" aria-hidden="true">
            <ShieldAlert className="w-16 h-16 mb-4" />
            <p className="font-serif text-xl italic">Ready for deductive inquiry.</p>
          </div>
        )}
        
        <div ref={thoughtsEndRef} />
      </section>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={(e) => { e.preventDefault(); handleReason(); }} className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2" aria-hidden="true">
          <div className="p-1 text-ocean/40">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <label htmlFor="query-input" className="sr-only">Enter forensic hypothesis or query</label>
        <textarea
          id="query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter forensic hypothesis or query..."
          className="w-full bg-cream border-2 border-beige/40 rounded-2xl py-4 pl-12 pr-16 text-ocean placeholder:text-ocean/20 focus:border-ocean focus:ring-2 focus:ring-ocean/20 outline-none transition-all resize-none min-h-[60px]"
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          aria-describedby="query-hint"
        />
        <p id="query-hint" className="sr-only">Press Enter to submit, Shift+Enter for new line</p>
        <button 
          type="submit"
          disabled={!query.trim() || isThinking}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-ocean text-cream rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-20 focus:ring-2 focus:ring-ocean/40"
          aria-label="Submit query"
        >
          {isThinking ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </form>
    </main>
  );
}
