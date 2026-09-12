"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  Layers,
  Sparkles,
  Trophy,
  Zap,
  ArrowRight,
  CheckCircle2,
  BookmarkCheck,
} from "lucide-react";
import { Badge, Button, PageHeader, DifficultyBadge } from "@/components/ui";
import { cx } from "@/lib/utils";

type ProgramCard = {
  id: number;
  title: string;
  slug: string;
  description: string;
  level: string;
  durationWeeks: number;
  daysPerWeek: number;
  category: string;
  isEnrolled: boolean;
  currentWeek: number;
  currentDay: number;
  status: string | null;
};

export function ProgramsClient({ programs }: { programs: ProgramCard[] }) {
  const [filter, setFilter] = useState("all");

  const filtered = programs.filter((p) => {
    if (filter === "all") return true;
    if (filter === "enrolled") return p.isEnrolled;
    return p.category === filter;
  });

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Structured Periodization"
        title="Multi-Week Programs"
        sub="Progressive training blocks built around scientific overload. Commit to a structured schedule and follow day-by-day routines."
      />

      {/* Filter Chips */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {["all", "enrolled", "hypertrophy", "strength", "shred"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cx(
              "cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition-all",
              filter === cat
                ? "border-volt/60 bg-volt/10 text-volt shadow-lg shadow-volt/20"
                : "border-white/10 bg-white/[0.03] text-fog hover:border-white/20 hover:text-paper"
            )}
          >
            {cat === "all" ? "All Programs" : cat === "enrolled" ? "Enrolled Only" : cat}
          </button>
        ))}
      </div>

      {/* Program Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((prog) => (
          <div
            key={prog.id}
            className="panel group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-volt/40 hover:bg-white/[0.04]"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge tone="volt" className="capitalize text-[10px] font-bold">
                  {prog.category}
                </Badge>
                <DifficultyBadge difficulty={prog.level} />
              </div>

              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-paper group-hover:text-volt transition-colors">
                {prog.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-fog line-clamp-3">
                {prog.description}
              </p>

              {/* Specs */}
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/5 pt-4 text-xs">
                <div className="flex items-center gap-1.5 text-fog">
                  <Calendar size={13} className="text-volt" />
                  <span>{prog.durationWeeks} Weeks Duration</span>
                </div>
                <div className="flex items-center gap-1.5 text-fog">
                  <Clock size={13} className="text-ember" />
                  <span>{prog.daysPerWeek} Days / Week</span>
                </div>
              </div>

              {/* Enrollment status indicator */}
              {prog.isEnrolled && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <BookmarkCheck size={14} /> Active Enrollment
                    </span>
                    <span className="font-mono text-paper">
                      W{prog.currentWeek} • D{prog.currentDay}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-white/8 pt-4">
              <Link href={`/dashboard/programs/${prog.id}`} className="block w-full">
                <Button variant={prog.isEnrolled ? "volt" : "outline"} className="w-full justify-between">
                  <span>{prog.isEnrolled ? "Resume Program" : "View Curriculum"}</span>
                  <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
