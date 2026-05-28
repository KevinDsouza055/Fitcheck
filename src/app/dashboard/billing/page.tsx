import { createClient } from "@/lib/supabase/server";
import { BillingClient } from "@/components/billing/billing-client";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id, role").eq("auth_id", user!.id).single();

  if (gymUser?.role !== "owner") {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-card border border-border rounded-2xl">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-bold text-foreground mb-1">Owner Access Only</h2>
          <p className="text-sm text-muted-foreground">Only gym owners can access billing settings.</p>
        </div>
      </div>
    );
  }

  const { data: gym } = await supabase.from("gyms").select("*").eq("id", gymUser.gym_id).single();
  const { data: billingHistory } = await supabase
    .from("billing_events")
    .select("*")
    .eq("gym_id", gymUser.gym_id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: memberCount } = await supabase
    .from("members").select("*", { count: "exact", head: true }).eq("gym_id", gymUser.gym_id);
  const { count: staffCount } = await supabase
    .from("gym_users").select("*", { count: "exact", head: true }).eq("gym_id", gymUser.gym_id);
  const { count: branchCount } = await supabase
    .from("branches").select("*", { count: "exact", head: true }).eq("gym_id", gymUser.gym_id);

  return (
    <BillingClient
      gym={gym as any}
      billingHistory={(billingHistory ?? []) as any[]}
      usage={{ members: memberCount ?? 0, staff: staffCount ?? 0, branches: branchCount ?? 0 }}
    />
  );
}
