import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = await createServiceClient();

  try {
    const gymId = event.payload?.subscription?.entity?.notes?.gym_id;
    if (!gymId) return NextResponse.json({ ok: true });

    // Store billing event
    await supabase.from("billing_events").insert({
      gym_id: gymId,
      event_type: event.event,
      razorpay_event_id: event.id,
      amount: event.payload?.payment?.entity?.amount ? event.payload.payment.entity.amount / 100 : null,
      payload: event,
      processed: false,
    });

    // Handle specific events
    switch (event.event) {
      case "subscription.activated":
        await supabase.from("gyms").update({
          sub_status: "active",
          razorpay_sub_id: event.payload.subscription.entity.id,
          sub_ends_at: new Date(event.payload.subscription.entity.current_end * 1000).toISOString(),
        }).eq("id", gymId);
        break;

      case "subscription.charged":
        await supabase.from("gyms").update({
          sub_status: "active",
          sub_ends_at: new Date(event.payload.subscription.entity.current_end * 1000).toISOString(),
        }).eq("id", gymId);
        break;

      case "subscription.cancelled":
      case "subscription.expired":
        await supabase.from("gyms").update({ sub_status: "cancelled" }).eq("id", gymId);
        await supabase.from("notifications").insert({
          gym_id: gymId,
          title: "Subscription cancelled",
          message: "Your GymOS subscription has been cancelled. Upgrade to continue using all features.",
          type: "warning",
        });
        break;

      case "payment.failed":
        await supabase.from("gyms").update({ sub_status: "past_due" }).eq("id", gymId);
        await supabase.from("notifications").insert({
          gym_id: gymId,
          title: "Payment failed",
          message: "Your subscription payment failed. Please update your payment method.",
          type: "error",
        });
        break;
    }

    // Mark processed
    if (event.id) {
      await supabase.from("billing_events").update({ processed: true }).eq("razorpay_event_id", event.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
