export type UserRole = "owner" | "trainer" | "staff";
export type MemberStatus = "active" | "expired" | "expiring" | "frozen" | "inactive";
export type PaymentStatus = "success" | "pending" | "failed" | "refunded";
export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "razorpay";
export type PlanDuration = "monthly" | "quarterly" | "half_yearly" | "yearly" | "custom";
export type SaasPlan = "starter" | "growth" | "pro";
export type SubscriptionStatus = "active" | "trial" | "expired" | "cancelled" | "past_due";
export type NotificationType = "info" | "success" | "warning" | "error";

export interface Gym {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  logo_url?: string;
  timezone: string;
  currency: string;
  onboarded: boolean;
  saas_plan: SaasPlan;
  sub_status: SubscriptionStatus;
  trial_ends_at?: string;
  sub_ends_at?: string;
  razorpay_sub_id?: string;
  member_limit: number;
  staff_limit: number;
  branch_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  gym_id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  is_main: boolean;
  active: boolean;
  created_at: string;
}

export interface GymUser {
  id: string;
  gym_id: string;
  branch_id?: string;
  auth_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  can_manage_members: boolean;
  can_manage_payments: boolean;
  can_delete_members: boolean;
  can_export_data: boolean;
  can_manage_plans: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface MembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  description?: string;
  duration: PlanDuration;
  duration_days: number;
  price: number;
  features: string[];
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  branch_id?: string;
  membership_plan_id?: string;
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  photo_url?: string;
  notes?: string;
  join_date: string;
  expiry_date?: string;
  status: MemberStatus;
  qr_code?: string;
  height_cm?: number;
  weight_kg?: number;
  fitness_goal?: string;
  created_at: string;
  updated_at: string;
  // Joined
  membership_plan?: MembershipPlan;
  branch?: Branch;
}

export interface Attendance {
  id: string;
  gym_id: string;
  branch_id?: string;
  member_id: string;
  check_in_time: string;
  check_out_time?: string;
  check_in_method: string;
  notes?: string;
  created_at: string;
  // Joined
  member?: Member;
}

export interface Payment {
  id: string;
  gym_id: string;
  branch_id?: string;
  member_id: string;
  membership_plan_id?: string;
  amount: number;
  discount: number;
  final_amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_date?: string;
  due_date?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  notes?: string;
  renewal_from?: string;
  renewal_to?: string;
  created_at: string;
  updated_at: string;
  // Joined
  member?: Member;
  membership_plan?: MembershipPlan;
}

export interface Notification {
  id: string;
  gym_id: string;
  user_id?: string;
  title: string;
  message?: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  gym_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  // Joined
  user?: GymUser;
}

export interface WhatsAppTemplate {
  id: string;
  gym_id: string;
  name: string;
  trigger: string;
  message: string;
  is_active: boolean;
  days_before: number;
  sent_count: number;
  created_at: string;
  updated_at: string;
}

// Dashboard analytics types
export interface DashboardStats {
  total_members: number;
  active_members: number;
  expired_members: number;
  expiring_soon: number;
  frozen_members: number;
  todays_checkins: number;
  monthly_revenue: number;
  pending_dues: number;
  new_members_this_month: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  members: number;
  churn: number;
}

export interface AttendanceDataPoint {
  day: string;
  count: number;
}

// Form types
export interface MemberFormData {
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_plan_id?: string;
  join_date: string;
  expiry_date?: string;
  notes?: string;
  branch_id?: string;
}

export interface PaymentFormData {
  member_id: string;
  membership_plan_id?: string;
  amount: number;
  discount?: number;
  payment_method: PaymentMethod;
  payment_date: string;
  due_date?: string;
  notes?: string;
  renewal_from?: string;
  renewal_to?: string;
}

export interface PlanFormData {
  name: string;
  description?: string;
  duration: PlanDuration;
  duration_days: number;
  price: number;
  features: string[];
  color: string;
}

// Saas plan config
export interface SaasPlanConfig {
  id: SaasPlan;
  name: string;
  price_monthly: number;
  price_annual: number;
  color: string;
  badge?: string;
  limits: { members: number; staff: number; branches: number };
  features: string[];
  locked: string[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
