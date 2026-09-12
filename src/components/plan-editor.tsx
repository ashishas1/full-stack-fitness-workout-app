"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  ListOrdered,
  Pencil,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Exercise, Plan } from "@/db/schema";
import { AREA_LABEL, cx, EQUIPMENT_LABEL } from "@/lib/utils";
import {
  Badge,
  Button,
  DifficultyBadge,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { ExerciseArt, exerciseIcon } from "@/components/exercise-art";
import { StartSessionButton } from "@/components/start-session";

export type PlanItem = {
  id: number;
  planId: number;
  exerciseId: number;
  orderIndex: number;
  sets: number;
  reps: string;
  restSeconds: number;
  durationSeconds: number | null;
  exercise: Exercise;
};

let tempIdCounter = 0;
function nextTempId(): number {
  return --tempIdCounter;
}

export function PlanEditor({
  plan,
  initialItems,
  library,
}: {
  plan: Plan;
  initialItems: PlanItem[];
  library: Exercise[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [meta, setMeta] = useState({
    name: plan.name,
    description: plan.description,
    level: plan.level,
    focus: plan.focus,
  });
  const [editMetaOpen, setEditMetaOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pickQuery, setPickQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const estMinutes = Math.max(
    1,
    Math.round(
      items.reduce((a, it) => a + it.sets * ((it.durationSeconds ?? 40) + it.restSeconds), 0) / 60
    )
  );

  const pickables = useMemo(
    () =>
      library.filter(
        (e) =>
          !items.some((it) => it.exerciseId === e.id) &&
          (!pickQuery || e.name.toLowerCase().includes(pickQuery.toLowerCase()))
      ),
    [library, items, pickQuery]
  );

  /* ---------- meta ---------- */
  async function saveMeta() {
    setSaving(true);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
      if (!res.ok) throw new Error();
      toast.success("Program updated");
      setEditMetaOpen(false);
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- items ---------- */
  function patchLocal(id: number, patch: Partial<PlanItem>) {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function patchRemote(id: number, patch: Record<string, unknown>) {
    try {
      await fetch(`/api/plans/${plan.id}/exercises`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planExerciseId: id, ...patch }),
      });
    } catch {
      toast.error("Sync hiccup — change saved locally");
    }
  }

  function updateField(id: number, field: string, value: number | string | null) {
    patchLocal(id, { [field]: value } as Partial<PlanItem>);
    patchRemote(id, { [field]: value });
  }

  async function move(id: number, dir: -1 | 1) {
    const idx = items.findIndex((it) => it.id === id);
    const swap = items[idx + dir];
    if (!swap) return;
    const next = [...items];
    const a = { ...next[idx], orderIndex: swap.orderIndex };
    const b = { ...swap, orderIndex: next[idx].orderIndex };
    next[idx] = b;
    next[idx + dir] = a;
    setItems(next);
    patchRemote(a.id, { orderIndex: a.orderIndex });
    patchRemote(b.id, { orderIndex: b.orderIndex });
  }

  async function removeItem(id: number) {
    const backup = items;
    setItems((arr) => arr.filter((it) => it.id !== id));
    try {
      const res = await fetch(`/api/plans/${plan.id}/exercises`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planExerciseId: id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Exercise removed");
    } catch {
      setItems(backup);
      toast.error("Could not remove — restored");
    }
  }

  async function addExercise(e: Exercise) {
    // optimistic
    const temp: PlanItem = {
      id: nextTempId(),
      planId: plan.id,
      exerciseId: e.id,
      orderIndex: items.length,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.restSeconds,
      durationSeconds: e.durationSeconds,
      exercise: e,
    };
    setItems((arr) => [...arr, temp]);
    setAddOpen(false);
    setPickQuery("");
    try {
      const res = await fetch(`/api/plans/${plan.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: e.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add");
      setItems((arr) =>
        arr.map((it) => (it.id === temp.id ? { ...data.item, exercise: e } : it))
      );
      toast.success(`${e.name} added`);
    } catch (err) {
      setItems((arr) => arr.filter((it) => it.id !== temp.id));
      toast.error(err instanceof Error ? err.message : "Could not add");
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/plans"
        className="mb-6 inline-flex items-center gap-2 text-[13px] font-semibold text-fog transition-colors hover:text-volt"
      >
        <ArrowLeft size={15} /> All programs
      </Link>

      <PageHeader
        eyebrow={`~${estMinutes} min · ${items.length} moves`}
        title={meta.name}
        sub={meta.description}
      >
        <Button variant="outline" onClick={() => setEditMetaOpen(true)}>
          <Pencil size={15} /> Edit info
        </Button>
        {items.length > 0 && (
          <StartSessionButton planId={plan.id} label="Start workout" />
        )}
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={meta.level} />
        <Badge className="capitalize">{meta.focus}</Badge>
        <Badge>
          <Clock3 size={10} /> est. {estMinutes} minutes
        </Badge>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="This program is empty"
          body="Stack it with moves from the library. Order matters — put your hardest hitters first."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add first exercise
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map((it, i) => {
              const Icon = exerciseIcon(it.exercise.icon);
              const open = expanded === it.id;
              return (
                <motion.div
                  layout
                  key={it.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="panel overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4 md:gap-5">
                    <span className="font-display hidden w-8 text-2xl text-white/20 sm:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-volt">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[15px] font-semibold">
                          {it.exercise.name}
                        </span>
                        <Badge>{AREA_LABEL[it.exercise.targetArea]}</Badge>
                      </div>
                      <div className="mt-0.5 text-[12px] text-fog">
                        {it.exercise.equipment === "none"
                          ? "Bodyweight"
                          : EQUIPMENT_LABEL[it.exercise.equipment]}
                        {it.durationSeconds ? ` · timed ${it.durationSeconds}s` : ""}
                      </div>
                    </div>

                    {/* editable numbers */}
                    <div className="hidden items-center gap-2 md:flex">
                      <NumField
                        label="Sets"
                        value={it.sets}
                        onChange={(v) => updateField(it.id, "sets", v)}
                        min={1}
                        max={10}
                      />
                      <TextField
                        label="Reps"
                        value={it.reps}
                        onChange={(v) => updateField(it.id, "reps", v)}
                      />
                      <NumField
                        label="Rest s"
                        value={it.restSeconds}
                        onChange={(v) => updateField(it.id, "restSeconds", v)}
                        min={0}
                        max={300}
                        step={5}
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <IconBtn onClick={() => move(it.id, -1)} disabled={i === 0} label="Move up">
                        <ArrowUp size={15} />
                      </IconBtn>
                      <IconBtn onClick={() => move(it.id, 1)} disabled={i === items.length - 1} label="Move down">
                        <ArrowDown size={15} />
                      </IconBtn>
                      <IconBtn onClick={() => setExpanded(open ? null : it.id)} label="How to perform">
                        <ChevronDown size={16} className={cx("transition-transform", open && "rotate-180")} />
                      </IconBtn>
                      <IconBtn danger onClick={() => removeItem(it.id)} label="Remove">
                        <Trash2 size={15} />
                      </IconBtn>
                    </div>
                  </div>

                  {/* mobile numbers */}
                  <div className="flex items-center gap-2 border-t border-white/6 px-4 py-3 md:hidden">
                    <NumField label="Sets" value={it.sets} onChange={(v) => updateField(it.id, "sets", v)} min={1} max={10} />
                    <TextField label="Reps" value={it.reps} onChange={(v) => updateField(it.id, "reps", v)} />
                    <NumField label="Rest s" value={it.restSeconds} onChange={(v) => updateField(it.id, "restSeconds", v)} min={0} max={300} step={5} />
                  </div>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/6"
                      >
                        <div className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
                          <ExerciseArt
                            accent={it.exercise.accent}
                            icon={it.exercise.icon}
                            className="hidden h-36 rounded-xl border border-white/8 md:block"
                          />
                          <ol className="space-y-1.5">
                            {it.exercise.steps.map((s, si) => (
                              <li key={si} className="flex gap-2.5 text-[13px] leading-relaxed text-paper/85">
                                <span className="font-timer mt-0.5 shrink-0 text-volt">{si + 1}.</span>
                                {s}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <button
            onClick={() => setAddOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-4 text-sm font-semibold text-fog transition-all hover:border-volt/40 hover:text-volt"
          >
            <Plus size={16} /> Add exercise
          </button>

          {items.length > 0 && (
            <div className="flex justify-center pt-2">
              <StartSessionButton planId={plan.id} label={`Arm the timer — ${items.length} moves`} />
            </div>
          )}
        </div>
      )}

      {/* meta modal */}
      <Modal open={editMetaOpen} onClose={() => setEditMetaOpen(false)}>
        <h3 className="font-display text-3xl tracking-wide uppercase">Program info</h3>
        <div className="mt-5 space-y-4">
          <Field label="Name">
            <Input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <Select value={meta.level} onChange={(e) => setMeta({ ...meta, level: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </Field>
            <Field label="Focus tag">
              <Input value={meta.focus} onChange={(e) => setMeta({ ...meta, focus: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setEditMetaOpen(false)}>
            <X size={14} /> Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={saveMeta}>
            <Check size={14} /> Save
          </Button>
        </div>
      </Modal>

      {/* add exercise modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} wide>
        <h3 className="font-display text-3xl tracking-wide uppercase">
          <ListOrdered className="mr-2 inline text-volt" size={24} />
          Add an exercise
        </h3>
        <div className="relative mt-4">
          <Search size={15} className="absolute top-1/2 left-4 -translate-y-1/2 text-fog" />
          <Input
            value={pickQuery}
            onChange={(e) => setPickQuery(e.target.value)}
            placeholder="Search the library…"
            className="pl-10"
            autoFocus
          />
        </div>
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
          {pickables.length === 0 && (
            <p className="py-8 text-center text-sm text-fog">
              Everything in the library is already in this program. Beast.
            </p>
          )}
          {pickables.map((e) => (
            <button
              key={e.id}
              onClick={() => addExercise(e)}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition-colors hover:border-volt/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-volt">
                <Timer size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{e.name}</span>
                <span className="block text-[12px] text-fog">
                  {AREA_LABEL[e.targetArea]} · {e.sets} × {e.reps}
                </span>
              </span>
              <Plus size={16} className="text-fog transition-colors group-hover:text-volt" />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="block w-16 text-center">
      <span className="mb-1 block text-[9px] font-bold tracking-[0.14em] text-fog uppercase">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) =>
          onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))
        }
        className="font-timer h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] text-center text-sm text-paper outline-none focus:border-volt/60"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block w-20 text-center">
      <span className="mb-1 block text-[9px] font-bold tracking-[0.14em] text-fog uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-timer h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] text-center text-[13px] text-paper outline-none focus:border-volt/60"
      />
    </label>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        "cursor-pointer rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-25",
        danger
          ? "text-fog hover:bg-red-500/10 hover:text-red-300"
          : "text-fog hover:bg-white/8 hover:text-paper"
      )}
    >
      {children}
    </button>
  );
}
