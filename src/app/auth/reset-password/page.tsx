"use client";

import { useState, useTransition } from "react";
import { resetPassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) {
      setError("Passwords don't match");
      return;
    }
    startTransition(async () => {
      const result = await resetPassword(fd);
      if (result?.error) setError(result.error);
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
          <h1 className="text-2xl font-bold text-foreground mb-6">Set new password</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[["password", "New Password"], ["confirm", "Confirm Password"]].map(([n, l]) => (
              <div key={n}>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">{l}</label>
                <input name={n} type="password" required minLength={8} placeholder="Min. 8 characters"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors" />
              </div>
            ))}
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60">
              {isPending ? "Updating…" : "Update Password →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
