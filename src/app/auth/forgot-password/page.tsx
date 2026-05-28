"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setMessage("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await forgotPassword(fd);
      if (result.error) setError(result.error);
      if (result.success) setMessage(result.success);
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
          <h1 className="text-2xl font-bold text-foreground mb-1">Reset password</h1>
          <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send a reset link</p>
          {message ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">{message}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Email</label>
                <input name="email" type="email" required placeholder="you@gym.com"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors" />
              </div>
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
              <button type="submit" disabled={isPending}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60">
                {isPending ? "Sending…" : "Send Reset Link →"}
              </button>
            </form>
          )}
          <Link href="/auth/login" className="block text-center mt-4 text-sm text-muted-foreground hover:text-orange-500 transition-colors">← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
