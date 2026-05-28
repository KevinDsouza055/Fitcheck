import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const RAZORPAY_PLAN_IDS: Record<string, string> = {
  starter_monthly: process.env.RAZORPAY_STARTER_MONTHLY_PLAN_ID ?? "",
  growth_monthly: process.env.RAZORPAY_GROWTH_MONTHLY_PLAN_ID ?? "",
  pro_monthly: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID ?? "",
  starter_annual: process.env.RAZORPAY_STARTER_ANNUAL_PLAN_ID ?? "",
  growth_annual: process.env.RAZORPAY_GROWTH_ANNUAL_PLAN_ID ?? "",
  pro_annual: process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID ?? "",
};

export async function createSubscription(planId: string, gymId: string, email: string) {
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 12,
    quantity: 1,
    customer_notify: 1,
    notes: {
      gym_id: gymId,
      email,
    },
  });
  return subscription;
}

export async function cancelSubscription(subscriptionId: string) {
  return razorpay.subscriptions.cancel(subscriptionId, false);
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}
