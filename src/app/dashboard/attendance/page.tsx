import { createClient } from "@/lib/supabase/server";
import { AttendanceClient } from "@/components/attendance/attendance-client";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id").eq("auth_id", user!.id).single();
  const gymId = gymUser!.gym_id as string;

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    { data: todayCheckins },
    { count: weekCount },
    { count: monthCount },
    { data: members },
  ] = await Promise.all([
    supabase.from("attendance")
      .select("*, member:members(name, photo_url, membership_plan:membership_plans(name))")
      .eq("gym_id", gymId)
      .gte("check_in_time", `${today}T00:00:00`)
      .order("check_in_time", { ascending: false })
      .limit(50),
    supabase.from("attendance").select("*", { count: "exact", head: true }).eq("gym_id", gymId).gte("check_in_time", `${weekAgo}T00:00:00`),
    supabase.from("attendance").select("*", { count: "exact", head: true }).eq("gym_id", gymId).gte("check_in_time", monthStart),
    supabase.from("members").select("id, name, phone, status, photo_url, membership_plan:membership_plans(name)").eq("gym_id", gymId).eq("status", "active").order("name"),
  ]);

  // Weekly chart data
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekData = days.map((day) => ({ day, count: 0 }));
  (todayCheckins ?? []).forEach((c: any) => {
    const d = new Date(c.check_in_time).getDay();
    weekData[d].count++;
  });

  return (
    <AttendanceClient
      todayCheckins={(todayCheckins ?? []) as any[]}
      todayCount={todayCheckins?.length ?? 0}
      weekCount={weekCount ?? 0}
      monthCount={monthCount ?? 0}
      weeklyData={weekData}
      gymId={gymId}
      members={(members ?? []) as any[]}
    />
  );
}
