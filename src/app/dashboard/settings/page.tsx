import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/settings-client";
export const metadata = { title: "Settings" };
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: gymUser } = await supabase.from("gym_users").select("*, gym:gyms(*)").eq("auth_id", user!.id).single();
  return <SettingsClient gymUser={gymUser as any} />;
}
