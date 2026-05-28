"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export function PlansClient({ plans, gymId, canManage }: { plans: any[]; gymId: string; canManage: boolean }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  async function handleToggle(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("membership_plans").update({ is_active: !current }).eq("id", id);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("membership_plans").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Plan deleted"); router.refresh(); }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Membership Plans</h1>
          <p className="text-sm text-muted-foreground">Design your gym's pricing tiers</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
            + Create Plan
          </button>
        )}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No plans yet</h3>
          <p className="text-sm text-muted-foreground mb-5">Create your first membership plan</p>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors">
            + Create First Plan
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.id}
            className={`bg-card rounded-2xl p-5 relative overflow-hidden ${plan.is_active ? "border-2 border-border hover:border-orange-500/40" : "border border-border opacity-60"} transition-all`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm font-bold text-foreground">{plan.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{plan.duration_days} days · {plan.duration}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${plan.is_active ? "bg-emerald-400" : "bg-slate-500"}`} />
              </div>
            </div>

            <div className="mb-4">
              <span className="text-2xl font-black" style={{ color: plan.color ?? "#F97316" }}>
                {formatCurrency(plan.price)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">/ {plan.duration}</span>
            </div>

            <div className="space-y-1.5 mb-5">
              {(plan.features ?? []).map((f: string) => (
                <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-emerald-400">✓</span> {f}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
              <span>{(plan.members?.[0]?.count ?? 0)} members</span>
              <span>{plan.is_active ? "Active" : "Inactive"}</span>
            </div>

            {canManage && (
              <div className="flex gap-2">
                <button onClick={() => handleToggle(plan.id, plan.is_active)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${plan.is_active ? "border border-border text-muted-foreground hover:text-foreground" : "bg-emerald-500/10 text-emerald-400"}`}>
                  {plan.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => setEditPlan(plan)}
                  className="flex-1 py-1.5 text-xs font-bold bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(plan.id, plan.name)}
                  className="py-1.5 px-2 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(showCreate || editPlan) && (
        <PlanModal
          plan={editPlan}
          gymId={gymId}
          onClose={() => { setShowCreate(false); setEditPlan(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function PlanModal({ plan, gymId, onClose }: { plan?: any; gymId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: plan?.name ?? "",
    duration: plan?.duration ?? "monthly",
    duration_days: String(plan?.duration_days ?? 30),
    price: String(plan?.price ?? ""),
    color: plan?.color ?? "#F97316",
    features: (plan?.features ?? []).join("\n"),
    description: plan?.description ?? "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.name || !form.price) { toast.error("Name and price are required"); return; }
    startTransition(async () => {
      const supabase = createClient();
      const data = {
        gym_id: gymId,
        name: form.name,
        duration: form.duration as any,
        duration_days: parseInt(form.duration_days),
        price: parseFloat(form.price),
        color: form.color,
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
        description: form.description,
      };
      if (plan) {
        const { error } = await supabase.from("membership_plans").update(data).eq("id", plan.id);
        if (error) { toast.error(error.message); return; }
        toast.success("Plan updated");
      } else {
        const { error } = await supabase.from("membership_plans").insert(data);
        if (error) { toast.error(error.message); return; }
        toast.success("Plan created");
      }
      onClose();
    });
  }

  const durationPresets = [
    { label: "Monthly", value: "monthly", days: "30" },
    { label: "Quarterly", value: "quarterly", days: "90" },
    { label: "Half Yearly", value: "half_yearly", days: "180" },
    { label: "Yearly", value: "yearly", days: "365" },
    { label: "Custom", value: "custom", days: form.duration_days },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">{plan ? "Edit Plan" : "Create New Plan"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Plan Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Monthly Flex"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {durationPresets.map((d) => (
                <button key={d.value} onClick={() => { set("duration", d.value); set("duration_days", d.days); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.duration === d.value ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-border text-muted-foreground"}`}>
                  {d.label}
                </button>
              ))}
            </div>
            {form.duration === "custom" && (
              <input type="number" value={form.duration_days} onChange={(e) => set("duration_days", e.target.value)}
                placeholder="Days" className="mt-2 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500" />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Price (₹) *</label>
            <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="1500"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Accent Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
              <span className="text-sm text-muted-foreground">{form.color}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Features (one per line)</label>
            <textarea value={form.features} onChange={(e) => set("features", e.target.value)}
              placeholder={"Gym Access\nLocker\n2 PT Sessions"} rows={4}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground resize-none outline-none focus:border-orange-500 placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-60">
            {isPending ? "Saving…" : plan ? "Save Changes" : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
