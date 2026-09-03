import { Check, Flame, Users, X } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listFriends, listIncomingRequests, listOutgoingRequests } from "@/lib/services/friends";
import {
  respondFriendRequestAction,
  cancelFriendRequestAction,
  removeFriendAction,
} from "@/lib/actions/friends";
import { FriendSearch } from "@/components/friends/friend-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function FriendsPage() {
  const profile = await requireProfile();
  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(profile.id),
    listIncomingRequests(profile.id),
    listOutgoingRequests(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight fade-up">Amigos</h1>

      <div className="fade-up [animation-delay:40ms]">
        <FriendSearch />
      </div>

      {incoming.length > 0 && (
        <div className="space-y-2 fade-up [animation-delay:80ms]">
          <p className="stat-label">Solicitudes recibidas</p>
          {incoming.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <Avatar className="h-10 w-10">
                {r.profile.avatarUrl && <AvatarImage src={r.profile.avatarUrl} />}
                <AvatarFallback>{r.profile.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.profile.displayName}</p>
                <p className="text-sm text-muted-foreground">@{r.profile.username}</p>
              </div>
              <form action={respondFriendRequestAction.bind(null, r.id, true)}>
                <Button type="submit" size="icon-sm" variant="ghost">
                  <Check className="h-4 w-4 text-success" />
                </Button>
              </form>
              <form action={respondFriendRequestAction.bind(null, r.id, false)}>
                <Button type="submit" size="icon-sm" variant="ghost">
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="space-y-2 fade-up [animation-delay:100ms]">
          <p className="stat-label">Solicitudes enviadas</p>
          {outgoing.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <Avatar className="h-10 w-10">
                {r.profile.avatarUrl && <AvatarImage src={r.profile.avatarUrl} />}
                <AvatarFallback>{r.profile.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.profile.displayName}</p>
                <p className="text-sm text-muted-foreground">Pendiente</p>
              </div>
              <form action={cancelFriendRequestAction.bind(null, r.id)}>
                <Button type="submit" size="sm" variant="outline">
                  Cancelar
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 fade-up [animation-delay:140ms]">
        <p className="stat-label">
          {friends.length} amigo{friends.length === 1 ? "" : "s"}
        </p>
        {friends.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Todavía no tienes amigos añadidos.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="divide-y divide-border overflow-hidden py-0">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-11 w-11">
                  {f.avatarUrl && <AvatarImage src={f.avatarUrl} />}
                  <AvatarFallback>{f.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{f.displayName}</p>
                  <p className="text-sm text-muted-foreground">Nivel {f.level}</p>
                </div>
                {f.currentStreak > 0 && (
                  <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-primary" />
                    {f.currentStreak}d
                  </span>
                )}
                <form action={removeFriendAction.bind(null, f.id)}>
                  <Button type="submit" size="icon-sm" variant="ghost">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </form>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
