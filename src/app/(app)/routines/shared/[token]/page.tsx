import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { forkSharedTemplateAction } from "@/lib/actions/routines";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Reached either by pasting a copied share link, or from "Ver" on a routine
// a friend sent in-app — same destination either way. The preview comes
// from a token-gated RPC (see migration routine_sharing) rather than a
// direct table read, since the visitor generally doesn't own this template
// and it usually isn't public.
export default async function SharedRoutinePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await requireProfile();

  const supabase = await createClient();
  const { data } = await supabase
    .rpc("get_shared_template_preview", { p_token: token })
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/routines" />
      <Card className="fade-up">
        <CardHeader>
          <CardTitle>{data.name}</CardTitle>
          <CardDescription>Compartida por {data.owner_display_name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ListChecks className="h-4 w-4" />
            {data.day_count} día{data.day_count === 1 ? "" : "s"} · {data.exercise_count} ejercicio
            {data.exercise_count === 1 ? "" : "s"}
          </p>
          <form action={forkSharedTemplateAction.bind(null, token)}>
            <Button type="submit" className="w-full">
              Añadir a mis rutinas
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
