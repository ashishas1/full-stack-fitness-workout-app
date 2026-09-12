"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Dumbbell,
  Flame,
  Flag,
  ListOrdered,
  Hourglass,
  Pause,
  Play,
  Save,
  Search,
  SkipForward,
  Timer,
  Trophy,
  Zap,
  Sparkles,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { AREA_LABEL, cx, fmtClock } from "@/lib/utils";
import { Badge, Button, Modal } from "@/components/ui";
import { exerciseIcon } from "@/components/exercise-art";

export type PlayerExercise = {
  exerciseId: number;
  name: string;
  targetArea: string;
  accent: string;
  icon: string;
  steps: string[];
  sets: number;
  reps: string;
  durationSeconds: number | null;
  restSeconds: number;
};

type Segment = {
  kind: "work" | "rest";
  exIdx: number;
  setIdx: number;
  seconds: number | null;
  label: string;
  sub: string;
};

type Summary = {
  duration: number;
  exercises: number;
  sets: number;
  kcal: number;
  totalVolumeKg: number;
};

type LoggedSet = {
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number;
};

type Store = {
  phase: "prepare" | "run" | "summary";
  prepareLeft: number;
  segIdx: number;
  remaining: number | null;
  segElapsed: number;
  elapsed: number;
  running: boolean;
  ended: boolean;
  saving: boolean;
  setsDone: number[];
  freeLogs: Record<number, number>;
  freeQuery: string;
  showSteps: boolean;
  confirmEnd: boolean;
  summary: Summary | null;
  notes: string;
  noteSaved: boolean;
  currentWeightKg: string;
  currentReps: string;
  currentRpe: string;
  loggedSets: LoggedSet[];
  newPrs: Array<{
    exerciseName: string;
    recordType: string;
    value: number;
    unit: string;
  }>;
};

function beep(freq = 880, dur = 0.09) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const g = window as unknown as { __sfAudio?: AudioContext };
    g.__sfAudio ??= new Ctx();
    const ctx = g.__sfAudio;
    const o = ctx.createOscillator();
    const gain = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(gain);
    gain.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.05);
  } catch {
    /* audio blocked */
  }
}

