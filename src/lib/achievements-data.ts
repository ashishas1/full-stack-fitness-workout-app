export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  icon: "flame" | "zap" | "star" | "dumbbell" | "trophy" | "award" | "crown";
  target: number;
  metric: "workouts" | "streak" | "volume" | "prs";
};

export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "first_workout",
    title: "First Blood",
    description: "Completed your first live workout session.",
    icon: "flame",
    target: 1,
    metric: "workouts",
  },
  {
    key: "streak_3",
    title: "Momentum Builder",
    description: "Trained 3 consecutive days.",
    icon: "zap",
    target: 3,
    metric: "streak",
  },
  {
    key: "streak_7",
    title: "Consistency Master",
    description: "Maintained a 7-day training streak.",
    icon: "star",
    target: 7,
    metric: "streak",
  },
  {
    key: "volume_10k",
    title: "10-Ton Club",
    description: "Lifted a cumulative 10,000 kg across workouts.",
    icon: "dumbbell",
    target: 10000,
    metric: "volume",
  },
  {
    key: "first_pr",
    title: "Record Breaker",
    description: "Smashed your first personal record.",
    icon: "trophy",
    target: 1,
    metric: "prs",
  },
  {
    key: "workouts_10",
    title: "Decathlete",
    description: "Completed 10 total workout sessions.",
    icon: "award",
    target: 10,
    metric: "workouts",
  },
  {
    key: "workouts_25",
    title: "Iron Dedicated",
    description: "Completed 25 total workout sessions.",
    icon: "crown",
    target: 25,
    metric: "workouts",
  },
];
