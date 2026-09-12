"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  Home,
  ListOrdered,
  RotateCcw,
  Sparkles,
  User,
} from "lucide-react";
import { AREA_LABEL, GOAL_LABEL, LEVEL_LABEL, cx } from "@/lib/utils";
import { Badge, DifficultyBadge } from "@/components/ui";
import { ExerciseArt } from "@/components/exercise-art";

type ExerciseLite = {
  id: number;
  name: string;
  targetArea: string;
  difficulty: string;
  equipment: string;
  description: string;
  steps: string[];
  sets: number;
  reps: string;
  durationSeconds: number | null;
  restSeconds: number;
  accent: string;
  icon: string;
};

type Suggestion = { exercise: ExerciseLite; reason: string };

type Msg = {
  id: number;
  from: "coach" | "user";
  text: string;
  suggestions?: Suggestion[];
  options?: { label: string; icon?: "spark" | "home" | "gym" | "check" | "no"; value: string }[];
};

const GOAL_CHIPS = [
  { label: "Melt fat", value: "shred" },
  { label: "Deep definition", value: "define" },
  { label: "Core strength", value: "strength" },
  { label: "Athletic core", value: "athletic" },
];

const LEVEL_CHIPS = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const SETTING_CHIPS = [
  { label: "At home", value: "home", icon: "home" as const },
  { label: "At the gym", value: "gym", icon: "gym" as const },
];

let mid = 0;
const nid = () => ++mid;

