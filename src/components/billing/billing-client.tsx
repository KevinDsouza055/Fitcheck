"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency, formatDate, planLimits } from "@/lib/utils";
import type { Gym } from "@/types";

const SAAS_PLANS = [
  {
    id: "starter", name: "Starter", price_monthly: 999, price_annual: 9990, color: "#10B981",
    limits: { members: 100, staff: 2, branches: 1 },
    features: ["100 members", "2 staff accounts", "1 branch", "Basic dashboard", "Attendance & payments", "Email support"],
    locked: ["Advanced analytics", "WhatsApp automation", "Multi-branch", "API access"],
  },
  {
    id: "growth", name: "Growth", price_monthly: 2499, price_annual: 24990, color: "#F97316", badge: "POPULAR",
    limits: { members: 500, staff: 10, branches: 3 },
    features: ["500 members", "10 staff accounts", "3 branches", "Advanced analytics", "Revenue forecasting", "WhatsApp reminders", "CSV export", "Priority support"],
    locked: ["Full WhatsApp automation", "API access", "White label"],
  },
  {
    id: "pro", name: "Pro", price_monthly: 5999, price_annual: 59990, color: "#8B5CF6", badge: "ENTERPRISE",
    limits: { members: Infinity, staff: Infinity, branches: Infinity },
    features: ["Unlimited everything", "Full analytics suite", "WhatsApp automation", "Public API", "Custom branding", "Dedicated support", "SLA guarantee"],
    locked: [],
  },
];

interface Props {
  gym: Gym;
  billingHistory: any[];
  usage: { members: number; staff: number; branches: number };
}

export function BillingClient({ gym, billingHistory, usage }: Props) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const currentPlanConfig = SAAS_PLANS.find((p) => p.id === gym.saas_plan) ?? SAAS_PLANS[0];
  const limits = planLimits(gym.saas_plan);

  function handleUpgrade(planId: string) {
    toast.info(`Redirecting to Razorpay for ${planId} plan… (Razorpay integration ready in production)`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black text-foreground tracking-tight">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground">Manage your GymOS plan</p>
      </div>

      {/* Current plan card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: currentPlanConfig.color + "20" }}>💎</div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-foreground">{currentPlanConfig.name} Plan</h2>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {gym.sub_status === "trial" ? "TRIAL" : "ACTIVE"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {gym.sub_status === "trial"
                  ? `Trial ends ${gym.trial_ends_at ? formatDate(gym.trial_ends_at) : "soon"}`
                  : `${formatCurrency(currentPlanConfig.price_monthly)}/month · Next billing on 1st`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 text-xs font-semibold border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              Manage Invoice
            </button>
            <button className="px-3 py-2 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
              Cancel Plan
            </button>
          </div>
        </div>

        {/* Usage bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
          {[
            { label: "Members", used: usage.members, max: limits.members },
            { label: "Staff Accounts", used: usage.staff, max: limits.staff },
            { label: "Branches", used: usage.branches, max: limits.branches },
          ].map((u) => {
            const isUnlimited = u.max === Infinity;
            const pct = isUnlimited ? 15 : Math.min((u.used / u.max) * 100, 100);
            const warn = pct > 80;
            return (
              <div key={u.label} className="bg-background rounded-xl p-3.5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">{u.label}</span>
                  <span className={`font-bold ${warn ? "text-amber-400" : "text-foreground"}`}>
                    {u.used} / {isUnlimited ? "∞" : u.max}
                  </span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${warn ? "bg-amber-500" : "bg-orange-500"}`}
                    style={{ width: `${pct}%` }} />
                </div>
                {warn && !isUnlimited && <p className="text-[10px] text-amber-400 mt-1">Approaching limit</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan toggle */}
      <div className="flex justify-center">
        <div className="bg-card border border-border rounded-xl p-1 flex">
          {(["monthly", "annual"] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${billing === b ? "bg-orange-500 text-white" : "text-muted-foreground"}`}>
              {b === "monthly" ? "Monthly" : "Annual"}
              {b === "annual" && <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Save 17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SAAS_PLANS.map((plan) => {
          const isCurrent = plan.id === gym.saas_plan;
          const price = billing === "annual" ? Math.round(plan.price_annual / 12) : plan.price_monthly;
          return (
            <div key={plan.id}
              className={`bg-card rounded-2xl p-6 relative transition-all hover:-translate-y-1 ${isCurrent ? `border-2` : "border border-border hover:border-orange-500/30"}`}
              style={{ borderColor: isCurrent ? plan.color : undefined }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-white px-3 py-1 rounded-full"
                  style={{ background: plan.color }}>{plan.badge}</div>
              )}
              <div className="mb-5">
                <div className="text-base font-bold text-foreground mb-1">{plan.name}</div>
                <div className="text-3xl font-black" style={{ color: plan.color }}>
                  {formatCurrency(price)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
                {billing === "annual" && (
                  <div className="text-xs text-emerald-400 mt-0.5">
                    {formatCurrency(plan.price_annual)} billed annually
                  </div>
                )}
              </div>
              <div className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-foreground">
                    <span style={{ color: plan.color }}>✓</span> {f}
                  </div>
                ))}
                {plan.locked.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground/50">
                    <span>🔒</span> {f}
                  </div>
                ))}
              </div>
              <button onClick={() => !isCurrent && handleUpgrade(plan.id)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isCurrent ? "bg-border text-muted-foreground cursor-default" : "text-white hover:opacity-90"
                }`}
                style={{ background: isCurrent ? undefined : plan.color }}>
                {isCurrent ? "Current Plan" : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Billing history */}
      {billingHistory.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Billing History</h3>
          </div>
          <div className="divide-y divide-border">
            {billingHistory.map((b) => (
              <div key={b.id} className="flex justify-between items-center px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-foreground capitalize">{b.event_type?.replace(".", " — ")}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(b.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  {b.amount && <span className="text-sm font-black text-foreground">{formatCurrency(b.amount)}</span>}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.processed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {b.processed ? "Processed" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {billingHistory.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-sm text-muted-foreground">No billing history yet. Invoices will appear here after your first payment.</p>
        </div>
      )}
    </div>
  );
}
