import { checkAIAvailable } from "@/lib/ai/service";

export async function GET() {
  const available = await checkAIAvailable();
  return Response.json({ available });
}
