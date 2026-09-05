import { createClient } from "@/lib/supabase/server";
import { checkAIAvailable } from "@/lib/ai/service";
import { countMessagesToday } from "@/lib/services/ai-chat";
import { DAILY_MESSAGE_LIMIT } from "@/lib/ai/limits";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [available, usedToday] = await Promise.all([
    checkAIAvailable(),
    user ? countMessagesToday(user.id) : Promise.resolve(0),
  ]);

  return Response.json({ available, usedToday, dailyLimit: DAILY_MESSAGE_LIMIT });
}
