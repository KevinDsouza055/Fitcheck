"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const steps = [
  { title: "Welcome to GymOS", sub: "India's smartest gym management platform", emoji: "🏋️" },
  { title: "Set up your gym", sub: "Tell us about your gym location", emoji: "🏢" },
  { title: "Create your first plan", sub: "Set up a membership pricing tier", emoji: "📋" },
  { title: "You're all set!", sub: "Your gym is ready to go", emoji: "🎉" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [gymForm, setGymForm] = useState({ city: "", state: "", address: "", phone: "" });
  const [planForm, setPlanForm] = useState({ name: "Monthly Flex", price: "1500", duration: "30", features: "Gym Access\nLocker" });
  const setGym = (k: string, v: string) => setGymForm(p => ({ ...p, [k]: v }));
  const setPlan = (k: string, v: string) => setPlanForm(p => ({ ...p, [k]: v }));

  async function handleNext() {
    if (step === 1) {
      startTransition(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: gymUser } = await supabase.from("gym_users").select("gym_id").eq("auth_id", user.id).single();
        if (!gymUser) return;
        await supabase.from("gyms").update({ ...gymForm, onboarded: false }).eq("id", gymUser.gym_id);
        setStep(s => s + 1);
      });
    } else if (step === 2) {
      startTransition(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: gymUser } = await supabase.from("gym_users").select("gym_id").eq("auth_id", user.id).single();
        if (!gymUser) return;
        await supabase.from("membership_plans").insert({
          gym_id: gymUser.gym_id,
          name: planForm.name,
          duration: "monthly",
          duration_days: parseInt(planForm.duration),
          price: parseFloat(planForm.price),
          features: planForm.features.split("\n").map(f => f.trim()).filter(Boolean),
          color: "#F97316",
        });
        setStep(s => s + 1);
      });
    } else if (step === 3) {
      startTransition(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: gymUser } = await supabase.from("gym_users").select("gym_id").eq("auth_id", user.id).single();
        if (!gymUser) return;
        await supabase.from("gyms").update({ onboarded: true }).eq("id", gymUser.gym_id);
        toast.success("Welcome to GymOS! 🎉");
        router.push("/dashboard");
      });
    } else {
      setStep(s => s + 1);
    }
  }

  const current = steps[step];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-xl">🏋️</div>
          <span className="text-2xl font-black text-foreground tracking-tight">GymOS</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-orange-500" : "bg-border"}`} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-center mb-7">
            <div className="text-5xl mb-3">{current.emoji}</div>
            <h2 className="text-xl font-black text-foreground tracking-tight mb-1">{current.title}</h2>
            <p className="text-sm text-muted-foreground">{current.sub}</p>
          </div>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {["👥 Members", "💳 Payments", "✅ Attendance", "📊 Analytics"].map(f => (
                <div key={f} className="bg-orange-500/10 text-orange-500 rounded-xl p-3 text-sm font-semibold text-center">{f}</div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {[
                ["Phone", "phone", "tel", "+91 98765 43210"],
                ["City", "city", "text", "Mumbai"],
                ["State", "state", "text", "Maharashtra"],
                ["Address", "address", "text", "Bandra West, Mumbai"],
              ].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                  <input type={type} placeholder={ph} value={(gymForm as any)[key]} onChange={e => setGym(key, e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {[
                ["Plan Name", "name", "text", "Monthly Flex"],
                ["Price (₹)", "price", "number", "1500"],
                ["Duration (days)", "duration", "number", "30"],
              ].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
                  <input type={type} placeholder={ph} value={(planForm as any)[key]} onChange={e => setPlan(key, e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Features (one per line)</label>
                <textarea rows={3} value={planForm.features} onChange={e => setPlan("features", e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground resize-none outline-none focus:border-orange-500 transition-colors" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2.5">
              {[
                ["✅", "Gym profile created", true],
                ["✅", "First plan created", true],
                ["✅", "Dashboard ready", true],
                ["📋", "Add your first member", false],
              ].map(([icon, label, done]) => (
                <div key={label as string} className={`flex items-center gap-3 text-sm font-semibold ${done ? "text-emerald-400" : "text-muted-foreground"}`}>
                  <span>{icon as string}</span> {label as string}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-7">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
            )}
            <button onClick={handleNext} disabled={isPending}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60">
              {isPending ? "Saving…" : step < 3 ? "Continue →" : "Go to Dashboard 🚀"}
            </button>
          </div>
        </div>

        {step === 0 && (
          <div className="text-center mt-4">
            <button onClick={() => { const sc = createClient(); sc.auth.getUser().then(({data:{user}})=>{ if(user) sc.from("gym_users").select("gym_id").eq("auth_id",user.id).single().then(({data})=>{ if(data) sc.from("gyms").update({onboarded:true}).eq("id",data.gym_id).then(()=>router.push("/dashboard")); }); }); }}
              className="text-xs text-muted-foreground hover:text-orange-500 transition-colors">
              Skip setup and explore demo →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
