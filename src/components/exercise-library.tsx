"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clock3,
  Dumbbell,
  Flame,
  Lightbulb,
  ListOrdered,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Exercise } from "@/db/schema";
import { AREA_LABEL, cx, EQUIPMENT_LABEL, LEVEL_LABEL } from "@/lib/utils";
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
import { ExerciseArt } from "@/components/exercise-art";

const AREAS = ["all", "upper", "lower", "obliques", "full"] as const;
const DIFFS = ["all", "beginner", "intermediate", "advanced"] as const;

type FormState = {
  name: string;
  targetArea: string;
  difficulty: string;
  equipment: string;
  sets: string;
  reps: string;
  durationSeconds: string;
  restSeconds: string;
  description: string;
  steps: string;
  tips: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  targetArea: "full",
  difficulty: "beginner",
  equipment: "none",
  sets: "3",
  reps: "12",
  durationSeconds: "",
  restSeconds: "45",
  description: "",
  steps: "",
  tips: "",
};

function toForm(e: Exercise): FormState {
  return {
    name: e.name,
    targetArea: e.targetArea,
    difficulty: e.difficulty,
    equipment: e.equipment,
    sets: String(e.sets),
    reps: e.reps,
    durationSeconds: e.durationSeconds ? String(e.durationSeconds) : "",
    restSeconds: String(e.restSeconds),
    description: e.description,
    steps: Array.isArray(e.steps) ? e.steps.join("\n") : "",
    tips: Array.isArray(e.tips) ? e.tips.join("\n") : "",
  };
}

