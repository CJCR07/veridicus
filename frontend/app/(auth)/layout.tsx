import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Forensic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/20 mb-4 shadow-xl shadow-indigo-500/10">
            <Shield className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-100 tracking-tight italic">
            Veridicus
          </h1>
          <p className="text-slate-500 text-sm mt-1 lowercase tracking-wider">
            Investigator Access Portal
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             {/* Decorative grid */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
             
             <div className="relative z-10">
                {children}
             </div>
        </div>

        <p className="mt-8 text-center text-slate-600 text-[11px] uppercase tracking-[0.2em]">
          Secure Forensic Workstation v1.0.4
        </p>
      </div>
    </div>
  );
}
