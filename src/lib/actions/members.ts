"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeExpiryDate } from "@/lib/utils";
import type { MemberFormData } from "@/types";

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

export async function createMember(data: MemberFormData) {
  try {
    const { gymId, userId, supabase } = await getGymId();

    // Compute expiry if plan selected
    let expiryDate = data.expiry_date;
    if (data.membership_plan_id && data.join_date && !expiryDate) {
      const { data: plan } = await supabase
        .from("membership_plans")
        .select("duration_days")
        .eq("id", data.membership_plan_id)
        .single();
      if (plan) {
        expiryDate = computeExpiryDate(data.join_date, plan.duration_days);
      }
    }

    const { data: member, error } = await supabase
      .from("members")
      .insert({
        gym_id: gymId,
        ...data,
        expiry_date: expiryDate,
        status: "active",
        created_by: userId,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    // Log activity
    await supabase.from("activity_logs").insert({
      gym_id: gymId,
      user_id: userId,
      action: "created",
      entity_type: "member",
      entity_id: member.id,
      entity_name: data.name,
    });

    // Create notification
    await supabase.from("notifications").insert({
      gym_id: gymId,
      title: "New member joined",
      message: `${data.name} has joined with ${data.membership_plan_id ? "a plan" : "no plan"}`,
      type: "success",
    });

    revalidatePath("/dashboard/members");
    return { data: member };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function updateMember(id: string, data: Partial<MemberFormData>) {
  try {
    const { gymId, userId, supabase } = await getGymId();

    const { data: member, error } = await supabase
      .from("members")
      .update(data)
      .eq("id", id)
      .eq("gym_id", gymId)
      .select()
      .single();

    if (error) return { error: error.message };

    await supabase.from("activity_logs").insert({
      gym_id: gymId,
      user_id: userId,
      action: "updated",
      entity_type: "member",
      entity_id: id,
      entity_name: member.name,
    });

    revalidatePath("/dashboard/members");
    revalidatePath(`/dashboard/members/${id}`);
    return { data: member };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function deleteMember(id: string) {
  try {
    const { gymId, userId, supabase } = await getGymId();

    const { data: member } = await supabase
      .from("members")
      .select("name")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", id)
      .eq("gym_id", gymId);

    if (error) return { error: error.message };

    await supabase.from("activity_logs").insert({
      gym_id: gymId,
      user_id: userId,
      action: "deleted",
      entity_type: "member",
      entity_id: id,
      entity_name: member?.name,
    });

    revalidatePath("/dashboard/members");
    return { success: true };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function renewMember(
  memberId: string,
  planId: string,
  paymentMethod: string,
  amount: number
) {
  try {
    const { gymId, userId, supabase } = await getGymId();

    const { data: plan } = await supabase
      .from("membership_plans")
      .select("duration_days, price")
      .eq("id", planId)
      .single();

    if (!plan) return { error: "Plan not found" };

    const today = new Date().toISOString().split("T")[0];
    const newExpiry = computeExpiryDate(today, plan.duration_days);

    // Update member
    await supabase
      .from("members")
      .update({
        membership_plan_id: planId,
        expiry_date: newExpiry,
        status: "active",
        join_date: today,
      })
      .eq("id", memberId)
      .eq("gym_id", gymId);

    // Record payment
    const { data: payment } = await supabase
      .from("payments")
      .insert({
        gym_id: gymId,
        member_id: memberId,
        membership_plan_id: planId,
        amount: plan.price,
        discount: plan.price - amount,
        final_amount: amount,
        status: "success",
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        renewal_from: today,
        renewal_to: newExpiry,
        collected_by: userId,
      })
      .select()
      .single();

    await supabase.from("activity_logs").insert({
      gym_id: gymId,
      user_id: userId,
      action: "renewal",
      entity_type: "member",
      entity_id: memberId,
      details: { payment_id: payment?.id, amount },
    });

    revalidatePath("/dashboard/members");
    revalidatePath(`/dashboard/members/${memberId}`);
    revalidatePath("/dashboard/payments");
    return { success: true, new_expiry: newExpiry };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function getMembers(options?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { gymId, supabase } = await getGymId();
    const page = options?.page ?? 0;
    const limit = options?.limit ?? 20;

    let query = supabase
      .from("members")
      .select("*, membership_plan:membership_plans(name, color, price), branch:branches(name)", { count: "exact" })
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false })
      .range(page * limit, page * limit + limit - 1);

    if (options?.status && options.status !== "all") {
      query = query.eq("status", options.status);
    }

    if (options?.search) {
      query = query.or(
        `name.ilike.%${options.search}%,phone.ilike.%${options.search}%,email.ilike.%${options.search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return { error: error.message };
    return { data, count };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function getMember(id: string) {
  try {
    const { gymId, supabase } = await getGymId();

    const { data, error } = await supabase
      .from("members")
      .select("*, membership_plan:membership_plans(*), branch:branches(*)")
      .eq("id", id)
      .eq("gym_id", gymId)
      .single();

    if (error) return { error: error.message };
    return { data };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function checkInMember(memberId: string, branchId?: string) {
  try {
    const { gymId, userId, supabase } = await getGymId();

    const { data, error } = await supabase
      .from("attendance")
      .insert({
        gym_id: gymId,
        member_id: memberId,
        branch_id: branchId,
        check_in_time: new Date().toISOString(),
        check_in_method: "manual",
        created_by: userId,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    revalidatePath("/dashboard/attendance");
    return { data };
  } catch (e) {
    return { error: String(e) };
  }
}
