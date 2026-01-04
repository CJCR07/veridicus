"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Activity, ShieldCheck, BrainCircuit, MessageSquareText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AudioVisualizer from "@/components/audio-visualizer";

import { AudioStreamingService, VibeInsight } from "@/lib/audio-streaming";
import { useCaseStore } from "@/store/use-case-store";
import { supabase } from "@/lib/supabase";

interface InsightWithId extends VibeInsight {
  id: number;
}

export default function VibeForensics() {
  const { currentCase } = useCaseStore();
  const [isRecording, setIsRecording] = useState(false);
  const [intensity, setIntensity] = useState(0.2);
  const [error, setError] = useState<string | null>(null);
  const streamServiceRef = useRef<AudioStreamingService | null>(null);
  const [insights, setInsights] = useState<InsightWithId[]>([
    { id: 1, type: "affect", text: "Neutral baseline established.", confidence: 0.98 },
  ]);

  const handleInsight = useCallback((insight: VibeInsight) => {
    if (insight.type === 'error') {
      setError(insight.text);
      return;
    }
    
    setError(null);
    setInsights(prev => [
      { id: Date.now(), ...insight },
      ...prev.slice(0, 49)
    ]);
    
    // Flash intensity for 500ms when highly confident insight arrives
    if (insight.confidence > 0.9) {
      setIntensity(0.8);
      setTimeout(() => setIntensity(0.2), 500);
    }
  }, []);

  useEffect(() => {
    const service = new AudioStreamingService(handleInsight);
    streamServiceRef.current = service;
    
    return () => {
      service.stop();
    };
  }, [handleInsight]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      streamServiceRef.current?.stop();
      setIsRecording(false);
    } else {
      setError(null);
      // Get auth token for WebSocket
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          await streamServiceRef.current?.start(currentCase?.id || 'default', session.access_token);
          setIsRecording(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to start recording');
        }
      } else {
        setError('Please sign in to use Vibe Forensics');
      }
    }
  }, [isRecording, currentCase?.id]);

  // Calculate metrics from insights
  const latestInsight = insights[0];
  const stressLevel = isRecording 
    ? (latestInsight?.indicator === 'stress' || latestInsight?.indicator === 'anxiety' ? 'High' : 'Low')
    : '---';
  const truthScore = isRecording 
    ? `${Math.round((1 - (latestInsight?.indicator === 'deception' ? 0.15 : 0)) * 100)}%`
    : '---';

  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full" role="main" aria-labelledby="page-title">
      {/* Left Column: Live Control */}
      <section className="lg:col-span-2 space-y-8" aria-label="Audio analysis controls">
        <header>
          <h1 id="page-title" className="text-3xl font-serif font-bold text-ocean">Vibe Forensics</h1>
          <p className="text-ocean/60 mt-1">Real-time affective reasoning and stress detection via Gemini Live.</p>
        </header>

        <AudioVisualizer isAnalyzing={isRecording} intensity={intensity} />

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-4 ${
              isRecording 
                ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 scale-110 focus:ring-red-500/40' 
                : 'bg-ocean text-cream shadow-xl shadow-ocean/20 focus:ring-ocean/40'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            aria-pressed={isRecording}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8" aria-hidden="true" />
            ) : (
              <Mic className="w-8 h-8" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-3 gap-4" role="group" aria-label="Live analysis metrics">
          <article className="artifact-card p-4 flex flex-col items-center text-center">
            <Activity 
              className={`w-5 h-5 mb-2 ${stressLevel === 'High' ? 'text-red-500' : 'text-ocean/40'}`} 
              aria-hidden="true" 
            />
            <p className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest">Stress Level</p>
            <p 
              className={`text-xl font-serif font-bold uppercase ${stressLevel === 'High' ? 'text-red-500' : 'text-ocean'}`}
              aria-live="polite"
            >
              {stressLevel}
            </p>
          </article>
          
          <article className="artifact-card p-4 flex flex-col items-center text-center">
            <ShieldCheck className="w-5 h-5 text-ocean/40 mb-2" aria-hidden="true" />
            <p className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest">Truth Score</p>
            <p className="text-xl font-serif font-bold text-ocean uppercase" aria-live="polite">{truthScore}</p>
          </article>
          
          <article className="artifact-card p-4 flex flex-col items-center text-center">
            <BrainCircuit className="w-5 h-5 text-ocean/40 mb-2" aria-hidden="true" />
            <p className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest">Status</p>
            <p className="text-xl font-serif font-bold text-ocean uppercase" aria-live="polite">
              {isRecording ? 'Active' : '---'}
            </p>
          </article>
        </div>
      </section>

      {/* Right Column: Real-time Transcript/Insights */}
      <aside className="flex flex-col gap-4" aria-label="Affective insights panel">
        <h2 className="font-serif font-bold text-ocean flex items-center gap-2">
          <MessageSquareText className="w-4 h-4" aria-hidden="true" />
          Affective Insights
        </h2>
        
        <div 
          className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar" 
          role="log" 
          aria-live="polite"
          aria-atomic="false"
        >
          <AnimatePresence initial={false}>
            {insights.map((insight) => (
              <motion.article
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={insight.id}
                className="artifact-card p-4 border-l-4 border-l-ocean"
                aria-label={`${insight.type === 'affect' ? 'Sentiment analysis' : 'Engine state'}: ${insight.text}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-bold text-ocean/40 uppercase tracking-tighter">
                    {insight.type === 'affect' ? 'Sentiment Analysis' : 'Engine State'}
                  </span>
                  <span className="text-[8px] font-bold text-ocean/60 uppercase">
                    {(insight.confidence * 100).toFixed(0)}% Conf.
                  </span>
                </div>
                <p className="text-sm text-ocean font-medium leading-relaxed italic">
                  &quot;{insight.text}&quot;
                </p>
                {insight.indicator && (
                  <span className={`inline-block mt-2 text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
                    insight.indicator === 'stress' || insight.indicator === 'deception' 
                      ? 'bg-red-100 text-red-600' 
                      : insight.indicator === 'anxiety' || insight.indicator === 'cognitive_load'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-600'
                  }`}>
                    {insight.indicator.replace('_', ' ')}
                  </span>
                )}
              </motion.article>
            ))}
          </AnimatePresence>
          
          {!isRecording && insights.length <= 1 && (
            <div 
              className="h-64 flex flex-col items-center justify-center text-center p-8 bg-beige/10 rounded-xl border border-dashed border-beige/40"
              role="status"
            >
              <Activity className="w-8 h-8 text-ocean/20 mb-3" aria-hidden="true" />
              <p className="text-xs text-ocean/40 font-medium italic">
                Begin stream to populate real-time reasoning insights.
              </p>
            </div>
          )}
        </div>
      </aside>
    </main>
  );
}
