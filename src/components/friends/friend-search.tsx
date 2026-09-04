"use client";

import { useActionState } from "react";
import { Search, UserPlus } from "lucide-react";
import { searchUserByUsernameAction, sendFriendRequestAction, type SearchResult } from "@/lib/actions/friends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: SearchResult = { error: null };

export function FriendSearch() {
  const [state, formAction, pending] = useActionState(searchUserByUsernameAction, initialState);

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <form action={formAction} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="username"
            placeholder="Buscar por username exacto..."
            className="pl-8"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Buscar"}
        </Button>
      </form>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.profile && (
        <div className="flex items-center gap-3 rounded-xl border bg-surface p-3">
          <Avatar className="h-10 w-10">
            {state.profile.avatarUrl && <AvatarImage src={state.profile.avatarUrl} />}
            <AvatarFallback>{state.profile.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{state.profile.displayName}</p>
            <p className="text-sm text-muted-foreground">
              @{state.profile.username} · Nivel {state.profile.level}
            </p>
          </div>
          <form action={sendFriendRequestAction.bind(null, state.profile.id)}>
            <Button type="submit" size="sm">
              <UserPlus className="h-3.5 w-3.5" />
              Enviar solicitud
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
