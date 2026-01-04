import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-carbon flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Forensic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pacific/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-powder/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-pacific/10 p-4 rounded-2xl border border-pacific/20 mb-4 shadow-xl shadow-pacific/10">
            <Shield className="w-10 h-10 text-pacific" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-alabaster tracking-tight italic">
            Veridicus
          </h1>
          <p className="text-pacific/60 text-sm mt-1 lowercase tracking-wider font-medium">
            Investigator Access Portal
          </p>
        </div>

        <div className="bg-charcoal/40 backdrop-blur-2xl border border-charcoal rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             {/* Decorative grid */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#a9bcd008_1px,transparent_1px),linear-gradient(to_bottom,#a9bcd008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
             
             <div className="relative z-10">
                {children}
             </div>
        </div>

        <p className="mt-8 text-center text-powder/20 text-[11px] uppercase tracking-[0.2em] font-bold">
          Secure Forensic Workstation v1.0.4
        </p>
      </div>
    </div>
  );
}
