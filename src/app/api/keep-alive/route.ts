import { createClient } from "@/lib/supabase/server";

// Supabase's free plan pauses a project after about a week without database
// activity, and a paused project leaves the whole app spinning on load —
// every page asks Supabase who you are first. Vercel calls this once a day
// (see vercel.json) so a quiet week can't put the app to sleep.
//
// It has to run a real query: the request needs to reach Postgres, not just
// the API gateway or the auth service. It reads a public reference table and
// returns nothing about any user.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel sends this header on cron calls when CRON_SECRET is set in the
  // project, which keeps anyone else from poking the endpoint. Without the
  // variable it stays open, which is harmless given what it does.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("muscle_groups")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("keep-alive query failed", error);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true, at: new Date().toISOString() });
}
