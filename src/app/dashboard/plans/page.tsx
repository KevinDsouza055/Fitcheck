import { createClient } from "@/lib/supabase/server";
import { PlansClient } from "@/components/plans/plans-client";

export const metadata = { title: "Membership Plans" };

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id, role").eq("auth_id", user!.id).single();
  const gymId = gymUser!.gym_id as string;

  const { data: plans } = await supabase
    .from("membership_plans")
    .select("*, members:members(count)")
    .eq("gym_id", gymId)
    .order("sort_order");

  return <PlansClient plans={(plans ?? []) as any[]} gymId={gymId} canManage={gymUser!.role === "owner"} />;
}
