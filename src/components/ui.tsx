"use client";

import {
  createElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ElementType,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/utils";

/* ---------------- Button ---------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "volt" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
};

export function Button({
  variant = "volt",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "volt" &&
          "rounded-full bg-volt text-black hover:brightness-110 hover:shadow-[0_8px_30px_-6px_rgba(200,255,46,0.5)]",
        variant === "outline" &&
          "rounded-full border border-white/15 bg-white/[0.03] text-paper hover:border-white/30 hover:bg-white/[0.06]",
        variant === "ghost" &&
          "rounded-full text-fog hover:bg-white/[0.06] hover:text-paper",
        variant === "danger" &&
          "rounded-full border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
        size === "sm" && "h-9 px-4 text-[13px]",
        size === "md" && "h-11 px-6 text-sm",
        size === "lg" && "h-13 px-8 text-base",
        size === "icon" && "h-9 w-9 p-0",
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------- Inputs ---------------- */

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-paper outline-none transition-colors placeholder:text-fog/60 focus:border-volt/60 focus:bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-fog/60 focus:border-volt/60 focus:bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "h-11 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-panel-2 px-4 text-sm text-paper outline-none transition-colors focus:border-volt/60 [&>option]:bg-panel-2",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-fog uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-fog/70">{hint}</span>}
    </label>
  );
}

/* ---------------- Badge ---------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "volt" | "ember" | "frost" | "ghost";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tone === "neutral" && "border-white/10 bg-white/[0.04] text-fog",
        tone === "volt" && "border-volt/30 bg-volt/10 text-volt",
        tone === "ember" && "border-ember/30 bg-ember/10 text-ember",
        tone === "frost" && "border-frost/30 bg-frost/10 text-frost",
        tone === "ghost" && "border-ghost/30 bg-ghost/10 text-ghost",
        className
      )}
    >
      {children}
    </span>
  );
}

export const DIFFICULTY_TONE: Record<string, "volt" | "ember" | "ghost"> = {
  beginner: "volt",
  intermediate: "ember",
  advanced: "ghost",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <Badge tone={DIFFICULTY_TONE[difficulty] ?? "neutral"}>
      {difficulty}
    </Badge>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className={cx(
              "max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-panel-2 p-6 shadow-2xl sm:rounded-3xl",
              wide ? "sm:max-w-2xl" : "sm:max-w-md"
            )}
          >
            <div className="mb-4 flex justify-end">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-full p-1.5 text-fog transition-colors hover:bg-white/10 hover:text-paper"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-display text-2xl tracking-wide uppercase">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fog">{body}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------- Empty / Loading ---------------- */

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon | ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  let renderedIcon: ReactNode = null;
  if (isValidElement(Icon)) {
    renderedIcon = Icon;
  } else if (Icon) {
    // LucideIcon or component type
    renderedIcon = createElement(Icon as ElementType, {
      size: 26,
      className: "text-volt",
    });
  }

  return (
    <div className="panel flex flex-col items-center px-6 py-14 text-center">
      {renderedIcon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-volt/25 bg-volt/10 text-volt">
          {renderedIcon}
        </div>
      )}
      <h3 className="font-display text-xl tracking-wide uppercase">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-fog">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 size={22} className={cx("animate-spin text-volt", className)} />
  );
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold tracking-[0.22em] text-volt uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl tracking-wide uppercase md:text-5xl">
          {title}
        </h1>
        {sub && <p className="mt-2 max-w-xl text-sm text-fog">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
