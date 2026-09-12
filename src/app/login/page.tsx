"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hexagon, KeyRound, LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Input, Modal } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to reset password.");
        return;
      }
      toast.success(data.message ?? "Password updated successfully!");
      setEmail(resetEmail);
      setPassword("");
      setForgotOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  async function performLogin(loginEmail: string, loginPass: string) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      toast.success(`Welcome back, ${data.user.username}. Time to forge.`);
      window.location.href = "/dashboard";
    } catch {
      toast.error("Network error — try again");
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  async function loginAsDemo() {
    setEmail("demo@sixforge.app");
    setPassword("demo1234");
    await performLogin("demo@sixforge.app", "demo1234");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-md"
        >
          <Link href="/" className="mb-10 flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center">
              <Hexagon size={36} strokeWidth={2.5} className="absolute text-volt" />
              <span className="font-display text-sm text-volt">6</span>
            </span>
            <span className="font-display text-xl tracking-wider">
              SIX<span className="text-volt">FORGE</span>
            </span>
          </Link>

          <h1 className="font-display text-4xl uppercase md:text-5xl">
            Back to the <span className="text-volt">forge</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-fog">
            Your streak is waiting. Log in and pick up exactly where you left off.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@trainhard.com"
                autoComplete="email"
              />
            </Field>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold tracking-wider text-fog uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setForgotOpen(true);
                  }}
                  className="cursor-pointer text-xs font-semibold text-volt transition-colors hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              <LogIn size={16} />
              {loading ? "Checking credentials…" : "Log in & train"}
            </Button>
          </form>

          <button
            type="button"
            onClick={loginAsDemo}
            disabled={loading}
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-dashed border-volt/35 bg-volt/5 py-3 text-[13px] font-semibold text-volt transition-colors hover:bg-volt/10 disabled:opacity-50"
          >
            <KeyRound size={14} />
            1-Click Demo Login (Pre-loaded with 8 weeks of data)
          </button>

          <p className="mt-8 text-center text-sm text-fog">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-volt hover:underline">
              Forge an account
            </Link>
          </p>

          {/* Password Reset Modal */}
          <Modal open={forgotOpen} onClose={() => setForgotOpen(false)}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-volt/30 bg-volt/10 text-volt">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-display text-2xl tracking-wide uppercase">
                  Reset Password
                </h3>
                <p className="text-xs text-fog">
                  Enter your registered email and choose a new password.
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
              <Field label="Your Account Email">
                <Input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="athlete@sixforge.app"
                  autoComplete="email"
                />
              </Field>
              <Field label="New Password (min 6 characters)">
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm New Password">
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotOpen(false)}
                  disabled={resetLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={resetLoading}>
                  <KeyRound size={14} /> Update Password
                </Button>
              </div>
            </form>
          </Modal>
        </motion.div>
      </div>

      <div className="relative hidden lg:block">
        <img
          src="https://images.pexels.com/photos/30191517/pexels-photo-30191517.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000"
          alt="Athlete training in a dark gym"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-ink/20" />
        <div className="absolute right-10 bottom-10 left-10 rounded-3xl border border-white/10 bg-ink/70 p-6 backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-volt uppercase">
            <Sparkles size={13} /> Today&apos;s reminder
          </div>
          <p className="font-display text-2xl leading-snug uppercase">
            &ldquo;A one-hour workout is 4% of your day. No excuses&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
