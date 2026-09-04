// Shape of a measurement entry, shared by the server service and the client
// form/chart. Kept out of services/body.ts because that module is
// "server-only" and these lists have to be readable from client components.

/** Measurements that exist once on the body. */
export const SINGLE_MEASUREMENTS = [
  { key: "neckCm", label: "Cuello" },
  { key: "chestCm", label: "Pecho" },
  { key: "waistCm", label: "Cintura" },
  { key: "hipCm", label: "Cadera" },
] as const;

/**
 * Measurements that come in pairs. Stored per side rather than as one number
 * per limb, because "is my left arm keeping up with my right?" is a question
 * a single averaged figure can never answer.
 */
export const PAIRED_MEASUREMENTS = [
  { label: "Brazo", left: "armLeftCm", right: "armRightCm" },
  { label: "Antebrazo", left: "forearmLeftCm", right: "forearmRightCm" },
  { label: "Pierna", left: "thighLeftCm", right: "thighRightCm" },
  { label: "Gemelo", left: "calfLeftCm", right: "calfRightCm" },
] as const;

export type SingleMeasurementKey = (typeof SINGLE_MEASUREMENTS)[number]["key"];
export type PairedMeasurementKey =
  | (typeof PAIRED_MEASUREMENTS)[number]["left"]
  | (typeof PAIRED_MEASUREMENTS)[number]["right"];
export type MeasurementKey = SingleMeasurementKey | PairedMeasurementKey;

export type MeasurementEntry = { id: string; recordedAt: string } & Record<
  MeasurementKey,
  number | null
>;

/** snake_case column for each camelCase key, for reads and writes. */
export const MEASUREMENT_COLUMNS: Record<MeasurementKey, string> = {
  neckCm: "neck_cm",
  chestCm: "chest_cm",
  waistCm: "waist_cm",
  hipCm: "hip_cm",
  armLeftCm: "arm_left_cm",
  armRightCm: "arm_right_cm",
  forearmLeftCm: "forearm_left_cm",
  forearmRightCm: "forearm_right_cm",
  thighLeftCm: "thigh_left_cm",
  thighRightCm: "thigh_right_cm",
  calfLeftCm: "calf_left_cm",
  calfRightCm: "calf_right_cm",
};

/** Every measurement as a flat list, for pickers that treat sides separately. */
export const ALL_MEASUREMENT_FIELDS: { key: MeasurementKey; label: string }[] = [
  ...SINGLE_MEASUREMENTS.map((m) => ({ key: m.key as MeasurementKey, label: m.label })),
  ...PAIRED_MEASUREMENTS.flatMap((m) => [
    { key: m.left as MeasurementKey, label: `${m.label} izq.` },
    { key: m.right as MeasurementKey, label: `${m.label} der.` },
  ]),
];
