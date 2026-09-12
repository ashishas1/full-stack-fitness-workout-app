"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  Check,
  ClipboardList,
  Flame,
  Plus,
  Scale,
  Trash2,
  TrendingUp,
  X,
  Target,
  Trophy,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Award,
  Zap,
  Star,
  Crown,
  Dumbbell,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cx, fmtDate } from "@/lib/utils";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Textarea,
  Badge,
  Select,
} from "@/components/ui";
import { StreakCalendar, TrendChart } from "@/components/charts";

export type ProgressLogRow = {
  id: number;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armsCm: number | null;
  thighsCm: number | null;
  bodyFatPct: number | null;
  note: string;
};

export type UserGoalRow = {
  id: number;
  title: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string | null;
  status: string;
};

export type PersonalRecordRow = {
  id: number;
  exerciseId: number | null;
  exerciseName: string;
  recordType: string;
  value: number;
  weightKg: number | null;
  reps: number | null;
  achievedAt: string;
};

export type AchievementRow = {
  key: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  metric: string;
  isUnlocked: boolean;
  currentValue: number;
  unlockedAt: string | null;
};

export function ProgressClient({
  initialLogs,
  initialGoals,
  personalRecords,
  achievements = [],
  calendarDays,
  totalWorkouts,
  totalVolumeKg,
}: {
  initialLogs: ProgressLogRow[];
  initialGoals: UserGoalRow[];
  personalRecords: PersonalRecordRow[];
  achievements?: AchievementRow[];
  calendarDays: { date: string; minutes: number }[];
  totalWorkouts: number;
  totalVolumeKg: number;
}) {
  const [activeTab, setActiveTab] = useState<"body" | "goals" | "prs" | "consistency" | "achievements">("body");
  const [logs, setLogs] = useState(initialLogs);
  const [goals, setGoals] = useState(initialGoals);
  const [metric, setMetric] = useState<"weightKg" | "waistCm" | "chestCm" | "armsCm" | "thighsCm" | "bodyFatPct">("weightKg");

  // Add Log State
  const [addOpen, setAddOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [arms, setArms] = useState("");
  const [thighs, setThighs] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ProgressLogRow | null>(null);
  const [busy, setBusy] = useState(false);

  // Add Goal State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("strength");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalUnit, setGoalUnit] = useState("kg");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const withMetric = logs.filter((l) => l[metric] != null);
  const first = withMetric[0];
  const last = withMetric[withMetric.length - 1];
  const delta =
    first && last && withMetric.length > 1
      ? (last[metric] ?? 0) - (first[metric] ?? 0)
      : null;

  const metricLabels: Record<string, { label: string; unit: string }> = {
    weightKg: { label: "Body Weight", unit: "kg" },
    waistCm: { label: "Waist Circumference", unit: "cm" },
    chestCm: { label: "Chest Circumference", unit: "cm" },
    armsCm: { label: "Arms Circumference", unit: "cm" },
    thighsCm: { label: "Thighs Circumference", unit: "cm" },
    bodyFatPct: { label: "Body Fat", unit: "%" },
  };

  const trainedDays = calendarDays.filter((d) => d.minutes > 0).length;
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  async function addLog() {
    if (saving) return;
    const numWeight = weight.trim() ? Number(weight) : null;
    const numWaist = waist.trim() ? Number(waist) : null;
    const numChest = chest.trim() ? Number(chest) : null;
    const numArms = arms.trim() ? Number(arms) : null;
    const numThighs = thighs.trim() ? Number(thighs) : null;
    const numBodyFat = bodyFat.trim() ? Number(bodyFat) : null;

    if (
      numWeight === null &&
      numWaist === null &&
      numChest === null &&
      numArms === null &&
      numThighs === null &&
      numBodyFat === null
    ) {
      toast.error("Please enter at least one body measurement.");
      return;
    }

    setSaving(true);
    const parsedDate = date ? new Date(date) : new Date();
    const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const temp: ProgressLogRow = {
      id: -Date.now(),
      date: validDate.toISOString(),
      weightKg: numWeight,
      waistCm: numWaist,
      chestCm: numChest,
      armsCm: numArms,
      thighsCm: numThighs,
      bodyFatPct: numBodyFat,
      note,
    };
    setLogs((arr) =>
      [...arr, temp].sort((a, b) => a.date.localeCompare(b.date))
    );
    setAddOpen(false);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          weightKg: weight,
          waistCm: waist,
          chestCm: chest,
          armsCm: arms,
          thighsCm: thighs,
          bodyFatPct: bodyFat,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not log");
      setLogs((arr) =>
        arr
          .map((l) =>
            l.id === temp.id
              ? {
                  id: data.log.id,
                  date: data.log.date,
                  weightKg: data.log.weightKg ? Number(data.log.weightKg) : null,
                  waistCm: data.log.waistCm ? Number(data.log.waistCm) : null,
                  chestCm: data.log.chestCm ? Number(data.log.chestCm) : null,
                  armsCm: data.log.armsCm ? Number(data.log.armsCm) : null,
                  thighsCm: data.log.thighsCm ? Number(data.log.thighsCm) : null,
                  bodyFatPct: data.log.bodyFatPct ? Number(data.log.bodyFatPct) : null,
                  note: data.log.note,
                }
              : l
          )
          .sort((a, b) => a.date.localeCompare(b.date))
      );
      toast.success("Measurement recorded in database");
      setWeight("");
      setWaist("");
      setChest("");
      setArms("");
      setThighs("");
      setBodyFat("");
      setNote("");
    } catch (err) {
      setLogs((arr) => arr.filter((l) => l.id !== temp.id));
      toast.error(err instanceof Error ? err.message : "Could not log");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setBusy(true);
    setLogs((arr) => arr.filter((l) => l.id !== target.id));
    setDeleting(null);
    try {
      const res = await fetch(`/api/progress/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Entry deleted");
    } catch {
      setLogs((arr) => [...arr, target].sort((a, b) => a.date.localeCompare(b.date)));
      toast.error("Could not delete — restored");
    } finally {
      setBusy(false);
    }
  }

  async function createGoal() {
    if (!goalTitle.trim() || !goalTarget.trim()) {
      toast.error("Title and target value are required");
      return;
    }
    setSavingGoal(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalTitle,
          category: goalCategory,
          targetValue: goalTarget,
          currentValue: goalCurrent || "0",
          unit: goalUnit,
          deadline: goalDeadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create goal");
      setGoals([
        {
          id: data.goal.id,
          title: data.goal.title,
          category: data.goal.category,
          targetValue: Number(data.goal.targetValue),
          currentValue: Number(data.goal.currentValue),
          unit: data.goal.unit,
          deadline: data.goal.deadline,
          status: data.goal.status,
        },
        ...goals,
      ]);
      setGoalModalOpen(false);
      setGoalTitle("");
      setGoalTarget("");
      setGoalCurrent("");
      toast.success("Goal set! Track your progress as you train.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSavingGoal(false);
    }
  }

  async function incrementGoal(g: UserGoalRow, deltaVal: number) {
    const updatedVal = Math.max(0, g.currentValue + deltaVal);
    setGoals((prev) =>
      prev.map((item) =>
        item.id === g.id
          ? {
              ...item,
              currentValue: updatedVal,
              status: updatedVal >= item.targetValue ? "completed" : item.status,
            }
          : item
      )
    );
    try {
      const res = await fetch(`/api/goals/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentValue: updatedVal }),
      });
      if (!res.ok) throw new Error();
      if (updatedVal >= g.targetValue && g.status !== "completed") {
        toast.success(`🎯 Goal Achieved: ${g.title}!`);
      }
    } catch {
      toast.error("Failed to update goal");
    }
  }

  async function deleteGoal(id: number) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
      toast.success("Goal deleted");
    } catch {
      toast.error("Could not delete goal");
    }
  }

  function renderAchievementIcon(icon: string) {
    switch (icon) {
      case "flame":
        return <Flame className="h-6 w-6 text-ember" />;
      case "zap":
        return <Zap className="h-6 w-6 text-volt" />;
      case "star":
        return <Star className="h-6 w-6 text-amber-400" />;
      case "dumbbell":
        return <Dumbbell className="h-6 w-6 text-sky-400" />;
      case "trophy":
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case "crown":
        return <Crown className="h-6 w-6 text-purple-400" />;
      case "award":
      default:
        return <Award className="h-6 w-6 text-emerald-400" />;
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Real Transformation Metrics"
        title="Progress & Analytics"
        sub="Monitor body measurements, target athletic goals, personal records, and weekly volume consistency."
      >
        <div className="flex gap-2">
          {activeTab === "body" && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Log Measurement
            </Button>
          )}
          {activeTab === "goals" && (
            <Button onClick={() => setGoalModalOpen(true)}>
              <Plus size={16} /> New Target Goal
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Tabs Switcher */}
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("body")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "body"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <Scale size={15} className="inline mr-1.5" /> Body Composition ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "achievements"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <Award size={15} className="inline mr-1.5" /> Achievements ({unlockedCount}/{achievements.length})
        </button>
        <button
          onClick={() => setActiveTab("goals")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "goals"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <Target size={15} className="inline mr-1.5" /> Target Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab("prs")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "prs"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <Trophy size={15} className="inline mr-1.5" /> Personal Records ({personalRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("consistency")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "consistency"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <CalendarCheck size={15} className="inline mr-1.5" /> Consistency & Volume
        </button>
      </div>

      {/* TAB 1: Body Metrics */}
      {activeTab === "body" && (
        <div className="space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <div className="panel p-4">
              <span className="text-[11px] font-semibold text-fog uppercase">Weight</span>
              <p className="mt-1 font-display text-2xl font-bold text-paper">
                {last?.weightKg ? `${last.weightKg} kg` : "—"}
              </p>
            </div>
            <div className="panel p-4">
              <span className="text-[11px] font-semibold text-fog uppercase">Waist</span>
              <p className="mt-1 font-display text-2xl font-bold text-paper">
                {last?.waistCm ? `${last.waistCm} cm` : "—"}
              </p>
            </div>
            <div className="panel p-4">
              <span className="text-[11px] font-semibold text-fog uppercase">Chest</span>
              <p className="mt-1 font-display text-2xl font-bold text-paper">
                {last?.chestCm ? `${last.chestCm} cm` : "—"}
              </p>
            </div>
            <div className="panel p-4">
              <span className="text-[11px] font-semibold text-fog uppercase">Arms</span>
              <p className="mt-1 font-display text-2xl font-bold text-paper">
                {last?.armsCm ? `${last.armsCm} cm` : "—"}
              </p>
            </div>
            <div className="panel p-4">
              <span className="text-[11px] font-semibold text-fog uppercase">Thighs</span>
              <p className="mt-1 font-display text-2xl font-bold text-paper">
                {last?.thighsCm ? `${last.thighsCm} cm` : "—"}
              </p>
            </div>
            <div className="panel p-4">
              <span className="text-[11px] font-semibold text-fog uppercase">Body Fat</span>
              <p className="mt-1 font-display text-2xl font-bold text-paper">
                {last?.bodyFatPct ? `${last.bodyFatPct}%` : "—"}
              </p>
            </div>
          </div>

          {/* Metric Selector & Chart */}
          <div className="panel p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-paper">Biometric Trend: {metricLabels[metric].label}</h3>
                <p className="text-xs text-fog">Track circumferences, body composition, and mass progression over time</p>
              </div>
              <div className="flex flex-wrap rounded-xl border border-white/10 bg-white/[0.03] p-1 gap-1">
                {(["weightKg", "waistCm", "chestCm", "armsCm", "thighsCm", "bodyFatPct"] as const).map((mKey) => (
                  <button
                    key={mKey}
                    onClick={() => setMetric(mKey)}
                    className={cx(
                      "cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                      metric === mKey ? "bg-volt text-black" : "text-fog hover:text-paper"
                    )}
                  >
                    {metricLabels[mKey].label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {withMetric.length > 0 ? (
              <TrendChart
                points={withMetric.map((l) => ({
                  date: l.date,
                  value: l[metric] ?? 0,
                }))}
                unit={metricLabels[metric].unit}
              />
            ) : (
              <div className="p-8 text-center text-sm text-fog">
                No measurements logged yet for {metricLabels[metric].label.toLowerCase()}. Click &apos;Log Measurement&apos; above.
              </div>
            )}
          </div>

          {/* Measurements History Table */}
          <div className="panel overflow-hidden rounded-2xl border border-white/10">
            <div className="border-b border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-base font-bold text-paper">Measurement Log History</h3>
            </div>
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-bold uppercase text-fog">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Weight</th>
                      <th className="p-3">Waist</th>
                      <th className="p-3">Chest</th>
                      <th className="p-3">Arms</th>
                      <th className="p-3">Thighs</th>
                      <th className="p-3">BF %</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((l) => (
                      <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-paper font-medium">{fmtDate(l.date)}</td>
                        <td className="p-3 text-fog">{l.weightKg ? `${l.weightKg} kg` : "—"}</td>
                        <td className="p-3 text-fog">{l.waistCm ? `${l.waistCm} cm` : "—"}</td>
                        <td className="p-3 text-fog">{l.chestCm ? `${l.chestCm} cm` : "—"}</td>
                        <td className="p-3 text-fog">{l.armsCm ? `${l.armsCm} cm` : "—"}</td>
                        <td className="p-3 text-fog">{l.thighsCm ? `${l.thighsCm} cm` : "—"}</td>
                        <td className="p-3 text-fog">{l.bodyFatPct ? `${l.bodyFatPct}%` : "—"}</td>
                        <td className="p-3 text-fog text-xs max-w-[180px] truncate">{l.note || "—"}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setDeleting(l)}
                            className="cursor-pointer rounded-lg p-1.5 text-fog hover:bg-white/10 hover:text-ember transition-colors"
                            title="Delete log entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-fog">
                No measurements logged yet. Use &apos;Log Measurement&apos; to add your stats.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Achievements & Badges */}
      {activeTab === "achievements" && (
        <div className="space-y-8">
          {/* Milestone Banner */}
          <div className="panel p-6 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-volt/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-volt">Athletic Milestones</span>
                <h3 className="mt-1 font-display text-2xl font-bold text-paper">
                  {unlockedCount} of {achievements.length} Badges Unlocked
                </h3>
                <p className="mt-1 text-sm text-fog">
                  Badges automatically unlock as you log real workouts, hit personal records, and lift cumulative volume.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-40 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-volt rounded-full transition-all duration-500"
                    style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-bold text-volt">
                  {achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {achievements.map((ach) => {
              const progressPct = Math.min(100, Math.round((ach.currentValue / ach.target) * 100));
              return (
                <div
                  key={ach.key}
                  className={cx(
                    "panel p-5 relative overflow-hidden transition-all",
                    ach.isUnlocked
                      ? "border-volt/30 bg-volt/[0.03] shadow-lg shadow-volt/5"
                      : "border-white/10 opacity-75"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cx(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
                        ach.isUnlocked
                          ? "border-volt/40 bg-volt/10"
                          : "border-white/10 bg-white/[0.03]"
                      )}
                    >
                      {renderAchievementIcon(ach.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display text-base font-bold text-paper truncate">
                          {ach.title}
                        </h4>
                        {ach.isUnlocked ? (
                          <Badge tone="volt" className="shrink-0 text-[10px]">
                            <CheckCircle2 size={11} className="mr-1" /> Unlocked
                          </Badge>
                        ) : (
                          <Badge tone="neutral" className="shrink-0 text-[10px]">
                            <Lock size={10} className="mr-1" /> Locked
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-fog leading-relaxed">
                        {ach.description}
                      </p>

                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-fog">
                          <span>
                            {ach.isUnlocked
                              ? `Unlocked ${ach.unlockedAt ? fmtDate(ach.unlockedAt) : "Recently"}`
                              : `Progress: ${ach.currentValue.toLocaleString()} / ${ach.target.toLocaleString()} ${ach.metric}`}
                          </span>
                          <span className="font-semibold text-paper">{progressPct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={cx(
                              "h-full rounded-full transition-all duration-500",
                              ach.isUnlocked ? "bg-volt" : "bg-white/40"
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Goals */}
      {activeTab === "goals" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-paper">Target Benchmarks</h3>
            <span className="text-xs text-fog">Increment values as you advance</span>
          </div>

          {goals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                const isDone = g.currentValue >= g.targetValue || g.status === "completed";
                return (
                  <div key={g.id} className="panel p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge tone={isDone ? "volt" : "neutral"} className="text-[10px]">
                          {g.category.toUpperCase()}
                        </Badge>
                        {isDone ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <Check size={14} /> Completed
                          </span>
                        ) : g.deadline ? (
                          <span className="text-xs text-fog">
                            Due {fmtDate(g.deadline)}
                          </span>
                        ) : null}
                      </div>
                      <h4 className="mt-3 font-display text-lg font-bold text-paper">
                        {g.title}
                      </h4>
                      <p className="mt-1 text-xs text-fog">
                        Target: {g.targetValue} {g.unit}
                      </p>

                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono text-paper">
                            {g.currentValue} {g.unit}
                          </span>
                          <span className="font-bold text-volt">{pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={cx(
                              "h-full rounded-full transition-all duration-300",
                              isDone ? "bg-emerald-400" : "bg-volt"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => incrementGoal(g, 1)}
                          className="cursor-pointer rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-paper hover:bg-white/10 transition-colors"
                        >
                          +1 {g.unit}
                        </button>
                        <button
                          onClick={() => incrementGoal(g, 5)}
                          className="cursor-pointer rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-paper hover:bg-white/10 transition-colors"
                        >
                          +5
                        </button>
                      </div>
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="cursor-pointer p-1 text-fog hover:text-ember transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel p-12 text-center">
              <Target className="mx-auto h-10 w-10 text-fog opacity-40" />
              <h4 className="mt-3 text-base font-bold text-paper">No goals set yet</h4>
              <p className="mt-1 text-xs text-fog">Set benchmarks for strength, weight, or frequency to maintain laser focus.</p>
              <Button className="mt-4 mx-auto" onClick={() => setGoalModalOpen(true)}>
                <Plus size={16} /> Create First Goal
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Personal Records */}
      {activeTab === "prs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-paper">Personal Records Hall</h3>
              <p className="text-xs text-fog">Automatically recognized whenever you hit higher 1RM or max load in live sessions</p>
            </div>
            <Badge tone="volt">{personalRecords.length} All-Time PRs</Badge>
          </div>

          {personalRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalRecords.map((pr) => (
                <div key={pr.id} className="panel p-5 border-l-4 border-l-volt">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-volt">
                      {pr.recordType === "estimated_1rm" ? "Estimated 1RM" : "Max Load"}
                    </span>
                    <span className="text-xs text-fog">{fmtDate(pr.achievedAt)}</span>
                  </div>
                  <h4 className="mt-2 font-display text-lg font-bold text-paper truncate">
                    {pr.exerciseName}
                  </h4>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-paper">
                      {pr.value}
                    </span>
                    <span className="text-sm font-semibold text-volt">kg</span>
                    {pr.weightKg && pr.reps && (
                      <span className="ml-auto text-xs text-fog">
                        via {pr.weightKg} kg × {pr.reps} reps
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel p-12 text-center">
              <Trophy className="mx-auto h-10 w-10 text-fog opacity-40" />
              <h4 className="mt-3 text-base font-bold text-paper">No PRs recorded yet</h4>
              <p className="mt-1 text-xs text-fog">Complete live workouts and push heavier sets to automatically establish personal records.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Consistency & Volume */}
      {activeTab === "consistency" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="panel p-5">
              <span className="text-xs font-semibold uppercase text-fog">Total Completed Workouts</span>
              <p className="mt-1 font-display text-3xl font-bold text-paper">{totalWorkouts}</p>
            </div>
            <div className="panel p-5">
              <span className="text-xs font-semibold uppercase text-fog">Active Training Days</span>
              <p className="mt-1 font-display text-3xl font-bold text-volt">{trainedDays} days</p>
            </div>
            <div className="panel p-5">
              <span className="text-xs font-semibold uppercase text-fog">Cumulative Iron Volume</span>
              <p className="mt-1 font-display text-3xl font-bold text-emerald-400">
                {Math.round(totalVolumeKg).toLocaleString()} kg
              </p>
            </div>
          </div>

          <div className="panel p-6">
            <h3 className="text-lg font-bold text-paper">14-Week Consistency Matrix</h3>
            <p className="text-xs text-fog mb-6">Visual breakdown of training minutes across days</p>
            <StreakCalendar days={calendarDays} />
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <h3 className="font-display text-2xl tracking-wide uppercase">
          Log Biometric Measurement
        </h3>
        <p className="mt-1 text-sm text-fog">
          Track body mass and circumferences in your database history.
        </p>
        <div className="mt-5 space-y-4">
          <Field label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)">
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75.5"
              />
            </Field>
            <Field label="Waist (cm)">
              <Input
                type="number"
                step="0.5"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="82.0"
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Chest (cm)">
              <Input
                type="number"
                step="0.5"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                placeholder="102"
              />
            </Field>
            <Field label="Arms (cm)">
              <Input
                type="number"
                step="0.5"
                value={arms}
                onChange={(e) => setArms(e.target.value)}
                placeholder="38.5"
              />
            </Field>
            <Field label="Thighs (cm)">
              <Input
                type="number"
                step="0.5"
                value={thighs}
                onChange={(e) => setThighs(e.target.value)}
                placeholder="58"
              />
            </Field>
          </div>
          <Field label="Body Fat (%)">
            <Input
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="15.2"
            />
          </Field>
          <Field label="Notes (optional)">
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Fasted morning weigh-in, post-sleep..."
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={addLog}>
            <Check size={14} /> Save to Database
          </Button>
        </div>
      </Modal>

      {/* Add Goal Modal */}
      <Modal open={goalModalOpen} onClose={() => setGoalModalOpen(false)}>
        <h3 className="font-display text-2xl tracking-wide uppercase">
          Set Target Goal
        </h3>
        <p className="mt-1 text-sm text-fog">
          Create a measurable benchmark to aim for in your training.
        </p>
        <div className="mt-5 space-y-4">
          <Field label="Goal Title">
            <Input
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. 100 kg Bench Press, 72 kg Body Weight..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value)}
              >
                <option value="strength">Strength / Lift</option>
                <option value="body">Body Weight / Composition</option>
                <option value="consistency">Consistency / Frequency</option>
                <option value="performance">Performance / Endurance</option>
              </Select>
            </Field>
            <Field label="Unit">
              <Input
                value={goalUnit}
                onChange={(e) => setGoalUnit(e.target.value)}
                placeholder="kg, reps, days..."
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current Value">
              <Input
                type="number"
                step="0.5"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Target Value">
              <Input
                type="number"
                step="0.5"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="100"
              />
            </Field>
          </div>
          <Field label="Target Deadline (optional)">
            <Input
              type="date"
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setGoalModalOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" loading={savingGoal} onClick={createGoal}>
            <Check size={14} /> Commit Goal
          </Button>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Delete measurement?"
        body="This permanently removes this date's log from your database."
        confirmLabel="Delete"
      />
    </div>
  );
}
