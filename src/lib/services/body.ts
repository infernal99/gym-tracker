import "server-only";
import { createClient } from "@/lib/supabase/server";
import { MEASUREMENT_COLUMNS, type MeasurementEntry } from "@/lib/body-measurements";

export type { MeasurementEntry };
export { MEASUREMENT_COLUMNS };

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
    neckCm: r.neck_cm,
    chestCm: r.chest_cm,
    waistCm: r.waist_cm,
    hipCm: r.hip_cm,
    armLeftCm: r.arm_left_cm,
    armRightCm: r.arm_right_cm,
    forearmLeftCm: r.forearm_left_cm,
    forearmRightCm: r.forearm_right_cm,
    thighLeftCm: r.thigh_left_cm,
    thighRightCm: r.thigh_right_cm,
    calfLeftCm: r.calf_left_cm,
    calfRightCm: r.calf_right_cm,
  }));
}


