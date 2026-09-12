"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Zap } from "lucide-react";
import { toast } from "sonner";
import { cx } from "@/lib/utils";

export function StartSessionButton({
  planId,
  label,
  variant = "volt",
  className,
}: {
  planId: number | null;
  label: string;
  variant?: "volt" | "outline";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function start() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not start session");
        setLoading(false);
        return;
      }
      toast.success(planId ? "Workout armed. Let's go." : "Free session started.");
      router.push(`/dashboard/train/live/${data.session.id}`);
    } catch {
      toast.error("Network error");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.97] disabled:opacity-60",
        variant === "volt"
          ? "bg-volt px-6 py-3 text-sm text-black hover:shadow-[0_8px_30px_-6px_rgba(200,255,46,0.55)]"
          : "border border-white/15 px-6 py-3 text-sm text-paper hover:border-volt/40 hover:text-volt",
        className
      )}
    >
      {variant === "volt" ? (
        <Zap size={16} fill="currentColor" />
      ) : (
        <Play size={16} />
      )}
      {loading ? "Arming…" : label}
    </button>
  );
}
