"use client";

import { useState } from "react";
import { CalendarX2, Flame, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fmtClock, fmtDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui";

export type SessionRow = {
  id: number;
  planName: string;
  status: string;
  startedAt: string;
  durationSeconds: number;
  logCount: number;
};

export function RecentSessions({ initial }: { initial: SessionRow[] }) {
  const [rows, setRows] = useState(initial);
  const [deleting, setDeleting] = useState<SessionRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setBusy(true);
    // optimistic removal
    setRows((r) => r.filter((x) => x.id !== target.id));
    setDeleting(null);
    try {
      const res = await fetch(`/api/sessions/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Session deleted");
    } catch {
      setRows((r) => [...r, target].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)));
      toast.error("Could not delete — restored");
    } finally {
      setBusy(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CalendarX2 size={26} className="mb-3 text-fog" />
        <p className="text-sm text-fog">
          Nothing logged yet. Your first completed session lands here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {rows.map((s) => (
          <div
            key={s.id}
            className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/16"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                s.status === "completed"
                  ? "bg-volt/10 text-volt"
                  : "bg-white/6 text-fog"
              }`}
            >
              <Flame size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{s.planName}</div>
              <div className="text-[12px] text-fog">
                {fmtDate(s.startedAt)} · {s.logCount} exercises
              </div>
            </div>
            {s.status === "abandoned" && (
              <span className="hidden rounded-full border border-white/10 px-2 py-0.5 text-[10px] tracking-wide text-fog uppercase sm:block">
                abandoned
              </span>
            )}
            <span className="font-timer text-sm text-volt">
              {fmtClock(s.durationSeconds)}
            </span>
            <button
              onClick={() => setDeleting(s)}
              aria-label="Delete session"
              className="cursor-pointer rounded-lg p-2 text-fog opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Delete session?"
        body={`"${deleting?.planName}" from ${deleting ? fmtDate(deleting.startedAt) : ""} will vanish from your history and stats.`}
      />
    </>
  );
}
