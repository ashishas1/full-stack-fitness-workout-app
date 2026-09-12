"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart2,
  Calendar,
  Check,
  Clock,
  Dumbbell,
  Flame,
  Heart,
  Hexagon,
  Info,
  Layers,
  Scale,
  Shield,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { cx } from "@/lib/utils";

type OnboardingData = {
  name: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  unitsPreference: "metric" | "imperial";
  primaryGoal: string;
  secondaryGoals: string[];
  currentBodyFat: number;
  targetBodyFat: number;
  targetWeight: number;
  targetTimelineWeeks: number;
  trainingDaysPerWeek: number;
  workoutDurationMinutes: number;
  experience: "beginner" | "intermediate" | "advanced";
  activityLevel: string;
  equipment: string[];
  trainingPreferences: string[];
};

const PRIMARY_GOALS = [
  {
    id: "build_muscle",
    title: "Build Muscle",
    desc: "Maximize hypertrophy, increase lean muscle mass & definition",
    icon: Flame,
    tag: "Hypertrophy",
  },
  {
    id: "lose_fat",
    title: "Lose Fat",
    desc: "Shed body fat while preserving muscle density and core tone",
    icon: Zap,
    tag: "Cutting / Leaning",
  },
  {
    id: "improve_strength",
    title: "Improve Strength",
    desc: "Increase raw 1RM power on squat, bench, deadlift and heavy carries",
    icon: Dumbbell,
    tag: "Power & Force",
  },
  {
    id: "gain_weight",
    title: "Gain Weight",
    desc: "Healthy caloric surplus to build dense athletic frame",
    icon: Scale,
    tag: "Mass / Bulking",
  },
  {
    id: "improve_endurance",
    title: "Improve Endurance",
    desc: "Enhance VO2 max, stamina, high-rep capacity & work capacity",
    icon: Heart,
    tag: "Stamina & Cardio",
  },
  {
    id: "athletic_performance",
    title: "Athletic Performance",
    desc: "Explosive rotational power, midline stability & speed for sport",
    icon: Trophy,
    tag: "Athleticism",
  },
  {
    id: "general_fitness",
    title: "General Fitness",
    desc: "Daily vitality, functional joint mobility and healthy longevity",
    icon: Activity,
    tag: "Health & Vitality",
  },
];

const EQUIPMENT_OPTIONS = [
  { id: "full_gym", label: "Full Commercial Gym", icon: Dumbbell },
  { id: "dumbbells", label: "Dumbbells", icon: Dumbbell },
  { id: "barbell", label: "Barbell & Plates", icon: Dumbbell },
  { id: "machines", label: "Cable & Pin-Loaded Machines", icon: Layers },
  { id: "kettlebells", label: "Kettlebells", icon: Flame },
  { id: "resistance_bands", label: "Resistance Bands", icon: Zap },
  { id: "bodyweight", label: "Bodyweight / Calisthenics", icon: User },
  { id: "home_gym", label: "Home Gym Setup", icon: Hexagon },
  { id: "cardio", label: "Treadmill / Rower / AirBike", icon: Heart },
];

const TRAINING_STYLES = [
  { id: "hypertrophy", label: "Hypertrophy (8–12 reps)" },
  { id: "strength", label: "Heavy Strength (3–6 reps)" },
  { id: "compound", label: "Compound Movements" },
  { id: "isolation", label: "Targeted Isolation" },
  { id: "cardio", label: "High-Intensity Conditioning" },
  { id: "mobility", label: "Core Mobility & Joint Health" },
  { id: "functional", label: "Functional Training" },
  { id: "bodyweight", label: "Calisthenics & Holds" },
];

