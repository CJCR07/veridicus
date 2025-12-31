"use client";

import { useEffect, useRef } from "react";

interface VisualizerProps {
  isAnalyzing: boolean;
  intensity: number; // 0 to 1
}

export default function AudioVisualizer({ isAnalyzing, intensity }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    const bars = 40;
    const barWidth = 4;
    const barGap = 2;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      for (let i = 0; i < bars; i++) {
        const h = isAnalyzing 
          ? (Math.random() * 40 * intensity) + 5 
          : 2;
        
        ctx.fillStyle = isAnalyzing ? "#2C365A" : "#C4BCB0";
        ctx.fillRect(
          i * (barWidth + barGap),
          (rect.height - h) / 2,
          barWidth,
          h
        );
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isAnalyzing, intensity]);

  return (
    <div className="bg-beige/10 border border-beige/40 rounded-xl p-6 flex flex-col items-center justify-center gap-4">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={60} 
        className="w-full max-w-sm"
      />
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-ocean animate-pulse' : 'bg-beige'}`} />
        <span className="text-[10px] font-bold text-ocean/60 uppercase tracking-widest">
          {isAnalyzing ? "Bi-directional Stream Active" : "Waiting for Audio Input"}
        </span>
      </div>
    </div>
  );
}
