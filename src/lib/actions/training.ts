"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { recordChallengeWinsForUser } from "@/lib/services/group-challenges";
import { logDayRange, logTimestamp, todayKey } from "@/lib/date-utils";
import type { Database } from "@/types/database.types";

// Opens the log for one routine day on one date — creating it the first time
// — and takes you to it. There's no "live" session any more: a log is just
// the sets you did on a given day, written down whenever suits you and
// editable forever after. Opening the same day twice on the same date lands
// on the existing log rather than starting a second one.
//
// dayId comes from the caller (the "Hoy" screen's suggestion, or one of the
// other days picked by hand) or, from the "registrar otro día" form, from
// the form itself along with the date. Bound form actions get the FormData
// as their last argument, which is how that date arrives.
// countsTowardSequence controls whether this log becomes the reference
// point for future "next day" suggestions.
export async function openLogAction(
  dayId: string | null,
  countsTowardSequence: boolean,
  formData?: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (!profile.active_template_id) redirect("/my-routine/choose");

  const resolvedDayId = dayId ?? String(formData?.get("dayId") ?? "");
  const today = todayKey();
  const requestedDate = String(formData?.get("date") ?? "");
  // Anything that isn't a plain date, or is in the future, means today —
  // you write down what you did, not what you're going to do.
  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate <= today ? requestedDate : today;

  const { data: day } = await supabase
    .from("workout_template_days")
    .select("*")
    .eq("id", resolvedDayId)
    .maybeSingle();
  if (!day || day.is_rest_day) redirect("/my-routine");

  const [dayStart, dayEnd] = logDayRange(date);
  const [{ data: existing }, { data: templateExercises }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("template_day_id", day.id)
      .gte("started_at", dayStart)
      .lt("started_at", dayEnd)
      .order("started_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_template_exercises")
      .select("*")
      .eq("template_day_id", day.id)
      .order("order_index"),
  ]);
  if (existing) redirect(`/train/${existing.id}`);

  // completed_at stays empty until the first set goes in: a log with
  // nothing in it isn't a workout, and everything that counts workouts
  // (streak, totals, achievements) goes by completed_at.
  const { data: session } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: profile.id,
      template_id: day.template_id,
      template_day_id: day.id,
      name: day.name,
      started_at: logTimestamp(date),
      counts_toward_sequence: countsTowardSequence,
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
        is_unilateral: ex.is_unilateral,
      })),
    );
  }

  redirect(`/train/${session.id}`);
}

// Manually realign "next suggested day" without training right now.
export async function setSequenceAnchorAction(dayId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ sequence_anchor_day_id: dayId })
    .eq("id", profile.id);

  revalidatePath("/dashboard");
  revalidatePath("/my-routine");
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
  let beatARecord = false;

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
    beatARecord = true;
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
    beatARecord = true;
  }

  // One feed entry per set at most, even if both record types were beaten —
  // that's still a single PR moment from the user's point of view. The
  // exercise name isn't otherwise available here, so it's fetched only on
  // this (rare) path rather than on every set logged.
  if (beatARecord) {
    const { data: exercise } = await supabase.from("exercises").select("name").eq("id", exerciseId).single();
    await supabase.from("activity_feed").insert({
      user_id: userId,
      type: "new_pr",
      related_type: "exercise",
      related_id: exerciseId,
      metadata: { exerciseName: exercise?.name ?? "", weightKg, reps },
    });
  }
}

