import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MembersClient } from "@/components/members/members-client";

export const metadata = { title: "Members" };

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string; action?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase
    .from("gym_users")
    .select("gym_id, gym:gyms(saas_plan)")
    .eq("auth_id", user!.id)
    .single();

  const gymId = gymUser?.gym_id as string;
  const page = parseInt(params.page ?? "0");
  const limit = 20;

  let query = supabase
    .from("members")
    .select("*, membership_plan:membership_plans(name,color,price), branch:branches(name)", { count: "exact" })
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.search) query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%`);

  const [{ data: members, count }, { data: plans }] = await Promise.all([
    query,
    supabase.from("membership_plans").select("id,name,price,duration_days,color").eq("gym_id", gymId).eq("is_active", true),
  ]);

  return (
    <Suspense fallback={<div className="animate-pulse space-y-4">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 bg-card rounded-xl border border-border"/>)}</div>}>
      <MembersClient
        members={(members ?? []) as any[]}
        total={count ?? 0}
        plans={(plans ?? []) as any[]}
        gymId={gymId}
        initialStatus={params.status ?? "all"}
        initialSearch={params.search ?? ""}
        initialAction={params.action}
        page={page}
      />
    </Suspense>
  );
}
