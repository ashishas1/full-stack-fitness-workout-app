import { createElement } from "react";
import {
  ArrowUp,
  CircleDot,
  Dumbbell,
  Flame,
  Repeat,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ACCENTS, cx } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  zap: Zap,
  shield: Shield,
  repeat: Repeat,
  "arrow-up": ArrowUp,
  dumbbell: Dumbbell,
  "circle-dot": CircleDot,
};

export function exerciseIcon(icon: string): LucideIcon {
  return ICONS[icon] ?? Flame;
}

/** Generative card art for an exercise: accent mesh + big index + icon. */
export function ExerciseArt({
  accent = "volt",
  icon = "flame",
  index,
  className,
  iconSize = 30,
}: {
  accent?: string;
  icon?: string;
  index?: number;
  className?: string;
  iconSize?: number;
}) {
  const a = ACCENTS[accent] ?? ACCENTS.volt;
  return (
    <div
      className={cx("relative overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 140% at 85% 0%, ${a.hex}26, transparent 55%), radial-gradient(100% 120% at 0% 100%, ${a.hex}14, transparent 50%)`,
      }}
    >
      <div className="bg-grid absolute inset-0 opacity-60" />
      {index !== undefined && (
        <span
          className="font-display absolute -right-2 -bottom-5 text-[92px] leading-none tracking-tight select-none"
          style={{ color: "transparent", WebkitTextStroke: `1.5px ${a.ring}` }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <div
        className="absolute top-3 left-3 flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur-sm"
        style={{ borderColor: a.ring, background: a.soft, color: a.hex }}
      >
        {createElement(exerciseIcon(icon), { size: iconSize - 8 })}
      </div>
    </div>
  );
}
