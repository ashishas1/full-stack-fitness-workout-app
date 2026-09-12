import crypto from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { authSessions, users } from "@/db/schema";

const COOKIE_NAME = "sf_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const ref = Buffer.from(hash, "hex");
  return test.length === ref.length && crypto.timingSafeEqual(test, ref);
}

export type SessionUser = {
  id: number;
  username: string;
  name: string | null;
  email: string;
  role: string;
  onboardingCompleted: boolean;
  goal: string;
  primaryGoal: string;
  level: string;
  membershipTier: string;
  membershipExpiresAt: Date | null;
  targetWorkoutsPerWeek: number;
  avatarUrl: string | null;
};

export async function createSession(userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(authSessions).values({ token, userId, expiresAt });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(authSessions).where(eq(authSessions.token, token));
  }
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      onboardingCompleted: users.onboardingCompleted,
      goal: users.goal,
      primaryGoal: users.primaryGoal,
      level: users.level,
      membershipTier: users.membershipTier,
      membershipExpiresAt: users.membershipExpiresAt,
      trainingDaysPerWeek: users.trainingDaysPerWeek,
      avatarUrl: users.avatarUrl,
    })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(
      and(eq(authSessions.token, token), gt(authSessions.expiresAt, new Date()))
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  let activeTier = row.membershipTier ?? "free";
  if (
    activeTier !== "free" &&
    activeTier !== "lifetime" &&
    row.membershipExpiresAt &&
    new Date(row.membershipExpiresAt).getTime() < Date.now()
  ) {
    activeTier = "free";
    // Sync database asynchronously
    await db
      .update(users)
      .set({ membershipTier: "free" })
      .where(eq(users.id, row.id));
  }

  return {
    id: row.id,
    username: row.username,
    name: row.name || row.username,
    email: row.email,
    role: row.role || "user",
    onboardingCompleted: Boolean(row.onboardingCompleted),
    goal: row.goal,
    primaryGoal: row.primaryGoal || row.goal || "build_muscle",
    level: row.level,
    membershipTier: activeTier,
    membershipExpiresAt: row.membershipExpiresAt,
    targetWorkoutsPerWeek: row.trainingDaysPerWeek || 4,
    avatarUrl: row.avatarUrl,
  };
}
