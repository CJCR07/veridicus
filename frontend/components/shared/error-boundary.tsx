"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RotateCcw, Home } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRASH] Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-slate-900/50 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl"
          >
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="text-red-500 w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-100 mb-2">System Failure</h1>
            <p className="text-slate-400 mb-8 lowercase">
              The reasoning engine encountered a critical inconsistency.
              <code className="block mt-2 text-xs text-red-400/70 p-2 bg-slate-950/50 rounded border border-red-900/10">
                {this.state.error?.message || "Unknown anomaly detected"}
              </code>
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Operation
              </button>
              
              <button
                onClick={() => window.location.href = "/"}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
