"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, Hexagon, Home, Target, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";
import { cx } from "@/lib/utils";

const GOALS = [
  { id: "shred", label: "Melt fat", desc: "Reveal what's there" },
  { id: "define", label: "Deep definition", desc: "Etch every line" },
  { id: "strength", label: "Core strength", desc: "Armor-plated midline" },
  { id: "athletic", label: "Athletic core", desc: "Power for sport" },
];

const LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [goal, setGoal] = useState("shred");
  const [level, setLevel] = useState("beginner");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, goal, level }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Signup failed");
        return;
      }
      toast.success(`Account forged, ${data.user.username}. Your starter programs are loaded.`);
      window.location.href = "/dashboard";
    } catch {
      toast.error("Network error — try again");
    } finally {
      setLoading(false);
    }
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
            Forge your <span className="text-volt">account</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-fog">
            60 seconds to set up. 12 weeks to transform. We load your account with
            starter programs instantly.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name / handle">
                <Input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="AbsAssassin"
                />
              </Field>
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
            </div>
            <Field label="Password" hint="6+ characters. Make it stronger than your excuses.">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <div>
              <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-fog uppercase">
                <Target size={12} /> Primary goal
              </span>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={cx(
                      "cursor-pointer rounded-xl border p-3 text-left transition-all",
                      goal === g.id
                        ? "border-volt/60 bg-volt/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25"
                    )}
                  >
                    <div className={cx("text-[13px] font-semibold", goal === g.id ? "text-volt" : "text-paper")}>
                      {g.label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-fog">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-fog uppercase">
                <Dumbbell size={12} /> Current level
              </span>
              <div className="flex gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevel(l.id)}
                    className={cx(
                      "flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all",
                      level === l.id
                        ? "border-volt/60 bg-volt/10 text-volt"
                        : "border-white/10 bg-white/[0.03] text-fog hover:border-white/25"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              <UserPlus size={16} />
              {loading ? "Forging your account…" : "Create account & load programs"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-fog">
            Already forging?{" "}
            <Link href="/login" className="font-semibold text-volt hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="relative hidden lg:block">
        <img
          src="https://images.pexels.com/photos/38453115/pexels-photo-38453115.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1400&w=1000"
          alt="Focused athlete training in a dark gym"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-ink/20" />
        <div className="absolute right-10 bottom-10 left-10 rounded-3xl border border-white/10 bg-ink/70 p-6 backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-volt uppercase">
            <Home size={13} /> Gym or living room
          </div>
          <p className="font-display text-2xl leading-snug uppercase">
            &ldquo;The best gym is the one you actually show up to&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
