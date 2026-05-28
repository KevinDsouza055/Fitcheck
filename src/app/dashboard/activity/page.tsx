import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Activity Log" };
export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id").eq("auth_id", user!.id).single();
  const { data: logs } = await supabase.from("activity_logs").select("*, user:gym_users(name)").eq("gym_id", gymUser!.gym_id).order("created_at", { ascending: false }).limit(100);
  const emojiMap: Record<string, string> = { created:"👤", updated:"✏️", deleted:"🗑️", login:"🔐", checkin:"✅", payment:"💳", renewal:"🔄" };
  const colorMap: Record<string, string> = { member:"bg-blue-500/10", payment:"bg-emerald-500/10", attendance:"bg-purple-500/10", security:"bg-red-500/10", plan:"bg-orange-500/10" };
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground">Complete audit trail</p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-lg">{logs?.length ?? 0} entries</span>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {(!logs || logs.length === 0) && (
          <div className="text-center py-12 text-sm text-muted-foreground">No activity logged yet</div>
        )}
        <div className="divide-y divide-border">
          {(logs ?? []).map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${colorMap[log.entity_type] ?? "bg-muted"}`}>
                {emojiMap[log.action] ?? "📝"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground capitalize">{log.action} {log.entity_type}</div>
                {log.entity_name && <div className="text-xs text-muted-foreground mt-0.5">{log.entity_name}</div>}
                <div className="text-xs text-muted-foreground/70 mt-0.5">by {log.user?.name ?? "System"}</div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(log.created_at).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
