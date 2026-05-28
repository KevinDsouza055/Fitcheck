import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: gymUser } = await supabase.from("gym_users").select("gym_id").eq("auth_id", user.id).single();
  if (!gymUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { member_ids, template_id, custom_message } = body;

  // Get template
  let message = custom_message;
  let template: any = null;
  if (template_id) {
    const { data } = await supabase.from("whatsapp_templates").select("*").eq("id", template_id).eq("gym_id", gymUser.gym_id).single();
    template = data;
    message = data?.message;
  }

  if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

  // Get members
  const { data: members } = await supabase
    .from("members")
    .select("id, name, phone, expiry_date, membership_plan:membership_plans(name)")
    .in("id", member_ids)
    .eq("gym_id", gymUser.gym_id);

  const { data: gym } = await supabase.from("gyms").select("name").eq("id", gymUser.gym_id).single();

  const results = [];
  for (const m of members ?? []) {
    const filled = message
      .replace(/\{\{name\}\}/g, m.name)
      .replace(/\{\{gym\}\}/g, gym?.name ?? "")
      .replace(/\{\{plan\}\}/g, (m as any).membership_plan?.name ?? "")
      .replace(/\{\{date\}\}/g, m.expiry_date ? new Date(m.expiry_date).toLocaleDateString("en-IN") : "");

    const result = await sendWhatsAppMessage(m.phone, filled);

    // Log it
    await supabase.from("whatsapp_logs").insert({
      gym_id: gymUser.gym_id,
      template_id: template_id ?? null,
      member_id: m.id,
      phone: m.phone,
      message: filled,
      status: result.success ? "sent" : "failed",
      error: result.error ?? null,
    });

    results.push({ member: m.name, success: result.success });
  }

  // Update sent count
  if (template_id) {
    await supabase.from("whatsapp_templates")
      .update({ sent_count: (template?.sent_count ?? 0) + results.filter(r => r.success).length })
      .eq("id", template_id);
  }

  return NextResponse.json({ results, sent: results.filter(r => r.success).length });
}
