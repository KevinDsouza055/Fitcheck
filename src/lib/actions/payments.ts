"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PaymentFormData } from "@/types";

async function getGymId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("gym_users")
    .select("gym_id, id")
    .eq("auth_id", user.id)
    .single();
  return { gymId: data?.gym_id as string, userId: data?.id as string, supabase };
}

export async function createPayment(data: PaymentFormData) {
  try {
    const { gymId, userId, supabase } = await getGymId();

    const finalAmount = data.amount - (data.discount ?? 0);

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        gym_id: gymId,
        ...data,
        final_amount: finalAmount,
        status: "success",
        payment_date: data.payment_date || new Date().toISOString(),
        collected_by: userId,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    await supabase.from("activity_logs").insert({
      gym_id: gymId,
      user_id: userId,
      action: "payment",
      entity_type: "payment",
      entity_id: payment.id,
      details: { amount: finalAmount, method: data.payment_method },
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard");
    return { data: payment };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function getPayments(options?: {
  status?: string;
  member_id?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { gymId, supabase } = await getGymId();
    const page = options?.page ?? 0;
    const limit = options?.limit ?? 20;

    let query = supabase
      .from("payments")
      .select(
        "*, member:members(name, phone, photo_url), membership_plan:membership_plans(name)",
        { count: "exact" }
      )
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false })
      .range(page * limit, page * limit + limit - 1);

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }
    if (options?.member_id) {
      query = query.eq("member_id", options.member_id);
    }

    const { data, error, count } = await query;
    if (error) return { error: error.message };
    return { data, count };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function getDashboardRevenue() {
  try {
    const { gymId, supabase } = await getGymId();

    // Last 8 months
    const { data, error } = await supabase.rpc("get_monthly_revenue", {
      p_gym_id: gymId,
    });

    if (error) {
      // Fallback: raw query
      const { data: raw } = await supabase
        .from("payments")
        .select("final_amount, payment_date, status")
        .eq("gym_id", gymId)
        .eq("status", "success")
        .gte(
          "payment_date",
          new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000).toISOString()
        );
      return { data: raw };
    }

    return { data };
  } catch (e) {
    return { error: String(e) };
  }
}
