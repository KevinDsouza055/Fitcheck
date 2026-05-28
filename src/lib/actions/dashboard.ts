"use server";

import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/types";

async function getGymId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("gym_users")
    .select("gym_id, id, role, gym:gyms(*)")
    .eq("auth_id", user.id)
    .single();
  return { gymId: data?.gym_id as string, userId: data?.id as string, gymUser: data, supabase };
}

export async function getDashboardStats(): Promise<{ data?: DashboardStats; error?: string }> {
  try {
    const { gymId, supabase } = await getGymId();
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [
      { count: total_members },
      { count: active_members },
      { count: expired_members },
      { count: expiring_soon },
      { count: frozen_members },
      { count: todays_checkins },
      { data: revenueData },
      { data: pendingData },
      { count: new_members_this_month },
    ] = await Promise.all([
      supabase.from("members").select("*", { count: "exact", head: true }).eq("gym_id", gymId),
      supabase.from("members").select("*", { count: "exact", head: true }).eq("gym_id", gymId).eq("status", "active"),
      supabase.from("members").select("*", { count: "exact", head: true }).eq("gym_id", gymId).eq("status", "expired"),
      supabase.from("members").select("*", { count: "exact", head: true }).eq("gym_id", gymId).eq("status", "expiring"),
      supabase.from("members").select("*", { count: "exact", head: true }).eq("gym_id", gymId).eq("status", "frozen"),
      supabase.from("attendance").select("*", { count: "exact", head: true }).eq("gym_id", gymId).gte("check_in_time", `${today}T00:00:00`).lte("check_in_time", `${today}T23:59:59`),
      supabase.from("payments").select("final_amount").eq("gym_id", gymId).eq("status", "success").gte("payment_date", monthStart),
      supabase.from("payments").select("final_amount").eq("gym_id", gymId).eq("status", "pending"),
      supabase.from("members").select("*", { count: "exact", head: true }).eq("gym_id", gymId).gte("created_at", monthStart),
    ]);

    const monthly_revenue = (revenueData ?? []).reduce((sum, p) => sum + (p.final_amount ?? 0), 0);
    const pending_dues = (pendingData ?? []).reduce((sum, p) => sum + (p.final_amount ?? 0), 0);

    return {
      data: {
        total_members: total_members ?? 0,
        active_members: active_members ?? 0,
        expired_members: expired_members ?? 0,
        expiring_soon: expiring_soon ?? 0,
        frozen_members: frozen_members ?? 0,
        todays_checkins: todays_checkins ?? 0,
        monthly_revenue,
        pending_dues,
        new_members_this_month: new_members_this_month ?? 0,
      },
    };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function getRecentActivity() {
  try {
    const { gymId, supabase } = await getGymId();

    const [checkins, payments] = await Promise.all([
      supabase
        .from("attendance")
        .select("*, member:members(name, photo_url, membership_plan:membership_plans(name))")
        .eq("gym_id", gymId)
        .order("check_in_time", { ascending: false })
        .limit(6),
      supabase
        .from("payments")
        .select("*, member:members(name, photo_url)")
        .eq("gym_id", gymId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      checkins: checkins.data ?? [],
      payments: payments.data ?? [],
    };
  } catch (e) {
    return { checkins: [], payments: [], error: String(e) };
  }
}

export async function getMonthlyRevenue() {
  try {
    const { gymId, supabase } = await getGymId();

    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 7);
    eightMonthsAgo.setDate(1);

    const { data, error } = await supabase
      .from("payments")
      .select("final_amount, payment_date")
      .eq("gym_id", gymId)
      .eq("status", "success")
      .gte("payment_date", eightMonthsAgo.toISOString());

    if (error) return { data: [] };

    // Group by month
    const grouped: Record<string, number> = {};
    (data ?? []).forEach((p) => {
      if (!p.payment_date) return;
      const month = new Date(p.payment_date).toLocaleDateString("en-IN", { month: "short" });
      grouped[month] = (grouped[month] ?? 0) + p.final_amount;
    });

    return {
      data: Object.entries(grouped).map(([month, revenue]) => ({ month, revenue })),
    };
  } catch (e) {
    return { data: [] };
  }
}

export async function getWeeklyAttendance() {
  try {
    const { gymId, supabase } = await getGymId();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);

    const { data } = await supabase
      .from("attendance")
      .select("check_in_time")
      .eq("gym_id", gymId)
      .gte("check_in_time", weekAgo.toISOString());

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const grouped: Record<string, number> = {};

    (data ?? []).forEach((a) => {
      const day = days[new Date(a.check_in_time).getDay()];
      grouped[day] = (grouped[day] ?? 0) + 1;
    });

    return {
      data: days.map((day) => ({ day, count: grouped[day] ?? 0 })),
    };
  } catch (e) {
    return { data: [] };
  }
}
