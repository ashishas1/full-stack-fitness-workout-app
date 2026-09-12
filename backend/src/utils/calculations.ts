/**
 * Calculates Estimated One-Rep Max (1RM) using Epley & Brzycki formulas.
 */
export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;

  // Epley Formula: weight * (1 + reps / 30)
  const epley = weightKg * (1 + reps / 30);

  // Brzycki Formula: weight * (36 / (37 - reps))
  const brzycki = reps < 37 ? weightKg * (36 / (37 - reps)) : epley;

  // Average of both formulas for accuracy
  const average1RM = (epley + brzycki) / 2;
  return Math.round(average1RM * 10) / 10;
}

/**
 * Calculates consecutive day workout streak from an array of workout dates.
 */
export function calculateWorkoutStreak(dates: Date[]): { currentStreak: number; longestStreak: number } {
  if (!dates.length) return { currentStreak: 0, longestStreak: 0 };

  // Format to unique YYYY-MM-DD strings sorted descending
  const uniqueDays = Array.from(
    new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))
  ).sort().reverse();

  if (!uniqueDays.length) return { currentStreak: 0, longestStreak: 0 };

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  // Check if today or yesterday has a workout to consider current streak active
  const hasRecentWorkout = uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr;

  let prevDate: Date | null = null;

  for (let i = 0; i < uniqueDays.length; i++) {
    const currentDate = new Date(uniqueDays[i]);

    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffTime = Math.abs(prevDate.getTime() - currentDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }

    // Capture current streak from the latest chain
    if (i === 0 && hasRecentWorkout) {
      currentStreak = runningStreak;
    } else if (hasRecentWorkout && currentStreak === i) {
      currentStreak = runningStreak;
    }

    prevDate = currentDate;
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

/**
 * Calculates estimated calories burned based on exercise duration, sets, and user body weight.
 */
export function estimateCaloriesBurned(durationMinutes: number, bodyWeightKg: number = 75): number {
  // Moderate-to-vigorous resistance training MET: ~6.0
  const met = 6.0;
  const caloriesPerMinute = (met * 3.5 * bodyWeightKg) / 200;
  return Math.round(caloriesPerMinute * durationMinutes);
}

export const calculateEpley1RM = calculateEstimated1RM;
export const calculateCaloriesBurned = estimateCaloriesBurned;

export function calculateCurrentStreak(dates: Date[]): number {
  return calculateWorkoutStreak(dates).currentStreak;
}

export function calculateLongestStreak(dates: Date[]): number {
  return calculateWorkoutStreak(dates).longestStreak;
}
