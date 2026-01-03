"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Activity, ShieldAlert, FileStack, Brain, Clock, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

const menuItems = [
  { name: 'Dossier Archive', href: '/cases', icon: Archive, description: 'View all investigation cases' },
  { name: 'Evidence Vault', href: '/vault', icon: FileStack, description: 'Manage case evidence files' },
  { name: 'Reasoning Engine', href: '/reasoning', icon: Brain, description: 'AI-powered forensic analysis' },
  { name: 'Vibe Forensics', href: '/vibe', icon: Activity, description: 'Real-time audio analysis' },
  { name: 'Timeline', href: '/timeline', icon: Clock, description: 'Chronological event view' },
  { name: 'Contradiction Map', href: '/contradictions', icon: ShieldAlert, description: 'View detected inconsistencies' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <aside 
      className="w-64 h-screen border-r border-beige bg-cream/50 backdrop-blur-md sticky top-0 px-4 py-8 flex flex-col"
      role="complementary"
      aria-label="Main navigation"
    >
      <header className="mb-12 px-2">
        <h1 className="text-2xl font-serif font-bold text-ocean tracking-tight italic">
          Veridicus
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-ocean/60 font-semibold mt-1">
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
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group focus:outline-none focus:ring-2 focus:ring-ocean/40 ${
                    isActive 
                      ? 'text-ocean bg-beige/40' 
                      : 'text-ocean/80 hover:text-ocean hover:bg-beige/40'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-describedby={`nav-desc-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <item.icon 
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-ocean' : 'text-ocean/60 group-hover:text-ocean'
                    }`} 
                    aria-hidden="true" 
                  />
                  <span>{item.name}</span>
                </Link>
                <span 
                  id={`nav-desc-${item.name.replace(/\s+/g, '-').toLowerCase()}`} 
                  className="sr-only"
                >
                  {item.description}
                </span>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="mt-auto border-t border-beige pt-6 px-2">
        <div className="flex items-center gap-3" role="group" aria-label="User information">
          <div 
            className="w-8 h-8 rounded-full bg-ocean flex items-center justify-center text-cream font-bold text-xs uppercase"
            aria-hidden="true"
          >
            {user?.email ? user.email[0] : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-ocean truncate">
              {user?.email ? user.email.split('@')[0] : 'Guest Investigator'}
            </p>
            <p className="text-[10px] text-ocean/60 truncate" aria-label="Email address">
              {user?.email ? user.email : 'Authentication pending...'}
            </p>
          </div>
        </div>
      </footer>
    </aside>
  );
}
