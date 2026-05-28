"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { getInitials, getAvatarColor } from "@/lib/utils";

interface TopbarProps {
  title: string;
  gymId: string;
}

type MemberSearchResult = {
  id: string;
  name: string;
  phone: string;
  status: string;
  membership_plan?: {
    name: string;
  }[];
};

export function Topbar({ title, gymId }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowResults(false); return; }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("members")
        .select("id, name, phone, status, membership_plan:membership_plans(name)")
        .eq("gym_id", gymId)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(5);
      setResults((data as MemberSearchResult[]) ?? []);
      setShowResults(true);
    }, 200);
    return () => clearTimeout(t);
  }, [query, gymId]);

  // Click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-[58px] bg-card border-b border-border flex items-center px-5 gap-3 sticky top-0 z-50">
      {/* Mobile menu */}
      <button className="lg:hidden text-muted-foreground hover:text-foreground transition-colors text-xl">☰</button>

      {/* Title */}
      <div className="flex-1">
        <h1 className="text-[15px] font-bold text-foreground">{title}</h1>
      </div>

      {/* Search */}
      <div ref={searchRef} className="relative">
        <div className="flex items-center bg-background border border-border rounded-lg px-3 py-1.5 gap-2 w-52">
          <span className="text-muted-foreground text-sm">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members…"
            className="bg-transparent text-sm text-foreground outline-none flex-1 placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground bg-border px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
            {results.map((m: MemberSearchResult) => (
              <button
                key={m.id}
                onClick={() => { router.push(`/dashboard/members/${m.id}`); setShowResults(false); setQuery(""); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-accent transition-colors text-left border-b border-border last:border-0"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: getAvatarColor(m.name) + "22", color: getAvatarColor(m.name) }}
                >
                  {getInitials(m.name)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.phone} · {m.status}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="border border-border bg-card rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* Notifications */}
      <button className="relative border border-border bg-card rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors">
        🔔
      </button>
    </header>
  );
}
