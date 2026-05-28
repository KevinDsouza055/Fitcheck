-- ═══════════════════════════════════════════════════════════════════
-- GymOS — Complete Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ─── ENUMS ──────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('owner', 'trainer', 'staff');
CREATE TYPE member_status AS ENUM ('active', 'expired', 'expiring', 'frozen', 'inactive');
CREATE TYPE payment_status AS ENUM ('success', 'pending', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'card', 'bank_transfer', 'razorpay');
CREATE TYPE plan_duration AS ENUM ('monthly', 'quarterly', 'half_yearly', 'yearly', 'custom');
CREATE TYPE saas_plan AS ENUM ('starter', 'growth', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'expired', 'cancelled', 'past_due');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE log_action AS ENUM ('created', 'updated', 'deleted', 'login', 'checkin', 'payment', 'renewal');

-- ─── GYMS ────────────────────────────────────────────────────────────
CREATE TABLE gyms (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  pincode       TEXT,
  logo_url      TEXT,
  timezone      TEXT DEFAULT 'Asia/Kolkata',
  currency      TEXT DEFAULT 'INR',
  onboarded     BOOLEAN DEFAULT FALSE,
  saas_plan     saas_plan DEFAULT 'starter',
  sub_status    subscription_status DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  sub_ends_at   TIMESTAMPTZ,
  razorpay_sub_id TEXT,
  razorpay_customer_id TEXT,
  member_limit  INTEGER DEFAULT 100,
  staff_limit   INTEGER DEFAULT 2,
  branch_limit  INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BRANCHES ────────────────────────────────────────────────────────
CREATE TABLE branches (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  address    TEXT,
  city       TEXT,
  phone      TEXT,
  is_main    BOOLEAN DEFAULT FALSE,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS / STAFF ───────────────────────────────────────────────────
CREATE TABLE gym_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id      UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  branch_id   UUID REFERENCES branches(id),
  auth_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  role        user_role DEFAULT 'staff',
  avatar_url  TEXT,
  -- Granular permissions
  can_manage_members   BOOLEAN DEFAULT TRUE,
  can_manage_payments  BOOLEAN DEFAULT FALSE,
  can_delete_members   BOOLEAN DEFAULT FALSE,
  can_export_data      BOOLEAN DEFAULT FALSE,
  can_manage_plans     BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEMBERSHIP PLANS ────────────────────────────────────────────────
CREATE TABLE membership_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id      UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  duration    plan_duration NOT NULL DEFAULT 'monthly',
  duration_days INTEGER NOT NULL DEFAULT 30,
  price       DECIMAL(10,2) NOT NULL,
  features    TEXT[] DEFAULT '{}',
  color       TEXT DEFAULT '#F97316',
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEMBERS ─────────────────────────────────────────────────────────
CREATE TABLE members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id            UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  branch_id         UUID REFERENCES branches(id),
  membership_plan_id UUID REFERENCES membership_plans(id),
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT,
  date_of_birth     DATE,
  gender            TEXT,
  blood_group       TEXT,
  address           TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  photo_url         TEXT,
  notes             TEXT,
  join_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date       DATE,
  status            member_status DEFAULT 'active',
  qr_code           TEXT,
  -- Progress tracking
  height_cm         DECIMAL(5,2),
  weight_kg         DECIMAL(5,2),
  fitness_goal      TEXT,
  created_by        UUID REFERENCES gym_users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ATTENDANCE ──────────────────────────────────────────────────────
CREATE TABLE attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id        UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  branch_id     UUID REFERENCES branches(id),
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  check_in_method TEXT DEFAULT 'manual', -- manual, qr, biometric
  notes         TEXT,
  created_by    UUID REFERENCES gym_users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENTS ────────────────────────────────────────────────────────
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id           UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  branch_id        UUID REFERENCES branches(id),
  member_id        UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  membership_plan_id UUID REFERENCES membership_plans(id),
  amount           DECIMAL(10,2) NOT NULL,
  discount         DECIMAL(10,2) DEFAULT 0,
  final_amount     DECIMAL(10,2) NOT NULL,
  status           payment_status DEFAULT 'pending',
  payment_method   payment_method DEFAULT 'cash',
  payment_date     TIMESTAMPTZ,
  due_date         DATE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  notes            TEXT,
  renewal_from     DATE,
  renewal_to       DATE,
  collected_by     UUID REFERENCES gym_users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES gym_users(id),
  title      TEXT NOT NULL,
  message    TEXT,
  type       notification_type DEFAULT 'info',
  is_read    BOOLEAN DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id      UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES gym_users(id),
  action      log_action NOT NULL,
  entity_type TEXT NOT NULL, -- member, payment, plan, attendance, staff
  entity_id   UUID,
  entity_name TEXT,
  details     JSONB DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WHATSAPP TEMPLATES ──────────────────────────────────────────────
CREATE TABLE whatsapp_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id      UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  trigger     TEXT NOT NULL, -- renewal_reminder, welcome, payment_due, birthday
  message     TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  days_before INTEGER DEFAULT 7, -- for renewal reminders
  sent_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WHATSAPP LOGS ───────────────────────────────────────────────────
CREATE TABLE whatsapp_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id      UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  template_id UUID REFERENCES whatsapp_templates(id),
  member_id   UUID REFERENCES members(id),
  phone       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'sent', -- sent, delivered, failed
  error       TEXT,
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SAAS BILLING (Platform) ─────────────────────────────────────────
CREATE TABLE billing_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id        UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL, -- subscription.created, payment.captured, subscription.cancelled
  razorpay_event_id TEXT UNIQUE,
  amount        DECIMAL(10,2),
  currency      TEXT DEFAULT 'INR',
  payload       JSONB DEFAULT '{}',
  processed     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────
CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_expiry_date ON members(expiry_date);
CREATE INDEX idx_attendance_gym_id ON attendance(gym_id);
CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_attendance_check_in ON attendance(check_in_time);
CREATE INDEX idx_payments_gym_id ON payments(gym_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_activity_logs_gym_id ON activity_logs(gym_id);
CREATE INDEX idx_notifications_gym_id ON notifications(gym_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_gym_users_auth_id ON gym_users(auth_id);
CREATE INDEX idx_gym_users_gym_id ON gym_users(gym_id);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gyms_updated_at BEFORE UPDATE ON gyms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON membership_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON gym_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── AUTO-UPDATE MEMBER STATUS ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_member_statuses()
RETURNS void AS $$
BEGIN
  -- Mark expired
  UPDATE members SET status = 'expired'
  WHERE status = 'active' AND expiry_date < CURRENT_DATE;

  -- Mark expiring (within 7 days)
  UPDATE members SET status = 'expiring'
  WHERE status = 'active'
    AND expiry_date >= CURRENT_DATE
    AND expiry_date <= CURRENT_DATE + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Helper: get gym_id for current auth user
CREATE OR REPLACE FUNCTION auth_gym_id()
RETURNS UUID AS $$
  SELECT gym_id FROM gym_users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get role for current auth user
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM gym_users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- GYMS: users can read/update their own gym
CREATE POLICY "gym_users_select" ON gyms FOR SELECT USING (id = auth_gym_id());
CREATE POLICY "gym_owners_update" ON gyms FOR UPDATE USING (id = auth_gym_id() AND auth_user_role() = 'owner');

-- BRANCHES: gym members see their branches
CREATE POLICY "branches_select" ON branches FOR SELECT USING (gym_id = auth_gym_id());
CREATE POLICY "branches_insert" ON branches FOR INSERT WITH CHECK (gym_id = auth_gym_id() AND auth_user_role() = 'owner');
CREATE POLICY "branches_update" ON branches FOR UPDATE USING (gym_id = auth_gym_id() AND auth_user_role() = 'owner');
CREATE POLICY "branches_delete" ON branches FOR DELETE USING (gym_id = auth_gym_id() AND auth_user_role() = 'owner');

-- GYM_USERS: can read own gym's users; only owners manage
CREATE POLICY "gym_users_select" ON gym_users FOR SELECT USING (gym_id = auth_gym_id());
CREATE POLICY "gym_users_insert" ON gym_users FOR INSERT WITH CHECK (gym_id = auth_gym_id() AND auth_user_role() = 'owner');
CREATE POLICY "gym_users_update" ON gym_users FOR UPDATE USING (gym_id = auth_gym_id() AND (auth_user_role() = 'owner' OR auth_id = auth.uid()));
CREATE POLICY "gym_users_delete" ON gym_users FOR DELETE USING (gym_id = auth_gym_id() AND auth_user_role() = 'owner');

-- MEMBERSHIP_PLANS
CREATE POLICY "plans_select" ON membership_plans FOR SELECT USING (gym_id = auth_gym_id());
CREATE POLICY "plans_insert" ON membership_plans FOR INSERT WITH CHECK (gym_id = auth_gym_id());
CREATE POLICY "plans_update" ON membership_plans FOR UPDATE USING (gym_id = auth_gym_id());
CREATE POLICY "plans_delete" ON membership_plans FOR DELETE USING (gym_id = auth_gym_id() AND auth_user_role() = 'owner');

-- MEMBERS
CREATE POLICY "members_select" ON members FOR SELECT USING (gym_id = auth_gym_id());
CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (gym_id = auth_gym_id());
CREATE POLICY "members_update" ON members FOR UPDATE USING (gym_id = auth_gym_id());
CREATE POLICY "members_delete" ON members FOR DELETE USING (gym_id = auth_gym_id() AND auth_user_role() IN ('owner', 'staff'));

-- ATTENDANCE
CREATE POLICY "attendance_select" ON attendance FOR SELECT USING (gym_id = auth_gym_id());
CREATE POLICY "attendance_insert" ON attendance FOR INSERT WITH CHECK (gym_id = auth_gym_id());
CREATE POLICY "attendance_update" ON attendance FOR UPDATE USING (gym_id = auth_gym_id());
CREATE POLICY "attendance_delete" ON attendance FOR DELETE USING (gym_id = auth_gym_id() AND auth_user_role() = 'owner');

-- PAYMENTS
CREATE POLICY "payments_select" ON payments FOR SELECT USING (gym_id = auth_gym_id());
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (gym_id = auth_gym_id());
CREATE POLICY "payments_update" ON payments FOR UPDATE USING (gym_id = auth_gym_id());
CREATE POLICY "payments_delete" ON payments FOR DELETE USING (gym_id = auth_gym_id() AND auth_user_role() = 'owner');

-- NOTIFICATIONS
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (gym_id = auth_gym_id() AND (user_id IS NULL OR user_id = (SELECT id FROM gym_users WHERE auth_id = auth.uid())));
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (gym_id = auth_gym_id());

-- ACTIVITY LOGS
CREATE POLICY "logs_select" ON activity_logs FOR SELECT USING (gym_id = auth_gym_id());
CREATE POLICY "logs_insert" ON activity_logs FOR INSERT WITH CHECK (gym_id = auth_gym_id());

-- WHATSAPP
CREATE POLICY "wa_templates_select" ON whatsapp_templates FOR SELECT USING (gym_id = auth_gym_id());
CREATE POLICY "wa_templates_all" ON whatsapp_templates FOR ALL USING (gym_id = auth_gym_id() AND auth_user_role() IN ('owner', 'staff'));
CREATE POLICY "wa_logs_select" ON whatsapp_logs FOR SELECT USING (gym_id = auth_gym_id());

-- BILLING EVENTS: only service role can write
CREATE POLICY "billing_select" ON billing_events FOR SELECT USING (gym_id = auth_gym_id() AND auth_user_role() = 'owner');

-- ─── SEED DATA ───────────────────────────────────────────────────────
-- NOTE: Replace 'YOUR_OWNER_AUTH_ID' with the actual auth.users id after signing up

-- Demo Gym
INSERT INTO gyms (id, name, slug, email, phone, address, city, state, saas_plan, sub_status, onboarded)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Iron Nation Gym',
  'iron-nation',
  'contact@ironnation.in',
  '+91 98765 43210',
  'Shop 12, Linking Road, Bandra West',
  'Mumbai',
  'Maharashtra',
  'growth',
  'active',
  true
);

-- Main Branch
INSERT INTO branches (id, gym_id, name, address, city, is_main)
VALUES (
  'b1b2c3d4-0000-0000-0000-000000000001',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Main Branch',
  'Shop 12, Linking Road, Bandra West',
  'Mumbai',
  true
);

-- Demo Plans
INSERT INTO membership_plans (gym_id, name, duration, duration_days, price, features, color, sort_order) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'Monthly Flex', 'monthly', 30, 1500, ARRAY['Gym Access', 'Locker', '1 PT Session'], '#10B981', 1),
('a1b2c3d4-0000-0000-0000-000000000001', 'Quarterly Power', 'quarterly', 90, 4200, ARRAY['Gym Access', 'Locker', '4 PT Sessions', 'Diet Plan'], '#3B82F6', 2),
('a1b2c3d4-0000-0000-0000-000000000001', 'Annual Beast', 'yearly', 365, 11500, ARRAY['Unlimited Access', 'Premium Locker', '12 PT Sessions', 'Diet Plan', 'Monthly Protein'], '#F97316', 3),
('a1b2c3d4-0000-0000-0000-000000000001', 'Student Special', 'monthly', 30, 999, ARRAY['Gym Access', 'Morning Slot Only'], '#8B5CF6', 4);

-- Demo WhatsApp Templates
INSERT INTO whatsapp_templates (gym_id, name, trigger, message, is_active, days_before) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'Renewal Reminder', 'renewal_reminder', 'Hi {{name}}, your {{plan}} membership at {{gym}} expires on {{date}}. Renew now to continue your fitness journey! 💪 Reply RENEW to get started.', true, 7),
('a1b2c3d4-0000-0000-0000-000000000001', 'Welcome Message', 'welcome', 'Welcome to {{gym}}, {{name}}! 🎉 Your {{plan}} membership is now active till {{date}}. See you at the gym! 🏋️', true, 0),
('a1b2c3d4-0000-0000-0000-000000000001', 'Payment Due', 'payment_due', 'Hi {{name}}, your payment of ₹{{amount}} is pending at {{gym}}. Please clear dues to continue gym access. 📲', true, 0),
('a1b2c3d4-0000-0000-0000-000000000001', 'Birthday Wish', 'birthday', 'Happy Birthday {{name}}! 🎂 A special gift from {{gym}} - use code BDAY20 for 20% off your next renewal!', false, 0);
