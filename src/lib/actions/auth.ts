"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const gymName = formData.get("gym_name") as string;
  const phone = formData.get("phone") as string;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, gym_name: gymName },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create account." };
  }

  // Create gym
  const service = await createServiceClient();
  const slug = generateSlug(gymName);

  const { data: gym, error: gymError } = await service
    .from("gyms")
    .insert({
      name: gymName,
      slug: `${slug}-${Date.now()}`,
      email,
      phone,
      saas_plan: "starter",
      sub_status: "trial",
      onboarded: false,
    })
    .select()
    .single();

  if (gymError) {
    return { error: "Failed to create gym. Please try again." };
  }

  // Create main branch
  await service.from("branches").insert({
    gym_id: gym.id,
    name: `${gymName} — Main`,
    is_main: true,
    active: true,
  });

  // Create gym_user as owner
  const { error: userError } = await service.from("gym_users").insert({
    gym_id: gym.id,
    auth_id: authData.user.id,
    name,
    email,
    phone,
    role: "owner",
    can_manage_members: true,
    can_manage_payments: true,
    can_delete_members: true,
    can_export_data: true,
    can_manage_plans: true,
  });

  if (userError) {
    return { error: "Account created but user profile failed." };
  }

  redirect("/onboarding");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Update last_login
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const service = await createServiceClient();
    await service
      .from("gym_users")
      .update({ last_login: new Date().toISOString() })
      .eq("auth_id", user.id);
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset email sent. Check your inbox." };
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: gymUser } = await supabase
    .from("gym_users")
    .select("*, gym:gyms(*)")
    .eq("auth_id", user.id)
    .single();

  return gymUser;
}
