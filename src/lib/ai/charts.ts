// A read-only counterpart to proposals.ts: a tool can attach a small chart
// payload to its result so the chat can render an actual graph instead of
// just numbers in prose. Same mechanism as __proposal — stripped out of
// what the model sees, surfaced to the UI as its own stream event.

export type ExerciseProgressChart = {
  kind: "exercise_progress";
  exerciseName: string;
  exerciseSlug: string;
  points: { date: string; e1rm: number }[];
  changePct: number | null;
};

export type AIChart = ExerciseProgressChart;
