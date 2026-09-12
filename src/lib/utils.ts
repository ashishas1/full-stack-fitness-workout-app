export function cx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/** "07:32" or "1:04:12" */
export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "Mar 4" */
export function fmtDay(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "Mar 4, 2026" */
export function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Local YYYY-MM-DD key for streak math */
export function dayKey(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

export const AREA_LABEL: Record<string, string> = {
  upper: "Upper Abs",
  lower: "Lower Abs",
  obliques: "Obliques",
  full: "Full Core",
};

export const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const GOAL_LABEL: Record<string, string> = {
  shred: "Melt Fat",
  define: "Deep Definition",
  strength: "Core Strength",
  athletic: "Athletic Core",
};

export const EQUIPMENT_LABEL: Record<string, string> = {
  none: "No Equipment",
  mat: "Mat Only",
  bar: "Pull-up Bar",
  cable: "Cable Machine",
  weights: "Dumbbell / Plate",
  wheel: "Ab Wheel",
  bench: "Bench",
};

/** Accent palette keyed per exercise card */
export const ACCENTS: Record<
  string,
  { hex: string; soft: string; ring: string; text: string; bg: string }
> = {
  volt: {
    hex: "#c8ff2e",
    soft: "rgba(200,255,46,0.12)",
    ring: "rgba(200,255,46,0.45)",
    text: "text-volt",
    bg: "bg-volt",
  },
  ember: {
    hex: "#ff7a29",
    soft: "rgba(255,122,41,0.12)",
    ring: "rgba(255,122,41,0.45)",
    text: "text-ember",
    bg: "bg-ember",
  },
  frost: {
    hex: "#7df9ff",
    soft: "rgba(125,249,255,0.10)",
    ring: "rgba(125,249,255,0.4)",
    text: "text-frost",
    bg: "bg-frost",
  },
  ghost: {
    hex: "#b48cff",
    soft: "rgba(180,140,255,0.12)",
    ring: "rgba(180,140,255,0.45)",
    text: "text-ghost",
    bg: "bg-ghost",
  },
};

export const AREA_ACCENT: Record<string, string> = {
  upper: "volt",
  lower: "ember",
  obliques: "frost",
  full: "ghost",
};
