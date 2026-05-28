"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { toast } from "sonner";

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm_password")) {
      setError("Passwords don't match");
      return;
    }
    startTransition(async () => {
      const result = await signUp(fd);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-xl">🏋️</div>
          <span className="text-2xl font-black text-foreground tracking-tight">GymOS</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Start your free trial</h1>
          <p className="text-muted-foreground text-sm mb-6">14-day free trial · No credit card needed</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: "name", label: "Your Name", type: "text", placeholder: "Rahul Kumar" },
              { name: "gym_name", label: "Gym Name", type: "text", placeholder: "Iron Nation Gym" },
              { name: "phone", label: "Phone Number", type: "tel", placeholder: "+91 98765 43210" },
              { name: "email", label: "Email", type: "email", placeholder: "rahul@ironnation.in" },
              { name: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
              { name: "confirm_password", label: "Confirm Password", type: "password", placeholder: "••••••••" },
            ].map((f: { name: string; label: string; type: string; placeholder: string }) => (
              <div key={f.name}>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">{f.label}</label>
                <input
                  name={f.name}
                  type={f.type}
                  required
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            ))}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {isPending ? "Creating account…" : "Create Free Account →"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-orange-500 hover:text-orange-400 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
