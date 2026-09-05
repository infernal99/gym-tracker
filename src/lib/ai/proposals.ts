import { goalTypeValues } from "@/lib/validation/goals";

// A proposal is something the AI wants to write, rendered as a card in the
// chat for the user to confirm. The AI never writes on its own: the tools
// only build and validate these, and the actual insert happens in a server
// action triggered by the user tapping the card's button.
//
// The payload round-trips through the client, so every server action that
// applies one re-validates it from scratch (ownership, real exercise ids,
// schema bounds) instead of trusting what comes back.

export type ProposalExercise = {
  exerciseId: string;
  exerciseName: string;
  muscleGroupName: string | null;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
};

export type ProposalDay = {
  name: string;
  exercises: ProposalExercise[];
};

export type RoutineProposal = {
  kind: "routine";
  name: string;
  description: string | null;
  /** Whether the user already asked for it to become the active routine. */
  setActive: boolean;
  days: ProposalDay[];
  /** Things worth telling the user before they confirm (e.g. a similar routine already exists). */
  warnings: string[];
};

export type GoalProposal = {
  kind: "goal";
  type: (typeof goalTypeValues)[number];
  title: string;
  exerciseId: string | null;
  exerciseName: string | null;
  currentValue: number | null;
  targetValue: number;
  unit: string;
};

export type RoutineChangeProposal = {
  kind: "routine_change";
  templateId: string;
  templateName: string;
  dayId: string;
  dayName: string;
  add: ProposalExercise[];
  remove: { rowId: string; exerciseName: string }[];
};

export type AIProposal = RoutineProposal | GoalProposal | RoutineChangeProposal;

export function countProposalStats(proposal: RoutineProposal) {
  const exercises = proposal.days.reduce((sum, d) => sum + d.exercises.length, 0);
  const sets = proposal.days.reduce(
    (sum, d) => sum + d.exercises.reduce((s, e) => s + e.targetSets, 0),
    0,
  );
  return { days: proposal.days.length, exercises, sets };
}
