import { createClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id, gym:gyms(saas_plan)").eq("auth_id", user!.id).single();
  const gymId = gymUser!.gym_id as string;
  const saas_plan = (gymUser?.gym as any)?.saas_plan ?? "starter";

  const eightMonthsAgo = new Date(); eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 7); eightMonthsAgo.setDate(1);

  const [{ data: payments }, { data: members }, { data: attendance }] = await Promise.all([
    supabase.from("payments").select("final_amount, payment_date, status, created_at").eq("gym_id", gymId).eq("status", "success").gte("payment_date", eightMonthsAgo.toISOString()),
    supabase.from("members").select("id, status, join_date, expiry_date, created_at").eq("gym_id", gymId),
    supabase.from("attendance").select("check_in_time").eq("gym_id", gymId).gte("check_in_time", eightMonthsAgo.toISOString()),
  ]);

  // Build monthly revenue
  const monthMap: Record<string, { revenue: number; members: number; churn: number }> = {};
  (payments ?? []).forEach((p) => {
    if (!p.payment_date) return;
    const key = new Date(p.payment_date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (!monthMap[key]) monthMap[key] = { revenue: 0, members: 0, churn: 0 };
    monthMap[key].revenue += p.final_amount;
  });
  (members ?? []).forEach((m) => {
    const key = new Date(m.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (monthMap[key]) monthMap[key].members++;
    if (m.status === "expired") {
      const ekey = m.expiry_date ? new Date(m.expiry_date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) : null;
      if (ekey && monthMap[ekey]) monthMap[ekey].churn++;
    }
  });

  const revenueData = Object.entries(monthMap).map(([month, d]) => ({ month, ...d })).slice(-8);

  // Attendance heatmap
  const heatmap: Record<string, Record<number, number>> = {};
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  (attendance ?? []).forEach((a) => {
    const d = new Date(a.check_in_time);
    const day = dayNames[d.getDay()];
    const hour = d.getHours();
    if (!heatmap[day]) heatmap[day] = {};
    heatmap[day][hour] = (heatmap[day][hour] ?? 0) + 1;
  });

  const activeCount = (members ?? []).filter((m) => m.status === "active").length;
  const totalCount = (members ?? []).length;
  const retentionRate = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  return (
    <AnalyticsClient
      revenueData={revenueData}
      heatmapData={heatmap}
      totalMembers={totalCount}
      activeMembers={activeCount}
      retentionRate={retentionRate}
      saas_plan={saas_plan}
    />
  );
}
