import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { ChevronRight, Clock3, Dumbbell, History, Zap } from "lucide-react";
import { db } from "@/db";
import { planExercises, plans, sessionLogs, workoutSessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fmtClock, fmtDate } from "@/lib/utils";
import { Badge, DifficultyBadge, PageHeader } from "@/components/ui";
import { StartSessionButton } from "@/components/start-session";

export const dynamic = "force-dynamic";

export default async function TrainPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userPlans = await db
    .select()
    .from(plans)
    .where(eq(plans.userId, user.id));

  const items = await db
    .select({
      planId: planExercises.planId,
      sets: planExercises.sets,
      restSeconds: planExercises.restSeconds,
      durationSeconds: planExercises.durationSeconds,
    })
    .from(planExercises)
    .innerJoin(plans, eq(plans.id, planExercises.planId))
    .where(eq(plans.userId, user.id));

  const summary = new Map<number, { count: number; seconds: number }>();
  for (const it of items) {
    const cur = summary.get(it.planId) ?? { count: 0, seconds: 0 };
    cur.count++;
    cur.seconds += it.sets * ((it.durationSeconds ?? 40) + it.restSeconds);
    summary.set(it.planId, cur);
  }

  const history = await db
    .select({
      session: workoutSessions,
      logCount: sql<number>`count(${sessionLogs.id})`.mapWith(Number),
    })
    .from(workoutSessions)
    .leftJoin(sessionLogs, eq(sessionLogs.sessionId, workoutSessions.id))
    .where(
      sql`${workoutSessions.userId} = ${user.id} and ${workoutSessions.status} = 'completed'`
    )
    .groupBy(workoutSessions.id)
    .orderBy(desc(workoutSessions.startedAt))
    .limit(6);

  return (
    <div>
      <PageHeader
        eyebrow="Mission control"
        title="Arm a session"
        sub="Pick a program or run free. The timer walks you through every set, rest and hold — you just show up."
      />

      {/* free session hero */}
      <div className="panel relative mb-6 overflow-hidden p-6 md:p-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 100% at 100% 0%, rgba(200,255,46,0.12), transparent 60%)",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-volt uppercase">
              <Zap size={13} /> No plan? No problem
            </div>
            <h2 className="font-display text-3xl tracking-wide uppercase md:text-4xl">
              Free session
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-fog">
              A raw stopwatch and the full library at your fingertips. Log sets as
              you go — perfect for improvised living-room burners.
            </p>
          </div>
          <StartSessionButton planId={null} label="Start free session" />
        </div>
      </div>

      <h2 className="font-display mb-4 text-lg tracking-wide uppercase">
        Programs
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {userPlans.map((p) => {
          const meta = summary.get(p.id);
          const count = meta?.count ?? 0;
          const est = Math.max(1, Math.round((meta?.seconds ?? 0) / 60));
          return (
            <div key={p.id} className="panel lift flex flex-col p-5">
              <div className="mb-2 flex items-center gap-2">
                <DifficultyBadge difficulty={p.level} />
                <Badge className="capitalize">{p.focus}</Badge>
              </div>
              <h3 className="font-display text-2xl tracking-wide uppercase">
                {p.name}
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-fog">
                {p.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-[12px] text-fog">
                <span className="flex items-center gap-1.5">
                  <Dumbbell size={13} /> {count} moves
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 size={13} /> ~{est} min
                </span>
              </div>
              <div className="mt-4 flex gap-2 border-t border-white/8 pt-4">
                {count > 0 ? (
                  <StartSessionButton planId={p.id} label="Arm timer" className="flex-1 px-4 py-2.5" />
                ) : (
                  <Link
                    href={`/dashboard/plans/${p.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-dashed border-white/15 px-4 py-2.5 text-[12px] text-fog hover:border-volt/40 hover:text-volt"
                  >
                    Add exercises first <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* history */}
      <div className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <History size={16} className="text-volt" />
          <h2 className="font-display text-lg tracking-wide uppercase">
            Session history
          </h2>
        </div>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/12 px-5 py-8 text-center text-sm text-fog">
            Nothing completed yet — this wall fills up fast once you start.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {history.map((h) => (
              <div
                key={h.session.id}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {h.session.planName}
                  </div>
                  <div className="text-[12px] text-fog">
                    {fmtDate(h.session.startedAt)} · {h.logCount} moves
                  </div>
                </div>
                <span className="font-timer shrink-0 text-sm text-volt">
                  {fmtClock(h.session.durationSeconds)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
