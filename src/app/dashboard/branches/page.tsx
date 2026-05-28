import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Branches" };
export default async function BranchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id, role").eq("auth_id", user!.id).single();
  const gymId = gymUser!.gym_id as string;
  const { data: branches } = await supabase.from("branches").select("*").eq("gym_id", gymId);
  const memberCounts: Record<string, number> = {};
  for (const b of branches ?? []) {
    const { count } = await supabase.from("members").select("*", { count:"exact", head:true }).eq("branch_id", b.id);
    memberCounts[b.id] = count ?? 0;
  }
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-black text-foreground tracking-tight">Branches</h1><p className="text-sm text-muted-foreground">Manage gym locations</p></div>
        {gymUser?.role === "owner" && <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">+ Add Branch</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(branches ?? []).map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">{b.name}{b.is_main && <span className="text-[9px] font-bold bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded">MAIN</span>}</div>
                <div className="text-xs text-muted-foreground mt-0.5">📍 {b.city ?? b.address ?? "—"}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>{b.active ? "Active" : "Inactive"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-background rounded-xl p-3 text-center"><div className="text-lg font-black text-orange-500">{memberCounts[b.id] ?? 0}</div><div className="text-[10px] text-muted-foreground">Members</div></div>
              <div className="bg-background rounded-xl p-3 text-center"><div className="text-lg font-black text-blue-400">{b.phone ? "Yes" : "—"}</div><div className="text-[10px] text-muted-foreground">Phone</div></div>
            </div>
            {gymUser?.role === "owner" && (
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 text-xs font-semibold border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Edit</button>
                {!b.is_main && <button className="py-1.5 px-3 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">Delete</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
