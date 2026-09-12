"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Check,
  ClipboardList,
  Crown,
  Dumbbell,
  Flame,
  HeartPulse,
  Hexagon,
  Moon,
  Play,
  Salad,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BASE_EXERCISES, BLUEPRINT } from "@/lib/seed-data";
import { AREA_LABEL } from "@/lib/utils";
import { ExerciseArt } from "@/components/exercise-art";

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const PILLAR_ICONS: Record<string, LucideIcon> = {
  salad: Salad,
  dumbbell: Dumbbell,
  "heart-pulse": HeartPulse,
  moon: Moon,
  "calendar-check": CalendarCheck,
};

const MARQUEE = BASE_EXERCISES.map((e) => e.name).slice(0, 9);

export function Landing({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="overflow-x-clip">
      {/* ---------------- Nav ---------------- */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <Hexagon size={32} strokeWidth={2.5} className="absolute text-volt" />
              <span className="font-display text-xs text-volt">6</span>
            </span>
            <span className="font-display text-lg tracking-wider">
              SIX<span className="text-volt">FORGE</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-fog md:flex">
            <a href="#blueprint" className="transition-colors hover:text-paper">Blueprint</a>
            <a href="#inside" className="transition-colors hover:text-paper">Inside the app</a>
            <a href="#library" className="transition-colors hover:text-paper">Library</a>
            <a href="#pricing" className="transition-colors hover:text-paper">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            {!loggedIn && (
              <Link
                href="/login"
                className="hidden text-[13px] font-medium text-fog transition-colors hover:text-paper sm:block"
              >
                Log in
              </Link>
            )}
            <Link
              href={loggedIn ? "/dashboard" : "/signup"}
              className="group inline-flex items-center gap-2 rounded-full bg-volt px-5 py-2.5 text-[13px] font-bold text-black transition-all hover:shadow-[0_0_30px_-6px_rgba(200,255,46,0.6)]"
            >
              {loggedIn ? "Open dashboard" : "Start forging"}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="relative pt-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 75% 20%, rgba(200,255,46,0.09), transparent 60%), radial-gradient(40% 40% at 10% 80%, rgba(255,122,41,0.06), transparent 60%)",
          }}
        />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-14 pb-20 md:pt-24 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-volt/25 bg-volt/8 px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-volt uppercase"
            >
              <Sparkles size={13} />
              The six-pack operating system
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="font-display text-[17vw] leading-[0.92] uppercase sm:text-7xl md:text-8xl lg:text-[6.5rem]"
            >
              Forge
              <br />
              <span className="stroke-soft">your</span> six
              <span className="text-volt">-</span>pack
              <span className="text-volt">.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-fog md:text-base"
            >
              Pro-grade ab programs, step-by-step exercise guides, a live
              training timer and a coach that keeps suggesting until your midsection
              runs out of excuses. Built for gym rats, home warriors and fitness
              freaks alike.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={loggedIn ? "/dashboard" : "/signup"}
                className="group inline-flex items-center gap-2 rounded-full bg-volt px-7 py-3.5 text-sm font-bold text-black transition-all hover:shadow-[0_0_40px_-8px_rgba(200,255,46,0.7)]"
              >
                <Play size={16} fill="currentColor" />
                {loggedIn ? "Back to training" : "Start free — 60 seconds"}
              </Link>
              <a
                href="#library"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-paper transition-colors hover:border-white/40"
              >
                Explore exercises
                <ArrowUpRight size={16} />
              </a>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-10 flex gap-8 border-t border-white/8 pt-6">
              {[
                ["19", "guided moves"],
                ["4", "pro programs"],
                ["12", "week blueprint"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-3xl text-volt">{n}</div>
                  <div className="mt-0.5 text-[11px] tracking-[0.14em] text-fog uppercase">{l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
              <img
                src="https://images.pexels.com/photos/5327528/pexels-photo-5327528.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1100&w=800"
                alt="Athlete flexing under dramatic gym lighting"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/30" />
              {/* floating timer chip */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="animate-floaty absolute top-5 left-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-ink/80 px-4 py-3 backdrop-blur-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt/15 text-volt">
                  <Timer size={17} />
                </span>
                <div>
                  <div className="font-timer text-lg leading-none font-bold">07:32</div>
                  <div className="mt-1 text-[10px] tracking-wider text-fog uppercase">Plank hold</div>
                </div>
              </motion.div>
              {/* floating suggestion chip */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.05, duration: 0.6 }}
                className="absolute right-5 bottom-24 max-w-55 rounded-2xl border border-volt/30 bg-ink/85 p-4 backdrop-blur-md"
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-volt uppercase">
                  <Sparkles size={11} /> Coach suggests
                </div>
                <div className="text-sm font-semibold">Hanging Leg Raise</div>
                <div className="mt-1 text-xs leading-snug text-fog">
                  Attacks the stubborn lower-belly overhang
                </div>
              </motion.div>
              {/* bottom strip */}
              <div className="absolute right-5 bottom-5 left-5 flex items-center justify-between rounded-2xl border border-white/10 bg-ink/80 px-5 py-3.5 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <Flame size={17} className="text-ember" />
                  <span className="text-sm font-semibold">14-day streak</span>
                </div>
                <span className="font-timer text-sm text-volt">-5.2 cm waist</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Marquee ---------------- */}
      <div className="border-y border-white/8 bg-panel py-4">
        <div className="flex w-max animate-marquee gap-0">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {MARQUEE.map((name) => (
                <span key={`${copy}-${name}`} className="flex items-center">
                  <span className="font-display px-6 text-xl tracking-wide whitespace-nowrap text-paper/70 uppercase">
                    {name}
                  </span>
                  <Zap size={14} className="shrink-0 text-volt" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Blueprint ---------------- */}
      <section id="blueprint" className="mx-auto max-w-7xl px-5 py-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={fadeUp} className="mb-2 text-[11px] font-bold tracking-[0.22em] text-volt uppercase">
            How a six-pack is actually built
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-display max-w-2xl text-4xl uppercase md:text-6xl">
            The blueprint<span className="text-volt">.</span> No shortcuts<span className="text-volt">.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 max-w-xl text-sm leading-relaxed text-fog">
            Crunches alone never carved a midsection. Six packs are forged in five
            disciplines — and SIXFORGE keeps all five honest.
          </motion.p>
        </motion.div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BLUEPRINT.map((p, i) => {
            const Icon = PILLAR_ICONS[p.icon] ?? Flame;
            return (
              <motion.div
                key={p.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className={`panel lift p-6 ${i === 0 ? "md:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-volt/25 bg-volt/10 text-volt">
                    <Icon size={20} />
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.14em] text-fog uppercase">
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-display text-2xl tracking-wide uppercase">{p.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-2.5 text-[13px] leading-relaxed text-fog">
                      <Check size={15} className="mt-0.5 shrink-0 text-volt" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="panel relative overflow-hidden p-6"
          >
            <img
              src="https://images.pexels.com/photos/4162541/pexels-photo-4162541.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
              alt="Athlete training abs on a gym bench"
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
            <div className="relative flex h-full min-h-55 flex-col justify-end">
              <p className="font-display text-3xl leading-tight uppercase">
                &ldquo;Abs are made in the gym, revealed in the kitchen&rdquo;
              </p>
              <Link
                href={loggedIn ? "/dashboard/coach" : "/signup"}
                className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-bold text-volt"
              >
                Ask the coach <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Inside the app (bento) ---------------- */}
      <section id="inside" className="border-y border-white/8 bg-panel/50 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-12 text-center"
          >
            <motion.p variants={fadeUp} className="mb-2 text-[11px] font-bold tracking-[0.22em] text-volt uppercase">
              Inside the forge
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl uppercase md:text-6xl">
              Train. Time. Track<span className="text-volt">.</span>
            </motion.h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Live timer mock */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="panel lift p-6 md:row-span-2"
            >
              <div className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-fog uppercase">
                <Timer size={14} className="text-volt" /> Live workout timer
              </div>
              <div className="rounded-2xl border border-white/8 bg-ink p-5 text-center">
                <div className="font-timer text-5xl font-bold tracking-tight text-volt">00:41</div>
                <div className="mt-2 text-[11px] tracking-[0.18em] text-fog uppercase">
                  Set 2 / 4 — Ab Wheel Rollout
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-volt/60 to-volt" />
                </div>
                <div className="mt-5 flex justify-center gap-3">
                  <span className="pulse-ring flex h-12 w-12 items-center justify-center rounded-full bg-volt text-black">
                    <Play size={18} fill="currentColor" />
                  </span>
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-fog">
                Start, pause and finish flows. Per-set countdowns, automatic rest
                timers, rep-based manual sets — every second is logged to your history.
              </p>
            </motion.div>

            {/* Coach mock */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="panel lift p-6"
            >
              <div className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-fog uppercase">
                <Sparkles size={14} className="text-volt" /> Smart suggestions
              </div>
              <div className="space-y-2.5">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-white/8 bg-white/[0.04] p-3 text-[13px]">
                  Goal: melt fat, training at home. What first?
                </div>
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-md border border-volt/25 bg-volt/10 p-3 text-[13px]">
                  Try <b>Mountain Climbers</b> — torches calories while hammering
                  your core. Want more suggestions?
                </div>
              </div>
            </motion.div>

            {/* Progress mock */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="panel lift p-6"
            >
              <div className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-fog uppercase">
                <TrendingUp size={14} className="text-volt" /> Progress engine
              </div>
              <div className="flex h-24 items-end gap-1.5">
                {[35, 55, 40, 70, 60, 85, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-volt/25 to-volt/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-fog">
                Waist, weight and workout streaks — watch the numbers bend.
              </p>
            </motion.div>

            {/* Plans mock */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="panel lift p-6"
            >
              <div className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-fog uppercase">
                <ClipboardList size={14} className="text-volt" /> Programs that adapt
              </div>
              {["Home Shred Starter", "Gym Core Crusher", "Advanced Ab Assault"].map((p, i) => (
                <div key={p} className="mb-2 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-[13px]">
                  <span className="font-medium">{p}</span>
                  <span className="font-timer text-xs text-fog">~{12 + i * 6} min</span>
                </div>
              ))}
              <p className="mt-4 text-[13px] leading-relaxed text-fog">
                Curated programs plus your own custom builds — full CRUD, your rules.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------- Exercise library strip ---------------- */}
      <section id="library" className="mx-auto max-w-7xl px-5 py-24">
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="mb-10 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <motion.p variants={fadeUp} className="mb-2 text-[11px] font-bold tracking-[0.22em] text-volt uppercase">
              19 moves, fully coached
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl uppercase md:text-6xl">
              The library<span className="stroke-volt">.</span>
            </motion.h2>
          </div>
          <motion.div variants={fadeUp}>
            <Link href={loggedIn ? "/dashboard/exercises" : "/signup"} className="group inline-flex items-center gap-2 text-sm font-bold text-volt">
              Browse all <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {BASE_EXERCISES.slice(0, 6).map((e, i) => (
            <motion.div
              key={e.name}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              className="panel lift overflow-hidden"
            >
              <ExerciseArt accent={e.accent} icon={e.icon} index={i} className="h-28" />
              <div className="p-4">
                <div className="text-sm font-semibold">{e.name}</div>
                <div className="mt-1 text-[11px] tracking-wide text-fog uppercase">
                  {AREA_LABEL[e.targetArea]} · {e.reps}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Pricing Section ---------------- */}
      <section id="pricing" className="border-t border-white/8 bg-white/[0.01] py-24">
        <div className="mx-auto max-w-7xl px-5">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center"
          >
            <motion.p
              variants={fadeUp}
              className="mb-2 text-[11px] font-bold tracking-[0.22em] text-volt uppercase"
            >
              Transparent Investment
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl uppercase md:text-6xl"
            >
              Membership <span className="text-volt">Plans</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-3 max-w-md text-sm text-fog"
            >
              Choose the path to chisel your midline. From flexible monthly training to lifetime VIP founder access.
            </motion.p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Monthly */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="panel flex flex-col justify-between p-7"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl uppercase">Monthly Pro</h3>
                </div>
                <p className="mt-1 text-xs text-fog">Billed monthly · Cancel anytime</p>
                <div className="mt-6 flex items-baseline gap-1 border-b border-white/8 pb-6">
                  <span className="font-display text-5xl">₹99</span>
                  <span className="text-sm text-fog">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-[13px] text-paper/90">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-volt" /> Full 12+ coached exercise library
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-volt" /> Live interactive interval timer
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-volt" /> Unlimited workout session tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-volt" /> Body metrics & waist tracking
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4">
                <Link
                  href={loggedIn ? "/dashboard/membership" : "/signup"}
                  className="block w-full rounded-full border border-white/20 bg-white/5 py-3 text-center text-sm font-semibold text-paper transition-all hover:border-white/40 hover:bg-white/10"
                >
                  Get Started (₹99/mo)
                </Link>
              </div>
            </motion.div>

            {/* Yearly */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="panel relative flex flex-col justify-between border-ember/50 p-7 shadow-[0_0_40px_-15px_rgba(255,122,41,0.25)]"
            >
              <div className="absolute top-4 right-4 rounded-full border border-ember/50 bg-ember/20 px-3 py-1 text-[11px] font-bold text-ember uppercase">
                Save ₹638 / yr
              </div>
              <div>
                <h3 className="font-display text-2xl uppercase">Yearly Elite</h3>
                <p className="mt-1 text-xs text-fog">Billed annually · Most Popular</p>
                <div className="mt-6 flex items-baseline gap-1 border-b border-white/8 pb-6">
                  <span className="font-display text-5xl">₹550</span>
                  <span className="text-sm text-fog">/ year</span>
                </div>
                <ul className="mt-6 space-y-3 text-[13px] text-paper/90">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-ember" /> Everything in Monthly Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-ember" /> All 4 progression workout programs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-ember" /> 98-day training heat map
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-ember" /> Custom exercise creator
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-ember" /> Elite member profile badge
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4">
                <Link
                  href={loggedIn ? "/dashboard/membership" : "/signup"}
                  className="block w-full rounded-full bg-volt py-3 text-center text-sm font-bold text-black transition-all hover:shadow-[0_0_25px_rgba(200,255,46,0.6)]"
                >
                  Choose Yearly (₹550/yr)
                </Link>
              </div>
            </motion.div>

            {/* Lifetime */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="panel relative flex flex-col justify-between border-amber-400/40 p-7 shadow-[0_0_40px_-15px_rgba(255,215,0,0.25)]"
            >
              <div className="absolute top-4 right-4 rounded-full border border-amber-400/50 bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-300 uppercase">
                VIP Founder
              </div>
              <div>
                <h3 className="font-display text-2xl uppercase">VIP Lifetime</h3>
                <p className="mt-1 text-xs text-fog">One-time payment · Never pay again</p>
                <div className="mt-6 flex items-baseline gap-1 border-b border-white/8 pb-6">
                  <span className="font-display text-5xl">₹1,200</span>
                  <span className="text-sm text-fog">one-time</span>
                </div>
                <ul className="mt-6 space-y-3 text-[13px] text-paper/90">
                  <li className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-300" /> Permanent lifetime access forever
                  </li>
                  <li className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-300" /> All future programs & AI modules
                  </li>
                  <li className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-300" /> Exclusive VIP Founder crown badge
                  </li>
                  <li className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-300" /> Direct routine consultation
                  </li>
                  <li className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-300" /> Zero recurring charges ever
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4">
                <Link
                  href={loggedIn ? "/dashboard/membership" : "/signup"}
                  className="block w-full rounded-full border border-amber-400/50 bg-amber-400/10 py-3 text-center text-sm font-bold text-amber-300 transition-all hover:bg-amber-400/20"
                >
                  Get Lifetime VIP (₹1200)
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden border-t border-white/8">
        <img
          src="https://images.pexels.com/photos/17706044/pexels-photo-17706044.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1600"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />
        <div className="relative mx-auto max-w-4xl px-5 py-28 text-center">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-volt/25 bg-ink/60 px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-volt uppercase backdrop-blur">
              <Dumbbell size={13} /> Gym, home, anywhere
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-5xl uppercase md:text-7xl">
              Your six-pack starts <span className="text-volt">today</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-fog">
              Free account, pre-loaded programs, coach suggestions from minute one.
              The only thing left to bring is 12 weeks of honesty.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-9">
              <Link
                href={loggedIn ? "/dashboard/train" : "/signup"}
                className="inline-flex items-center gap-2 rounded-full bg-volt px-9 py-4 text-sm font-bold text-black transition-all hover:shadow-[0_0_50px_-8px_rgba(200,255,46,0.8)]"
              >
                <Zap size={16} fill="currentColor" />
                {loggedIn ? "Start a workout" : "Create your free account"}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/8 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 text-[12px] text-fog">
          <span className="font-display tracking-wider text-paper/70">
            SIX<span className="text-volt">FORGE</span>
          </span>
          <span>Forge daily. Reveal slowly. Never skip core day.</span>
        </div>
      </footer>
    </div>
  );
}
