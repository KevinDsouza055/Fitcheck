import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendRenewalReminder } from "@/lib/email";
import { formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createServiceClient();

  // Update expired member statuses
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("members").update({ status: "expired" }).eq("status", "active").lt("expiry_date", today);

  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const seven = in7.toISOString().split("T")[0];
  await supabase.from("members").update({ status: "expiring" }).eq("status", "active").gte("expiry_date", today).lte("expiry_date", seven);

  // Get expiring members
  const { data: expiring } = await supabase
    .from("members")
    .select("id, name, phone, email, expiry_date, gym_id, membership_plan:membership_plans(name), gym:gyms(name,saas_plan)")
    .eq("status", "expiring");

  let sent = 0;
  for (const m of expiring ?? []) {
    const gym = (m as any).gym;
    const plan = (m as any).membership_plan;
    if (!gym) continue;
    const { data: tmpl } = await supabase.from("whatsapp_templates").select("message,sent_count").eq("gym_id", m.gym_id).eq("trigger", "renewal_reminder").eq("is_active", true).single();
    if (tmpl && gym.saas_plan !== "starter") {
      const msg = tmpl.message.replace(/\{\{name\}\}/g, m.name).replace(/\{\{gym\}\}/g, gym.name).replace(/\{\{plan\}\}/g, plan?.name ?? "").replace(/\{\{date\}\}/g, m.expiry_date ? formatDate(m.expiry_date) : "");
      await sendWhatsAppMessage(m.phone, msg).catch(() => {});
    }
    if (m.email) await sendRenewalReminder({ to: m.email, memberName: m.name, gymName: gym.name, planName: plan?.name ?? "", expiryDate: m.expiry_date ? formatDate(m.expiry_date) : "" }).catch(() => {});
    await supabase.from("notifications").insert({ gym_id: m.gym_id, title: `${m.name}'s membership expiring soon`, message: `Expires on ${m.expiry_date ? formatDate(m.expiry_date) : ""}`, type: "warning", link: `/dashboard/members/${m.id}` });
    sent++;
  }
  return NextResponse.json({ ok: true, processed: expiring?.length ?? 0, sent });
}
