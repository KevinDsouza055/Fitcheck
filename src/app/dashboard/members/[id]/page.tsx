import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberProfileClient } from "@/components/members/member-profile-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("members").select("name").eq("id", id).single();
  return { title: data?.name ?? "Member Profile" };
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: gymUser } = await supabase
    .from("gym_users")
    .select("gym_id")
    .eq("auth_id", user.id)
    .single();

  const [
    { data: member },
    { data: payments },
    { data: attendance },
    { data: plans },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*, membership_plan:membership_plans(*), branch:branches(*)")
      .eq("id", id)
      .eq("gym_id", gymUser!.gym_id)
      .single(),
    supabase
      .from("payments")
      .select("*, membership_plan:membership_plans(name)")
      .eq("member_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("attendance")
      .select("*")
      .eq("member_id", id)
      .order("check_in_time", { ascending: false })
      .limit(30),
    supabase
      .from("membership_plans")
      .select("id,name,price,duration_days,color")
      .eq("gym_id", gymUser!.gym_id)
      .eq("is_active", true),
  ]);

  if (!member) notFound();

  return (
    <MemberProfileClient
      member={member as any}
      payments={(payments ?? []) as any[]}
      attendance={(attendance ?? []) as any[]}
      plans={(plans ?? []) as any[]}
    />
  );
}
