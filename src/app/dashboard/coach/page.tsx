import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  Check,
  Dumbbell,
  HeartPulse,
  Moon,
  Salad,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BLUEPRINT } from "@/lib/seed-data";
import { PageHeader } from "@/components/ui";
import { CoachChat } from "@/components/coach-chat";

export const dynamic = "force-dynamic";

const PILLAR_ICONS: Record<string, LucideIcon> = {
  salad: Salad,
  dumbbell: Dumbbell,
  "heart-pulse": HeartPulse,
  moon: Moon,
  "calendar-check": CalendarCheck,
};

export default async function CoachPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader
        eyebrow="The six-pack blueprint"
        title="Coach"
        sub="Five disciplines build a visible six-pack. Then ask the coach below for your next moves — it keeps suggesting as long as you keep asking."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BLUEPRINT.map((p, i) => {
          const Icon = PILLAR_ICONS[p.icon] ?? Dumbbell;
          return (
            <div key={p.title} className={`panel lift p-6 ${i === 0 ? "xl:col-span-1" : ""}`}>
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-volt/25 bg-volt/10 text-volt">
                  <Icon size={20} />
                </span>
                <span className="text-[11px] font-bold tracking-[0.14em] text-fog uppercase">
                  {p.tag}
                </span>
              </div>
              <h3 className="font-display text-xl tracking-wide uppercase">
                <span className="mr-2 text-volt">{String(i + 1).padStart(2, "0")}</span>
                {p.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2.5 text-[13px] leading-relaxed text-fog">
                    <Check size={15} className="mt-0.5 shrink-0 text-volt" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div className="panel relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(90% 90% at 100% 0%, rgba(200,255,46,0.12), transparent 60%)",
            }}
          />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-volt/25 bg-volt/10 text-volt">
                <Sparkles size={20} />
              </span>
              <h3 className="font-display text-xl tracking-wide uppercase">
                Not sure what to do next?
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-fog">
                Tell the coach your goal and training spot. It ranks the whole
                library for you — and always asks if you want more.
              </p>
            </div>
            <a href="#coach-chat" className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-volt px-5 py-2.5 text-[13px] font-bold text-black transition-all hover:shadow-[0_0_30px_-6px_rgba(200,255,46,0.6)]">
              <Sparkles size={14} /> Ask the coach
            </a>
          </div>
        </div>
      </div>

      <div id="coach-chat" className="mt-8 scroll-mt-24">
        <CoachChat goal={user.goal} level={user.level} />
      </div>
    </div>
  );
}
