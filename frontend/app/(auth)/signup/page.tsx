"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { UserPlus, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic password match validation
    if (password !== confirmPassword) {
      setError("Investigator credentials do not match.");
      setIsLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else {
      // Direct access after registration
      // If "Confirm email" is disabled in Supabase Dashboard, this will work instantly
      router.push("/cases");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-100">Initialize Credentials</h2>
        <p className="text-slate-400 text-sm">Register as a new investigator on the Veridicus workstation.</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-3">
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="email"
              placeholder="investigator@veridicus.dev"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="password"
              placeholder="Investigation Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
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
          className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Register Investigator
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 text-center border-t border-slate-800/50">
        <p className="text-slate-500 text-xs">
          Already registered?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            investigator portal
          </Link>
        </p>
      </div>
    </div>
  );
}
