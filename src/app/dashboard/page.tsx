import { Suspense } from "react";
import { getDashboardStats, getRecentActivity, getMonthlyRevenue, getWeeklyAttendance } from "@/lib/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [stats, activity, revenue, attendance] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    getMonthlyRevenue(),
    getWeeklyAttendance(),
  ]);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient
        stats={stats.data ?? null}
        checkins={activity.checkins}
        payments={activity.payments}
        revenueData={revenue.data ?? []}
        attendanceData={attendance.data ?? []}
      />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-card rounded-lg w-64" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-xl border border-border" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-card rounded-xl border border-border" />
        <div className="h-64 bg-card rounded-xl border border-border" />
      </div>
    </div>
  );
}