export function OnboardingClient({
  username,
  initialData,
}: {
  username: string;
  initialData: OnboardingData;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 5;

  function toggleEquipment(id: string) {
    setForm((prev) => {
      const exists = prev.equipment.includes(id);
      const next = exists
        ? prev.equipment.filter((item) => item !== id)
        : [...prev.equipment, id];
      return { ...prev, equipment: next.length > 0 ? next : ["bodyweight"] };
    });
  }

  function toggleTrainingStyle(id: string) {
    setForm((prev) => {
      const exists = prev.trainingPreferences.includes(id);
      const next = exists
        ? prev.trainingPreferences.filter((item) => item !== id)
        : [...prev.trainingPreferences, id];
      return { ...prev, trainingPreferences: next.length > 0 ? next : ["hypertrophy"] };
    });
  }

  function toggleSecondaryGoal(id: string) {
    setForm((prev) => {
      const exists = prev.secondaryGoals.includes(id);
      const next = exists
        ? prev.secondaryGoals.filter((g) => g !== id)
        : [...prev.secondaryGoals, id];
      return { ...prev, secondaryGoals: next };
    });
  }

  function handleNext() {
    if (step === 1) {
      if (!form.name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      if (form.weightKg <= 30 || form.heightCm <= 90) {
        toast.error("Please enter valid height and weight measurements");
        return;
      }
    }
    if (step < totalSteps) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submitProfile();
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submitProfile() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save profile");
        setIsSubmitting(false);
        return;
      }
      toast.success("Fitness profile forged! Launching your personalized dashboard.");
      router.push("/dashboard");
    } catch {
      toast.error("Network error saving profile");
      setIsSubmitting(false);
    }
  }

  // Display conversions for imperial vs metric
  const displayWeight =
    form.unitsPreference === "imperial"
      ? Math.round(form.weightKg * 2.20462)
      : form.weightKg;
  const displayTargetWeight =
    form.unitsPreference === "imperial"
      ? Math.round(form.targetWeight * 2.20462)
      : form.targetWeight;

  return (
    <div className="min-h-dvh bg-carbon px-4 py-8 sm:px-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Brand Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <Hexagon size={32} strokeWidth={2.5} className="absolute text-volt" />
              <span className="font-display text-xs text-volt">6</span>
            </span>
            <span className="font-display text-lg tracking-wider">
              SIX<span className="text-volt">FORGE</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-fog">
            <span>Step {step} of {totalSteps}</span>
            <span className="rounded-full bg-volt/15 px-2.5 py-0.5 text-[11px] font-bold text-volt">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
        </div>

        {/* Multi-step progress bar */}
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-volt shadow-[0_0_12px_rgba(200,255,46,0.8)]"
            initial={{ width: "20%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          />
        </div>

        {/* Step Cards Container */}
        <div className="panel relative overflow-hidden p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-volt uppercase">
                    Step 1 · The Foundation
                  </span>
                  <h2 className="font-display mt-1 text-3xl tracking-wide uppercase">
                    Basic Bio & Units
                  </h2>
                  <p className="mt-1 text-sm text-fog">
                    Your baseline biometric profile informs caloric burn, estimated 1RM calculations, and baseline workout volume.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Your Preferred Name / Handle
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                      placeholder="e.g. Alex"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Age
                    </label>
                    <input
                      type="number"
                      min={14}
                      max={95}
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                      placeholder="25"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Gender
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                    >
                      <option value="male" className="bg-carbon text-paper">Male</option>
                      <option value="female" className="bg-carbon text-paper">Female</option>
                      <option value="other" className="bg-carbon text-paper">Other</option>
                      <option value="prefer_not_to_say" className="bg-carbon text-paper">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Units Preference
                    </label>
                    <div className="flex h-11 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, unitsPreference: "metric" })}
                        className={cx(
                          "flex-1 rounded-lg text-xs font-bold transition-all",
                          form.unitsPreference === "metric"
                            ? "bg-volt text-black shadow-sm"
                            : "text-fog hover:text-paper"
                        )}
                      >
                        Metric (kg / cm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, unitsPreference: "imperial" })}
                        className={cx(
                          "flex-1 rounded-lg text-xs font-bold transition-all",
                          form.unitsPreference === "imperial"
                            ? "bg-volt text-black shadow-sm"
                            : "text-fog hover:text-paper"
                        )}
                      >
                        Imperial (lb / ft-in)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Height {form.unitsPreference === "metric" ? "(cm)" : "(inches)"}
                    </label>
                    <input
                      type="number"
                      value={
                        form.unitsPreference === "metric"
                          ? form.heightCm
                          : Math.round(form.heightCm / 2.54)
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setForm({
                          ...form,
                          heightCm:
                            form.unitsPreference === "metric"
                              ? val
                              : Math.round(val * 2.54),
                        });
                      }}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                      placeholder={form.unitsPreference === "metric" ? "175" : "69"}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Current Bodyweight {form.unitsPreference === "metric" ? "(kg)" : "(lb)"}
                    </label>
                    <input
                      type="number"
                      value={displayWeight}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setForm({
                          ...form,
                          weightKg:
                            form.unitsPreference === "metric"
                              ? val
                              : Math.round(val / 2.20462),
                        });
                      }}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                      placeholder={form.unitsPreference === "metric" ? "75" : "165"}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Fitness Goal */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-volt uppercase">
                    Step 2 · Your North Star
                  </span>
                  <h2 className="font-display mt-1 text-3xl tracking-wide uppercase">
                    Primary Fitness Goal
                  </h2>
                  <p className="mt-1 text-sm text-fog">
                    Select your primary objective. This anchors your daily workout split, recommended sets, and intensity targets.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {PRIMARY_GOALS.map((g) => {
                    const Icon = g.icon;
                    const isSelected = form.primaryGoal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setForm({ ...form, primaryGoal: g.id })}
                        className={cx(
                          "cursor-pointer rounded-2xl border p-4 text-left transition-all",
                          isSelected
                            ? "border-volt/60 bg-volt/10 text-paper shadow-[0_0_24px_-8px_rgba(200,255,46,0.3)]"
                            : "border-white/10 bg-white/[0.03] text-fog hover:border-white/20 hover:text-paper"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cx(
                              "flex h-10 w-10 items-center justify-center rounded-xl",
                              isSelected ? "bg-volt text-black" : "bg-white/10 text-paper"
                            )}
                          >
                            <Icon size={20} />
                          </div>
                          <span
                            className={cx(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                              isSelected
                                ? "bg-volt/20 text-volt"
                                : "bg-white/5 text-fog"
                            )}
                          >
                            {g.tag}
                          </span>
                        </div>
                        <h3 className="font-display mt-3 text-lg tracking-wide uppercase text-paper">
                          {g.title}
                        </h3>
                        <p className="mt-1 text-xs text-fog leading-relaxed">
                          {g.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wider text-fog uppercase">
                    Secondary Goals (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRIMARY_GOALS.filter((g) => g.id !== form.primaryGoal).map((g) => {
                      const isSecondary = form.secondaryGoals.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleSecondaryGoal(g.id)}
                          className={cx(
                            "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                            isSecondary
                              ? "border-volt/60 bg-volt/15 text-volt"
                              : "border-white/10 bg-white/[0.03] text-fog hover:text-paper"
                          )}
                        >
                          {g.title} {isSecondary ? "✓" : "+"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Body Composition & Realistic Timeline */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-volt uppercase">
                    Step 3 · Body Composition
                  </span>
                  <h2 className="font-display mt-1 text-3xl tracking-wide uppercase">
                    Composition & Timeline
                  </h2>
                  <p className="mt-1 text-sm text-fog">
                    Establish your target body composition. We customize your progression rate with healthy, sustainable milestones.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Current Body Fat Est. (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={6}
                      max={45}
                      value={form.currentBodyFat}
                      onChange={(e) => setForm({ ...form, currentBodyFat: Number(e.target.value) })}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                      placeholder="16"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Target Body Fat (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={6}
                      max={45}
                      value={form.targetBodyFat}
                      onChange={(e) => setForm({ ...form, targetBodyFat: Number(e.target.value) })}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                      placeholder="12"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                    Target Bodyweight {form.unitsPreference === "metric" ? "(kg)" : "(lb)"}
                  </label>
                  <input
                    type="number"
                    value={displayTargetWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm({
                        ...form,
                        targetWeight:
                          form.unitsPreference === "metric"
                            ? val
                            : Math.round(val / 2.20462),
                      });
                    }}
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                    placeholder="70"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wider text-fog uppercase">
                    What&apos;s your target timeline?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {[
                      { weeks: 8, label: "8 Weeks", sub: "Quick Kickstart" },
                      { weeks: 12, label: "12 Weeks", sub: "Signature Split" },
                      { weeks: 16, label: "16 Weeks", sub: "Transformation" },
                      { weeks: 24, label: "6 Months", sub: "Mastery Path" },
                    ].map((t) => (
                      <button
                        key={t.weeks}
                        type="button"
                        onClick={() => setForm({ ...form, targetTimelineWeeks: t.weeks })}
                        className={cx(
                          "cursor-pointer rounded-xl border p-3 text-center transition-all",
                          form.targetTimelineWeeks === t.weeks
                            ? "border-volt/60 bg-volt/10 text-paper"
                            : "border-white/10 bg-white/[0.03] text-fog hover:border-white/20 hover:text-paper"
                        )}
                      >
                        <div className="font-display text-lg tracking-wide uppercase text-paper">
                          {t.label}
                        </div>
                        <div className="text-[11px] text-fog">{t.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Important Non-Guarantee Disclaimer Card */}
                <div className="flex items-start gap-3 rounded-2xl border border-volt/20 bg-volt/[0.04] p-4 text-xs leading-relaxed text-fog">
                  <Info size={18} className="mt-0.5 shrink-0 text-volt" />
                  <div>
                    <span className="font-semibold text-paper">Progressive Adjustment Guarantee:</span>
                    <p className="mt-0.5">
                      We&apos;ll use this as your target timeline and adjust your training split and load based on your actual progress. No artificial transformation claims — pure consistency and science.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Training Availability & Equipment */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-volt uppercase">
                    Step 4 · Capacity & Gear
                  </span>
                  <h2 className="font-display mt-1 text-3xl tracking-wide uppercase">
                    Schedule & Equipment
                  </h2>
                  <p className="mt-1 text-sm text-fog">
                    How many days can you commit to training, and what equipment do you have access to?
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wider text-fog uppercase">
                    Training Frequency: Days Per Week
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[2, 3, 4, 5, 6, 7].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setForm({ ...form, trainingDaysPerWeek: days })}
                        className={cx(
                          "cursor-pointer rounded-xl border py-3 text-center transition-all",
                          form.trainingDaysPerWeek === days
                            ? "border-volt/60 bg-volt text-black font-bold shadow-md"
                            : "border-white/10 bg-white/[0.03] text-fog hover:text-paper"
                        )}
                      >
                        <span className="font-display text-xl">{days}</span>
                        <span className="block text-[10px] uppercase">Days</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Workout Session Duration
                    </label>
                    <select
                      value={form.workoutDurationMinutes}
                      onChange={(e) => setForm({ ...form, workoutDurationMinutes: Number(e.target.value) })}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                    >
                      <option value={25} className="bg-carbon text-paper">20–30 min (Express Burner)</option>
                      <option value={40} className="bg-carbon text-paper">30–45 min (Standard Session)</option>
                      <option value={55} className="bg-carbon text-paper">45–60 min (Full Core & Lifts)</option>
                      <option value={75} className="bg-carbon text-paper">60–90 min (Extended Athlete)</option>
                      <option value={95} className="bg-carbon text-paper">90+ min (High Volume)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-fog uppercase">
                      Lifting Experience Level
                    </label>
                    <select
                      value={form.experience}
                      onChange={(e) => setForm({ ...form, experience: e.target.value as any })}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none focus:border-volt/60"
                    >
                      <option value="beginner" className="bg-carbon text-paper">Beginner (&lt;1 year lifting)</option>
                      <option value="intermediate" className="bg-carbon text-paper">Intermediate (1–3 years lifting)</option>
                      <option value="advanced" className="bg-carbon text-paper">Advanced (3+ years serious lifting)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wider text-fog uppercase">
                    Available Equipment (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {EQUIPMENT_OPTIONS.map((item) => {
                      const isSelected = form.equipment.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleEquipment(item.id)}
                          className={cx(
                            "flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                            isSelected
                              ? "border-volt/60 bg-volt/10 text-paper font-semibold"
                              : "border-white/10 bg-white/[0.03] text-fog hover:border-white/20 hover:text-paper"
                          )}
                        >
                          <span
                            className={cx(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border",
                              isSelected
                                ? "border-volt bg-volt text-black"
                                : "border-white/20"
                            )}
                          >
                            {isSelected && <Check size={11} strokeWidth={3} />}
                          </span>
                          <span className="text-xs">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Training Styles & Finalizing */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-volt uppercase">
                    Step 5 · Preferences & Activation
                  </span>
                  <h2 className="font-display mt-1 text-3xl tracking-wide uppercase">
                    Training Style & Focus
                  </h2>
                  <p className="mt-1 text-sm text-fog">
                    What lifting disciplines do you prefer? We tailor exercise selection and rep ranges to your taste.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold tracking-wider text-fog uppercase">
                    Preferred Styles (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {TRAINING_STYLES.map((style) => {
                      const isSelected = form.trainingPreferences.includes(style.id);
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => toggleTrainingStyle(style.id)}
                          className={cx(
                            "cursor-pointer rounded-xl border p-3 text-center transition-all",
                            isSelected
                              ? "border-volt/60 bg-volt/15 text-paper font-semibold shadow-sm"
                              : "border-white/10 bg-white/[0.03] text-fog hover:border-white/20 hover:text-paper"
                          )}
                        >
                          <div className="text-xs">{style.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-display text-base tracking-wider uppercase text-volt">
                    <Sparkles size={16} /> Profile Summary
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-fog">
                    <div>Athlete: <strong className="text-paper">{form.name}</strong></div>
                    <div>Primary Goal: <strong className="text-paper capitalize">{form.primaryGoal.replace("_", " ")}</strong></div>
                    <div>Frequency: <strong className="text-paper">{form.trainingDaysPerWeek} Days / Week</strong></div>
                    <div>Duration: <strong className="text-paper">{form.workoutDurationMinutes} mins</strong></div>
                    <div>Target Timeline: <strong className="text-paper">{form.targetTimelineWeeks} Weeks</strong></div>
                    <div>Level: <strong className="text-paper capitalize">{form.experience}</strong></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-white/8 pt-6">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft size={16} /> Back
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="button"
              variant="volt"
              loading={isSubmitting}
              onClick={handleNext}
              className="gap-2 px-8"
            >
              {step === totalSteps ? (
                <>
                  <Sparkles size={16} /> Forge My Plan
                </>
              ) : (
                <>
                  Next <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
