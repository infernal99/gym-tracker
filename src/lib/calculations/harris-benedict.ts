import type { Database } from "@/types/database.types";

type Sex = Database["public"]["Enums"]["biological_sex"];
export type ActivityLevel = Database["public"]["Enums"]["activity_level"];

export const activityLevelValues: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

export const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: "Sedentario (poco o nada de ejercicio)",
  light: "Ligero (ejercicio 1-3 días/semana)",
  moderate: "Moderado (ejercicio 3-5 días/semana)",
  active: "Activo (ejercicio 6-7 días/semana)",
  very_active: "Muy activo (ejercicio intenso a diario o trabajo físico)",
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function ageFromDateOfBirth(dateOfBirth: string, now = new Date()): number | null {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age;
}

export interface HarrisBenedictInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
}

export interface HarrisBenedictResult {
  bmr: number;
  tdee: number;
  calorieTargets: {
    lose: number;
    maintain: number;
    gain: number;
  };
}

/** Revised Harris-Benedict equation (Roza & Shizgal, 1984). */
export function calculateHarrisBenedict(input: HarrisBenedictInput): HarrisBenedictResult {
  const { sex, weightKg, heightCm, age, activityLevel } = input;

  const bmr =
    sex === "female"
      ? 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age
      : 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;

  const tdee = bmr * activityMultipliers[activityLevel];

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTargets: {
      lose: Math.round(tdee - 500),
      maintain: Math.round(tdee),
      gain: Math.round(tdee + 300),
    },
  };
}
