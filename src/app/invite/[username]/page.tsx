import Link from "next/link";
import { UserCheck, UserPlus, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/profile";
import { usernameSearchSchema } from "@/lib/validation/friends";
import { sendFriendRequestAction } from "@/lib/actions/friends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Public, unauthenticated-reachable route (see PUBLIC_PATHS in
// lib/supabase/middleware.ts). Deliberately does no DB read at all for a
// signed-out visitor — the username in the URL is shown as-is, nothing about
// that account is looked up until the visitor has logged in themselves.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          G
        </div>
        <span className="text-lg font-bold tracking-tight">Gym Tracker</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const parsedUsername = usernameSearchSchema.safeParse({ username: rawUsername });

  if (!parsedUsername.success) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Enlace no válido</CardTitle>
            <CardDescription>Este enlace de invitación está mal formado.</CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }
  const username = parsedUsername.data.username;

  const viewer = await getCurrentProfile();

  if (!viewer) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Te han invitado a Gym Tracker</CardTitle>
            <CardDescription>@{username} quiere entrenar contigo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              render={<Link href={`/login?redirect=${encodeURIComponent(`/invite/${username}`)}`} />}
            >
              Inicia sesión para añadirlo
            </Button>
            <Button variant="outline" className="w-full" render={<Link href="/register" />}>
              Crear una cuenta
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (username === viewer.username) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Este es tu propio enlace</CardTitle>
            <CardDescription>Compártelo con quien quieras añadir, no contigo mismo.</CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  const supabase = await createClient();
  // Excludes the caller themselves by design, so a self-invite is handled
  // above instead of relying on this ever matching.
  const { data: matches } = await supabase.rpc("find_user_by_username", {
    p_username: username,
  });
  const target = matches?.[0] ?? null;

  if (!target) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Usuario no encontrado</CardTitle>
            <CardDescription>@{username} no existe o te ha bloqueado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" render={<Link href="/friends" />}>
              Ir a Amigos
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const [{ data: friendship }, { data: incomingRequest }, { data: outgoingRequest }] = await Promise.all([
    supabase
      .from("friendships")
      .select("id")
      .or(
        `and(user_id_a.eq.${viewer.id},user_id_b.eq.${target.id}),and(user_id_a.eq.${target.id},user_id_b.eq.${viewer.id})`,
      )
      .maybeSingle(),
    supabase
      .from("friend_requests")
      .select("id")
      .eq("sender_id", target.id)
      .eq("receiver_id", viewer.id)
      .eq("status", "pending")
      .maybeSingle(),
    supabase
      .from("friend_requests")
      .select("id")
      .eq("sender_id", viewer.id)
      .eq("receiver_id", target.id)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  return (
    <Shell>
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-16 w-16">
            {target.avatar_url && <AvatarImage src={target.avatar_url} />}
            <AvatarFallback>{target.display_name[0]}</AvatarFallback>
          </Avatar>
          <CardTitle>{target.display_name}</CardTitle>
          <CardDescription>
            @{target.username} · Nivel {target.level}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {friendship ? (
            <div className="space-y-2 text-center">
              <p className="flex items-center justify-center gap-1.5 text-sm text-success">
                <UserCheck className="h-4 w-4" /> Ya sois amigos
              </p>
              <Button variant="outline" className="w-full" render={<Link href="/friends" />}>
                Ir a Amigos
              </Button>
            </div>
          ) : incomingRequest ? (
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Te ha enviado una solicitud de amistad.</p>
              <Button className="w-full" render={<Link href="/friends" />}>
                Responder en Amigos
              </Button>
            </div>
          ) : outgoingRequest ? (
            <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
              <UserX className="h-4 w-4" /> Ya le has enviado una solicitud, esperando respuesta.
            </p>
          ) : (
            <form action={sendFriendRequestAction.bind(null, target.id)}>
              <Button type="submit" className="w-full">
                <UserPlus className="h-4 w-4" />
                Enviar solicitud de amistad
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}
