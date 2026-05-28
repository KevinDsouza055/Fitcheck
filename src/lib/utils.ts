import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, fmt = "dd MMM yyyy"): string {
  if (!date) return "—";
  return format(new Date(date), fmt);
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getMemberStatusColor(status: string) {
  switch (status) {
    case "active":
      return { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" };
    case "expiring":
      return { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" };
    case "expired":
      return { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" };
    case "frozen":
      return { text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" };
    default:
      return { text: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" };
  }
}

export function getPaymentStatusColor(status: string) {
  switch (status) {
    case "success":
      return { text: "text-emerald-400", bg: "bg-emerald-400/10" };
    case "pending":
      return { text: "text-amber-400", bg: "bg-amber-400/10" };
    case "failed":
      return { text: "text-red-400", bg: "bg-red-400/10" };
    case "refunded":
      return { text: "text-blue-400", bg: "bg-blue-400/10" };
    default:
      return { text: "text-slate-400", bg: "bg-slate-400/10" };
  }
}

export function isExpiringSoon(expiryDate: string, days = 7): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const threshold = addDays(now, days);
  return isAfter(expiry, now) && isBefore(expiry, threshold);
}

export function isExpired(expiryDate: string): boolean {
  if (!expiryDate) return false;
  return isBefore(new Date(expiryDate), new Date());
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function computeExpiryDate(joinDate: string, durationDays: number): string {
  const d = new Date(joinDate);
  d.setDate(d.getDate() + durationDays);
  return format(d, "yyyy-MM-dd");
}

export function saasFeatureAllowed(
  gymPlan: string,
  feature: "analytics" | "whatsapp" | "branches" | "api" | "staff_limit"
): boolean {
  const matrix: Record<string, string[]> = {
    starter: [],
    growth: ["analytics", "whatsapp"],
    pro: ["analytics", "whatsapp", "branches", "api", "staff_limit"],
  };
  return (matrix[gymPlan] ?? []).includes(feature);
}

export function planLimits(saas_plan: string) {
  switch (saas_plan) {
    case "starter":
      return { members: 100, staff: 2, branches: 1 };
    case "growth":
      return { members: 500, staff: 10, branches: 3 };
    case "pro":
      return { members: Infinity, staff: Infinity, branches: Infinity };
    default:
      return { members: 100, staff: 2, branches: 1 };
  }
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export const AVATAR_COLORS = [
  "#F97316", "#3B82F6", "#10B981", "#8B5CF6",
  "#F59E0B", "#EF4444", "#06B6D4", "#EC4899",
  "#14B8A6", "#6366F1",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
