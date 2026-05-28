# 🏋️ GymOS — Production SaaS Gym Management Platform

> The smartest gym CRM and membership management platform built for Indian gyms, MMA gyms, fitness studios and training centers.

---

## ✅ What's Inside

| Layer | Features |
|---|---|
| **Gym Management** | Members, Attendance, Payments, Plans, Branches, Staff |
| **Multi-Tenant SaaS** | Every gym isolated by `gym_id`, Supabase RLS on every table |
| **Billing + Feature Gating** | Starter / Growth / Pro plans, Razorpay subscriptions, usage limits |
| **Automation** | WhatsApp reminders, email via Resend, daily cron jobs on Vercel |

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url> gymos
cd gymos
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in all values — see below
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** into `.env.local`
3. Copy your **service_role key** into `.env.local`
4. Open **SQL Editor** → paste contents of `supabase/migrations/001_initial_schema.sql` → Run

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) → Sign up → Onboarding → Dashboard ✅

---

## 🔑 Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (keep secret!) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your domain in prod |
| `RAZORPAY_KEY_ID` | [razorpay.com](https://razorpay.com) → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay → Settings → API Keys |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Webhooks → create webhook |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | Your verified email in Resend |
| `WHATSAPP_API_KEY` | [interakt.ai](https://interakt.ai) or [wati.io](https://wati.io) |
| `CRON_SECRET` | Any random string — used to secure cron endpoint |

---

## 🗄️ Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** — all tables, RLS policies, indexes and seed data will be created

### Tables created:
- `gyms` — Multi-tenant gym profiles
- `branches` — Multiple locations per gym
- `gym_users` — Staff/owner accounts with permissions
- `membership_plans` — Pricing tiers
- `members` — Member records with full profile
- `attendance` — Check-in logs
- `payments` — Payment records
- `notifications` — In-app alerts
- `activity_logs` — Full audit trail
- `whatsapp_templates` — Message templates
- `whatsapp_logs` — Sent message history
- `billing_events` — Razorpay webhook events

### Row Level Security:
Every table has RLS enabled. Users only see data for **their gym** via `auth_gym_id()` helper function.

---

## 💳 Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Get API keys from Settings → API Keys
3. Create subscription plans in Razorpay Dashboard:
   - Starter Monthly: ₹999/month
   - Growth Monthly: ₹2,499/month  
   - Pro Monthly: ₹5,999/month
4. Add plan IDs to `.env.local`:
   ```
   RAZORPAY_STARTER_MONTHLY_PLAN_ID=plan_xxx
   RAZORPAY_GROWTH_MONTHLY_PLAN_ID=plan_xxx
   RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_xxx
   ```
5. Set up webhook in Razorpay → Webhooks:
   - URL: `https://yourdomain.com/api/billing/webhook`
   - Events: `subscription.*`, `payment.*`
   - Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`

---

## 💬 WhatsApp Setup (Interakt)

1. Sign up at [interakt.ai](https://interakt.ai)
2. Connect your WhatsApp Business number
3. Get your API key from Dashboard → Settings → API
4. Set `WHATSAPP_API_URL` and `WHATSAPP_API_KEY` in `.env.local`

---

## 📧 Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create API key → add to `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to your verified sending address

---

## 🚢 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com):

1. Import repository
2. Add all environment variables from `.env.example`
3. Deploy

### Cron Jobs (Vercel)
The `vercel.json` configures a daily cron at 8 AM IST:
- Updates expired member statuses
- Sends WhatsApp + email renewal reminders
- Creates in-app notifications

To enable: set `CRON_SECRET` in Vercel environment variables.

---

## 🌱 Seed Demo Data

After setup, run this from your browser or Postman to add demo members/payments/attendance:

```bash
curl -X POST https://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"gym_id": "YOUR_GYM_ID"}'
```

Get your `gym_id` from Supabase → Table Editor → `gyms`.

---

## 📁 Project Structure

```
gymos/
├── src/
│   ├── app/
│   │   ├── auth/               # Login, signup, forgot/reset password
│   │   ├── dashboard/          # All protected dashboard pages
│   │   │   ├── members/        # Members list + [id] profile
│   │   │   ├── attendance/
│   │   │   ├── payments/
│   │   │   ├── plans/
│   │   │   ├── analytics/
│   │   │   ├── branches/
│   │   │   ├── staff/
│   │   │   ├── whatsapp/
│   │   │   ├── notifications/
│   │   │   ├── activity/
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── billing/webhook/  # Razorpay webhooks
│   │   │   ├── whatsapp/         # Send messages
│   │   │   ├── cron/reminders/   # Daily cron job
│   │   │   └── seed/             # Demo data
│   │   └── onboarding/
│   ├── components/
│   │   ├── layout/             # Sidebar, Topbar
│   │   ├── dashboard/          # Dashboard charts and cards
│   │   ├── members/            # Member list, profile, modals
│   │   ├── attendance/         # Check-in UI
│   │   ├── payments/           # Payment table and modals
│   │   ├── plans/              # Plan cards and CRUD
│   │   ├── analytics/          # Charts and heatmaps
│   │   ├── billing/            # SaaS subscription UI
│   │   └── settings/           # Settings forms
│   ├── lib/
│   │   ├── supabase/           # client, server, middleware
│   │   ├── actions/            # Server actions (auth, members, payments)
│   │   ├── razorpay.ts
│   │   ├── email.ts
│   │   ├── whatsapp.ts
│   │   └── utils.ts
│   ├── types/index.ts
│   └── styles/globals.css
├── supabase/migrations/        # Full DB schema SQL
├── .env.example
├── vercel.json                 # Cron config
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🔐 SaaS Plan Limits

| Feature | Starter ₹999/mo | Growth ₹2,499/mo | Pro ₹5,999/mo |
|---|---|---|---|
| Members | 100 | 500 | Unlimited |
| Staff | 2 | 10 | Unlimited |
| Branches | 1 | 3 | Unlimited |
| Analytics | ❌ | ✅ | ✅ |
| WhatsApp | ❌ | Reminders | Full automation |
| API | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + next-themes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner
- **Payments**: Razorpay
- **Email**: Resend
- **WhatsApp**: Interakt / WATI
- **Deployment**: Vercel

---

## 📄 License

MIT — build, sell, customise freely.
