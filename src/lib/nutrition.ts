// Расчёт суточных норм по формуле Миффлина-Сан Жеора. Чистые функции, без side-effects.

export type Gender = "male" | "female";
export type Goal = "lose" | "maintain" | "gain";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "high"
  | "veryHigh";

export interface ProfileInput {
  gender: Gender;
  age: number;
  height: number; // см
  weight: number; // кг
  goal: Goal;
  activityLevel: ActivityLevel;
}

export interface DailyTargets {
  calories: number;
  protein: number; // г
  fat: number; // г
  carbs: number; // г
}

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2, // минимум движения
  light: 1.375, // лёгкие нагрузки 1-3 р/нед
  moderate: 1.55, // 3-5 р/нед
  high: 1.725, // 6-7 р/нед
  veryHigh: 1.9, // тяжёлый физический труд / 2 тренировки в день
};

const GOAL_FACTOR: Record<Goal, number> = {
  lose: 0.8, // дефицит 20%
  maintain: 1.0,
  gain: 1.1, // профицит 10%
};

export function calcTargets(p: ProfileInput): DailyTargets {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  const bmr = p.gender === "male" ? base + 5 : base - 161;
  const calories = Math.round(
    bmr * ACTIVITY_FACTOR[p.activityLevel] * GOAL_FACTOR[p.goal],
  );

  // Макросы привязаны к массе тела (защитимый практический дефолт).
  const protein = Math.round(2.0 * p.weight);
  const fat = Math.round(0.9 * p.weight);
  const carbsCalories = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = Math.round(carbsCalories / 4);

  return { calories, protein, fat, carbs };
}
