"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Layers,
  Play,
  Repeat,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, DifficultyBadge } from "@/components/ui";
import { cx } from "@/lib/utils";

type DayExercise = {
  id: number;
  orderIndex: number;
  sets: number;
  reps: string;
  restSeconds: number;
  exercise: {
    id: number;
    name: string;
    targetArea: string;
    difficulty: string;
    equipment: string;
  };
};

type ProgramDayData = {
  id: number;
  dayNumber: number;
  name: string;
  focus: string;
  isRestDay: boolean;
  exercises: DayExercise[];
};

type ProgramWeekData = {
  id: number;
  weekNumber: number;
  title: string;
  description: string;
  days: ProgramDayData[];
};

export function ProgramDetailClient({
  program,
  weeks,
  initialEnrollment,
}: {
  program: {
    id: number;
    title: string;
    description: string;
    level: string;
    durationWeeks: number;
    daysPerWeek: number;
    category: string;
  };
  weeks: ProgramWeekData[];
  initialEnrollment: {
    id: number;
    currentWeek: number;
    currentDay: number;
    status: string;
  } | null;
}) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [selectedWeek, setSelectedWeek] = useState(initialEnrollment ? initialEnrollment.currentWeek : 1);
  const [enrolling, setEnrolling] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/programs/${program.id}/enroll`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to enroll");
      setEnrollment(data.enrollment);
      toast.success(`Enrolled in ${program.title}! Time to lock in.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  }

  async function startDaySession(day: ProgramDayData) {
    if (day.isRestDay || day.exercises.length === 0) return;
    setStartingSession(true);

    try {
      // 1. Create live workout session
      const sessRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: `${program.title} (W${selectedWeek} ${day.name})`,
        }),
      });
      const sessData = await sessRes.json();
      if (!sessRes.ok) throw new Error(sessData.error ?? "Failed to initialize session");

      toast.success(`Booting ${day.name}...`);
      router.push(`/dashboard/train/live/${sessData.session.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start session");
      setStartingSession(false);
    }
  }

  const activeWeek = weeks.find((w) => w.weekNumber === selectedWeek) || weeks[0];

  return (
    <div className="mx-auto max-w-5xl pb-20">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/programs"
          className="inline-flex items-center gap-2 text-sm font-medium text-fog transition-colors hover:text-paper"
        >
          <ArrowLeft size={16} /> Back to Programs
        </Link>
        {enrollment && enrollment.status === "active" ? (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={13} /> Active Enrollment (W{enrollment.currentWeek} • D{enrollment.currentDay})
          </span>
        ) : (
          <Button variant="volt" size="sm" loading={enrolling} onClick={handleEnroll}>
            <Zap size={14} /> Enroll in Program
          </Button>
        )}
      </div>

      {/* Hero Header Card */}
      <div className="panel relative overflow-hidden rounded-3xl border border-white/10 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge tone="volt" className="uppercase font-bold tracking-wider">
            {program.category}
          </Badge>
          <DifficultyBadge difficulty={program.level} />
          <Badge tone="neutral">
            <Calendar size={12} className="inline mr-1" />
            {program.durationWeeks} Weeks Block
          </Badge>
          <Badge tone="neutral">
            <Clock size={12} className="inline mr-1" />
            {program.daysPerWeek} Days / Week
          </Badge>
        </div>

        <h1 className="font-display text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-paper">
          {program.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-fog">
          {program.description}
        </p>
      </div>

      {/* Week Tabs */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {weeks.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWeek(w.weekNumber)}
            className={cx(
              "cursor-pointer shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
              selectedWeek === w.weekNumber
                ? "bg-volt text-black shadow-lg shadow-volt/20"
                : "text-fog hover:bg-white/[0.04] hover:text-paper"
            )}
          >
            Week {w.weekNumber}
          </button>
        ))}
      </div>

      {/* Days List for Active Week */}
      {activeWeek && (
        <div className="mt-6 space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-paper">{activeWeek.title}</h2>
            <p className="text-xs text-fog">{activeWeek.description}</p>
          </div>

          <div className="space-y-4">
            {activeWeek.days.map((day) => (
              <div
                key={day.id}
                className={cx(
                  "panel rounded-2xl border p-5 transition-all",
                  day.isRestDay
                    ? "border-white/5 bg-white/[0.01] opacity-75"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-volt">
                        Day {day.dayNumber}
                      </span>
                      {day.isRestDay ? (
                        <Badge tone="frost" className="text-[10px]">Rest & Recovery</Badge>
                      ) : (
                        <Badge tone="neutral" className="text-[10px] capitalize">{day.focus}</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-paper">{day.name}</h3>
                  </div>

                  {!day.isRestDay && (
                    <Button
                      size="sm"
                      variant="volt"
                      disabled={startingSession}
                      onClick={() => startDaySession(day)}
                      className="gap-1.5"
                    >
                      <Play size={13} fill="currentColor" /> Train Day {day.dayNumber}
                    </Button>
                  )}
                </div>

                {/* Day Exercise List */}
                {!day.isRestDay && day.exercises.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {day.exercises.map((de, idx) => (
                      <div
                        key={de.id}
                        className="rounded-xl border border-white/6 bg-white/[0.02] p-3 text-xs"
                      >
                        <span className="font-semibold text-paper block truncate">
                          {idx + 1}. {de.exercise.name}
                        </span>
                        <span className="font-mono text-volt mt-1 block">
                          {de.sets} sets × {de.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
