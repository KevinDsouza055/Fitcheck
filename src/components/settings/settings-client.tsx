"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function SettingsClient({ gymUser }: { gymUser: any }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState("gym");
  const [isPending, startTransition] = useTransition();
  const [gym, setGym] = useState({
    name: gymUser?.gym?.name ?? "",
    email: gymUser?.gym?.email ?? "",
    phone: gymUser?.gym?.phone ?? "",
    address: gymUser?.gym?.address ?? "",
    city: gymUser?.gym?.city ?? "",
    state: gymUser?.gym?.state ?? "",
    timezone: gymUser?.gym?.timezone ?? "Asia/Kolkata",
  });
  const [account, setAccount] = useState({
    name: gymUser?.name ?? "",
    phone: gymUser?.phone ?? "",
  });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  async function saveGym() {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("gyms").update(gym).eq("id", gymUser.gym_id);
      if (error) toast.error(error.message);
      else { toast.success("Gym profile saved"); router.refresh(); }
    });
  }

  async function saveAccount() {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("gym_users").update({ name: account.name, phone: account.phone }).eq("id", gymUser.id);
      if (error) toast.error(error.message);
      else toast.success("Account updated");
    });
  }

  async function changePassword() {
    if (passwords.newPass !== passwords.confirm) { toast.error("Passwords don't match"); return; }
    if (passwords.newPass.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
      if (error) toast.error(error.message);
      else { toast.success("Password updated"); setPasswords({ current: "", newPass: "", confirm: "" }); }
    });
  }

  const tabs = ["gym", "account", "security", "notifications"];

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-xl font-black text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your gym profile and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-orange-500 text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Gym Profile */}
      {tab === "gym" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Gym Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Gym Name", "name", "text"],
              ["Email", "email", "email"],
              ["Phone", "phone", "tel"],
              ["City", "city", "text"],
              ["State", "state", "text"],
              ["Address", "address", "text"],
            ].map(([label, key, type]) => (
              <div key={key} className={key === "address" ? "col-span-2" : ""}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                <input type={type} value={(gym as any)[key]}
                  onChange={(e) => setGym((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Timezone</label>
              <select value={gym.timezone} onChange={(e) => setGym((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500">
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
          <button onClick={saveGym} disabled={isPending}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-colors">
            {isPending ? "Saving…" : "Save Gym Profile"}
          </button>
        </div>
      )}

      {/* Account */}
      {tab === "account" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Personal Info</h2>
            {[["Your Name", "name", "text"], ["Phone", "phone", "tel"]].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                <input type={type} value={(account as any)[key]}
                  onChange={(e) => setAccount((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors" />
              </div>
            ))}
            <button onClick={saveAccount} disabled={isPending}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-60">
              {isPending ? "Saving…" : "Save Account"}
            </button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-sm font-bold text-foreground mb-4">Preferences</h2>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <div className="text-sm font-semibold text-foreground">Dark Mode</div>
                <div className="text-xs text-muted-foreground">Switch between light and dark theme</div>
              </div>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`w-11 h-6 rounded-full relative transition-colors ${theme === "dark" ? "bg-orange-500" : "bg-border"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${theme === "dark" ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Change Password</h2>
          {[
            ["New Password", "newPass", "Minimum 8 characters"],
            ["Confirm Password", "confirm", "Repeat new password"],
          ].map(([label, key, ph]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
              <input type="password" placeholder={ph} value={(passwords as any)[key]}
                onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors" />
            </div>
          ))}
          <button onClick={changePassword} disabled={isPending || !passwords.newPass}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-colors">
            {isPending ? "Updating…" : "Update Password"}
          </button>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Notification Preferences</h2>
          {[
            ["Membership Expiry Alerts", "Get notified when memberships are expiring", true],
            ["New Member Notifications", "Alert when a new member joins", true],
            ["Payment Reminders", "Remind members with pending dues", true],
            ["Daily Report Email", "Receive daily summary every morning", false],
            ["WhatsApp Automation", "Send automated WhatsApp messages", gymUser?.gym?.saas_plan !== "starter"],
          ].map(([title, desc, enabled]) => (
            <div key={title as string} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <div className="text-sm font-semibold text-foreground">{title as string}</div>
                <div className="text-xs text-muted-foreground">{desc as string}</div>
              </div>
              {enabled ? (
                <button className="w-11 h-6 rounded-full bg-orange-500 relative">
                  <div className="absolute top-1 left-6 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              ) : (
                <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">🔒 Upgrade</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
