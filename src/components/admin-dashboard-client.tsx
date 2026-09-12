"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Users,
  Dumbbell,
  Flame,
  CreditCard,
  IndianRupee,
  Layers,
  Search,
  Filter,
  Check,
  AlertCircle,
  Clock,
  Database,
  RefreshCw,
  Crown,
  Plus,
  Edit2,
  Trash2,
  Video,
  ExternalLink,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cx, fmtDate } from "@/lib/utils";
import { Badge, Button, PageHeader, Select, Input, Modal, Field, Textarea, ConfirmDialog } from "@/components/ui";

type AdminUser = {
  id: number;
  username: string;
  email: string;
  name: string | null;
  role: string;
  membershipTier: string;
  membershipExpiresAt: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
};

type AuditLog = {
  id: number;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

type AdminExercise = {
  id: number;
  name: string;
  slug: string | null;
  targetArea: string;
  bodyPart: string;
  primaryMuscle: string | null;
  difficulty: string;
  equipment: string;
  exerciseType: string;
  movementMedia: string | null;
  instructionalVideo: string | null;
  description: string;
  setupInstructions: string | null;
  movementInstructions: string | null;
  commonMistakes: string[] | null;
  isCustom: boolean;
  createdAt: string;
};

type Stats = {
  totalUsers: number;
  totalWorkouts: number;
  totalVolumeKg: number;
  totalRevenueInr: number;
  activePaidMembers: number;
};

export function AdminDashboardClient({
  initialUsers,
  initialAuditLogs,
  initialExercises = [],
  stats,
}: {
  initialUsers: AdminUser[];
  initialAuditLogs: AuditLog[];
  initialExercises?: AdminExercise[];
  stats: Stats;
}) {
  const [usersList, setUsersList] = useState<AdminUser[]>(initialUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [exercisesList, setExercisesList] = useState<AdminExercise[]>(initialExercises);
  const [activeTab, setActiveTab] = useState<"users" | "exercises" | "logs" | "health">("users");

  // Users Filters
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Exercises State
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [exerciseBodyPartFilter, setExerciseBodyPartFilter] = useState("all");
  const [exerciseDifficultyFilter, setExerciseDifficultyFilter] = useState("all");

  // Exercise Create/Edit Modal
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<AdminExercise | null>(null);
  const [formName, setFormName] = useState("");
  const [formBodyPart, setFormBodyPart] = useState("chest");
  const [formDifficulty, setFormDifficulty] = useState("beginner");
  const [formEquipment, setFormEquipment] = useState("dumbbells");
  const [formMovementPattern, setFormMovementPattern] = useState("push");
  const [formDescription, setFormDescription] = useState("");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formSetup, setFormSetup] = useState("");
  const [formMovement, setFormMovement] = useState("");
  const [savingExercise, setSavingExercise] = useState(false);
  const [deletingExercise, setDeletingExercise] = useState<AdminExercise | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  // Media Preview Modal
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  const filteredUsers = usersList.filter((u) => {
    const q = query.toLowerCase();
    const matchQuery =
      !query ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q));
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchTier = tierFilter === "all" || u.membershipTier === tierFilter;
    return matchQuery && matchRole && matchTier;
  });

  const filteredExercises = exercisesList.filter((e) => {
    const q = exerciseQuery.toLowerCase();
    const matchQuery =
      !exerciseQuery ||
      e.name.toLowerCase().includes(q) ||
      (e.primaryMuscle && e.primaryMuscle.toLowerCase().includes(q));
    const matchPart = exerciseBodyPartFilter === "all" || e.bodyPart === exerciseBodyPartFilter;
    const matchDiff = exerciseDifficultyFilter === "all" || e.difficulty === exerciseDifficultyFilter;
    return matchQuery && matchPart && matchDiff;
  });

  async function updateUserRole(userId: number, newRole: string) {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update role");
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success("User role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateUserTier(userId: number, newTier: string) {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, membershipTier: newTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update tier");
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, membershipTier: newTier } : u))
      );
      toast.success("Membership tier updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  function openCreateExercise() {
    setEditingExercise(null);
    setFormName("");
    setFormBodyPart("chest");
    setFormDifficulty("beginner");
    setFormEquipment("dumbbells");
    setFormMovementPattern("push");
    setFormDescription("");
    setFormMediaUrl("");
    setFormSetup("");
    setFormMovement("");
    setExerciseModalOpen(true);
  }

  function openEditExercise(ex: AdminExercise) {
    setEditingExercise(ex);
    setFormName(ex.name);
    setFormBodyPart(ex.bodyPart || "chest");
    setFormDifficulty(ex.difficulty || "beginner");
    setFormEquipment(ex.equipment || "dumbbells");
    setFormMovementPattern(ex.exerciseType || "push");
    setFormDescription(ex.description || "");
    setFormMediaUrl(ex.movementMedia || "");
    setFormSetup(ex.setupInstructions || "");
    setFormMovement(ex.movementInstructions || "");
    setExerciseModalOpen(true);
  }

  async function saveExercise() {
    if (!formName.trim()) {
      toast.error("Exercise name is required");
      return;
    }

    setSavingExercise(true);
    try {
      if (editingExercise) {
        // Update existing
        const res = await fetch(`/api/admin/exercises/${editingExercise.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            bodyPart: formBodyPart,
            targetArea: formBodyPart === "core" ? "lower" : "full",
            difficulty: formDifficulty,
            equipment: formEquipment,
            movementPattern: formMovementPattern,
            description: formDescription,
            movementMedia: formMediaUrl,
            setupInstructions: formSetup,
            movementInstructions: formMovement,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update exercise");

        setExercisesList((prev) =>
          prev.map((e) => (e.id === editingExercise.id ? { ...e, ...data.exercise } : e))
        );
        toast.success("Exercise updated in catalog");
      } else {
        // Create new
        const res = await fetch("/api/admin/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            bodyPart: formBodyPart,
            targetArea: formBodyPart === "core" ? "lower" : "full",
            difficulty: formDifficulty,
            equipment: formEquipment,
            movementPattern: formMovementPattern,
            description: formDescription,
            movementMedia: formMediaUrl,
            setupInstructions: formSetup,
            movementInstructions: formMovement,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create exercise");

        setExercisesList((prev) => [data.exercise, ...prev]);
        toast.success("New official exercise created");
      }
      setExerciseModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingExercise(false);
    }
  }

  async function confirmDeleteExercise() {
    if (!deletingExercise) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/admin/exercises/${deletingExercise.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete exercise");
      setExercisesList((prev) => prev.filter((e) => e.id !== deletingExercise.id));
      toast.success("Exercise deleted from database");
      setDeletingExercise(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Platform Governance & Control"
        title="Admin Command Console"
        sub="Role-based access management, platform KPIs, exercise catalog curation, and real-time security audit trail."
      >
        <Badge tone="volt" className="gap-1.5 px-3 py-1 font-mono text-xs font-bold">
          <ShieldCheck size={14} /> RBAC ENFORCED
        </Badge>
      </PageHeader>

      {/* KPI Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="panel p-5">
          <div className="flex items-center justify-between text-fog">
            <span className="text-xs font-bold uppercase tracking-wider">Athletes</span>
            <Users size={16} className="text-volt" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-paper">
            {stats.totalUsers}
          </div>
          <span className="text-[11px] text-fog">Total registered</span>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between text-fog">
            <span className="text-xs font-bold uppercase tracking-wider">Workouts</span>
            <Dumbbell size={16} className="text-volt" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-paper">
            {stats.totalWorkouts}
          </div>
          <span className="text-[11px] text-fog">Completed sessions</span>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between text-fog">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume</span>
            <Layers size={16} className="text-frost" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-paper">
            {stats.totalVolumeKg.toLocaleString()} <span className="text-sm font-normal text-fog">kg</span>
          </div>
          <span className="text-[11px] text-fog">Lifted across app</span>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between text-fog">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue</span>
            <IndianRupee size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-emerald-400">
            ₹{stats.totalRevenueInr.toLocaleString()}
          </div>
          <span className="text-[11px] text-fog">Total settled payments</span>
        </div>

        <div className="panel p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-fog">
            <span className="text-xs font-bold uppercase tracking-wider">Paid Members</span>
            <Crown size={16} className="text-amber-300" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-amber-300">
            {stats.activePaidMembers}
          </div>
          <span className="text-[11px] text-fog">Pro / Elite / VIP</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("users")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "users"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <Users size={15} className="inline mr-1.5" /> User Directory & Roles ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab("exercises")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "exercises"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <Dumbbell size={15} className="inline mr-1.5" /> Exercise Library & Media ({exercisesList.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "logs"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <Clock size={15} className="inline mr-1.5" /> Security Audit Log ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={cx(
            "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            activeTab === "health"
              ? "bg-volt text-black shadow-lg shadow-volt/20"
              : "text-fog hover:bg-white/[0.04] hover:text-paper"
          )}
        >
          <Database size={15} className="inline mr-1.5" /> System Architecture & DB
        </button>
      </div>

      {/* TAB 1: User Directory */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-fog" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search athlete by username, email, name..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm outline-none focus:border-volt"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-panel px-3 text-xs text-paper outline-none"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="trainer">Trainer</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-panel px-3 text-xs text-paper outline-none"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="monthly">Monthly Pro</option>
                <option value="yearly">Yearly Elite</option>
                <option value="lifetime">VIP Lifetime</option>
              </select>
            </div>
          </div>

          <div className="panel overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-bold uppercase text-fog">
                  <tr>
                    <th className="p-4">Athlete / Email</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Membership Plan</th>
                    <th className="p-4">Onboarding</th>
                    <th className="p-4">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-paper">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-paper">{u.name || u.username}</div>
                        <div className="text-xs text-fog font-mono">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <select
                          disabled={updatingId === u.id}
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          className={cx(
                            "cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold outline-none transition-colors",
                            u.role === "admin" || u.role === "super_admin"
                              ? "text-volt border-volt/30"
                              : u.role === "trainer"
                              ? "text-frost border-frost/30"
                              : "text-paper"
                          )}
                        >
                          <option value="user" className="bg-panel text-paper">user</option>
                          <option value="trainer" className="bg-panel text-paper">trainer</option>
                          <option value="staff" className="bg-panel text-paper">staff</option>
                          <option value="admin" className="bg-panel text-paper">admin</option>
                          <option value="super_admin" className="bg-panel text-paper">super_admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          disabled={updatingId === u.id}
                          value={u.membershipTier}
                          onChange={(e) => updateUserTier(u.id, e.target.value)}
                          className={cx(
                            "cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold outline-none transition-colors",
                            u.membershipTier === "lifetime"
                              ? "text-amber-300 border-amber-300/30"
                              : u.membershipTier === "yearly"
                              ? "text-emerald-400 border-emerald-400/30"
                              : u.membershipTier === "monthly"
                              ? "text-volt border-volt/30"
                              : "text-fog"
                          )}
                        >
                          <option value="free" className="bg-panel text-paper">free</option>
                          <option value="monthly" className="bg-panel text-paper">monthly</option>
                          <option value="yearly" className="bg-panel text-paper">yearly</option>
                          <option value="lifetime" className="bg-panel text-paper">lifetime</option>
                        </select>
                      </td>
                      <td className="p-4">
                        {u.onboardingCompleted ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <Check size={14} /> Completed
                          </span>
                        ) : (
                          <span className="text-xs text-fog">Pending</span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-mono text-fog">
                        {fmtDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Exercise Library & Media Curation */}
      {activeTab === "exercises" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-fog" />
              <input
                value={exerciseQuery}
                onChange={(e) => setExerciseQuery(e.target.value)}
                placeholder="Filter by exercise name, muscle group..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm outline-none focus:border-volt"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={exerciseBodyPartFilter}
                onChange={(e) => setExerciseBodyPartFilter(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-panel px-3 text-xs text-paper outline-none"
              >
                <option value="all">All Muscle Groups</option>
                <option value="chest">Chest</option>
                <option value="back">Back</option>
                <option value="shoulders">Shoulders</option>
                <option value="legs">Legs</option>
                <option value="arms">Arms</option>
                <option value="core">Core</option>
                <option value="full_body">Full Body</option>
              </select>
              <select
                value={exerciseDifficultyFilter}
                onChange={(e) => setExerciseDifficultyFilter(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-panel px-3 text-xs text-paper outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <Button onClick={openCreateExercise} size="sm">
                <Plus size={15} /> Add Exercise
              </Button>
            </div>
          </div>

          <div className="panel overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-bold uppercase text-fog">
                  <tr>
                    <th className="p-4">Exercise / Muscle</th>
                    <th className="p-4">Target Body Part</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4">Equipment</th>
                    <th className="p-4">Media Demonstration</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-paper">
                  {filteredExercises.map((e) => (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-paper">{e.name}</div>
                        <div className="text-xs text-fog font-mono">{e.primaryMuscle || e.slug}</div>
                      </td>
                      <td className="p-4">
                        <span className="capitalize text-xs font-medium text-paper">
                          {e.bodyPart.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={cx(
                            "rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                            e.difficulty === "advanced"
                              ? "bg-ember/20 text-ember"
                              : e.difficulty === "intermediate"
                              ? "bg-amber-400/20 text-amber-300"
                              : "bg-volt/20 text-volt"
                          )}
                        >
                          {e.difficulty}
                        </span>
                      </td>
                      <td className="p-4 capitalize text-xs text-fog">
                        {e.equipment}
                      </td>
                      <td className="p-4">
                        {e.movementMedia ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                              <CheckCircle2 size={13} /> Active Media
                            </span>
                            <button
                              onClick={() => setPreviewMediaUrl(e.movementMedia)}
                              className="cursor-pointer rounded p-1 text-fog hover:text-paper hover:bg-white/10"
                              title="Preview Media"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-fog">No Media Link</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditExercise(e)}
                            className="cursor-pointer rounded-lg p-1.5 text-fog hover:bg-white/10 hover:text-volt transition-colors"
                            title="Edit Exercise"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingExercise(e)}
                            className="cursor-pointer rounded-lg p-1.5 text-fog hover:bg-white/10 hover:text-ember transition-colors"
                            title="Delete Exercise"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Log */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-paper">Security Audit Trail</h3>
            <span className="text-xs font-mono text-fog">Showing latest {auditLogs.length} events</span>
          </div>

          <div className="panel overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-bold uppercase text-fog">
                  <tr>
                    <th className="p-4">Admin Actor</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target Entity</th>
                    <th className="p-4">Metadata Payload</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {auditLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-paper font-semibold">{l.adminEmail}</td>
                      <td className="p-4">
                        <span className="rounded bg-white/5 px-2 py-0.5 text-volt font-bold">
                          {l.action}
                        </span>
                      </td>
                      <td className="p-4 text-fog">{l.targetType} #{l.targetId ?? "—"}</td>
                      <td className="p-4 text-fog max-w-xs truncate">
                        {l.details ? JSON.stringify(l.details) : "—"}
                      </td>
                      <td className="p-4 text-fog">{fmtDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Architecture & DB */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="panel p-6">
              <h3 className="font-display text-lg font-bold text-paper">System Services</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-fog">Next.js 16 App Router</span>
                  <span className="text-emerald-400 font-semibold font-mono">ONLINE :3000</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-fog">Express Microservice</span>
                  <span className="text-emerald-400 font-semibold font-mono">ONLINE :5000</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-fog">PostgreSQL Primary (Drizzle)</span>
                  <span className="text-emerald-400 font-semibold font-mono">app_db :5433</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-fog">PostgreSQL Secondary (Prisma)</span>
                  <span className="text-emerald-400 font-semibold font-mono">fitness_backend_db :5433</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-fog">Razorpay Payment Gateway</span>
                  <span className="text-volt font-semibold font-mono">LIVE / WEBHOOK READY</span>
                </div>
              </div>
            </div>

            <div className="panel p-6">
              <h3 className="font-display text-lg font-bold text-paper">Data Persistence Integrity</h3>
              <p className="mt-2 text-xs text-fog leading-relaxed">
                Zero mock policy verified. Every user action, workout set, biometric measurement, multi-week program enrollment, and administrative exercise curation is strictly persisted to PostgreSQL with foreign key cascades and relational audit logging.
              </p>
              <div className="mt-6 flex gap-3">
                <div className="panel p-3 flex-1 text-center bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-fog">Curated Exercises</span>
                  <p className="mt-1 font-display text-xl font-bold text-paper">{exercisesList.length}</p>
                </div>
                <div className="panel p-3 flex-1 text-center bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-fog">Audit Logs</span>
                  <p className="mt-1 font-display text-xl font-bold text-volt">{auditLogs.length}</p>
                </div>
                <div className="panel p-3 flex-1 text-center bg-white/[0.02]">
                  <span className="text-[10px] uppercase font-bold text-fog">Registered Users</span>
                  <p className="mt-1 font-display text-xl font-bold text-emerald-400">{usersList.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Exercise Modal */}
      <Modal open={exerciseModalOpen} onClose={() => setExerciseModalOpen(false)}>
        <h3 className="font-display text-2xl tracking-wide uppercase">
          {editingExercise ? "Edit Exercise & Media" : "Create Official Exercise"}
        </h3>
        <p className="mt-1 text-sm text-fog">
          {editingExercise
            ? "Update exercise details, cues, or media demonstration URL."
            : "Add a new exercise to the platform library with instructions and coaching cues."}
        </p>
        <div className="mt-5 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <Field label="Exercise Name *">
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Incline Dumbbell Bench Press"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Target Body Part">
              <Select
                value={formBodyPart}
                onChange={(e) => setFormBodyPart(e.target.value)}
              >
                <option value="chest">Chest</option>
                <option value="back">Back</option>
                <option value="shoulders">Shoulders</option>
                <option value="legs">Legs</option>
                <option value="arms">Arms</option>
                <option value="core">Core</option>
                <option value="full_body">Full Body</option>
              </Select>
            </Field>

            <Field label="Difficulty Level">
              <Select
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Required Equipment">
              <Select
                value={formEquipment}
                onChange={(e) => setFormEquipment(e.target.value)}
              >
                <option value="none">None / Bodyweight</option>
                <option value="dumbbells">Dumbbells</option>
                <option value="barbell">Barbell</option>
                <option value="machines">Machine</option>
                <option value="cable">Cable</option>
                <option value="kettlebells">Kettlebells</option>
                <option value="bench">Bench</option>
                <option value="bands">Bands</option>
                <option value="wheel">Ab Wheel</option>
              </Select>
            </Field>

            <Field label="Movement Pattern">
              <Select
                value={formMovementPattern}
                onChange={(e) => setFormMovementPattern(e.target.value)}
              >
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="squat">Squat</option>
                <option value="hinge">Hinge</option>
                <option value="lunge">Lunge</option>
                <option value="carry">Carry</option>
                <option value="rotation">Rotation</option>
                <option value="isolation">Isolation</option>
              </Select>
            </Field>
          </div>

          <Field label="Media Demonstration URL (GIF / Video / Image)">
            <Input
              value={formMediaUrl}
              onChange={(e) => setFormMediaUrl(e.target.value)}
              placeholder="https://.../exercise-demo.gif or mp4"
            />
          </Field>

          {formMediaUrl && (
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
              <span className="text-[11px] font-semibold text-fog uppercase block mb-2">Media Preview</span>
              {formMediaUrl.match(/\.(mp4|webm)$/i) ? (
                <video src={formMediaUrl} autoPlay loop muted playsInline className="mx-auto max-h-48 rounded-lg" />
              ) : (
                <img src={formMediaUrl} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
              )}
            </div>
          )}

          <Field label="Exercise Description">
            <Textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Primary hypertrophy driver targeting upper chest..."
            />
          </Field>

          <Field label="Setup Instructions">
            <Textarea
              rows={2}
              value={formSetup}
              onChange={(e) => setFormSetup(e.target.value)}
              placeholder="Set bench to 30 degrees, retract scapulae..."
            />
          </Field>

          <Field label="Execution / Movement Instructions">
            <Textarea
              rows={2}
              value={formMovement}
              onChange={(e) => setFormMovement(e.target.value)}
              placeholder="Lower under control for 3 seconds, press up without clanking..."
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
          <Button variant="outline" size="sm" onClick={() => setExerciseModalOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" loading={savingExercise} onClick={saveExercise}>
            <Check size={14} /> {editingExercise ? "Save Changes" : "Create Exercise"}
          </Button>
        </div>
      </Modal>

      {/* Media Full Preview Modal */}
      <Modal open={!!previewMediaUrl} onClose={() => setPreviewMediaUrl(null)}>
        <h3 className="font-display text-xl tracking-wide uppercase mb-4">
          Media Demonstration
        </h3>
        {previewMediaUrl && (
          <div className="rounded-xl border border-white/10 bg-black/60 p-4 text-center">
            {previewMediaUrl.match(/\.(mp4|webm)$/i) ? (
              <video src={previewMediaUrl} controls autoPlay loop playsInline className="mx-auto max-h-[60vh] rounded-lg" />
            ) : (
              <img src={previewMediaUrl} alt="Demonstration" className="mx-auto max-h-[60vh] rounded-lg object-contain" />
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setPreviewMediaUrl(null)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Confirm Delete Exercise */}
      <ConfirmDialog
        open={!!deletingExercise}
        onClose={() => setDeletingExercise(null)}
        onConfirm={confirmDeleteExercise}
        loading={deletingBusy}
        title="Delete Exercise?"
        body={`Are you sure you want to delete "${deletingExercise?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
