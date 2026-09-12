/** Rule-based six-pack coach: ranks exercises by goal, level and setting. */

export type SuggestionQuery = {
  goal: string; // shred | define | strength | athletic
  level: string; // beginner | intermediate | advanced
  setting: string; // home | gym
  excludeIds?: number[];
  count?: number;
};

const LEVEL_RANK: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const HOME_OK = new Set(["none", "mat", "weights"]);

const AREA_REASONS: Record<string, string> = {
  upper: "Carves the top blocks of your six-pack",
  lower: "Attacks the stubborn lower-belly overhang",
  obliques: "Chisels the V-line that frames your abs",
  full: "Fires the entire core for maximum density",
};

const GOAL_REASON_BONUS: Record<string, Record<string, string>> = {
  shred: {
    full: "Torches calories while hammering every ab muscle",
    lower: "Burns fat + targets the hardest zone to reveal",
  },
  define: {
    obliques: "Deep-etch the side cuts that complete the look",
    upper: "Pumps the upper bricks for that stacked look",
  },
  strength: {
    full: "Builds an armor-plated midline for heavy lifting",
  },
  athletic: {
    full: "Rotation + bracing power every sport demands",
    obliques: "Rotational strength your sport will thank you for",
  },
};

export type RankedItem<T> = { item: T; reason: string };

export function suggestExercises<
  T extends {
    id: number;
    difficulty: string;
    targetArea: string;
    equipment: string;
    kcalPerMin: number;
  },
>(all: T[], q: SuggestionQuery): RankedItem<T>[] {
  const rank = LEVEL_RANK[q.level] ?? 0;
  const count = q.count ?? 3;
  const exclude = new Set(q.excludeIds ?? []);

  const unlocked = all
    .filter((e) => !exclude.has(e.id))
    .filter((e) => (LEVEL_RANK[e.difficulty] ?? 0) <= rank + 1)
    .filter((e) => q.setting !== "home" || HOME_OK.has(e.equipment));

  const scored = unlocked.map((e) => {
    let s = 0;
    const r = LEVEL_RANK[e.difficulty] ?? 0;
    if (r === rank) s += 6;
    else if (r < rank) s += 2;
    else s += 1; // one level above = stretch goal
    if (q.goal === "shred") {
      if (e.kcalPerMin >= 10) s += 6;
      if (e.targetArea === "full") s += 3;
    }
    if (q.goal === "define") {
      if (e.targetArea === "obliques" || e.targetArea === "upper") s += 3;
      if (e.kcalPerMin <= 8) s += 1;
    }
    if (q.goal === "strength") {
      if (["wheel", "bar", "cable", "bench"].includes(e.equipment)) s += 4;
      if (e.targetArea === "full") s += 2;
    }
    if (q.goal === "athletic") {
      if (e.targetArea === "obliques" || e.targetArea === "full") s += 4;
      if (e.kcalPerMin >= 10) s += 2;
    }
    if (q.setting === "gym" && !HOME_OK.has(e.equipment)) s += 2;
    if (q.setting === "home" && e.equipment === "none") s += 2;
    // deterministic-ish jitter so repeat calls feel alive
    s += ((e.id * 37 + count * 11 + (exclude.size || 0) * 5) % 10) / 10;
    return { e, s };
  });

  scored.sort((a, b) => b.s - a.s);

  // enforce area variety across the final picks
  const picks: T[] = [];
  const seenAreas = new Set<string>();
  for (const { e } of scored) {
    if (picks.length >= count) break;
    if (seenAreas.has(e.targetArea) && picks.length < count) continue;
    seenAreas.add(e.targetArea);
    picks.push(e);
  }
  for (const { e } of scored) {
    if (picks.length >= count) break;
    if (!picks.includes(e)) picks.push(e);
  }
  return picks.slice(0, count).map((item) => ({
    item,
    reason:
      GOAL_REASON_BONUS[q.goal]?.[item.targetArea] ??
      AREA_REASONS[item.targetArea] ??
      "A proven six-pack builder",
  }));
}
