"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPayment } from "@/lib/actions/payments";
import { formatCurrency, formatDate, formatRelativeTime, getInitials, getAvatarColor, downloadCSV } from "@/lib/utils";
import type { MembershipPlan } from "@/types";

interface Props {
  payments: any[];
  total: number;
  monthRevenue: number;
  pendingDues: number;
  members: any[];
  plans: MembershipPlan[];
  gymId: string;
  initialStatus: string;
  page: number;
}

export function PaymentsClient({ payments, total, monthRevenue, pendingDues, members, plans, gymId, initialStatus, page }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  function handleExport() {
    downloadCSV(
      payments.map((p) => ({
        "Txn ID": p.id.slice(0, 8),
        Member: p.member?.name ?? "",
        Plan: p.membership_plan?.name ?? "",
        Amount: p.final_amount,
        Method: p.payment_method,
        Status: p.status,
        Date: p.payment_date ? formatDate(p.payment_date) : "",
      })),
      "payments"
    );
    toast.success("Exported successfully");
  }

  const statusStyle: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-amber-500/10 text-amber-400",
    failed: "bg-red-500/10 text-red-400",
    refunded: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">Revenue tracking, dues and invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground bg-card border border-border rounded-lg hover:text-foreground transition-colors">
            ⬇ Export CSV
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
            + Record Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { emoji: "💰", label: "Month Revenue", value: formatCurrency(monthRevenue), color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { emoji: "📥", label: "Total Payments", value: String(total), color: "text-orange-500", bg: "bg-orange-500/10" },
          { emoji: "⏰", label: "Pending Dues", value: formatCurrency(pendingDues), color: "text-amber-400", bg: "bg-amber-500/10" },
          { emoji: "❌", label: "Failed", value: String(payments.filter((p) => p.status === "failed").length), color: "text-red-400", bg: "bg-red-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-base mb-3`}>{s.emoji}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {["all", "success", "pending", "failed"].map((s) => (
          <button key={s} onClick={() => { setStatus(s); router.push(`/dashboard/payments${s !== "all" ? `?status=${s}` : ""}`); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${status === s ? "bg-orange-500 text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {s === "all" ? "All Transactions" : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["Txn ID", "Member", "Plan", "Amount", "Method", "Date", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No payments found</td></tr>
              )}
              {payments.map((p) => {
                const name = p.member?.name ?? "Unknown";
                const color = getAvatarColor(name);
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-accent transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: color + "22", color }}>{getInitials(name)}</div>
                        <span className="text-sm font-semibold text-foreground">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.membership_plan?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-black text-foreground">{formatCurrency(p.final_amount)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{p.payment_method?.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.payment_date ? formatDate(p.payment_date, "dd MMM") : formatRelativeTime(p.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusStyle[p.status] ?? ""}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg hover:bg-blue-500/20 transition-colors">
                        Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Showing {page * 20 + 1}–{Math.min((page + 1) * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => router.push(`/dashboard/payments?page=${page - 1}${status !== "all" ? `&status=${status}` : ""}`)}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-accent">← Prev</button>
            <button disabled={(page + 1) * 20 >= total} onClick={() => router.push(`/dashboard/payments?page=${page + 1}${status !== "all" ? `&status=${status}` : ""}`)}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-accent">Next →</button>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAdd && (
        <AddPaymentModal members={members} plans={plans} gymId={gymId} onClose={() => { setShowAdd(false); router.refresh(); }} />
      )}
    </div>
  );
}

function AddPaymentModal({ members, plans, gymId, onClose }: { members: any[]; plans: MembershipPlan[]; gymId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    member_id: "", membership_plan_id: "", amount: "", discount: "0",
    payment_method: "cash", payment_date: new Date().toISOString().split("T")[0], notes: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const selectedPlan = plans.find((p) => p.id === form.membership_plan_id);
  const finalAmount = (parseFloat(form.amount || "0") - parseFloat(form.discount || "0"));

  async function handleSubmit() {
    if (!form.member_id || !form.amount) { toast.error("Member and amount are required"); return; }
    startTransition(async () => {
      const res = await createPayment({
        member_id: form.member_id,
        membership_plan_id: form.membership_plan_id || undefined,
        amount: parseFloat(form.amount),
        discount: parseFloat(form.discount || "0"),
        payment_method: form.payment_method as any,
        payment_date: form.payment_date,
        notes: form.notes || undefined,
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Payment recorded ✅");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Record Payment</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Member *</label>
            <select value={form.member_id} onChange={(e) => set("member_id", e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500">
              <option value="">Select member…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Membership Plan</label>
            <select value={form.membership_plan_id}
              onChange={(e) => {
                const p = plans.find((pl) => pl.id === e.target.value);
                set("membership_plan_id", e.target.value);
                if (p) set("amount", String(p.price));
              }}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500">
              <option value="">No plan / Custom</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Discount (₹)</label>
              <input type="number" value={form.discount} onChange={(e) => set("discount", e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {["cash", "upi", "card", "bank_transfer"].map((m) => (
                <button key={m} onClick={() => set("payment_method", m)}
                  className={`py-2 rounded-lg border text-xs font-semibold capitalize ${form.payment_method === m ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-border text-muted-foreground hover:border-orange-500/40"}`}>
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payment Date</label>
            <input type="date" value={form.payment_date} onChange={(e) => set("payment_date", e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500" />
          </div>
          {finalAmount > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <div className="text-xs text-muted-foreground">Final Amount</div>
              <div className="text-2xl font-black text-emerald-400">{formatCurrency(finalAmount)}</div>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-60">
            {isPending ? "Saving…" : "✓ Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
