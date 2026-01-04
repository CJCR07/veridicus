import { Sparkles, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-800/30 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-indigo-600/20 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-6 w-3/4 bg-slate-800/50 rounded animate-pulse" />
              <div className="h-5 w-5 bg-slate-800/50 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-800/30 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-slate-800/30 rounded animate-pulse" />
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-slate-800/50">
              <div className="h-4 w-24 bg-slate-800/20 rounded animate-pulse" />
              <div className="h-4 w-16 bg-slate-800/20 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
