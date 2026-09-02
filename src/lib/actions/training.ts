"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { getActiveSession, getNextDayInSequence } from "@/lib/services/training";
import type { Database } from "@/types/database.types";

export async function startWorkoutAction() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const active = await getActiveSession(profile.id);
  if (active) redirect(`/train/${active.id}`);

  if (!profile.active_template_id) redirect("/my-routine/choose");

  const { day } = await getNextDayInSequence(profile.id, profile.active_template_id);
  if (!day || day.is_rest_day) redirect("/my-routine");

  const { data: templateExercises } = await supabase
    .from("workout_template_exercises")
    .select("*")
    .eq("template_day_id", day.id)
    .order("order_index");

  const { data: session } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: profile.id,
      template_id: profile.active_template_id,
      template_day_id: day.id,
      name: day.name,
    })
    .select("id")
    .single();

  if (!session) redirect("/my-routine");

  if (templateExercises && templateExercises.length > 0) {
    await supabase.from("workout_session_exercises").insert(
      templateExercises.map((ex) => ({
        session_id: session.id,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        target_weight_kg: ex.target_weight_kg,
        target_rir: ex.target_rir,
        rest_seconds: ex.rest_seconds,
      })),
    );
  }

  redirect(`/train/${session.id}`);
}

const setSchema = z.object({
  weightKg: z.coerce.number().min(0).max(1000).optional().or(z.literal("")),
  reps: z.coerce.number().int().min(0).max(200).optional().or(z.literal("")),
  rir: z.coerce.number().int().min(0).max(10).optional().or(z.literal("")),
});

// PR detection: a set only counts once it has both weight and reps. We track
// two record types per (user, exercise): heaviest weight lifted for any rep
// count, and best estimated 1RM (Epley: weight * (1 + reps / 30)), which
// rewards strong lighter-weight sets too, not just raw weight moved.
async function checkAndRecordPRs(
  supabase: SupabaseClient<Database>,
  userId: string,
  exerciseId: string,
  setId: string,
  weightKg: number,
  reps: number,
) {
  const { data: bestWeight } = await supabase
    .from("personal_records")
    .select("value")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .eq("record_type", "max_weight")
    .order("value", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!bestWeight || weightKg > bestWeight.value) {
    await supabase.from("personal_records").insert({
      user_id: userId,
      exercise_id: exerciseId,
      record_type: "max_weight",
      value: weightKg,
      weight_kg: weightKg,
      reps,
      session_set_id: setId,
    });
  }

  const estimated1rm = weightKg * (1 + reps / 30);
  const { data: best1rm } = await supabase
    .from("personal_records")
    .select("value")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .eq("record_type", "best_1rm")
    .order("value", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!best1rm || estimated1rm > best1rm.value) {
    await supabase.from("personal_records").insert({
      user_id: userId,
      exercise_id: exerciseId,
      record_type: "best_1rm",
      value: estimated1rm,
      weight_kg: weightKg,
      reps,
      session_set_id: setId,
    });
  }
}

export async function logSetAction(
  sessionId: string,
  sessionExerciseId: string,
  exerciseId: string,
  setNumber: number,
  formData: FormData,
) {
  const parsed = setSchema.safeParse({
    weightKg: formData.get("weightKg") || "",
    reps: formData.get("reps") || "",
    rir: formData.get("rir") || "",
  });
  if (!parsed.success) return;

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: set } = await supabase
    .from("sets")
    .upsert(
      {
        session_exercise_id: sessionExerciseId,
        set_number: setNumber,
        weight_kg: parsed.data.weightKg === "" ? null : parsed.data.weightKg,
        reps: parsed.data.reps === "" ? null : parsed.data.reps,
        rir: parsed.data.rir === "" ? null : parsed.data.rir,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "session_exercise_id,set_number" },
    )
    .select("id")
    .single();

  if (set && parsed.data.weightKg && parsed.data.reps) {
    await checkAndRecordPRs(
      supabase,
      profile.id,
      exerciseId,
      set.id,
      Number(parsed.data.weightKg),
      Number(parsed.data.reps),
    );
  }

  revalidatePath(`/train/${sessionId}`);
}

export async function deleteSetAction(sessionId: string, setId: string) {
  const supabase = await createClient();
  await supabase.from("sets").delete().eq("id", setId);
  revalidatePath(`/train/${sessionId}`);
}

export async function finishWorkoutAction(sessionId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("id", sessionId)
    .single();

  if (!session) redirect("/dashboard");

  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000),
  );

  await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq("id", sessionId);

  revalidatePath("/dashboard");
  revalidatePath("/train/history");
  redirect(`/train/${sessionId}/summary`);
}

export async function cancelWorkoutAction(sessionId: string) {
  const supabase = await createClient();
  await supabase.from("workout_sessions").delete().eq("id", sessionId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
