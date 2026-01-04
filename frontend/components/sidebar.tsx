"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Activity, ShieldAlert, FileStack, Brain, Clock, User as UserIcon, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const menuItems = [
  { name: 'Investigation Archive', href: '/cases', icon: Archive, description: 'View all investigation cases' },
  { name: 'Evidence Vault', href: '/vault', icon: FileStack, description: 'Manage case evidence files' },
  { name: 'Reasoning Engine', href: '/reasoning', icon: Brain, description: 'AI-powered forensic analysis' },
  { name: 'Vibe Forensics', href: '/vibe', icon: Activity, description: 'Real-time audio analysis' },
  { name: 'Timeline', href: '/timeline', icon: Clock, description: 'Chronological event view' },
  { name: 'Contradiction Map', href: '/contradictions', icon: ShieldAlert, description: 'View detected inconsistencies' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted) setUser(user);
    }
    getUser();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside 
      className="w-64 h-screen border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 px-4 py-8 flex flex-col"
      role="complementary"
      aria-label="Main navigation"
    >
      <header className="mb-12 px-2">
        <h1 className="text-2xl font-serif font-bold text-slate-100 tracking-tight italic">
          Veridicus
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">
          Forensic Reasoning Engine
        </p>
      </header>

      <nav className="flex-1 space-y-2" aria-label="Main menu">
        <ul role="list" className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all group focus:outline-none ${
                    isActive 
                      ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon 
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`} 
                    aria-hidden="true" 
                  />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="mt-auto space-y-4 pt-6 border-t border-slate-800 px-2">
        <div className="flex items-center gap-3" role="group" aria-label="User information">
          <div 
            className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase"
            aria-hidden="true"
          >
            {user?.email ? user.email[0] : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">
              {user?.email ? user.email.split('@')[0] : 'Guest'}
            </p>
            <p className="text-[10px] text-slate-500 truncate" aria-label="Email address">
              {user?.email || 'Unauthorized'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all group"
        >
          <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-500 transition-colors" />
          <span>Terminate Session</span>
        </button>
      </footer>
    </aside>
  );
}
