import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Staff" };
export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id, role").eq("auth_id", user!.id).single();
  const { data: staff } = await supabase.from("gym_users").select("*, branch:branches(name)").eq("gym_id", gymUser!.gym_id).order("created_at");
  const roleStyle: Record<string, string> = { owner:"bg-orange-500/10 text-orange-500", trainer:"bg-blue-500/10 text-blue-400", staff:"bg-emerald-500/10 text-emerald-400" };
  const permLabels = [["can_manage_members","Members"],["can_manage_payments","Payments"],["can_delete_members","Delete"],["can_export_data","Export"],["can_manage_plans","Plans"]];
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-black text-foreground tracking-tight">Staff & Permissions</h1><p className="text-sm text-muted-foreground">Manage team and access control</p></div>
        {gymUser?.role === "owner" && <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">+ Add Staff</button>}
      </div>
      <div className="space-y-3">
        {(staff ?? []).map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-orange-500/20 flex items-center justify-center font-bold text-orange-500 flex-shrink-0">
                {s.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
              </div>
              <div className="flex-1 min-w-48">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground">{s.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleStyle[s.role] ?? ""}`}>{s.role}</span>
                  {!s.is_active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">Inactive</span>}
                </div>
                <div className="text-xs text-muted-foreground">{s.email} · {s.phone ?? "—"} · {s.branch?.name ?? "All branches"}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                {permLabels.map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-sm flex items-center justify-center ${s[key] ? "bg-emerald-500" : "bg-border"}`}>
                      {s[key] && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
              {gymUser?.role === "owner" && s.role !== "owner" && (
                <button className="text-xs font-semibold text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors self-start">Edit</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
