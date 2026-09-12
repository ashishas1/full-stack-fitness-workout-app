"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Crown,
  Dumbbell,
  Sparkles,
  Target,
  Trophy,
  X,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { cx } from "@/lib/utils";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silently handle network glitch
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markAllAsRead() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch {
      toast.error("Failed to update notifications");
    } finally {
      setLoading(false);
    }
  }

  async function markSingleAsRead(id: number) {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // ignore
    }
  }

  function renderIcon(type: string) {
    switch (type) {
      case "pr_achieved":
        return <Trophy size={16} className="text-volt" />;
      case "workout_completed":
        return <Flame size={16} className="text-ember" />;
      case "goal_completed":
        return <Target size={16} className="text-emerald-400" />;
      case "payment_success":
      case "membership_milestone":
        return <Crown size={16} className="text-amber-300" />;
      default:
        return <Sparkles size={16} className="text-frost" />;
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className={cx(
          "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all",
          open
            ? "border-volt bg-volt/10 text-volt"
            : "border-white/10 bg-white/[0.03] text-fog hover:border-white/20 hover:text-paper"
        )}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-volt px-1 font-mono text-[10px] font-bold text-black shadow-lg shadow-volt/40 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-panel shadow-2xl backdrop-blur-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm tracking-wider uppercase text-paper">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-volt/15 px-2 py-0.5 text-[10px] font-bold text-volt">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="cursor-pointer text-[11px] font-semibold text-fog transition-colors hover:text-volt flex items-center gap-1"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-fog text-xs">
                  <Bell size={24} className="mx-auto mb-2 opacity-40" />
                  No notifications yet. Complete workouts or set PRs to earn badges!
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markSingleAsRead(n.id)}
                    className={cx(
                      "flex items-start gap-3 p-3.5 transition-colors cursor-pointer",
                      n.isRead
                        ? "bg-transparent opacity-70 hover:opacity-100 hover:bg-white/[0.02]"
                        : "bg-volt/[0.04] hover:bg-volt/[0.08]"
                    )}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                      {renderIcon(n.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-semibold text-paper">
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-volt" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-fog">
                        {n.message}
                      </p>
                      <span className="mt-1 block text-[9.5px] text-fog/60">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
