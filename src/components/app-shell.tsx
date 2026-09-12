"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ClipboardList,
  Crown,
  Dumbbell,
  Flame,
  Hexagon,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cx } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";

const BASE_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/train", label: "Train", icon: Zap, exact: false },
  { href: "/dashboard/exercises", label: "Exercises", icon: Dumbbell, exact: false },
  { href: "/dashboard/plans", label: "Routines", icon: ClipboardList, exact: false },
  { href: "/dashboard/programs", label: "Programs", icon: Calendar, exact: false },
  { href: "/dashboard/progress", label: "Progress", icon: TrendingUp, exact: false },
  { href: "/dashboard/coach", label: "Coach", icon: Sparkles, exact: false },
  { href: "/dashboard/membership", label: "Membership", icon: Crown, exact: false },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center">
        <Hexagon size={36} strokeWidth={2.5} className="absolute text-volt" />
        <span className="font-display text-sm text-volt">6</span>
      </span>
      {!compact && (
        <span className="font-display text-xl tracking-wider">
          SIX<span className="text-volt">FORGE</span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navItems = isAdmin
    ? [
        ...BASE_NAV,
        { href: "/dashboard/admin", label: "Admin Console", icon: ShieldCheck, exact: false, isAdminBadge: true },
      ]
    : BASE_NAV;

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cx(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
              active
                ? "bg-volt/10 text-volt shadow-[inset_0_0_0_1px_rgba(200,255,46,0.25)]"
                : "text-fog hover:bg-white/[0.05] hover:text-paper"
            )}
          >
            <item.icon size={18} strokeWidth={active ? 2.4 : 2} />
            <span className="flex-1">{item.label}</span>
            {"isAdminBadge" in item && item.isAdminBadge && (
              <span className="rounded bg-volt/20 px-1.5 py-0.5 text-[10px] font-bold text-volt">
                ADMIN
              </span>
            )}
            {active && (
              <span className="h-1.5 w-1.5 rounded-full bg-volt" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: {
    username: string;
    level: string;
    email: string;
    role?: string;
    membershipTier?: string;
  };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out. Stay hungry.");
      window.location.href = "/";
    } catch {
      toast.error("Could not log out");
      setLoggingOut(false);
    }
  }

  const tier = user.membershipTier ?? "free";
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  const userCard = (
    <div className="mt-auto border-t border-white/8 pt-4">
      <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-volt to-[#7db91d] font-display text-lg text-black">
          {user.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{user.username}</span>
            {tier === "lifetime" && (
              <span className="flex h-4 items-center gap-0.5 rounded bg-amber-400/20 px-1 text-[9px] font-bold text-amber-300">
                <Crown size={9} /> VIP
              </span>
            )}
            {isAdmin && (
              <span className="flex h-4 items-center rounded bg-volt/20 px-1 text-[9px] font-bold text-volt">
                PRO
              </span>
            )}
          </div>
          <Link
            href="/dashboard/membership"
            className="mt-0.5 flex items-center gap-1 text-[11px] transition-colors hover:underline"
          >
            {tier === "lifetime" ? (
              <span className="font-semibold text-amber-300">Lifetime Founder</span>
            ) : tier === "yearly" ? (
              <span className="font-semibold text-ember">Elite Yearly</span>
            ) : tier === "monthly" ? (
              <span className="font-semibold text-volt">Pro Monthly</span>
            ) : (
              <span className="text-fog">Free · <span className="text-volt font-medium">Upgrade</span></span>
            )}
          </Link>
        </div>
        <button
          onClick={logout}
          disabled={loggingOut}
          aria-label="Log out"
          className="cursor-pointer rounded-lg p-2 text-fog transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-2 border-r border-white/8 bg-panel/80 p-4 backdrop-blur-xl lg:flex">
        <div className="flex items-center justify-between px-2 py-3">
          <Logo />
          <NotificationBell />
        </div>
        <NavLinks isAdmin={isAdmin} />
        {userCard}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/8 bg-ink/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-paper"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-72 flex-col gap-2 border-r border-white/10 bg-panel p-4"
            >
              <div className="flex items-center justify-between px-2 py-3">
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="cursor-pointer rounded-lg p-2 text-fog hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
              <NavLinks isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
              {userCard}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