export function ExerciseLibrary({ initial }: { initial: Exercise[] }) {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<(typeof AREAS)[number]>("all");
  const [diff, setDiff] = useState<(typeof DIFFS)[number]>("all");
  const [homeOnly, setHomeOnly] = useState(false);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((e) => {
      if (area !== "all" && e.targetArea !== area) return false;
      if (diff !== "all" && e.difficulty !== diff) return false;
      if (homeOnly && !["none", "mat", "weights"].includes(e.equipment))
        return false;
      if (query && !e.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [items, area, diff, homeOnly, query]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(e: Exercise) {
    setEditing(e);
    setForm(toForm(e));
    setFormOpen(true);
    setSelected(null);
  }

  async function saveForm() {
    if (saving) return;
    setSaving(true);
    const payload = {
      name: form.name,
      targetArea: form.targetArea,
      difficulty: form.difficulty,
      equipment: form.equipment,
      sets: Number(form.sets) || 3,
      reps: form.reps,
      durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : null,
      restSeconds: Number(form.restSeconds) || 45,
      description: form.description,
      steps: form.steps.split("\n").map((s) => s.trim()).filter(Boolean),
      tips: form.tips.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const optimistic: Exercise = editing
      ? {
          ...editing,
          ...payload,
          name: payload.name || editing.name,
          restSeconds: payload.restSeconds,
        }
      : ({
          id: -Date.now(),
          createdAt: new Date(),
          kcalPerMin: 7,
          accent: "volt",
          icon: "flame",
          isCustom: true,
          userId: -1,
          ...payload,
          name: payload.name || "New exercise",
        } as Exercise);

    // optimistic apply
    if (editing) {
      setItems((arr) => arr.map((x) => (x.id === editing.id ? optimistic : x)));
    } else {
      setItems((arr) => [...arr, optimistic]);
    }
    setFormOpen(false);

    try {
      const res = await fetch(
        editing ? `/api/exercises/${editing.id}` : "/api/exercises",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setItems((arr) =>
        editing
          ? arr.map((x) => (x.id === editing.id ? data.exercise : x))
          : arr.map((x) => (x.id === optimistic.id ? data.exercise : x))
      );
      toast.success(editing ? "Exercise updated" : "Custom exercise added");
    } catch (err) {
      setItems((arr) =>
        editing
          ? arr.map((x) => (x.id === optimistic.id ? editing : x))
          : arr.filter((x) => x.id !== optimistic.id)
      );
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExercise(e: Exercise) {
    if (deleting) return;
    setDeleting(true);
    setItems((arr) => arr.filter((x) => x.id !== e.id));
    setSelected(null);
    try {
      const res = await fetch(`/api/exercises/${e.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`"${e.name}" deleted`);
    } catch {
      setItems((arr) => [...arr, e].sort((a, b) => a.name.localeCompare(b.name)));
      toast.error("Could not delete — restored");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="The arsenal"
        title="Exercise library"
        sub="Every move ships with pro cues, sets, rest targets and form tips. Build your own with the + button."
      >
        <Button onClick={openCreate}>
          <Plus size={16} /> New exercise
        </Button>
      </PageHeader>

      {/* controls */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-fog" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search moves…"
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {AREAS.map((a) => (
            <FilterChip key={a} active={area === a} onClick={() => setArea(a)}>
              {a === "all" ? "All zones" : AREA_LABEL[a]}
            </FilterChip>
          ))}
          <span className="mx-1 h-5 w-px bg-white/10" />
          {DIFFS.map((d) => (
            <FilterChip key={d} active={diff === d} onClick={() => setDiff(d)}>
              {d === "all" ? "Any level" : LEVEL_LABEL[d]}
            </FilterChip>
          ))}
          <span className="mx-1 h-5 w-px bg-white/10" />
          <FilterChip active={homeOnly} onClick={() => setHomeOnly(!homeOnly)}>
            <Flame size={12} /> Home friendly
          </FilterChip>
        </div>
      </div>

      {/* grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No moves match"
          body="Loosen the filters or forge your own custom exercise for this exact spot."
          action={<Button onClick={openCreate}><Plus size={16} /> Create it</Button>}
        />
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((e, i) => (
              <motion.button
                layout
                key={e.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelected(e)}
                className="panel lift group cursor-pointer overflow-hidden text-left"
              >
                <ExerciseArt accent={e.accent} icon={e.icon} index={i} className="h-32" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{e.name}</h3>
                    {e.isCustom && (
                      <Badge tone="ghost">
                        <User size={10} /> Custom
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-fog">
                    {e.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge>{AREA_LABEL[e.targetArea]}</Badge>
                    <DifficultyBadge difficulty={e.difficulty} />
                    <Badge>
                      <Clock3 size={10} /> {e.sets}× {e.reps}
                    </Badge>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* -------- detail modal -------- */}
      <Modal open={!!selected} onClose={() => setSelected(null)} wide>
        {selected && (
          <div>
            <ExerciseArt
              accent={selected.accent}
              icon={selected.icon}
              className="mb-5 h-28 rounded-2xl border border-white/8"
            />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-3xl tracking-wide uppercase">
                  {selected.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={selected.accent as "volt" | "ember" | "frost" | "ghost"}>
                    {AREA_LABEL[selected.targetArea]}
                    </Badge>
                    <DifficultyBadge difficulty={selected.difficulty} />
                  <Badge>{EQUIPMENT_LABEL[selected.equipment] ?? selected.equipment}</Badge>
                  <Badge>
                    <Clock3 size={10} /> Rest {selected.restSeconds}s
                  </Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-volt/25 bg-volt/10 px-4 py-2.5 text-center">
                <div className="font-display text-xl text-volt">
                  {selected.sets} × {selected.reps}
                </div>
                <div className="text-[10px] tracking-wider text-fog uppercase">target</div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-fog">
              {selected.description}
            </p>

            <h4 className="mt-6 mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-volt uppercase">
              <ListOrdered size={13} /> How to perform it
            </h4>
            <ol className="space-y-2.5">
              {(Array.isArray(selected.steps) ? selected.steps : []).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-timer mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/6 text-[11px] text-volt">
                    {i + 1}
                  </span>
                  <span className="text-paper/90">{step}</span>
                </li>
              ))}
            </ol>

            {Array.isArray(selected.tips) && selected.tips.length > 0 && (
              <>
                <h4 className="mt-6 mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-ember uppercase">
                  <Lightbulb size={13} /> Coach&apos;s cues
                </h4>
                <ul className="space-y-2">
                  {selected.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-fog">
                      <Check size={14} className="mt-0.5 shrink-0 text-ember" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
              <Link href={`/dashboard/exercises/${selected.id}`}>
                <Button variant="volt" size="sm" className="gap-2">
                  <Flame size={14} /> Full Guide, Form & Personal Records
                </Button>
              </Link>
              {selected.isCustom && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleting}
                    onClick={() => deleteExercise(selected)}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* -------- create/edit modal -------- */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} wide>
        <h3 className="font-display text-3xl tracking-wide uppercase">
          {editing ? "Edit exercise" : "Forge an exercise"}
        </h3>
        <p className="mt-1 text-sm text-fog">
          {editing
            ? "Tune your custom move."
            : "Your move, your rules — it lands in the library instantly."}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bulgarian Crunch"
            />
          </Field>
          <Field label="Rep target" hint="'15–20', '45 sec', '10 / side'…">
            <Input
              value={form.reps}
              onChange={(e) => setForm({ ...form, reps: e.target.value })}
              placeholder="12–15"
            />
          </Field>
          <Field label="Target zone">
            <Select value={form.targetArea} onChange={(e) => setForm({ ...form, targetArea: e.target.value })}>
              {Object.entries(AREA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              {Object.entries(LEVEL_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Equipment">
            <Select value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}>
              {Object.entries(EQUIPMENT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sets">
              <Input type="number" min={1} max={10} value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} />
            </Field>
            <Field label="Sec (timed)">
              <Input type="number" min={0} value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })} placeholder="—" />
            </Field>
            <Field label="Rest s">
              <Input type="number" min={0} value={form.restSeconds} onChange={(e) => setForm({ ...form, restSeconds: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="mt-4">
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What it hits and why it works…"
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="How to perform — one step per line">
            <Textarea
              rows={5}
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              placeholder={"Set up…\nBrace…\nMove…"}
            />
          </Field>
          <Field label="Form tips — one per line (optional)">
            <Textarea
              rows={5}
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
              placeholder={"Exhale on effort…\nNo momentum…"}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>
            <X size={14} /> Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={saveForm}>
            <Check size={14} /> {editing ? "Save changes" : "Add to library"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all",
        active
          ? "border-volt/60 bg-volt/12 text-volt"
          : "border-white/10 bg-white/[0.03] text-fog hover:border-white/25 hover:text-paper"
      )}
    >
      {children}
    </button>
  );
}
