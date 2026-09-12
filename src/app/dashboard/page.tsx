import Link from "next/link";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  Activity,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Crown,
  Dumbbell,
  Flame,
  Layers,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  exercises,
  personalRecords,
  planExercises,
  plans,
  progressLogs,
  sessionLogs,
  userGoals,
  workoutSessions,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { suggestExercises } from "@/lib/suggestions";
import { dayKey, fmtClock, fmtDate, fmtDay, LEVEL_LABEL } from "@/lib/utils";
import { WeeklyBars } from "@/components/charts";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { StartSessionButton } from "@/components/start-session";
import { RecentSessions } from "@/components/recent-sessions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 56 * 86400000);

  // Auto-abandon sessions left dangling > 6h
  await db
    .update(workoutSessions)
    .set({ status: "abandoned", endedAt: now })
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        eq(workoutSessions.status, "active"),
        lt(workoutSessions.startedAt, new Date(now.getTime() - 6 * 3600000))
      )
    );

  const allSessions = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, user.id))
    .orderBy(desc(workoutSessions.startedAt));

  const completed = allSessions.filter((s) => s.status === "completed");
  const recentCompleted = completed.filter((s) => s.startedAt >= eightWeeksAgo);
  const activeSession = allSessions.find((s) => s.status === "active");

  // ---- Streaks (Current & Longest) ----
  const trainedDays = new Set(completed.map((s) => dayKey(new Date(s.startedAt))));
  let currentStreak = 0;
  let cursor = new Date(now);
  if (!trainedDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (trainedDays.has(dayKey(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Calculate longest streak historically
  const sortedDays = Array.from(trainedDays).sort();
  let longestStreak = 0;
  let running = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        running++;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    if (running > longestStreak) longestStreak = running;
  }
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  // ---- This week weekly target ----
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = completed.filter((s) => new Date(s.startedAt) >= weekStart);
  const targetWorkouts = user.targetWorkoutsPerWeek || 4;
  const completedThisWeek = thisWeek.length;
  const remainingWorkouts = Math.max(0, targetWorkouts - completedThisWeek);
  const consistencyPct = Math.min(100, Math.round((completedThisWeek / targetWorkouts) * 100));

  const weekMinutes = Math.round(
    thisWeek.reduce((a, s) => a + s.durationSeconds, 0) / 60
  );

  // ---- 8-week volume ----
  const weeks: { label: string; minutes: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(weekStart.getTime() - i * 7 * 86400000);
    const end = new Date(start.getTime() + 7 * 86400000);
    const mins = recentCompleted
      .filter((s) => {
        const d = new Date(s.startedAt);
        return d >= start && d < end;
      })
      .reduce((a, s) => a + s.durationSeconds, 0);
    weeks.push({ label: i === 0 ? "Now" : fmtDay(start), minutes: Math.round(mins / 60) });
  }

  // ---- Today's Workout Pick ----
  const userPlans = await db
    .select()
    .from(plans)
    .where(eq(plans.userId, user.id));

  const planItems = await db
    .select({
      planId: planExercises.planId,
      id: planExercises.id,
      sets: planExercises.sets,
      durationSeconds: planExercises.durationSeconds,
      restSeconds: planExercises.restSeconds,
    })
    .from(planExercises)
    .innerJoin(plans, eq(plans.id, planExercises.planId))
    .where(eq(plans.userId, user.id));

  const countByPlan = new Map<number, { count: number; minutes: number }>();
  for (const it of planItems) {
    const cur = countByPlan.get(it.planId) ?? { count: 0, minutes: 0 };
    cur.count++;
    cur.minutes += it.sets * ((it.durationSeconds ?? 40) + it.restSeconds);
    countByPlan.set(it.planId, cur);
  }

  const viablePlans = userPlans.filter((p) => (countByPlan.get(p.id)?.count ?? 0) > 0);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const todaysPlan = viablePlans.length > 0 ? viablePlans[dayOfYear % viablePlans.length] : null;
  const todaysPlanMeta = todaysPlan ? countByPlan.get(todaysPlan.id) : null;

  // ---- Recent PRs ----
  const prs = await db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, user.id))
    .orderBy(desc(personalRecords.achievedAt))
    .limit(4);

  // ---- Goals ----
  const goals = await db
    .select()
    .from(userGoals)
    .where(eq(userGoals.userId, user.id))
    .limit(3);

  // ---- Suggested focus ----
  const allExercises = await db.select().from(exercises);
  const focus = suggestExercises(allExercises, {
    goal: user.primaryGoal || user.goal,
    level: user.level,
    setting: "gym",
    count: 3,
  });

  // ---- Recent sessions ----
  const recent = await db
    .select({
      session: workoutSessions,
      logCount: sql<number>`count(${sessionLogs.id})`.mapWith(Number),
    })
    .from(workoutSessions)
    .leftJoin(sessionLogs, eq(sessionLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        sql`${workoutSessions.status} != 'active'`
      )
    )
    .groupBy(workoutSessions.id)
    .orderBy(desc(workoutSessions.startedAt))
    .limit(5);

  const totalMinutes = Math.round(
    completed.reduce((a, s) => a + s.durationSeconds, 0) / 60
  );

  // Time-of-day greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const formattedGoal = (user.primaryGoal || user.goal).replace(/_/g, " ");

  return (
    <div className="space-y-6">
      {/* Personalized Header Banner */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-fog">
              <span className="text-volt uppercase tracking-wider">{greeting},</span>
              <span className="text-paper font-bold">{user.name || user.username}</span>
              <span>·</span>
              <span className="capitalize">{LEVEL_LABEL[user.level] || user.level}</span>
            </div>
            <h1 className="font-display mt-1 text-3xl tracking-wide uppercase sm:text-4xl">
              Let&apos;s work toward your <span className="text-volt">{formattedGoal}</span> goal
            </h1>
            <p className="mt-1 text-sm text-fog">
              Consistency is everything. Your metrics, session recommendations, and personal records update live with every completed set.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold uppercase"
              style={{
                borderColor: user.membershipTier === "lifetime" ? "rgba(255,215,0,0.4)" : user.membershipTier === "yearly" ? "rgba(255,122,41,0.4)" : "rgba(200,255,46,0.4)",
                background: user.membershipTier === "lifetime" ? "rgba(255,215,0,0.1)" : user.membershipTier === "yearly" ? "rgba(255,122,41,0.1)" : "rgba(200,255,46,0.1)",
                color: user.membershipTier === "lifetime" ? "#ffd700" : user.membershipTier === "yearly" ? "#ff7a29" : "#c8ff2e",
              }}
            >
              {user.membershipTier === "lifetime" ? <Crown size={14} /> : user.membershipTier === "yearly" ? <Star size={14} /> : <Zap size={14} />}
              {user.membershipTier} Tier
            </span>
          </div>
        </div>
      </div>

      {/* Resume Banner if workout is active */}
      {activeSession && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-volt/40 bg-volt/10 px-5 py-4 shadow-[0_0_24px_-8px_rgba(200,255,46,0.4)]">
          <div className="flex items-center gap-3 text-sm">
            <span className="pulse-ring h-3 w-3 rounded-full bg-volt" />
            <span>
              <strong className="text-paper">{activeSession.planName}</strong> is currently active and awaiting your sets.
            </span>
          </div>
          <Link
            href={`/dashboard/train/live/${activeSession.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-volt px-4 py-2 text-xs font-bold text-black transition-transform hover:scale-105"
          >
            Resume Workout <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {/* Streak */}
        <div className="panel lift p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
              <Flame size={18} />
            </div>
            <span className="text-[10px] font-semibold text-fog uppercase">
              Best: {longestStreak}d
            </span>
          </div>
          <div className="font-display text-3xl md:text-4xl text-paper">{currentStreak} <span className="text-base text-fog">days</span></div>
          <div className="mt-1 text-[11px] font-semibold tracking-wider text-fog uppercase">
            Workout Streak
          </div>
        </div>

        {/* Weekly Consistency Bar */}
        <div className="panel lift p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt/15 text-volt">
              <Target size={18} />
            </div>
            <span className="text-[10px] font-bold text-volt uppercase">
              {consistencyPct}%
            </span>
          </div>
          <div className="font-display text-3xl md:text-4xl text-paper">
            {completedThisWeek} <span className="text-base text-fog">/ {targetWorkouts}</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold tracking-wider text-fog uppercase">
            Weekly Target
          </div>
          {/* Progress meter */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-volt transition-all duration-500"
              style={{ width: `${consistencyPct}%` }}
            />
          </div>
        </div>

        {/* Minutes this week */}
        <div className="panel lift p-4 md:p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
            <Timer size={18} />
          </div>
          <div className="font-display text-3xl md:text-4xl text-paper">{weekMinutes} <span className="text-base text-fog">min</span></div>
          <div className="mt-1 text-[11px] font-semibold tracking-wider text-fog uppercase">
            Minutes This Week
          </div>
        </div>

        {/* Total Time Lifted */}
        <div className="panel lift p-4 md:p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/15 text-purple-300">
            <TrendingUp size={18} />
          </div>
          <div className="font-display text-3xl md:text-4xl text-paper">
            {totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)}h` : `${totalMinutes}m`}
          </div>
          <div className="mt-1 text-[11px] font-semibold tracking-wider text-fog uppercase">
            Total Time Forged
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Workout & 8-Week Consistency */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's Workout Card */}
        <div className="panel relative flex flex-col justify-between overflow-hidden p-6 lg:col-span-2">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(90% 70% at 100% 0%, rgba(200,255,46,0.12), transparent 65%)",
            }}
          />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-widest text-volt uppercase">
                Today&apos;s Workout
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-fog uppercase">
                {fmtDay(now)}
              </span>
            </div>

            {todaysPlan ? (
              <div>
                <h3 className="font-display text-3xl tracking-wide uppercase text-paper">
                  {todaysPlan.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fog">
                  {todaysPlan.description || "Targeted routine mapped to your muscle split."}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-fog">
                  <span className="flex items-center gap-1.5">
                    <Dumbbell size={14} className="text-volt" />
                    {todaysPlanMeta?.count || 4} moves
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Timer size={14} className="text-volt" />
                    ~{Math.max(15, Math.round((todaysPlanMeta?.minutes || 1800) / 60))} min
                  </span>
                  <Badge tone="volt" className="capitalize">
                    {todaysPlan.level || "Intermediate"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-display text-2xl tracking-wide uppercase text-paper">
                  Free Session Mode
                </h3>
                <p className="mt-2 text-xs text-fog">
                  No scheduled program for today. Pick moves freely from the library or run an improvised burner.
                </p>
              </div>
            )}
          </div>

          <div className="relative mt-6 flex flex-wrap gap-2.5 border-t border-white/8 pt-4">
            <StartSessionButton
              planId={todaysPlan ? todaysPlan.id : null}
              label={todaysPlan ? "Start Today's Workout" : "Start Free Session"}
              className="flex-1"
            />
            {todaysPlan && (
              <StartSessionButton
                planId={null}
                label="Free Session"
                variant="outline"
              />
            )}
          </div>
        </div>

        {/* Weekly Volume History */}
        <div className="panel p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl tracking-wide uppercase">
                Weekly Volume Progression
              </h2>
              <p className="text-xs text-fog">Minutes trained per week · 8-week history</p>
            </div>
            <Link
              href="/dashboard/progress"
              className="text-xs font-semibold text-volt hover:underline flex items-center gap-1"
            >
              Full Analytics <ChevronRight size={13} />
            </Link>
          </div>
          <WeeklyBars weeks={weeks} />
        </div>
      </div>

      {/* PR Highlights & Coach Recommendations */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Personal Records */}
        <div className="panel p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-volt" />
              <h3 className="font-display text-lg tracking-wide uppercase">
                Personal Records
              </h3>
            </div>
            <Link href="/dashboard/progress" className="text-xs text-volt hover:underline">
              View all
            </Link>
          </div>

          {prs.length > 0 ? (
            <div className="space-y-2.5">
              {prs.map((pr) => (
                <div
                  key={pr.id}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-volt/30"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-paper">
                      {pr.exerciseName}
                    </div>
                    <div className="text-[11px] text-fog capitalize">
                      {pr.recordType.replace("_", " ")} · {fmtDate(pr.achievedAt)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-display text-lg text-volt">
                      {pr.weightKg ? `${pr.weightKg} kg` : pr.reps ? `${pr.reps} reps` : String(pr.value)}
                    </span>
                    {pr.reps && pr.weightKg && (
                      <div className="text-[10px] text-fog">× {pr.reps} reps</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-fog">
              <Trophy size={28} className="mx-auto mb-2 text-white/20" />
              Complete workouts to set your first Personal Record benchmarks.
            </div>
          )}
        </div>

        {/* Coach Recommendations */}
        <div className="panel p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-volt" />
              <h3 className="font-display text-lg tracking-wide uppercase">
                Recommended Moves for {formattedGoal}
              </h3>
            </div>
            <Link href="/dashboard/coach" className="text-xs text-volt hover:underline">
              AI Coach
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {focus.map((f) => (
              <Link
                key={f.item.id}
                href={`/dashboard/exercises/${f.item.id}`}
                className="group flex flex-col justify-between rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-all hover:border-volt/40 hover:bg-white/[0.04]"
              >
                <div>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-volt/10 text-volt">
                    <Dumbbell size={16} />
                  </div>
                  <h4 className="font-semibold text-sm text-paper group-hover:text-volt line-clamp-1">
                    {f.item.name}
                  </h4>
                  <p className="mt-1 text-[11px] text-fog line-clamp-2 leading-relaxed">
                    {f.reason}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-volt pt-2 border-t border-white/5">
                  <span>View Guide</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg tracking-wide uppercase">
              Recent Workout Sessions
            </h3>
            <p className="text-xs text-fog">Live telemetry recorded from completed sessions</p>
          </div>
          <Link href="/dashboard/train" className="text-xs text-volt hover:underline">
            All Sessions
          </Link>
        </div>

        <RecentSessions
          initial={recent.map((r) => ({
            id: r.session.id,
            planName: r.session.planName,
            status: r.session.status,
            startedAt: r.session.startedAt.toISOString(),
            durationSeconds: r.session.durationSeconds,
            logCount: r.logCount,
          }))}
        />
      </div>
    </div>
  );
}
