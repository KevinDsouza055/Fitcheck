"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import type { GymUser, Gym } from "@/types";

const NAV = [
  { href: "/dashboard", emoji: "⚡", label: "Dashboard" },
  { href: "/dashboard/members", emoji: "👥", label: "Members" },
  { href: "/dashboard/attendance", emoji: "✅", label: "Attendance" },
  { href: "/dashboard/payments", emoji: "💳", label: "Payments" },
  { href: "/dashboard/plans", emoji: "📋", label: "Plans" },
  { href: "/dashboard/analytics", emoji: "📊", label: "Analytics" },
  { href: "/dashboard/branches", emoji: "🏢", label: "Branches" },
  { href: "/dashboard/staff", emoji: "👤", label: "Staff" },
  { href: "/dashboard/whatsapp", emoji: "💬", label: "WhatsApp" },
  { href: "/dashboard/notifications", emoji: "🔔", label: "Notifications" },
  { href: "/dashboard/activity", emoji: "📜", label: "Activity Log" },
  { href: "/dashboard/billing", emoji: "💎", label: "Billing" },
  { href: "/dashboard/settings", emoji: "⚙️", label: "Settings" },
];

interface SidebarProps {
  user: GymUser & { gym: Gym };
  notifCount?: number;
  memberUsage?: { used: number; limit: number };
}

export function Sidebar({ user, notifCount = 0, memberUsage }: SidebarProps) {
  const pathname = usePathname();
  const avatarColor = getAvatarColor(user.name);
  const pct = memberUsage ? Math.min((memberUsage.used / memberUsage.limit) * 100, 100) : 0;

  return (
    <aside className="w-[220px] flex-shrink-0 bg-gymos-sidebar border-r border-[#141B2A] flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-thin">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#141B2A]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-lg flex-shrink-0">
            🏋️
          </div>
          <div>
            <div className="text-[#F1F5F9] font-extrabold text-base tracking-tight leading-none">GymOS</div>
            <div className="mt-1">
              <span className="text-[9px] font-bold text-orange-500 bg-orange-500/15 px-1.5 py-0.5 rounded uppercase tracking-wide">
                {user.gym.saas_plan}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gym name */}
      <div className="px-3 py-2.5 border-b border-[#141B2A]">
        <div className="bg-white/5 border border-[#141B2A] rounded-lg px-3 py-2 cursor-pointer hover:bg-white/8 transition-colors">
          <div className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mb-0.5">GYM</div>
          <div className="text-slate-300 text-xs font-medium truncate">{user.gym.name}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-2 overflow-y-auto scrollbar-thin">
        {NAV.map(({ href, emoji, label }: { href: string; emoji: string; label: string }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const isNotif = href === "/dashboard/notifications" && notifCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13px] mb-0.5 transition-all duration-100 font-medium",
                isActive
                  ? "bg-orange-500 text-white font-bold"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              )}
            >
              <span className="text-sm">{emoji}</span>
              <span className="flex-1">{label}</span>
              {isNotif && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {notifCount}
                </span>
              )}
              {href === "/superadmin" && (
                <span className="bg-purple-500/20 text-purple-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">ADMIN</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage */}
      {memberUsage && (
        <div className="px-3.5 py-2.5 border-t border-[#141B2A]">
          <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1.5">MEMBER USAGE</div>
          <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", pct > 80 ? "bg-amber-500" : "bg-orange-500")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {memberUsage.used} / {memberUsage.limit === Infinity ? "∞" : memberUsage.limit}
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-3.5 py-3 border-t border-[#141B2A]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: avatarColor + "22", color: avatarColor, boxShadow: `0 0 0 2px ${avatarColor}44` }}
          >
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#F1F5F9] text-[12.5px] font-semibold truncate">{user.name}</div>
            <div className="text-slate-500 text-[10.5px] capitalize">{user.role}</div>
          </div>
          <form action={signOut}>
            <button type="submit" title="Sign out" className="text-slate-500 hover:text-slate-300 transition-colors text-base">
              ⇥
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
