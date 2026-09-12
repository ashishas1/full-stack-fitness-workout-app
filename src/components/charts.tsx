"use client";

import { useMemo, useState } from "react";
import { cx, fmtDay } from "@/lib/utils";

/* ---------------- Weekly minutes bar chart ---------------- */

export function WeeklyBars({
  weeks,
}: {
  weeks: { label: string; minutes: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(30, ...weeks.map((w) => w.minutes));
  return (
    <div>
      <div className="flex h-40 items-end gap-2 md:gap-3">
        {weeks.map((w, i) => (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className={cx(
                "absolute -top-1 rounded-md border border-white/10 bg-panel-2 px-2 py-0.5 text-[11px] font-timer whitespace-nowrap transition-opacity",
                hover === i ? "opacity-100" : "opacity-0"
              )}
            >
              {w.minutes} min
            </div>
            <div
              className={cx(
                "w-full rounded-t-lg transition-all duration-500",
                i === weeks.length - 1
                  ? "bg-gradient-to-t from-volt/50 to-volt"
                  : "bg-gradient-to-t from-white/10 to-white/25 group-hover:from-volt/30 group-hover:to-volt/70"
              )}
              style={{ height: `${Math.max(4, (w.minutes / max) * 100)}%` }}
            />
            <span className="mt-2 text-[10px] tracking-wide text-fog uppercase">
              {w.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Trend area chart (weight / waist) ---------------- */

export function TrendChart({
  points,
  color = "#c8ff2e",
  unit,
}: {
  points: { date: string; value: number }[];
  color?: string;
  unit: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 190;
  const P = 14;

  const { path, area, coords } = useMemo(() => {
    if (points.length < 2)
      return { path: "", area: "", coords: [] as { x: number; y: number }[] };
    const min = Math.min(...points.map((p) => p.value));
    const maxV = Math.max(...points.map((p) => p.value));
    const span = Math.max(1, maxV - min);
    const coords = points.map((p, i) => ({
      x: P + (i / (points.length - 1)) * (W - P * 2),
      y: H - P - ((p.value - min) / span) * (H - P * 2.4),
    }));
    const path = coords
      .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");
    const area = `${path} L${coords[coords.length - 1].x},${H - P} L${coords[0].x},${H - P} Z`;
    return { path, area, coords };
  }, [points]);

  if (points.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-fog">
        Log at least two entries to see your trend line.
      </div>
    );
  }

  const hovPoint = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      {hovPoint && hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-white/10 bg-ink px-2.5 py-1.5 text-center whitespace-nowrap shadow-xl"
          style={{
            left: `${(coords[hover].x / W) * 100}%`,
            top: 0,
          }}
        >
          <div className="font-timer text-sm" style={{ color }}>
            {hovPoint.value}
            {unit}
          </div>
          <div className="text-[10px] text-fog">{fmtDay(hovPoint.date)}</div>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full">
        <defs>
          <linearGradient id={`tg-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={P}
            x2={W - P}
            y1={H * f}
            y2={H * f}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 6"
          />
        ))}
        <path d={area} fill={`url(#tg-${color})`} />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={hover === i ? 5.5 : 3.5}
            fill="#0a0b0c"
            stroke={color}
            strokeWidth="2"
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] tracking-wide text-fog uppercase">
        <span>{fmtDay(points[0].date)}</span>
        <span>{fmtDay(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

/* ---------------- Streak calendar (GitHub-style) ---------------- */

export function StreakCalendar({
  days,
}: {
  days: { date: string; minutes: number }[]; // last ~98 days oldest -> newest
}) {
  const max = Math.max(20, ...days.map((d) => d.minutes));
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d) => {
              const f = d.minutes / max;
              return (
                <div
                  key={d.date}
                  title={`${fmtDay(d.date)} — ${d.minutes || "no"} min trained`}
                  className="h-3.5 w-3.5 rounded-[4px] transition-transform hover:scale-125"
                  style={{
                    backgroundColor:
                      d.minutes === 0
                        ? "rgba(255,255,255,0.06)"
                        : `rgba(200,255,46,${0.25 + f * 0.75})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-fog">
        Less
        {[0.06, 0.25, 0.5, 0.75, 1].map((o) => (
          <span
            key={o}
            className="h-3 w-3 rounded-[4px]"
            style={{
              backgroundColor:
                o === 0.06 ? "rgba(255,255,255,0.06)" : `rgba(200,255,46,${o})`,
            }}
          />
        ))}
        More
      </div>
    </div>
  );
}