export function CoachChat({ goal, level }: { goal: string; level: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [stage, setStage] = useState<
    "goal" | "level" | "setting" | "more" | "done"
  >("goal");
  const prefs = useRef({ goal, level, setting: "home" });
  const shownIds = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  function coachSay(
    text: string,
    extra?: Partial<Msg>,
    delay = 650
  ): Promise<void> {
    setTyping(true);
    scrollDown();
    return new Promise((resolve) =>
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          { id: nid(), from: "coach", text, ...extra },
        ]);
        scrollDown();
        resolve();
      }, delay)
    );
  }

  function userSay(text: string) {
    setMessages((m) => [...m, { id: nid(), from: "user", text }]);
    scrollDown();
  }

  function clearOptions(msgId: number) {
    setMessages((m) =>
      m.map((msg) => (msg.id === msgId ? { ...msg, options: undefined } : msg))
    );
  }

  // intro
  useEffect(() => {
    let alive = true;
    (async () => {
      await new Promise((r) => setTimeout(r, 500));
      if (!alive) return;
      await coachSay(
        "Coach online. I build six-packs for a living — gym rats, home warriors, all of them."
      );
      if (!alive) return;
      await coachSay("First: what are we chasing?", {
        options: GOAL_CHIPS.map((c) => ({ ...c, icon: "spark" })),
      });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickGoal(msg: Msg, value: string, label: string) {
    clearOptions(msg.id);
    prefs.current.goal = value;
    userSay(label);
    await coachSay(
      value === "shred"
        ? "Fat loss first — smart. Visible abs are 80% revealed, 20% built."
        : "Locked in. I'll aim every pick at that."
    );
    await coachSay("And how battle-tested are your abs right now?", {
      options: LEVEL_CHIPS,
    });
    setStage("level");
  }

  async function pickLevel(msg: Msg, value: string, label: string) {
    clearOptions(msg.id);
    prefs.current.level = value;
    userSay(label);
    await coachSay(
      value === "advanced"
        ? "Respect. We'll bring out the heavy artillery."
        : "Good — I'll keep the progression honest."
    );
    await coachSay("Last one — where do you train?", {
      options: SETTING_CHIPS,
    });
    setStage("setting");
  }

  async function pickSetting(msg: Msg, value: string, label: string) {
    clearOptions(msg.id);
    prefs.current.setting = value;
    userSay(label);
    await coachSay(
      "Analyzing the library for your profile…",
      undefined,
      800
    );
    await serveSuggestions(true);
  }

  async function serveSuggestions(first = false) {
    const p = prefs.current;
    const res = await fetch(
      `/api/suggestions?goal=${p.goal}&level=${p.level}&setting=${p.setting}&exclude=${shownIds.current.join(",")}&count=3`
    );
    const data = await res.json();
    const suggestions: Suggestion[] = data.suggestions ?? [];
    if (suggestions.length === 0) {
      await coachSay(
        "That's the entire arsenal — you've seen every move I have. Build a program from them or go train."
      );
      setStage("done");
      return;
    }
    shownIds.current.push(...suggestions.map((s) => s.exercise.id));
    const label = GOAL_LABEL[p.goal] ?? p.goal;
    await coachSay(
      first
        ? `Here's your opening trio for ${label.toLowerCase()}. Every one comes with the full how-to.`
        : "More fire, as ordered:",
      { suggestions },
      900
    );
    await coachSay("Want more suggestions?", {
      options: [
        { label: "Yes, show me more", value: "more", icon: "spark" },
        { label: "No, I'm set", value: "done", icon: "no" },
      ],
    });
    setStage("more");
  }

  async function pickMore(msg: Msg, value: string) {
    clearOptions(msg.id);
    if (value === "more") {
      userSay("Show me more");
      await coachSay("Digging deeper into the playbook…", undefined, 600);
      await serveSuggestions();
    } else {
      userSay("I'm set, coach");
      await coachSay(
        "That's the spirit. Stack your picks into a program, or just hit a free session and start repping. The forge is open 24/7."
      );
      await coachSay("Come back tomorrow. Consistency compounds.", undefined, 500);
      setStage("done");
    }
  }

  function reset() {
    setMessages([]);
    shownIds.current = [];
    setStage("goal");
    (async () => {
      await coachSay("Fresh consultation. Same rules apply.");
      await coachSay("What are we chasing?", {
        options: GOAL_CHIPS.map((c) => ({ ...c, icon: "spark" })),
      });
    })();
  }

  return (
    <div className="panel overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-volt/15 text-volt">
            <Bot size={20} />
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-volt" />
          </span>
          <div>
            <div className="text-sm font-bold">Coach FORGE-1</div>
            <div className="text-[11px] text-fog">
              Knows 19 moves · reads your stats · never sleeps
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-fog transition-colors hover:border-volt/40 hover:text-volt"
        >
          <RotateCcw size={13} /> Restart
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="max-h-130 space-y-4 overflow-y-auto p-5">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cx("flex gap-3", m.from === "user" && "justify-end")}
          >
            {m.from === "coach" && (
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volt/15 text-volt">
                <Bot size={15} />
              </span>
            )}
            <div className={cx("max-w-[85%] sm:max-w-[75%]", m.from === "user" && "text-right")}>
              <div
                className={cx(
                  "inline-block rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
                  m.from === "coach"
                    ? "rounded-tl-md border border-white/8 bg-white/[0.04] text-paper"
                    : "rounded-tr-md bg-volt font-medium text-black"
                )}
              >
                {m.text}
              </div>

              {/* suggestion cards */}
              {m.suggestions && (
                <div className="mt-3 grid gap-3 text-left">
                  {m.suggestions.map((sg, i) => (
                    <SuggestionCard key={sg.exercise.id} s={sg} index={i} />
                  ))}
                </div>
              )}

              {/* option chips */}
              {m.options && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.options.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        if (stage === "goal") pickGoal(m, o.value, o.label);
                        else if (stage === "level") pickLevel(m, o.value, o.label);
                        else if (stage === "setting") pickSetting(m, o.value, o.label);
                        else if (stage === "more") pickMore(m, o.value);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-volt/40 bg-volt/8 px-4 py-2 text-[13px] font-semibold text-volt transition-all hover:bg-volt hover:text-black"
                    >
                      {o.icon === "home" && <Home size={13} />}
                      {o.icon === "gym" && <Dumbbell size={13} />}
                      {o.icon === "spark" && <Sparkles size={13} />}
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {m.from === "user" && (
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/8 text-fog">
                <User size={14} />
              </span>
            )}
          </motion.div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volt/15 text-volt">
              <Bot size={15} />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/8 bg-white/[0.04] px-4 py-3.5">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-paper" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-paper" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-paper" />
            </div>
          </div>
        )}

        {stage === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 pt-2"
          >
            <Link
              href="/dashboard/plans"
              className="inline-flex items-center gap-2 rounded-full bg-volt px-5 py-2.5 text-[13px] font-bold text-black"
            >
              <ClipboardList size={14} /> Build a program
            </Link>
            <Link
              href="/dashboard/exercises"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-[13px] font-semibold text-paper hover:border-volt/40 hover:text-volt"
            >
              Browse the library <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({ s, index }: { s: Suggestion; index: number }) {
  const [open, setOpen] = useState(false);
  const e = s.exercise;
  return (
    <div className="rounded-2xl border border-white/10 bg-ink/60">
      <div className="flex items-stretch gap-4 p-3">
        <ExerciseArt accent={e.accent} icon={e.icon} className="hidden w-24 shrink-0 rounded-xl sm:block" />
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg tracking-wide uppercase">
              {String(index + 1).padStart(2, "0")} · {e.name}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge>{AREA_LABEL[e.targetArea]}</Badge>
            <DifficultyBadge difficulty={e.difficulty} />
            <Badge>
              {e.sets} × {e.reps}
            </Badge>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-volt/90">
            Why: {s.reason}.
          </p>
        </div>
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between border-t border-white/8 px-4 py-2.5 text-[12px] font-bold tracking-wide text-fog uppercase transition-colors hover:text-volt"
      >
        <span className="flex items-center gap-2">
          <ListOrdered size={13} /> How to perform it
        </span>
        <ChevronDown size={15} className={cx("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ol className="space-y-2 border-t border-white/8 p-4">
              {e.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-paper/85">
                  <span className="font-timer mt-0.5 shrink-0 text-volt">{i + 1}.</span>
                  {step}
                </li>
              ))}
              <li className="pt-1 text-[12px] text-fog">
                Rest {e.restSeconds}s between sets.
              </li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
