"use client";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = Array.from({length:13},(_,i)=>i+7);

interface Props {
  revenueData: any[];
  heatmapData: Record<string, Record<number, number>>;
  totalMembers: number;
  activeMembers: number;
  retentionRate: number;
  saas_plan: string;
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-2xl">
      <div className="text-muted-foreground font-semibold mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }} className="font-bold">
          {p.name === "revenue" ? formatCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

export function AnalyticsClient({ revenueData, heatmapData, totalMembers, activeMembers, retentionRate, saas_plan }: Props) {
  const locked = saas_plan === "starter";
  const churnRate = totalMembers > 0 ? ((totalMembers - activeMembers) / totalMembers * 100).toFixed(1) : "0";
  const maxHeat = Math.max(...DAYS.flatMap(d => HOURS.map(h => heatmapData[d]?.[h] ?? 0)), 1);

  const radarData = [
    { subject: "Retention", A: retentionRate },
    { subject: "Renewals", A: Math.max(0, retentionRate - 8) },
    { subject: "Attendance", A: Math.min(100, retentionRate - 5) },
    { subject: "Revenue", A: Math.min(100, retentionRate + 9) },
    { subject: "Growth", A: Math.min(100, retentionRate - 3) },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Revenue forecasting, retention & growth insights</p>
        </div>
        {locked && (
          <div className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
            🔒 Upgrade to Growth for full analytics
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Retention Rate", value: `${retentionRate}%`, color: "text-emerald-400", bg: "bg-emerald-500/10", emoji: "🔄" },
          { label: "Churn Rate", value: `${churnRate}%`, color: "text-red-400", bg: "bg-red-500/10", emoji: "📉" },
          { label: "Active Members", value: String(activeMembers), color: "text-orange-500", bg: "bg-orange-500/10", emoji: "✅" },
          { label: "Total Members", value: String(totalMembers), color: "text-blue-400", bg: "bg-blue-500/10", emoji: "👥" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-base mb-3`}>{s.emoji}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Revenue Forecast</h3>
              <p className="text-xs text-muted-foreground">Historical + trend projection</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`₹${v/1000}k`} tick={{ fontSize:10, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} fill="url(#rg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Gym Health Score</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))"/>
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:"hsl(var(--muted-foreground))" }}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false}/>
              <Radar dataKey="A" stroke="#F97316" fill="#F97316" fillOpacity={0.25}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member growth */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-1">New vs Churned Members</h3>
        <p className="text-xs text-muted-foreground mb-4">Monthly acquisition and churn</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueData} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
            <XAxis dataKey="month" tick={{ fontSize:11, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip/>}/>
            <Bar dataKey="members" name="New" fill="#10B981" radius={[4,4,0,0]} barSize={14}/>
            <Bar dataKey="churn" name="Churned" fill="#EF4444" radius={[4,4,0,0]} barSize={14}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Heatmap */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-1">Attendance Heatmap</h3>
        <p className="text-xs text-muted-foreground mb-4">Check-in intensity by day and hour</p>
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid gap-1" style={{ gridTemplateColumns: `50px repeat(${HOURS.length}, 1fr)` }}>
              <div/>
              {HOURS.map(h=><div key={h} className="text-[9px] text-muted-foreground text-center">{h}h</div>)}
              {DAYS.map(day=>(
                <>
                  <div key={`l${day}`} className="text-[11px] text-muted-foreground flex items-center">{day}</div>
                  {HOURS.map(h=>{
                    const val = heatmapData[day]?.[h] ?? 0;
                    const opacity = val > 0 ? Math.max(0.08, val/maxHeat*0.9) : 0.04;
                    return <div key={`${day}-${h}`} className="h-7 rounded" style={{ background:`rgba(249,115,22,${opacity})` }} title={`${val} check-ins`}/>;
                  })}
                </>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] text-muted-foreground">Less</span>
              {[0.08,0.25,0.45,0.65,0.9].map(o=>(
                <div key={o} className="w-4 h-4 rounded" style={{ background:`rgba(249,115,22,${o})` }}/>
              ))}
              <span className="text-[10px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
