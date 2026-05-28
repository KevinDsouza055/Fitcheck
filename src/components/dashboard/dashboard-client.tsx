"use client";

import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatCurrency, formatRelativeTime, getInitials, getAvatarColor, getMemberStatusColor } from "@/lib/utils";
import type { DashboardStats } from "@/types";

const PLAN_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6"];

function StatCard({ emoji, label, value, sub, delta, deltaUp, colorClass }: {
  emoji: string; label: string; value: string; sub?: string;
  delta?: string; deltaUp?: boolean; colorClass: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center text-lg`}>{emoji}</div>
        {delta && (
          <span className={`text-xs font-bold ${deltaUp ? "text-emerald-400" : "text-red-400"}`}>
            {deltaUp ? "↑" : "↓"} {delta}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-black text-foreground tracking-tight leading-none">{value}</div>
        <div className="text-[12.5px] text-muted-foreground mt-1">{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-2xl">
      <div className="text-muted-foreground font-semibold mb-1.5">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }} className="font-bold">
          {p.name === "revenue" ? formatCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

interface Props {
  stats: DashboardStats | null;
  checkins: any[];
  payments: any[];
  revenueData: any[];
  attendanceData: any[];
}

export function DashboardClient({ stats, checkins, payments, revenueData, attendanceData }: Props) {
  const s = stats;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/members?action=export"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground bg-card border border-border rounded-lg hover:text-foreground transition-colors">
            ⬇ Export
          </Link>
          <Link href="/dashboard/members?action=add"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
            + Add Member
          </Link>
        </div>
      </div>

      {/* Expiry alert */}
      {s && s.expiring_soon > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <span className="text-amber-400 font-bold text-sm">{s.expiring_soon} memberships expiring in 7 days</span>
            <span className="text-muted-foreground text-xs ml-2">Send reminders to recover dues</span>
          </div>
          <Link href="/dashboard/whatsapp" className="text-xs font-bold text-amber-400 hover:text-amber-300 whitespace-nowrap">
            Send Reminders →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard emoji="👥" label="Total Members" value={String(s?.total_members ?? 0)} delta="+12%" deltaUp colorClass="bg-orange-500/15" />
        <StatCard emoji="✅" label="Active" value={String(s?.active_members ?? 0)} sub={`${s ? Math.round((s.active_members / Math.max(s.total_members, 1)) * 100) : 0}% rate`} colorClass="bg-emerald-500/15" />
        <StatCard emoji="⚠️" label="Expiring Soon" value={String(s?.expiring_soon ?? 0)} sub="Within 7 days" colorClass="bg-amber-500/15" />
        <StatCard emoji="💰" label="May Revenue" value={formatCurrency(s?.monthly_revenue ?? 0)} delta="+11%" deltaUp colorClass="bg-blue-500/15" />
        <StatCard emoji="📍" label="Today's Check-ins" value={String(s?.todays_checkins ?? 0)} colorClass="bg-purple-500/15" />
        <StatCard emoji="⏰" label="Pending Dues" value={formatCurrency(s?.pending_dues ?? 0)} colorClass="bg-red-500/15" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm font-bold text-foreground">Revenue Trend</div>
              <div className="text-xs text-muted-foreground">Monthly collections</div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">↑ 11% this month</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${v / 1000}k`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} fill="url(#revG)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-sm font-bold text-foreground mb-1">Weekly Attendance</div>
          <div className="text-xs text-muted-foreground mb-4">Check-ins this week</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#3B82F6" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent payments */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-bold text-foreground">Recent Payments</div>
            <Link href="/dashboard/payments" className="text-xs text-orange-500 hover:text-orange-400 font-semibold">View all →</Link>
          </div>
          <div className="space-y-3">
            {payments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
            )}
            {payments.slice(0, 5).map((p, i) => {
              const name = p.member?.name ?? "Unknown";
              const color = getAvatarColor(name);
              return (
                <div key={p.id ?? i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: color + "22", color }}>
                      {getInitials(name)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">{name}</div>
                      <div className="text-[11px] text-muted-foreground">{formatRelativeTime(p.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-foreground">{formatCurrency(p.final_amount)}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live check-ins */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold text-foreground">Today's Check-ins</div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">● LIVE</span>
            </div>
            <span className="text-sm font-black text-orange-500">{s?.todays_checkins ?? 0}</span>
          </div>
          <div className="space-y-2.5">
            {checkins.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No check-ins today</p>
            )}
            {checkins.slice(0, 6).map((c, i) => {
              const name = c.member?.name ?? "Unknown";
              const color = getAvatarColor(name);
              return (
                <div key={c.id ?? i} className={`flex items-center justify-between px-3 py-2 rounded-xl ${i === 0 ? "bg-orange-500/10 border border-orange-500/20" : ""}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: color + "22", color }}>
                      {getInitials(name)}
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold text-foreground">{name}</div>
                      <div className="text-[10.5px] text-muted-foreground">{c.member?.membership_plan?.name ?? "—"}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    🕐 {new Date(c.check_in_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
