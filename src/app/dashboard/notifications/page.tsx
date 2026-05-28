import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Notifications" };
export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id, id").eq("auth_id", user!.id).single();
  const { data: notifications } = await supabase.from("notifications").select("*").eq("gym_id", gymUser!.gym_id).order("created_at", { ascending: false }).limit(50);
  return <NotificationsView notifications={notifications ?? []} gymUserId={gymUser!.id} />;
}
function NotificationsView({ notifications, gymUserId }: { notifications: any[]; gymUserId: string }) {
  const unread = notifications.filter(n => !n.is_read).length;
  const typeEmoji: Record<string, string> = { warning: "⚠️", error: "❌", success: "✅", info: "ℹ️" };
  const typeStyle: Record<string, string> = {
    warning: "bg-amber-500/10 text-amber-400",
    error: "bg-red-500/10 text-red-400",
    success: "bg-emerald-500/10 text-emerald-400",
    info: "bg-blue-500/10 text-blue-400",
  };
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} unread</p>
        </div>
      </div>
      <div className="space-y-2">
        {notifications.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
        {notifications.map((n) => (
          <div key={n.id} className={`bg-card border rounded-xl p-4 flex items-start gap-3 ${!n.is_read ? "border-orange-500/30" : "border-border"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${typeStyle[n.type] ?? "bg-muted"}`}>
              {typeEmoji[n.type] ?? "🔔"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{n.title}</span>
                {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />}
              </div>
              {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
