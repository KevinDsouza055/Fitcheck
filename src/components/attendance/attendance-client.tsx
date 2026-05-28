"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { checkInMember } from "@/lib/actions/members";
import { getInitials, getAvatarColor } from "@/lib/utils";

interface Props {
  todayCheckins: any[];
  todayCount: number;
  weekCount: number;
  monthCount: number;
  weeklyData: { day: string; count: number }[];
  gymId: string;
  members: any[];
}

export function AttendanceClient({ todayCheckins, todayCount, weekCount, monthCount, weeklyData, gymId, members }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
  );

  async function handleCheckIn(memberId: string, memberName: string) {
    startTransition(async () => {
      const res = await checkInMember(memberId);
      if (res.error) { toast.error(res.error); return; }
      toast.success(`${memberName} checked in ✅`);
      setShowModal(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            {todayCount} check-ins today · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg text-muted-foreground hover:text-foreground bg-card transition-colors">
            📱 QR Check-in
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
            ✅ Manual Check-in
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today", value: todayCount, emoji: "📍", color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "This Week", value: weekCount, emoji: "📅", color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "This Month", value: monthCount, emoji: "📆", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Avg / Day", value: Math.round(weekCount / 7), emoji: "📊", color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-base mb-3`}>{s.emoji}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Live feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Weekly Pattern</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Bar dataKey="count" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Today's Check-ins</h3>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">● LIVE</span>
            </div>
            <span className="text-sm font-black text-orange-500">{todayCount}</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {todayCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No check-ins yet today</p>
            ) : todayCheckins.map((c, i) => {
              const name = c.member?.name ?? "Unknown";
              const color = getAvatarColor(name);
              return (
                <div key={c.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${i === 0 ? "bg-orange-500/10 border border-orange-500/20" : "hover:bg-accent"} transition-colors`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: color + "22", color }}>{getInitials(name)}</div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{name}</div>
                      <div className="text-xs text-muted-foreground">{c.member?.membership_plan?.name ?? "—"}</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.check_in_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Manual Check-in</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>
            <div className="p-5">
              <div className="flex items-center bg-background border border-border rounded-xl px-3 py-2.5 gap-2 mb-4">
                <span className="text-muted-foreground">🔍</span>
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search member by name or phone…"
                  className="bg-transparent text-sm text-foreground outline-none flex-1 placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filtered.slice(0, 8).map((m) => {
                  const color = getAvatarColor(m.name);
                  return (
                    <button key={m.id} onClick={() => handleCheckIn(m.id, m.name)} disabled={isPending}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-left group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: color + "22", color }}>{getInitials(m.name)}</div>
                        <div>
                          <div className="text-sm font-semibold text-foreground group-hover:text-orange-500 transition-colors">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.membership_plan?.name ?? "No plan"} · {m.phone}</div>
                        </div>
                      </div>
                      <span className="text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Check in →</span>
                    </button>
                  );
                })}
                {search.length > 1 && filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No members found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
