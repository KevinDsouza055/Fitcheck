import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeExpiryDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const supabase = await createServiceClient();
  const body = await req.json();
  const { gym_id } = body;
  if (!gym_id) return NextResponse.json({ error: "gym_id required" }, { status: 400 });

  // Get plans
  const { data: plans } = await supabase.from("membership_plans").select("id, price, duration_days").eq("gym_id", gym_id).limit(4);
  const { data: branches } = await supabase.from("branches").select("id").eq("gym_id", gym_id).limit(1);
  const branchId = branches?.[0]?.id;

  const DEMO_MEMBERS = [
    { name: "Arjun Sharma", phone: "9876543210", email: "arjun@demo.com", gender: "Male", blood_group: "O+" },
    { name: "Priya Mehta", phone: "8765432109", email: "priya@demo.com", gender: "Female", blood_group: "B+" },
    { name: "Rohit Singh", phone: "7654321098", email: "rohit@demo.com", gender: "Male", blood_group: "A+" },
    { name: "Kavya Nair", phone: "6543210987", email: "kavya@demo.com", gender: "Female", blood_group: "AB+" },
    { name: "Vikram Patel", phone: "5432109876", email: "vikram@demo.com", gender: "Male", blood_group: "O-" },
    { name: "Sneha Reddy", phone: "4321098765", email: "sneha@demo.com", gender: "Female", blood_group: "A-" },
    { name: "Aditya Kumar", phone: "3210987654", email: "aditya@demo.com", gender: "Male", blood_group: "B-" },
    { name: "Meera Joshi", phone: "2109876543", email: "meera@demo.com", gender: "Female", blood_group: "AB-" },
  ];

  const statuses = ["active", "active", "active", "expiring", "active", "expired", "active", "frozen"];

  const memberInserts = DEMO_MEMBERS.map((m, i) => {
    const plan = plans?.[i % (plans?.length ?? 1)];
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 180));
    const joinStr = joinDate.toISOString().split("T")[0];
    const expiry = plan ? computeExpiryDate(joinStr, plan.duration_days) : undefined;
    return {
      ...m,
      gym_id,
      branch_id: branchId,
      membership_plan_id: plan?.id ?? null,
      join_date: joinStr,
      expiry_date: expiry,
      status: statuses[i] as any,
    };
  });

  const { data: insertedMembers } = await supabase.from("members").insert(memberInserts).select("id");

  // Demo payments
  if (insertedMembers && plans?.length) {
    const paymentInserts = insertedMembers.slice(0, 6).map((m, i) => {
      const plan = plans[i % plans.length];
      return {
        gym_id,
        member_id: m.id,
        membership_plan_id: plan.id,
        amount: plan.price,
        discount: 0,
        final_amount: plan.price,
        status: i < 5 ? "success" : "pending",
        payment_method: ["cash", "upi", "card", "upi", "bank_transfer", "cash"][i] as any,
        payment_date: new Date(Date.now() - i * 2 * 86400000).toISOString(),
      };
    });
    await supabase.from("payments").insert(paymentInserts);
  }

  // Demo attendance (last 14 days)
  if (insertedMembers) {
    const attendanceInserts = [];
    for (let day = 0; day < 14; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      const count = Math.floor(Math.random() * 5) + 2;
      for (let j = 0; j < count; j++) {
        const member = insertedMembers[j % insertedMembers.length];
        date.setHours(7 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));
        attendanceInserts.push({
          gym_id,
          member_id: member.id,
          branch_id: branchId,
          check_in_time: date.toISOString(),
        });
      }
    }
    await supabase.from("attendance").insert(attendanceInserts);
  }

  return NextResponse.json({ ok: true, members: insertedMembers?.length ?? 0 });
}
