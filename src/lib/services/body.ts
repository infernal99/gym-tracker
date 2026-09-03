import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface WeightEntry {
  id: string;
  weightKg: number;
  recordedAt: string;
  note: string | null;
}

export async function listWeightEntries(userId: string): Promise<WeightEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("body_weight_entries")
    .select("id, weight_kg, recorded_at, note")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    weightKg: r.weight_kg,
    recordedAt: r.recorded_at,
    note: r.note,
  }));
}

export interface MeasurementEntry {
  id: string;
  recordedAt: string;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  forearmCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
  hipCm: number | null;
}

export async function listMeasurements(userId: string): Promise<MeasurementEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    recordedAt: r.recorded_at,
    waistCm: r.waist_cm,
    chestCm: r.chest_cm,
    armCm: r.arm_cm,
    forearmCm: r.forearm_cm,
    thighCm: r.thigh_cm,
    calfCm: r.calf_cm,
    hipCm: r.hip_cm,
  }));
}
