"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { updateMember, deleteMember } from "@/lib/actions/members";
import { formatCurrency, formatDate, formatRelativeTime, getInitials, getAvatarColor } from "@/lib/utils";
import type { Member, Payment, Attendance, MembershipPlan } from "@/types";

interface Props {
  member: Member & { membership_plan?: MembershipPlan; branch?: any };
  payments: (Payment & { membership_plan?: any })[];
  attendance: Attendance[];
  plans: MembershipPlan[];
}

export function MemberProfileClient({ member, payments, attendance, plans }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "attendance" | "qr">("overview");
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(member.notes ?? "");

  const color = getAvatarColor(member.name);
  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    expiring: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    expired: "bg-red-500/10 text-red-400 border-red-500/20",
    frozen: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const sc = statusColors[member.status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";

  // Attendance rate
  const totalDays = member.join_date
    ? Math.ceil((Date.now() - new Date(member.join_date).getTime()) / 86400000)
    : 30;
  const attendanceRate = totalDays > 0 ? Math.min(Math.round((attendance.length / Math.max(totalDays / 7, 1)) * 100), 100) : 0;

  async function handleDelete() {
    if (!confirm(`Permanently delete ${member.name}? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteMember(member.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Member deleted");
      router.push("/dashboard/members");
    });
  }

  async function handleSaveNotes() {
    startTransition(async () => {
      const res = await updateMember(member.id, { notes });
      if (res.error) toast.error(res.error);
      else toast.success("Notes saved");
    });
  }

  async function handleStatusChange(status: string) {
    startTransition(async () => {
      const res = await updateMember(member.id, { status: status as any });
      if (res.error) toast.error(res.error);
      else { toast.success("Status updated"); router.refresh(); }
    });
  }

  const tabs = ["overview", "payments", "attendance", "qr"] as const;

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      {/* Back */}
      <Link href="/dashboard/members" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to Members
      </Link>

      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black ring-4 flex-shrink-0"
              style={{ background: color + "22", color, ringColor: color + "33" }}>
              {member.photo_url
                ? <img src={member.photo_url} alt={member.name} className="w-full h-full rounded-2xl object-cover" />
                : getInitials(member.name)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-black text-foreground tracking-tight">{member.name}</h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${sc}`}>{member.status}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{member.membership_plan?.name ?? "No plan"} · {member.branch?.name ?? "Main"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Member since {formatDate(member.join_date)}</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select onChange={(e) => handleStatusChange(e.target.value)} value={member.status}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500">
              {["active", "frozen", "inactive"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-accent transition-colors">Edit</button>
            <button onClick={handleDelete}
              className="px-4 py-2 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">Delete</button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
          {[
            { label: "Plan Amount", value: formatCurrency(member.membership_plan?.price ?? 0), color: "text-orange-500" },
            { label: "Expiry Date", value: member.expiry_date ? formatDate(member.expiry_date) : "—", color: "text-foreground" },
            { label: "Attendance Rate", value: `${attendanceRate}%`, color: attendanceRate > 75 ? "text-emerald-400" : attendanceRate > 50 ? "text-amber-400" : "text-red-400" },
            { label: "Total Check-ins", value: String(attendance.length), color: "text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="bg-background rounded-xl p-3">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1.5 w-fit">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === t ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "qr" ? "QR Code" : t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal info */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Personal Information</h3>
            <div className="space-y-3">
              {[
                ["📱", "Phone", member.phone],
                ["📧", "Email", member.email ?? "—"],
                ["🎂", "Date of Birth", member.date_of_birth ? formatDate(member.date_of_birth) : "—"],
                ["⚥", "Gender", member.gender ?? "—"],
                ["🩸", "Blood Group", member.blood_group ?? "—"],
                ["📍", "Address", member.address ?? "—"],
                ["🆘", "Emergency Contact", member.emergency_contact_name ? `${member.emergency_contact_name} · ${member.emergency_contact_phone ?? ""}` : "—"],
              ].map(([icon, label, val]) => (
                <div key={label} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <span className="text-base w-5 flex-shrink-0">{icon}</span>
                  <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{label}</span>
                  <span className="text-sm text-foreground font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fitness + Notes */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Fitness Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Height", member.height_cm ? `${member.height_cm} cm` : "—"],
                  ["Weight", member.weight_kg ? `${member.weight_kg} kg` : "—"],
                  ["Goal", member.fitness_goal ?? "—"],
                  ["Attendance Rate", `${attendanceRate}%`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-background rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">{l}</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-foreground">Notes</h3>
                <button onClick={handleSaveNotes} disabled={isPending}
                  className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors">
                  {isPending ? "Saving…" : "Save"}
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this member…"
                rows={5}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground resize-none outline-none focus:border-orange-500 transition-colors placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Payments tab */}
      {activeTab === "payments" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Payment History</h3>
          </div>
          {payments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No payments recorded</div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{p.membership_plan?.name ?? "Payment"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {p.payment_method?.replace("_", " ")} · {p.payment_date ? formatDate(p.payment_date) : formatRelativeTime(p.created_at)}
                    </div>
                    {p.renewal_from && p.renewal_to && (
                      <div className="text-xs text-muted-foreground/70">
                        {formatDate(p.renewal_from)} → {formatDate(p.renewal_to)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-foreground">{formatCurrency(p.final_amount)}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance tab */}
      {activeTab === "attendance" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">Attendance History</h3>
            <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
              {attendance.length} total check-ins
            </span>
          </div>
          {attendance.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No check-ins recorded</div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {attendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-base">✅</div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {new Date(a.check_in_time).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{a.check_in_method} check-in</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    🕐 {new Date(a.check_in_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Code tab */}
      {activeTab === "qr" && (
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-5">
          <h3 className="text-sm font-bold text-foreground self-start">Member QR Code</h3>
          <div className="bg-white p-5 rounded-2xl">
            <QRCode
              value={JSON.stringify({ id: member.id, name: member.name, gym: "gymos" })}
              size={200}
              level="H"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{member.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Scan to check in at the gym</p>
          </div>
          <button
            onClick={() => {
              const svg = document.querySelector("svg");
              if (!svg) return;
              const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `${member.name}-qr.svg`; a.click();
            }}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors"
          >
            ⬇ Download QR Code
          </button>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditMemberModal
          member={member}
          onClose={() => { setEditing(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

function EditMemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: member.name,
    phone: member.phone,
    email: member.email ?? "",
    gender: member.gender ?? "",
    blood_group: member.blood_group ?? "",
    address: member.address ?? "",
    emergency_contact_name: member.emergency_contact_name ?? "",
    emergency_contact_phone: member.emergency_contact_phone ?? "",
    height_cm: String(member.height_cm ?? ""),
    weight_kg: String(member.weight_kg ?? ""),
    fitness_goal: member.fitness_goal ?? "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    startTransition(async () => {
      const res = await updateMember(member.id, {
        ...form,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
      } as any);
      if (res.error) toast.error(res.error);
      else { toast.success("Member updated"); onClose(); }
    });
  }

  const fields: [string, string, string, string][] = [
    ["name", "Full Name *", "text", ""],
    ["phone", "Phone *", "tel", ""],
    ["email", "Email", "email", ""],
    ["gender", "Gender", "text", "Male / Female / Other"],
    ["blood_group", "Blood Group", "text", "A+, B+, O+…"],
    ["address", "Address", "text", ""],
    ["emergency_contact_name", "Emergency Contact Name", "text", ""],
    ["emergency_contact_phone", "Emergency Contact Phone", "tel", ""],
    ["height_cm", "Height (cm)", "number", "170"],
    ["weight_kg", "Weight (kg)", "number", "70"],
    ["fitness_goal", "Fitness Goal", "text", "Weight loss, Muscle gain…"],
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-bold text-foreground">Edit Member</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {fields.map(([k, label, type, ph]) => (
            <div key={k} className={k === "address" || k === "fitness_goal" ? "col-span-2" : ""}>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
              <input
                type={type} placeholder={ph}
                value={(form as any)[k]} onChange={(e) => set(k, e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-60">
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
