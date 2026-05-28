import { createClient } from "@/lib/supabase/server";
import { PaymentsClient } from "@/components/payments/payments-client";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id").eq("auth_id", user!.id).single();
  const gymId = gymUser!.gym_id as string;

  const page = parseInt(params.page ?? "0");
  const limit = 20;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  let query = supabase
    .from("payments")
    .select("*, member:members(name, photo_url), membership_plan:membership_plans(name)", { count: "exact" })
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (params.status && params.status !== "all") query = query.eq("status", params.status);

  const [
    { data: payments, count },
    { data: revenueRaw },
    { data: pendingRaw },
    { data: members },
    { data: plans },
  ] = await Promise.all([
    query,
    supabase.from("payments").select("final_amount").eq("gym_id", gymId).eq("status", "success").gte("payment_date", monthStart),
    supabase.from("payments").select("final_amount").eq("gym_id", gymId).eq("status", "pending"),
    supabase.from("members").select("id, name").eq("gym_id", gymId).order("name"),
    supabase.from("membership_plans").select("id, name, price, duration_days").eq("gym_id", gymId).eq("is_active", true),
  ]);

  const monthRevenue = (revenueRaw ?? []).reduce((s, p) => s + p.final_amount, 0);
  const pendingDues = (pendingRaw ?? []).reduce((s, p) => s + p.final_amount, 0);

  return (
    <PaymentsClient
      payments={(payments ?? []) as any[]}
      total={count ?? 0}
      monthRevenue={monthRevenue}
      pendingDues={pendingDues}
      members={(members ?? []) as any[]}
      plans={(plans ?? []) as any[]}
      gymId={gymId}
      initialStatus={params.status ?? "all"}
      page={page}
    />
  );
}
