"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Clock,
  Dumbbell,
  Layers,
  Repeat,
  Trophy,
  Flame,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { Exercise } from "@/db/schema";
import { AREA_LABEL, cx, EQUIPMENT_LABEL, LEVEL_LABEL } from "@/lib/utils";
import { Badge, Button, DifficultyBadge } from "@/components/ui";
import { ExerciseArt } from "@/components/exercise-art";

interface ExerciseDetailClientProps {
  exercise: Exercise;
  personalRecords: Array<{
    id: number;
    recordType: string;
    value: string;
    unit: string;
    achievedAt: Date;
    notes?: string | null;
  }>;
  history: Array<{
    id: number;
    sets: number;
    reps: string;
    startedAt: string;
    planName: string | null;
  }>;
}

export function ExerciseDetailClient({
  exercise,
  personalRecords,
  history,
}: ExerciseDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"technique" | "history" | "safety">("technique");

  const primaryMuscle = exercise.primaryMuscle || exercise.targetArea;
  const secondaryMuscles = exercise.secondaryMuscles || [];
  const commonMistakes = exercise.commonMistakes || [];
  const formTips = exercise.formTips && exercise.formTips.length > 0 ? exercise.formTips : (exercise.tips || []);
  const alternatives = exercise.alternatives || [];

  return (
    <div className="mx-auto max-w-6xl pb-20">
      {/* Top breadcrumb & navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/exercises"
          className="inline-flex items-center gap-2 text-sm font-medium text-fog transition-colors hover:text-paper"
        >
          <ArrowLeft size={16} />
          Back to Exercise Arsenal
        </Link>
        <Link href="/dashboard/train">
          <Button variant="volt" size="sm" className="gap-2">
            <Zap size={14} /> Train Now
          </Button>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="panel relative overflow-hidden rounded-3xl border border-white/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="volt" className="uppercase font-bold tracking-wider">
                {primaryMuscle}
              </Badge>
              <DifficultyBadge difficulty={exercise.difficulty} />
              <Badge tone="neutral">
                {EQUIPMENT_LABEL[exercise.equipment] || exercise.equipment}
              </Badge>
              {exercise.movementPattern && (
                <Badge tone="ghost" className="capitalize">
                  {exercise.movementPattern} Pattern
                </Badge>
              )}
            </div>

            <div>
              <h1 className="font-display text-4xl font-extrabold tracking-wide uppercase text-paper md:text-5xl">
                {exercise.name}
              </h1>
              <p className="mt-2 text-base leading-relaxed text-fog">
                {exercise.description ||
                  `High-yield resistance movement targeting the ${primaryMuscle} with focus on optimal mechanical tension and controlled eccentric tempo.`}
              </p>
            </div>

            {/* Target Specs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-fog uppercase">
                  <Layers size={13} className="text-volt" /> Sets
                </span>
                <p className="mt-1 text-xl font-bold text-paper">{exercise.sets || 3} Working Sets</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-fog uppercase">
                  <Repeat size={13} className="text-volt" /> Rep Target
                </span>
                <p className="mt-1 text-xl font-bold text-paper">{exercise.reps || "10-12"} Reps</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-fog uppercase">
                  <Clock size={13} className="text-volt" /> Rest Interval
                </span>
                <p className="mt-1 text-xl font-bold text-paper">{exercise.restSeconds || 60}s Rest</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-fog uppercase">
                  <Flame size={13} className="text-ember" /> Burn Rate
                </span>
                <p className="mt-1 text-xl font-bold text-paper">~{exercise.kcalPerMin || 8} kcal/m</p>
              </div>
            </div>
          </div>

          <div className="flex w-full md:w-72 shrink-0 flex-col items-center justify-center">
            <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl">
              <ExerciseArt
                accent={exercise.accent || "volt"}
                icon={exercise.icon || "flame"}
                index={exercise.id}
                className="h-44 w-full"
              />
              <div className="border-t border-white/10 p-3 bg-white/[0.02] text-center">
                <span className="text-xs font-medium text-fog">Target Muscle Activation</span>
                <p className="text-sm font-semibold capitalize text-volt">
                  {primaryMuscle} {secondaryMuscles.length > 0 && `• ${secondaryMuscles.join(", ")}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("technique")}
          className={cx(
            "rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
            activeTab === "technique"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          Technique & Execution
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cx(
            "rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
            activeTab === "history"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          Personal Records & History ({history.length})
        </button>
        <button
          onClick={() => setActiveTab("safety")}
          className={cx(
            "rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
            activeTab === "safety"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          Safety & Anatomy
        </button>
      </div>

      {/* Tab 1: Technique & Form */}
      {activeTab === "technique" && (
        <div className="mt-8 space-y-8">
          {/* 3-Step Execution Blueprint */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-bold tracking-widest text-volt uppercase">Step-by-Step Blueprint</span>
              <h2 className="text-2xl font-bold text-paper">Biomechanical Breakdown</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1: Setup */}
              <div className="panel relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-timer text-2xl font-black text-volt">01</span>
                    <Badge tone="volt">Setup & Stance</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-paper">Starting Position</h3>
                  <p className="mt-3 text-sm leading-relaxed text-fog">
                    {exercise.setupInstructions ||
                      "Position feet firmly at shoulder-width. Brace core with diaphragmatic pressure, pin shoulder blades back and down, and establish a neutral spine before initiating movement."}
                  </p>
                </div>
                <div className="mt-6 border-t border-white/5 pt-4 text-xs font-medium text-fog/80">
                  ⚡ Focus: Stable base of support & kinetic alignment
                </div>
              </div>

              {/* Step 2: Movement */}
              <div className="panel relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-timer text-2xl font-black text-ember">02</span>
                    <Badge tone="ember">Execution</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-paper">Movement & Tempo</h3>
                  <p className="mt-3 text-sm leading-relaxed text-fog">
                    {exercise.movementInstructions ||
                      "Initiate the movement under control. Emphasize a 3-second eccentric (lowering) phase, feeling maximum stretch in the working muscle. Drive through the target musculature without bouncing."}
                  </p>
                </div>
                <div className="mt-6 border-t border-white/5 pt-4 text-xs font-medium text-fog/80">
                  ⚡ Focus: Controlled eccentric cadence & muscle tension
                </div>
              </div>

              {/* Step 3: Finish */}
              <div className="panel relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-timer text-2xl font-black text-frost">03</span>
                    <Badge tone="frost">Peak & Reset</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-paper">Finish & Squeeze</h3>
                  <p className="mt-3 text-sm leading-relaxed text-fog">
                    {exercise.finishInstructions ||
                      "Lock in peak contraction at the top for 1 full second. Squeeze the target muscle hard without hyperextending joints, then smoothly reset into the next repetition."}
                  </p>
                </div>
                <div className="mt-6 border-t border-white/5 pt-4 text-xs font-medium text-fog/80">
                  ⚡ Focus: Peak contraction without joint hyperextension
                </div>
              </div>
            </div>
          </div>

          {/* Form Cues & Common Mistakes in a 2-Column Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Form Cues */}
            <div className="panel rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2.5 text-volt mb-4">
                <CheckCircle2 size={20} />
                <h3 className="text-lg font-bold text-paper">Mastery Form Cues</h3>
              </div>
              <ul className="space-y-3">
                {formTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-paper/90">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-volt/20 text-[10px] font-bold text-volt">
                      ✓
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Mistakes */}
            <div className="panel rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-6">
              <div className="flex items-center gap-2.5 text-red-400 mb-4">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold text-paper">Common Mistakes to Avoid</h3>
              </div>
              <ul className="space-y-3">
                {commonMistakes.length > 0 ? (
                  commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-paper/90">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">
                        ✕
                      </span>
                      <span>{mistake}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-3 text-sm text-paper/90">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">
                        ✕
                      </span>
                      <span>Using body momentum or swinging weights rather than strict muscular isolation.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-paper/90">
                      <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">
                        ✕
                      </span>
                      <span>Truncating range of motion at bottom or failing to reach full extension.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Alternatives & Variations */}
          {alternatives.length > 0 && (
            <div className="panel rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-paper mb-3">
                <Sparkles size={18} className="text-volt" />
                <h3 className="text-lg font-bold">Recommended Variations & Substitutes</h3>
              </div>
              <p className="text-sm text-fog mb-4">
                If equipment is unavailable or you require joint-friendly adjustments, switch to:
              </p>
              <div className="flex flex-wrap gap-2">
                {alternatives.map((alt, idx) => (
                  <span
                    key={idx}
                    className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-paper"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Personal Records & History */}
      {activeTab === "history" && (
        <div className="mt-8 space-y-8">
          {/* PR Showcase */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-bold tracking-widest text-volt uppercase">Your Benchmark</span>
              <h2 className="text-2xl font-bold text-paper">Personal Records</h2>
            </div>

            {personalRecords.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {personalRecords.map((pr) => (
                  <div
                    key={pr.id}
                    className="panel relative overflow-hidden rounded-2xl border border-volt/30 bg-volt/[0.04] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <Trophy size={20} className="text-volt" />
                      <span className="text-[11px] font-semibold text-fog capitalize">
                        {pr.recordType.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="font-display text-3xl font-extrabold text-paper">
                        {pr.value}{" "}
                        <span className="text-lg font-normal text-volt">{pr.unit}</span>
                      </div>
                      <p className="mt-1 text-xs text-fog">
                        Achieved on {new Date(pr.achievedAt).toLocaleDateString()}
                      </p>
                      {pr.notes && (
                        <p className="mt-2 text-xs italic text-fog/80">&ldquo;{pr.notes}&rdquo;</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <Trophy size={36} className="mx-auto text-fog/40 mb-3" />
                <h3 className="text-base font-semibold text-paper">No Personal Records Yet</h3>
                <p className="mt-1 text-sm text-fog max-w-md mx-auto">
                  Complete a live workout logging this exercise to automatically calculate and record your 1RM, max weight, and volume PRs!
                </p>
                <Link href="/dashboard/train" className="mt-4 inline-block">
                  <Button variant="volt" size="sm">Start a Workout</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Session History Table */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-bold tracking-widest text-volt uppercase">Past Performances</span>
              <h2 className="text-2xl font-bold text-paper">Exercise Session History</h2>
            </div>

            {history.length > 0 ? (
              <div className="panel overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-bold uppercase text-fog">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Plan / Session</th>
                      <th className="p-4">Completed Sets</th>
                      <th className="p-4">Reps Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-paper">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-fog">
                          {new Date(h.startedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-4 font-medium">{h.planName || "Ad-hoc Session"}</td>
                        <td className="p-4 font-mono font-semibold text-volt">{h.sets} sets</td>
                        <td className="p-4 text-fog">{h.reps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-fog text-sm">
                No past training sessions logged with this exercise. Log your sets during your next workout to populate your training journal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Safety & Anatomy */}
      {activeTab === "safety" && (
        <div className="mt-8 space-y-6">
          <div className="panel rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2.5 text-volt mb-3">
              <ShieldCheck size={22} />
              <h3 className="text-xl font-bold text-paper">Safety & Injury Prevention Protocol</h3>
            </div>
            <p className="text-sm leading-relaxed text-fog mb-4">
              {exercise.safety ||
                "Maintain spinal neutrality and avoid excessive arching or rounding. If you feel localized joint impingement or sharp discomfort, immediately disengage and lower the working weight."}
            </p>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-xs leading-relaxed text-amber-200">
              <strong>Non-Medical Guidance Notice:</strong> The technique cues provided are for educational and athletic performance purposes. Always perform dynamic mobility warm-ups prior to loaded sets and consult a licensed physiotherapist if you have pre-existing joint pathology.
            </div>
          </div>

          <div className="panel rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-lg font-bold text-paper mb-3">Musculoskeletal Engagement</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <span className="text-xs font-semibold text-fog uppercase">Primary Mover</span>
                <p className="mt-1 text-base font-bold capitalize text-volt">{primaryMuscle}</p>
                <p className="mt-1 text-xs text-fog">Receives maximal motor unit recruitment and dynamic tension.</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <span className="text-xs font-semibold text-fog uppercase">Synergists & Stabilizers</span>
                <p className="mt-1 text-base font-bold capitalize text-paper">
                  {secondaryMuscles.length > 0 ? secondaryMuscles.join(", ") : "Core, rotator cuff & postural stabilizers"}
                </p>
                <p className="mt-1 text-xs text-fog">Provide isometric stabilization and kinetic integrity throughout ROM.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
