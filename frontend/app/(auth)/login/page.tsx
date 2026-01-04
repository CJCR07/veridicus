"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else {
      router.push("/cases");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-serif font-bold text-alabaster">Welcome Back</h2>
        <p className="text-powder/60 text-sm">Sign in to resume your forensic investigations.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-3">
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-powder/40 group-focus-within:text-pacific transition-colors" />
            <input
              type="email"
              placeholder="investigator@veridicus.dev"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-carbon/50 border border-charcoal rounded-xl py-2.5 pl-10 pr-4 text-alabaster placeholder:text-powder/20 focus:outline-none focus:border-pacific/50 transition-all text-sm"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-powder/40 group-focus-within:text-pacific transition-colors" />
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-carbon/50 border border-charcoal rounded-xl py-2.5 pl-10 pr-4 text-alabaster placeholder:text-powder/20 focus:outline-none focus:border-pacific/50 transition-all text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 animate-in fade-in duration-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-pacific hover:opacity-90 text-carbon font-bold py-3 rounded-xl transition-all shadow-lg shadow-pacific/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Enter Workstation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 text-center border-t border-charcoal/50">
        <p className="text-powder/40 text-xs">
          New investigator?{" "}
          <Link href="/signup" className="text-pacific hover:text-powder font-bold transition-colors">
            Initialize Account
          </Link>
        </p>
      </div>
    </div>
  );
}
