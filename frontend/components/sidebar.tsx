"use client";

import Link from "next/link";
import { Hammer, Archive, Activity, Zap, ShieldAlert, FileStack, Brain, Clock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const menuItems = [
    { name: 'Dossier Archive', href: '/cases', icon: Archive },
    { name: 'Evidence Vault', href: '/vault', icon: FileStack },
    { name: 'Reasoning Engine', href: '/reasoning', icon: Brain },
    { name: 'Vibe Forensics', href: '/vibe', icon: Activity },
    { name: 'Timeline', href: '/timeline', icon: Clock },
    { name: 'Contradiction Map', href: '/contradictions', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 h-screen border-r border-beige bg-cream/50 backdrop-blur-md sticky top-0 px-4 py-8 flex flex-col">
      <div className="mb-12 px-2">
        <h1 className="text-2xl font-serif font-bold text-ocean tracking-tight italic">
          Veridicus
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-ocean/60 font-semibold mt-1">
          Forensic Reasoning Engine
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-ocean/80 hover:text-ocean hover:bg-beige/40 rounded-lg transition-all group"
          >
            <item.icon className="w-4 h-4 text-ocean/60 group-hover:text-ocean transition-colors" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-beige pt-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ocean flex items-center justify-center text-cream font-bold text-xs uppercase">
            {user ? user.email[0] : <User className="w-4 h-4" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-ocean truncate">
              {user ? user.email.split('@')[0] : 'Guest Investigator'}
            </p>
            <p className="text-[10px] text-ocean/60 truncate">
              {user ? user.email : 'Authentication pending...'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
