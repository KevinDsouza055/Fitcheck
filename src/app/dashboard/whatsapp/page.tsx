import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "WhatsApp Automation" };
export default async function WhatsAppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("gym_id, gym:gyms(saas_plan)").eq("auth_id", user!.id).single();
  const gymId = gymUser!.gym_id as string;
  const saas_plan = (gymUser?.gym as any)?.saas_plan ?? "starter";
  const locked = saas_plan === "starter";
  const { data: templates } = await supabase.from("whatsapp_templates").select("*").eq("gym_id", gymId).order("created_at");
  const { data: logs } = await supabase.from("whatsapp_logs").select("*").eq("gym_id", gymId).order("sent_at", { ascending: false }).limit(20);
  const sentTotal = (templates ?? []).reduce((s: number, t: any) => s + (t.sent_count ?? 0), 0);
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-black text-foreground tracking-tight">WhatsApp Automation</h1><p className="text-sm text-muted-foreground">Automated messages and renewal reminders</p></div>
        {locked ? (
          <div className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">🔒 Growth Plan required</div>
        ) : (
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg">+ Create Template</button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Templates", value: String((templates??[]).length), emoji:"📋", color:"text-orange-500" },
          { label:"Total Sent", value: String(sentTotal), emoji:"📤", color:"text-emerald-400" },
          { label:"Active", value: String((templates??[]).filter((t:any)=>t.is_active).length), emoji:"✅", color:"text-blue-400" },
          { label:"Logs", value: String((logs??[]).length), emoji:"📜", color:"text-purple-400" },
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xl mb-1">{s.emoji}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {(templates ?? []).map((tmpl: any) => (
          <div key={tmpl.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-48">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-foreground">{tmpl.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tmpl.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                    {tmpl.is_active ? "● Active" : "○ Inactive"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">⚡ Trigger: {tmpl.trigger} {tmpl.days_before > 0 ? `· ${tmpl.days_before} days before` : ""}</div>
                <div className="bg-background border-l-2 border-emerald-500 px-3 py-2 rounded-r-xl text-xs text-muted-foreground italic">{tmpl.message}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xl font-black text-foreground">{tmpl.sent_count}</div>
                <div className="text-[10px] text-muted-foreground">sent</div>
                {!locked && <button className="text-xs font-semibold border border-border px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">Edit</button>}
              </div>
            </div>
          </div>
        ))}
        {(templates ?? []).length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-2xl">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-muted-foreground">{locked ? "Upgrade to Growth plan to use WhatsApp automation" : "No templates yet. Create your first one."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
