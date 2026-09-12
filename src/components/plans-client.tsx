"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  Dumbbell,
  FilePlus2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Plan } from "@/db/schema";
import {
  Badge,
  Button,
  ConfirmDialog,
  DifficultyBadge,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { StartSessionButton } from "@/components/start-session";

export type PlanWithMeta = Plan & { exerciseCount: number; estMinutes: number };

const FOCUS_SUGGESTIONS = ["custom", "shred", "hypertrophy", "daily", "strength", "endurance"];

export function PlansClient({ initial }: { initial: PlanWithMeta[] }) {
  const [rows, setRows] = useState(initial);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [focus, setFocus] = useState("custom");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<PlanWithMeta | null>(null);
  const [busy, setBusy] = useState(false);

  async function createPlan() {
    if (saving) return;
    setSaving(true);
    const temp: PlanWithMeta = {
      id: -Date.now(),
      userId: -1,
      name: name || "Untitled plan",
      description,
      level,
      focus,
      createdAt: new Date(),
      exerciseCount: 0,
      estMinutes: 1,
    };
    setRows((r) => [...r, temp]);
    setCreateOpen(false);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, level, focus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create plan");
      setRows((r) =>
        r.map((x) =>
          x.id === temp.id ? { ...data.plan, exerciseCount: 0, estMinutes: 1 } : x
        )
      );
      toast.success("Plan created — now load it with exercises");
      setName("");
      setDescription("");
      setLevel("beginner");
      setFocus("custom");
    } catch (err) {
      setRows((r) => r.filter((x) => x.id !== temp.id));
      toast.error(err instanceof Error ? err.message : "Could not create plan");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setBusy(true);
    setRows((r) => r.filter((x) => x.id !== target.id));
    setDeleting(null);
    try {
      const res = await fetch(`/api/plans/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`"${target.name}" deleted`);
    } catch {
      setRows((r) => [...r, target].sort((a, b) => a.name.localeCompare(b.name)));
      toast.error("Could not delete — restored");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Programs"
        title="Workout plans"
        sub="Structured circuits built from the library. Edit sets, reps and rest on every move — then arm the timer."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New plan
        </Button>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No programs yet"
          body="Build your first plan from the exercise library — pick a zone, stack moves, set the rests."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Create your first plan
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {rows.map((p) => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="panel lift group flex flex-col p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <DifficultyBadge difficulty={p.level} />
                    <Badge tone="neutral" className="capitalize">{p.focus}</Badge>
                  </div>
                  <button
                    onClick={() => setDeleting(p)}
                    aria-label="Delete plan"
                    className="cursor-pointer rounded-lg p-1.5 text-fog opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="font-display text-2xl tracking-wide uppercase">
                  {p.name}
                </h3>
                <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-fog">
                  {p.description || "No description — just pain."}
                </p>
                <div className="mt-4 flex items-center gap-4 text-[12px] text-fog">
                  <span className="flex items-center gap-1.5">
                    <Dumbbell size={13} /> {p.exerciseCount} moves
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={13} /> ~{p.estMinutes} min
                  </span>
                </div>
                <div className="mt-4 flex gap-2 border-t border-white/8 pt-4">
                  {p.exerciseCount > 0 ? (
                    <StartSessionButton planId={p.id} label="Start" className="flex-1 px-4 py-2.5" />
                  ) : (
                    <span className="flex flex-1 items-center justify-center rounded-full border border-dashed border-white/15 px-4 py-2.5 text-[12px] text-fog">
                      Add exercises to arm
                    </span>
                  )}
                  <Link
                    href={`/dashboard/plans/${p.id}`}
                    className="inline-flex items-center justify-center gap-1 rounded-full border border-white/15 px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:border-volt/40 hover:text-volt"
                  >
                    <Pencil size={13} /> Edit <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <h3 className="font-display text-3xl tracking-wide uppercase">
          <FilePlus2 className="mr-2 inline text-volt" size={26} />
          New program
        </h3>
        <div className="mt-5 space-y-4">
          <Field label="Program name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lower Ab Blitz"
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this program for, and when should you run it?"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </Field>
            <Field label="Focus tag">
              <Select value={focus} onChange={(e) => setFocus(e.target.value)}>
                {FOCUS_SUGGESTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
            <X size={14} /> Cancel
          </Button>
          <Button size="sm" loading={saving} onClick={createPlan}>
            <Check size={14} /> Create plan
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Delete program?"
        body={`"${deleting?.name}" and its exercise list will be removed. Past workout history stays intact.`}
      />
    </div>
  );
}
