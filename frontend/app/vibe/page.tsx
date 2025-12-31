"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Activity, ShieldCheck, BrainCircuit, MessageSquareText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AudioVisualizer from "@/components/audio-visualizer";

import { AudioStreamingService } from "@/lib/audio-streaming";
import { useCaseStore } from "@/store/use-case-store";
import { supabase } from "@/lib/supabase";

export default function VibeForensics() {
  const { currentCase } = useCaseStore();
  const [isRecording, setIsRecording] = useState(false);
  const [intensity, setIntensity] = useState(0.2);
  const [streamService, setStreamService] = useState<AudioStreamingService | null>(null);
  const [insights, setInsights] = useState<any[]>([
    { id: 1, type: "affect", text: "Neutral baseline established.", confidence: 0.98 },
  ]);

  useEffect(() => {
    const service = new AudioStreamingService((insight) => {
      setInsights(prev => [
        { id: Date.now(), ...insight },
        ...prev.slice(0, 49)
      ]);
      
      // Flash intensity for 500ms when highly confident insight arrives
      if (insight.confidence > 0.9) {
        setIntensity(0.8);
        setTimeout(() => setIntensity(0.2), 500);
      }
    });
    setStreamService(service);
    return () => {
      service.stop();
    };
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      streamService?.stop();
    } else {
      // Get auth token for WebSocket
      const { data: { session } } = await supabase.auth.getSession();
      await streamService?.start(currentCase?.id || 'default', session?.access_token);
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Left Column: Live Control */}
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-ocean">Vibe Forensics</h2>
          <p className="text-ocean/60 mt-1">Real-time affective reasoning and stress detection via Gemini Live.</p>
        </div>

        <AudioVisualizer isAnalyzing={isRecording} intensity={intensity} />

        <div className="flex justify-center">
          <button
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 scale-110' 
                : 'bg-ocean text-cream shadow-xl shadow-ocean/20'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { 
              label: "Stress Level", 
              value: isRecording ? (insights[0]?.confidence > 0.9 ? "High" : "Low") : "---", 
              icon: Activity,
              color: insights[0]?.confidence > 0.9 ? "text-red-500" : "text-ocean"
            },
            { label: "Truth Score", value: isRecording ? "92%" : "---", icon: ShieldCheck, color: "text-ocean" },
            { label: "Latency", value: isRecording ? "124ms" : "---", icon: BrainCircuit, color: "text-ocean" },
          ].map((metric) => (
            <div key={metric.label} className="artifact-card p-4 flex flex-col items-center text-center">
              <metric.icon className={`w-5 h-5 ${metric.color}/40 mb-2`} />
              <p className="text-[10px] font-bold text-ocean/40 uppercase tracking-widest">{metric.label}</p>
              <p className={`text-xl font-serif font-bold ${metric.color} uppercase`}>{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Real-time Transcript/Insights */}
      <div className="flex flex-col gap-4">
        <h3 className="font-serif font-bold text-ocean flex items-center gap-2">
          <MessageSquareText className="w-4 h-4" />
          Affective Insights
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {insights.map((insight) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={insight.id}
                className="artifact-card p-4 border-l-4 border-l-ocean"
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
                  "{insight.text}"
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {!isRecording && insights.length <= 1 && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-beige/10 rounded-xl border border-dashed border-beige/40">
              <Activity className="w-8 h-8 text-ocean/20 mb-3" />
              <p className="text-xs text-ocean/40 font-medium italic">Begin stream to populate real-time reasoning insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
