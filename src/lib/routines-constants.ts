// The sentinel the weekly-calendar UI sends for the always-available
// "Descanso" chip — it isn't tied to a specific day until it's actually
// dropped, since a template may not have a rest day yet. Lives outside
// actions/routines.ts because a "use server" file can only export async
// functions, not plain constants.
export const REST_DAY_SENTINEL = "rest";