export async function logSetAction(
  sessionId: string,
  sessionExerciseId: string,
  exerciseId: string,
  setNumber: number,
  side: "both" | "left" | "right",
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

  const [{ data: set }, { data: session }] = await Promise.all([
    supabase
      .from("sets")
      .upsert(
        {
          session_exercise_id: sessionExerciseId,
          set_number: setNumber,
          side,
          weight_kg: parsed.data.weightKg === "" ? null : parsed.data.weightKg,
          reps: parsed.data.reps === "" ? null : parsed.data.reps,
          rir: parsed.data.rir === "" ? null : parsed.data.rir,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "session_exercise_id,set_number,side" },
      )
      .select("id")
      .single(),
    supabase
      .from("workout_sessions")
      .select("name, started_at, completed_at, counts_toward_sequence")
      .eq("id", sessionId)
      .eq("user_id", profile.id)
      .single(),
  ]);
  if (!set || !session) return;

  // Sets can be corrected at any time now, so a record this set held may no
  // longer be true — a typo'd 1000 kg fixed to 100 kg shouldn't stay your
  // best. Its records are dropped and earned again (or not) just below.
  await supabase.from("personal_records").delete().eq("session_set_id", set.id);
  if (parsed.data.weightKg && parsed.data.reps) {
    await checkAndRecordPRs(
      supabase,
      profile.id,
      exerciseId,
      set.id,
      Number(parsed.data.weightKg),
      Number(parsed.data.reps),
    );
  }

  // The first set is what turns a log into a workout: it takes the log's
  // date, shows up in the history and the feed, and moves the routine on.
  if (!session.completed_at) {
    await Promise.all([
      supabase
        .from("workout_sessions")
        .update({ completed_at: session.started_at })
        .eq("id", sessionId),
      // A logged day that counts toward the sequence supersedes any manual
      // realignment — clear it so future suggestions follow this one.
      session.counts_toward_sequence
        ? supabase.from("profiles").update({ sequence_anchor_day_id: null }).eq("id", profile.id)
        : null,
      supabase.from("activity_feed").insert({
        user_id: profile.id,
        type: "workout_completed",
        related_type: "workout_session",
        related_id: sessionId,
        metadata: { sessionName: session.name, volumeKg: 0 },
      }),
    ]);
  }

  // Achievements, milestones, group challenges and the feed entry's volume
  // all follow from the new set, but none of them changes what's on this
  // screen — so they run once the response is on its way instead of
  // holding up the next set.
  after(() => refreshWorkoutSideEffects(supabase, profile.id, sessionId));

  revalidatePath(`/train/${sessionId}`);
  revalidatePath("/dashboard");
}

async function refreshWorkoutSideEffects(
  supabase: SupabaseClient<Database>,
  userId: string,
  sessionId: string,
) {
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("name, total_volume_kg")
    .eq("id", sessionId)
    .single();
  if (session) {
    await supabase
      .from("activity_feed")
      .update({ metadata: { sessionName: session.name, volumeKg: session.total_volume_kg } })
      .eq("type", "workout_completed")
      .eq("related_id", sessionId);
  }
  await supabase.rpc("evaluate_achievements", { p_user_id: userId });
  await supabase.rpc("check_exercise_milestones", { p_user_id: userId });
  await recordChallengeWinsForUser(supabase, userId);
}

export async function deleteSetAction(sessionId: string, setId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("personal_records").delete().eq("session_set_id", setId);
  await supabase.from("sets").delete().eq("id", setId);

  // Take out the last set and the day stops counting as a workout.
  const { count } = await supabase
    .from("sets")
    .select("id, workout_session_exercises!inner(session_id)", { count: "exact", head: true })
    .eq("workout_session_exercises.session_id", sessionId);
  if (count === 0) {
    await Promise.all([
      supabase
        .from("workout_sessions")
        .update({ completed_at: null })
        .eq("id", sessionId)
        .eq("user_id", profile.id),
      supabase
        .from("activity_feed")
        .delete()
        .eq("type", "workout_completed")
        .eq("related_id", sessionId),
    ]);
  } else {
    after(() => refreshWorkoutSideEffects(supabase, profile.id, sessionId));
  }

  revalidatePath(`/train/${sessionId}`);
  revalidatePath("/dashboard");
}

export async function deleteLogAction(sessionId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: sets } = await supabase
    .from("sets")
    .select("id, workout_session_exercises!inner(session_id)")
    .eq("workout_session_exercises.session_id", sessionId);
  const setIds = (sets ?? []).map((s) => s.id);
  if (setIds.length > 0) {
    await supabase.from("personal_records").delete().in("session_set_id", setIds);
  }
  await supabase
    .from("activity_feed")
    .delete()
    .eq("type", "workout_completed")
    .eq("related_id", sessionId);
  await supabase.from("workout_sessions").delete().eq("id", sessionId).eq("user_id", profile.id);
  revalidatePath("/dashboard");
  revalidatePath("/train/history");
  redirect("/train/history");
}
