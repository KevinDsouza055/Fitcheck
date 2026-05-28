"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signIn(fd);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-xl">
            🏋️
          </div>
          <span className="text-2xl font-black text-foreground tracking-tight">GymOS</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to your gym dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@gym.com"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {isPending ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div className="mt-4 flex justify-between text-sm">
            <Link href="/auth/forgot-password" className="text-muted-foreground hover:text-orange-500 transition-colors">
              Forgot password?
            </Link>
            <Link href="/auth/signup" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
              Create account →
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Demo: <span className="font-mono text-orange-400">demo@gymos.in</span> / <span className="font-mono text-orange-400">demo1234</span>
        </p>
      </div>
    </div>
  );
}
