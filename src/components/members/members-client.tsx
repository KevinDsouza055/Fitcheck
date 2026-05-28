"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { createMember, deleteMember, renewMember } from "@/lib/actions/members";
import { formatCurrency, formatDate, getInitials, getAvatarColor, getMemberStatusColor, downloadCSV } from "@/lib/utils";
import type { Member, MembershipPlan, MemberFormData } from "@/types";

interface Props {
  members: (Member & { membership_plan?: MembershipPlan; branch?: { name: string } })[];
  total: number;
  plans: MembershipPlan[];
  gymId: string;
  initialStatus: string;
  initialSearch: string;
  initialAction?: string;
  page: number;
}

export function MembersClient({ members, total, plans, gymId, initialStatus, initialSearch, initialAction, page }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [showAdd, setShowAdd] = useState(initialAction === "add");
  const [selectedMember, setSelectedMember] = useState<(Member & { membership_plan?: MembershipPlan; branch?: { name: string } }) | null>(null);
  const [isPending, startTransition] = useTransition();

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams();
    if (updates.status || initialStatus !== "all") params.set("status", updates.status ?? initialStatus);
    if (updates.search !== undefined ? updates.search : initialSearch) params.set("search", updates.search ?? initialSearch);
    if (updates.page) params.set("page", updates.page);
    router.push(`/dashboard/members?${params.toString()}`);
  }

  function handleExport() {
    downloadCSV(
      members.map((m) => ({
        Name: m.name, Phone: m.phone, Email: m.email ?? "", Plan: m.membership_plan?.name ?? "",
        Status: m.status, "Join Date": formatDate(m.join_date), "Expiry": m.expiry_date ? formatDate(m.expiry_date) : "",
      })),
      "members"
    );
    toast.success("CSV exported successfully");
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteMember(id);
      if (res.error) toast.error(res.error);
      else { toast.success(`${name} deleted`); router.refresh(); }
    });
  }

  const statusColors = {
    active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    expiring: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    expired: "bg-red-500/10 text-red-400 border border-red-500/20",
    frozen: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    inactive: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">{total} total · {members.filter(m => m.status === "active").length} active on this page</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground bg-card border border-border rounded-lg hover:text-foreground transition-colors">
            ⬇ Export CSV
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
            + Add Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-3.5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center bg-background border border-border rounded-lg px-3 py-2 gap-2 flex-1 min-w-48">
          <span className="text-muted-foreground text-sm">🔍</span>
          <input
            defaultValue={initialSearch}
            onChange={(e) => navigate({ search: e.target.value })}
            placeholder="Search name, phone, email…"
            className="bg-transparent text-sm text-foreground outline-none flex-1 placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "active", "expiring", "expired", "frozen"].map((s) => (
            <button key={s} onClick={() => navigate({ status: s, page: "0" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                initialStatus === s ? "bg-orange-500 text-white" : "bg-background border border-border text-muted-foreground hover:text-foreground"
              }`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["grid", "table"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${view === v ? "bg-border text-foreground" : "border-border text-muted-foreground"}`}>
              {v === "grid" ? "⊞" : "≡"}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {members.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-bold text-foreground mb-2">No members found</h3>
          <p className="text-sm text-muted-foreground mb-5">
            {initialSearch ? `No results for "${initialSearch}"` : "Add your first member to get started"}
          </p>
          <button onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors">
            + Add First Member
          </button>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((m) => {
            const color = getAvatarColor(m.name);
            const sc = statusColors[m.status as keyof typeof statusColors] ?? statusColors.inactive;
            return (
              <div key={m.id}
                className="bg-card border border-border hover:border-orange-500/40 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 group"
                onClick={() => router.push(`/dashboard/members/${m.id}`)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                      style={{
                        background: color + "22",
                        color,
                        boxShadow: `0 0 0 2px ${color}44`,
                      }}>
                      {m.photo_url
                        ? <Image src={m.photo_url} alt={m.name} width={44} height={44} className="rounded-full object-cover" />
                        : getInitials(m.name)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground group-hover:text-orange-500 transition-colors">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.membership_plan?.name ?? "No plan"}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${sc}`}>{m.status}</span>
                </div>
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-foreground font-medium">{m.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Expiry</span><span className="text-foreground font-medium">{m.expiry_date ? formatDate(m.expiry_date) : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-foreground font-bold">{formatCurrency(m.membership_plan?.price ?? 0)}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/members/${m.id}`); }}
                    className="flex-1 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:text-foreground transition-colors">
                    View Profile
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedMember(m); }}
                    className="flex-1 py-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 rounded-lg hover:bg-orange-500/20 transition-colors">
                    Renew
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {view === "table" && members.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Member", "Plan", "Phone", "Expiry", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const color = getAvatarColor(m.name);
                  const sc = statusColors[m.status as keyof typeof statusColors] ?? statusColors.inactive;
                  return (
                    <tr key={m.id} onClick={() => router.push(`/dashboard/members/${m.id}`)}
                      className="border-b border-border hover:bg-accent cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: color + "22", color }}>{getInitials(m.name)}</div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.email ?? ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{m.membership_plan?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{m.phone}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{m.expiry_date ? formatDate(m.expiry_date) : "—"}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${sc}`}>{m.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setSelectedMember(m)}
                            className="px-2.5 py-1 text-xs font-bold text-orange-500 bg-orange-500/10 rounded-lg hover:bg-orange-500/20 transition-colors">
                            Renew
                          </button>
                          <button onClick={() => handleDelete(m.id, m.name)}
                            className="px-2.5 py-1 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Showing {page * 20 + 1}–{Math.min((page + 1) * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => navigate({ page: String(page - 1) })}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-accent transition-colors">← Prev</button>
            <button disabled={(page + 1) * 20 >= total} onClick={() => navigate({ page: String(page + 1) })}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-accent transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAdd && <AddMemberModal plans={plans} gymId={gymId} onClose={() => { setShowAdd(false); router.refresh(); }} />}

      {/* Renew Modal */}
      {selectedMember && (
        <RenewModal member={selectedMember} plans={plans}
          onClose={() => { setSelectedMember(null); router.refresh(); }} />
      )}
    </div>
  );
}

function AddMemberModal({ plans, gymId, onClose }: { plans: MembershipPlan[]; gymId: string; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<Record<string, string>>({
    join_date: new Date().toISOString().split("T")[0],
  });

  const set = (k: string, v: string) => setFormData((p) => ({ ...p, [k]: v }));

  const formFields: [string, string, string, string][] = [
    ["name", "Full Name *", "text", "Arjun Sharma"],
    ["phone", "Phone *", "tel", "+91 98765 43210"],
    ["email", "Email", "email", "arjun@gmail.com"],
    ["emergency_name", "Emergency Contact Name", "text", ""],
    ["emergency_phone", "Emergency Contact Phone", "tel", ""],
  ];

  async function handleSubmit() {
    startTransition(async () => {
      const res = await createMember({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        membership_plan_id: formData.plan_id || undefined,
        join_date: formData.join_date,
        emergency_contact_name: formData.emergency_name,
        emergency_contact_phone: formData.emergency_phone,
        notes: formData.notes,
      } as MemberFormData);

      if (res.error) { toast.error(res.error); return; }
      toast.success(`${formData.name} added successfully! 🎉`);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Add New Member</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl transition-colors">×</button>
        </div>

        {/* Steps */}
        <div className="px-6 pt-5">
          <div className="flex gap-2 mb-5">
            {["Personal Info", "Membership", "Payment"].map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full mb-1.5 transition-colors ${i + 1 <= step ? "bg-orange-500" : "bg-border"}`} />
                <span className={`text-[11px] font-semibold ${i + 1 <= step ? "text-orange-500" : "text-muted-foreground"}`}>{s}</span>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              {formFields.map(([k, label, type, ph]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                  <input type={type} placeholder={ph} value={formData[k] ?? ""} onChange={(e) => set(k, e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Select Plan</label>
              {plans.map((p) => (
                <div key={p.id} onClick={() => set("plan_id", p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.plan_id === p.id ? "border-orange-500 bg-orange-500/10" : "border-border hover:border-border/80"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.duration_days} days</div>
                    </div>
                    <div className="text-lg font-black text-orange-500">{formatCurrency(p.price)}</div>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Join Date</label>
                <input type="date" value={formData.join_date} onChange={(e) => set("join_date", e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {["cash", "upi", "card", "bank_transfer"].map((m) => (
                  <button key={m} onClick={() => set("payment_method", m)}
                    className={`py-3 rounded-xl border text-sm font-semibold capitalize transition-all ${formData.payment_method === m ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-border text-muted-foreground hover:border-orange-500/40"}`}>
                    {m.replace("_", " ")}
                  </button>
                ))}
              </div>
              {plans.find((p) => p.id === formData.plan_id) && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <div className="text-xs text-muted-foreground">Amount Due</div>
                  <div className="text-3xl font-black text-emerald-400">{formatCurrency(plans.find((p) => p.id === formData.plan_id)!.price)}</div>
                  <div className="text-xs text-muted-foreground">{plans.find((p) => p.id === formData.plan_id)!.name}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-5 border-t border-border mt-5">
          {step > 1 && (
            <button onClick={() => setStep((p) => p - 1)}
              className="px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button onClick={() => setStep((p) => p + 1)} disabled={step === 1 && (!formData.name || !formData.phone)}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isPending}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60">
              {isPending ? "Saving…" : "✓ Save Member"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RenewModal({ member, plans, onClose }: { member: Member; plans: MembershipPlan[]; onClose: () => void }) {
  const [planId, setPlanId] = useState(member.membership_plan_id ?? "");
  const [method, setMethod] = useState("cash");
  const [isPending, startTransition] = useTransition();

  const selectedPlan = plans.find((p) => p.id === planId);

  async function handleRenew() {
    if (!planId) { toast.error("Select a plan"); return; }
    startTransition(async () => {
      const res = await renewMember(member.id, planId, method, selectedPlan!.price);
      if (res.error) { toast.error(res.error); return; }
      toast.success(`${member.name} renewed until ${res.new_expiry} 🎉`);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Renew Membership</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Renewing for <strong className="text-foreground">{member.name}</strong></p>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Select Plan</label>
            {plans.map((p) => (
              <div key={p.id} onClick={() => setPlanId(p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${planId === p.id ? "border-orange-500 bg-orange-500/10" : "border-border"}`}>
                <div className="text-sm font-semibold text-foreground">{p.name}</div>
                <div className="text-sm font-black text-orange-500">{formatCurrency(p.price)}</div>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {["cash", "upi", "card", "bank_transfer"].map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`py-2 rounded-lg border text-xs font-semibold capitalize ${method === m ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-border text-muted-foreground"}`}>
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground">Cancel</button>
          <button onClick={handleRenew} disabled={isPending || !planId}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
            {isPending ? "Renewing…" : "✓ Confirm Renewal"}
          </button>
        </div>
      </div>
    </div>
  );
}
