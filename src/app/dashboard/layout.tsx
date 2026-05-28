import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { planLimits } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: gymUser } = await supabase
    .from("gym_users")
    .select("*, gym:gyms(*)")
    .eq("auth_id", user.id)
    .single();

  if (!gymUser) redirect("/auth/login");

  // Redirect to onboarding if not complete
  if (!gymUser.gym?.onboarded) redirect("/onboarding");

  // Unread notifications count
  const { count: notifCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymUser.gym_id)
    .eq("is_read", false);

  // Member usage
  const { count: memberCount } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymUser.gym_id);

  const limits = planLimits(gymUser.gym?.saas_plan ?? "starter");

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex">
        <Sidebar
          user={gymUser as any}
          notifCount={notifCount ?? 0}
          memberUsage={{ used: memberCount ?? 0, limit: limits.members }}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="GymOS"
          gymId={gymUser.gym_id}
        />
        <main className="flex-1 p-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