export function WorkoutPlayer({
  sessionId,
  planName,
  items,
  library,
}: {
  sessionId: number;
  planName: string;
  items: PlayerExercise[];
  library: PlayerExercise[];
}) {
  const router = useRouter();
  const freeMode = items.length === 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const segments = useMemo<Segment[]>(() => buildSegments(items), [sessionId]);

  const [, force] = useReducer((x: number) => x + 1, 0);
  const S = useRef<Store>({
    phase: freeMode ? "run" : "prepare",
    prepareLeft: 8,
    segIdx: 0,
    remaining: freeMode ? null : initialRemaining(segments, 0),
    segElapsed: 0,
    elapsed: 0,
    running: true,
    ended: false,
    saving: false,
    setsDone: items.map(() => 0),
    freeLogs: {},
    freeQuery: "",
    showSteps: false,
    confirmEnd: false,
    summary: null,
    notes: "",
    noteSaved: false,
    currentWeightKg: "20",
    currentReps: items[0] ? String(parseInt(items[0].reps, 10) || 12) : "12",
    currentRpe: "8",
    loggedSets: [],
    newPrs: [],
  });
  const lastTickAt = useRef(0);

  /* ---------- master tick ---------- */
  useEffect(() => {
    const t = setInterval(() => {
      const s = S.current;
      if (!s.running || s.phase === "summary") return;
      const now = performance.now();
      const dt = Math.min(1, (now - (lastTickAt.current || now)) / 1000);
      lastTickAt.current = now;
      if (dt <= 0) return;

      s.elapsed += dt;
      s.segElapsed += dt;

      if (s.phase === "prepare") {
        const prev = s.prepareLeft;
        s.prepareLeft = Math.max(0, s.prepareLeft - dt);
        if (Math.ceil(prev) !== Math.ceil(s.prepareLeft) && s.prepareLeft > 0)
          beep(620, 0.06);
        if (s.prepareLeft <= 0) enterRun();
        force();
        return;
      }

      const seg = segments[s.segIdx];
      if (seg && seg.seconds != null && s.remaining != null) {
        const prev = s.remaining;
        const nv = s.remaining - dt;
        if (Math.ceil(prev) !== Math.ceil(nv) && nv > 0 && nv <= 3.5)
          beep(660, 0.05);
        if (nv <= 0) {
          advanceSegment();
        } else {
          s.remaining = nv;
        }
      }
      force();
    }, 120);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function initialRemaining(segs: Segment[], idx: number): number | null {
    return segs[idx]?.seconds ?? null;
  }

  function enterRun() {
    const s = S.current;
    s.phase = "run";
    s.prepareLeft = 0;
    beep(980, 0.12);
    navigator.vibrate?.(80);
  }

  function advanceSegment() {
    const s = S.current;
    const seg = segments[s.segIdx];
    if (seg?.kind === "work") {
      s.setsDone[seg.exIdx] = Math.min(
        items[seg.exIdx]?.sets ?? Infinity,
        s.setsDone[seg.exIdx] + 1
      );
    }
    const next = s.segIdx + 1;
    if (next >= segments.length) {
      s.running = false;
      beep(880, 0.12);
      setTimeout(() => beep(1174, 0.2), 140);
      finalize("complete");
      return;
    }
    s.segIdx = next;
    s.segElapsed = 0;
    s.remaining = segments[next].seconds;

    // Pre-populate target reps for next work segment
    const nextSeg = segments[next];
    if (nextSeg && nextSeg.kind === "work") {
      const nextEx = items[nextSeg.exIdx];
      if (nextEx) {
        s.currentReps = String(parseInt(nextEx.reps, 10) || 12);
      }
    }

    beep(segments[next].kind === "rest" ? 520 : 980, 0.1);
    navigator.vibrate?.(60);
  }

  function recordAndAdvanceWorkSet() {
    const s = S.current;
    const seg = segments[s.segIdx];
    if (seg && seg.kind === "work") {
      const currentEx = items[seg.exIdx];
      if (currentEx) {
        s.loggedSets.push({
          exerciseId: currentEx.exerciseId,
          exerciseName: currentEx.name,
          setNumber: seg.setIdx + 1,
          weightKg: Math.max(0, parseFloat(s.currentWeightKg) || 0),
          reps: Math.max(1, parseInt(s.currentReps, 10) || 10),
          rpe: Math.max(1, Math.min(10, parseFloat(s.currentRpe) || 8)),
        });
      }
    }
    advanceSegment();
    force();
  }

  function toggleRun() {
    const s = S.current;
    s.running = !s.running;
    lastTickAt.current = performance.now();
    beep(s.running ? 880 : 440, 0.07);
    force();
  }

  function skipSegment() {
    const s = S.current;
    if (s.phase === "prepare") {
      enterRun();
      force();
      return;
    }
    if (segments[s.segIdx]?.kind === "work") {
      recordAndAdvanceWorkSet();
      return;
    }
    s.remaining = segments[s.segIdx]?.seconds ?? null;
    advanceSegment();
    force();
  }

  function addFifteen() {
    const s = S.current;
    if (s.remaining != null) s.remaining += 15;
    force();
  }

  function logFreeSet(exId: number) {
    const s = S.current;
    s.freeLogs[exId] = (s.freeLogs[exId] ?? 0) + 1;
    const ex = library.find((l) => l.exerciseId === exId);
    if (ex) {
      s.loggedSets.push({
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        setNumber: s.freeLogs[exId],
        weightKg: Math.max(0, parseFloat(s.currentWeightKg) || 0),
        reps: Math.max(1, parseInt(s.currentReps, 10) || 10),
        rpe: 8,
      });
    }
    beep(760, 0.05);
    force();
  }

  function setStore(patch: Partial<Store>) {
    Object.assign(S.current, patch);
    force();
  }

  async function finalize(action: "complete" | "abandon") {
    const s = S.current;
    if (s.ended || s.saving) return;
    s.saving = true;
    force();
    const duration = Math.round(s.elapsed);
    const logs = freeMode
      ? Object.entries(s.freeLogs).map(([id, sets]) => {
          const ex = library.find((l) => l.exerciseId === Number(id));
          return {
            exerciseId: Number(id),
            exerciseName: ex?.name ?? "Exercise",
            sets,
            reps: ex?.reps ?? "",
          };
        })
      : items
          .map((it, i) => ({
            exerciseId: it.exerciseId,
            exerciseName: it.name,
            sets: s.setsDone[i],
            reps: it.reps,
          }))
          .filter((l) => l.sets > 0);

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          durationSeconds: duration,
          notes: s.notes,
          logs: action === "complete" ? logs : [],
          detailedSets: action === "complete" ? s.loggedSets : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      s.ended = true;
      if (action === "complete") {
        s.phase = "summary";
        const totalVol = data.totalVolumeKg ? parseFloat(data.totalVolumeKg) : 0;
        s.summary = {
          duration,
          exercises: logs.length,
          sets: s.loggedSets.length > 0 ? s.loggedSets.length : logs.reduce((a, l) => a + l.sets, 0),
          kcal: data.caloriesBurned || Math.max(1, Math.round((duration / 60) * 8.5)),
          totalVolumeKg: totalVol,
        };
        if (Array.isArray(data.newPrs)) {
          s.newPrs = data.newPrs;
          if (data.newPrs.length > 0) {
            beep(1200, 0.3);
            toast.success(`🔥 ${data.newPrs.length} New Personal Record(s) Achieved!`);
          }
        }
      } else {
        toast.info("Session discarded");
        router.push("/dashboard/train");
        return;
      }
    } catch {
      toast.error("Could not save session — try again");
    } finally {
      s.saving = false;
      s.confirmEnd = false;
      force();
    }
  }

  async function saveNote() {
    const s = S.current;
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "note", notes: s.notes }),
      });
      s.noteSaved = true;
      toast.success("Note saved");
    } catch {
      toast.error("Note failed to save");
    }
    force();
  }

  const s = S.current;
  const seg = segments[s.segIdx];
  const currentEx = seg ? items[seg.exIdx] : null;
  const nextSeg = segments[s.segIdx + 1];
  const exProgress =
    (!freeMode &&
      `${items.filter((_, i) => s.setsDone[i] >= items[i].sets).length}/${items.length}`) ||
    null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/dashboard/train"
          className="text-[13px] font-semibold text-fog transition-colors hover:text-volt"
        >
          ← Training hub
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5">
          <Timer size={14} className="text-volt" />
          <span className="font-timer text-sm font-semibold">
            {fmtClock(s.elapsed)}
          </span>
          {!s.running && s.phase === "run" && (
            <span className="text-[10px] font-bold tracking-widest text-ember uppercase">
              paused
            </span>
          )}
        </div>
        {s.phase !== "summary" && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setStore({ confirmEnd: true })}
          >
            <Flag size={13} /> End
          </Button>
        )}
      </div>

      <p className="mb-1 text-[11px] font-bold tracking-[0.22em] text-volt uppercase">
        {planName}
      </p>

      {/* =============== SUMMARY =============== */}
      {s.phase === "summary" && s.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel relative overflow-hidden p-8 text-center"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, rgba(200,255,46,0.14), transparent 65%)",
            }}
          />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-volt text-black glow-volt"
            >
              <Check size={40} strokeWidth={3} />
            </motion.div>
            <h1 className="font-display text-4xl tracking-wide uppercase md:text-5xl">
              Session forged
            </h1>
            <p className="mt-2 text-sm text-fog">
              Logged to your database. Real volume, real PRs, real progress.
            </p>

            {/* PR celebratory banner if any PRs beaten */}
            {s.newPrs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto mt-6 max-w-lg rounded-2xl border border-volt/40 bg-volt/[0.08] p-5 text-left"
              >
                <div className="flex items-center gap-2 text-volt font-bold uppercase tracking-wider text-xs mb-3">
                  <Trophy size={16} /> Personal Records Smashed!
                </div>
                <div className="space-y-2">
                  {s.newPrs.map((pr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-black/40 px-3.5 py-2 border border-volt/20 text-sm"
                    >
                      <span className="font-semibold text-paper">{pr.exerciseName}</span>
                      <span className="font-timer font-bold text-volt">
                        {pr.recordType}: {pr.value} {pr.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                [`${fmtClock(s.summary.duration)}`, "time"],
                [String(s.summary.exercises), "exercises"],
                [String(s.summary.sets), "sets logged"],
                [`${Math.round(s.summary.totalVolumeKg)} kg`, "total volume"],
                [`~${s.summary.kcal}`, "kcal burned"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4">
                  <div className="font-display text-2xl text-volt">{v}</div>
                  <div className="mt-1 text-[10px] tracking-widest text-fog uppercase">
                    {l}
                  </div>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-6 max-w-md">
              <div className="flex gap-2">
                <input
                  value={s.notes}
                  onChange={(e) => setStore({ notes: e.target.value, noteSaved: false })}
                  placeholder="How did it feel? Add a workout note…"
                  className="h-11 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm outline-none placeholder:text-fog/60 focus:border-volt/60"
                />
                <Button
                  variant={s.noteSaved ? "outline" : "volt"}
                  size="md"
                  onClick={saveNote}
                >
                  {s.noteSaved ? <Check size={15} /> : <Save size={15} />}
                  {s.noteSaved ? "Saved" : "Save note"}
                </Button>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={() => router.push("/dashboard")}>
                <Zap size={15} /> Back to Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/train")}>
                Train again
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* =============== PREPARE =============== */}
      {s.phase === "prepare" && (
        <div className="panel flex flex-col items-center p-10 text-center">
          <p className="text-[11px] font-bold tracking-[0.22em] text-fog uppercase">
            Get into position
          </p>
          <div className="font-timer my-4 text-8xl font-bold text-volt tabular-nums">
            {Math.ceil(s.prepareLeft)}
          </div>
          <p className="text-lg font-semibold">
            First up: <span className="text-volt">{items[0]?.name}</span>
          </p>
          <p className="mt-1 text-sm text-fog">
            {items[0]?.sets} × {items[0]?.reps} · rest {items[0]?.restSeconds}s
          </p>
          <Button className="mt-6" onClick={() => { enterRun(); force(); }}>
            <Play size={16} fill="currentColor" /> Start now
          </Button>
        </div>
      )}

      {/* =============== GUIDED RUN =============== */}
      {s.phase === "run" && !freeMode && seg && currentEx && (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="panel relative flex flex-col items-center overflow-hidden p-8">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  seg.kind === "rest"
                    ? "radial-gradient(70% 70% at 50% 0%, rgba(125,249,255,0.08), transparent 60%)"
                    : "radial-gradient(70% 70% at 50% 0%, rgba(200,255,46,0.10), transparent 60%)",
              }}
            />
            <Badge tone={seg.kind === "rest" ? "frost" : "volt"} className="mb-5">
              {seg.kind === "rest" ? "REST INTERVAL" : "WORKING SET"} · {seg.label}
            </Badge>

            {/* ring */}
            <div className="relative flex h-60 w-60 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="120" cy="120" r="104" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                {seg.seconds != null && s.remaining != null && (
                  <circle
                    cx="120" cy="120" r="104" fill="none"
                    stroke={seg.kind === "rest" ? "#7df9ff" : "#c8ff2e"}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 104}
                    strokeDashoffset={
                      2 * Math.PI * 104 * (1 - s.remaining / seg.seconds)
                    }
                    className="transition-[stroke-dashoffset] duration-150 ease-linear"
                  />
                )}
              </svg>
              <div className="text-center">
                <div className="font-timer text-5xl font-bold tabular-nums">
                  {seg.seconds != null && s.remaining != null
                    ? fmtClock(s.remaining)
                    : fmtClock(s.segElapsed)}
                </div>
                <div className="mt-1 text-[11px] tracking-[0.2em] text-fog uppercase">
                  {seg.kind === "rest" ? "rest remaining" : seg.seconds != null ? "time remaining" : "set timer"}
                </div>
              </div>
            </div>

            <h2 className="font-display mt-3 text-center text-3xl tracking-wide uppercase md:text-4xl">
              {seg.kind === "rest" ? "Recover & Breathe" : currentEx.name}
            </h2>
            <p className="mt-1 text-sm text-fog">{seg.sub}</p>

            {/* Set weight & reps input for active work segment */}
            {seg.kind === "work" && (
              <div className="mt-5 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-volt mb-3 text-center">
                  Log This Set&apos;s Numbers
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-fog font-medium uppercase mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={s.currentWeightKg}
                      onChange={(e) => setStore({ currentWeightKg: e.target.value })}
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-center text-sm font-bold text-volt outline-none focus:border-volt"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-fog font-medium uppercase mb-1">
                      Reps Done
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={s.currentReps}
                      onChange={(e) => setStore({ currentReps: e.target.value })}
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-center text-sm font-bold text-paper outline-none focus:border-volt"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-fog font-medium uppercase mb-1">
                      Effort (RPE)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="10"
                      value={s.currentRpe}
                      onChange={(e) => setStore({ currentRpe: e.target.value })}
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-center text-sm font-bold text-paper outline-none focus:border-volt"
                      placeholder="8"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* controls */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={skipSegment}
                className="cursor-pointer rounded-full border border-white/15 p-3.5 text-fog transition-colors hover:border-white/40 hover:text-paper"
                aria-label="Skip"
                title="Skip this segment"
              >
                <SkipForward size={18} />
              </button>
              <button
                onClick={toggleRun}
                className={cx(
                  "flex h-16 w-16 cursor-pointer items-center justify-center rounded-full text-black transition-all",
                  s.running ? "bg-paper hover:brightness-90" : "bg-volt pulse-ring hover:brightness-110"
                )}
                aria-label={s.running ? "Pause" : "Resume"}
              >
                {s.running ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              {seg.kind === "rest" ? (
                <button
                  onClick={addFifteen}
                  className="cursor-pointer rounded-full border border-white/15 p-3.5 text-fog transition-colors hover:border-white/40 hover:text-paper"
                  aria-label="Add 15 seconds"
                  title="+15 seconds rest"
                >
                  <Hourglass size={18} />
                </button>
              ) : (
                <button
                  onClick={recordAndAdvanceWorkSet}
                  className="cursor-pointer rounded-full bg-volt px-6 py-3.5 text-sm font-bold text-black transition-all hover:shadow-[0_0_30px_-6px_rgba(200,255,46,0.6)] flex items-center gap-1.5"
                >
                  <Check size={18} /> Complete Set
                </button>
              )}
            </div>
          </div>

          {/* side column */}
          <div className="flex flex-col gap-4">
            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-bold tracking-[0.18em] text-fog uppercase">
                  Workout Route · {exProgress}
                </h3>
                <Dumbbell size={14} className="text-fog" />
              </div>
              <div className="space-y-2">
                {items.map((it, i) => {
                  const done = s.setsDone[i] >= it.sets;
                  const activeNow = seg.exIdx === i && seg.kind === "work";
                  const Icon = exerciseIcon(it.icon);
                  return (
                    <div
                      key={it.exerciseId}
                      className={cx(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] transition-colors",
                        activeNow
                          ? "border-volt/40 bg-volt/8"
                          : done
                            ? "border-white/6 bg-white/[0.02] opacity-50"
                            : "border-white/6 bg-white/[0.02]"
                      )}
                    >
                      <Icon size={15} className={activeNow ? "text-volt" : "text-fog"} />
                      <span className="min-w-0 flex-1 truncate font-medium">{it.name}</span>
                      <span className="font-timer text-[11px] text-fog">
                        {s.setsDone[i]}/{it.sets}
                      </span>
                      {done && <CircleCheck size={14} className="text-volt" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logged Sets Live List */}
            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-bold tracking-[0.18em] text-fog uppercase">
                  Sets Logged This Session ({s.loggedSets.length})
                </h3>
                <Sparkles size={14} className="text-volt" />
              </div>
              {s.loggedSets.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {s.loggedSets.map((ls, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-1.5 text-xs border border-white/5"
                    >
                      <span className="truncate font-medium text-paper">
                        {ls.exerciseName} <span className="text-fog">#{ls.setNumber}</span>
                      </span>
                      <span className="font-mono font-semibold text-volt">
                        {ls.weightKg > 0 ? `${ls.weightKg}kg × ${ls.reps}` : `${ls.reps} reps`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-fog">
                  Sets will appear here as you log weight and repetitions.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =============== FREE RUN =============== */}
      {s.phase === "run" && freeMode && (
        <div className="panel p-8">
          <div className="flex flex-col items-center text-center">
            <Badge tone="volt" className="mb-4">
              Free session · Log at your own pace
            </Badge>
            <div className="font-timer text-7xl font-bold tabular-nums">
              {fmtClock(s.elapsed)}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={toggleRun}
                className={cx(
                  "flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-black transition-all",
                  s.running ? "bg-paper hover:brightness-90" : "bg-volt pulse-ring hover:brightness-110"
                )}
                aria-label={s.running ? "Pause" : "Resume"}
              >
                {s.running ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fog mb-3">
              Choose an Exercise to Log
            </h3>
            <div className="relative mb-4">
              <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-fog" />
              <input
                value={s.freeQuery}
                onChange={(e) => setStore({ freeQuery: e.target.value })}
                placeholder="Search exercise..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm outline-none focus:border-volt"
              />
            </div>
            <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
              {library
                .filter((l) => !s.freeQuery || l.name.toLowerCase().includes(s.freeQuery.toLowerCase()))
                .map((l) => (
                  <div
                    key={l.exerciseId}
                    className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] p-3 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-paper">{l.name}</div>
                      <div className="text-xs text-fog">{l.targetArea} · target {l.reps}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.freeLogs[l.exerciseId] && (
                        <span className="font-mono text-xs text-volt bg-volt/10 px-2 py-0.5 rounded">
                          {s.freeLogs[l.exerciseId]} sets
                        </span>
                      )}
                      <button
                        onClick={() => logFreeSet(l.exerciseId)}
                        className="rounded-lg bg-volt px-3 py-1.5 text-xs font-bold text-black hover:brightness-110"
                      >
                        + Log Set
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* end confirmation */}
      <Modal open={s.confirmEnd} onClose={() => setStore({ confirmEnd: false })}>
        <h3 className="font-display text-2xl tracking-wide uppercase">
          End this session?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-fog">
          You can log what you&apos;ve done so far (
          {freeMode
            ? `${Object.values(s.freeLogs).reduce((a, b) => a + b, 0)} sets`
            : `${s.loggedSets.length || s.setsDone.reduce((a, b) => a + b, 0)} sets`}
          ) or discard the session entirely.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setStore({ confirmEnd: false })}>
            Keep training
          </Button>
          <Button variant="danger" size="sm" loading={s.saving} onClick={() => finalize("abandon")}>
            Discard
          </Button>
          <Button size="sm" loading={s.saving} onClick={() => finalize("complete")}>
            <Check size={14} /> Log & finish
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function buildSegments(items: PlayerExercise[]): Segment[] {
  const segs: Segment[] = [];
  items.forEach((it, exIdx) => {
    for (let setIdx = 0; setIdx < it.sets; setIdx++) {
      segs.push({
        kind: "work",
        exIdx,
        setIdx,
        seconds: it.durationSeconds,
        label: `SET ${setIdx + 1}/${it.sets}`,
        sub: it.durationSeconds
          ? `Hold for ${it.durationSeconds}s · exercise ${exIdx + 1}/${items.length}`
          : `Target ${it.reps} reps · exercise ${exIdx + 1}/${items.length}`,
      });
      const isLastSet = setIdx === it.sets - 1;
      const isLastEx = exIdx === items.length - 1;
      if (!(isLastSet && isLastEx)) {
        segs.push({
          kind: "rest",
          exIdx,
          setIdx,
          seconds: it.restSeconds,
          label: `${it.restSeconds}S`,
          sub: isLastSet
            ? "Then switch exercises"
            : `Then set ${setIdx + 2} of ${it.sets}`,
        });
      }
    }
  });
  return segs;
}
