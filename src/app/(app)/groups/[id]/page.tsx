import { notFound } from "next/navigation";
import { Flame, Trophy, Users, Weight, X } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getGroupDetail, listInviteCandidates } from "@/lib/services/groups";
import { listGroupChallenges } from "@/lib/services/group-challenges";
import { listGroupActivity } from "@/lib/services/group-activity";
import { listExercises } from "@/lib/services/exercises";
import { removeMemberAction, leaveGroupAction } from "@/lib/actions/groups";
import { GroupRanking } from "@/components/groups/group-ranking";
import { CreateGroupChallengeDialog } from "@/components/groups/create-group-challenge-dialog";
import { GroupChallengeCard } from "@/components/groups/group-challenge-card";
import { GroupActivityFeed } from "@/components/groups/group-activity-feed";
import { InviteFriendDialog } from "@/components/groups/invite-friend-dialog";
import { SharingSettingsForm } from "@/components/groups/sharing-settings-form";
import { BackButton } from "@/components/ui/back-button";
import { StatTile } from "@/components/ui/stat-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const group = await getGroupDetail(id, profile.id);
  if (!group) notFound();

  const isOwner = group.viewerRole === "owner";
  const candidates = isOwner ? await listInviteCandidates(id, profile.id) : [];
  const [challenges, exercises, activity] = await Promise.all([
    listGroupChallenges(id),
    listExercises(),
    listGroupActivity(id),
  ]);
  const exerciseOptions = exercises.map((e) => ({ id: e.id, name: e.name }));
  const me = group.members.find((m) => m.isMe)!;

  // Group totals only add up figures that are actually shared — a member
  // who hid their volume shouldn't silently count as zero toward the group.
  const sumVisible = (values: (number | null)[]) =>
    values.some((v) => v !== null) ? values.reduce((s: number, v) => s + (v ?? 0), 0) : null;
  const workoutsThisWeek = sumVisible(group.members.map((m) => m.workoutsThisWeek));
  const prsThisWeek = sumVisible(group.members.map((m) => m.prsThisWeek));
  const volumeThisWeekKg = sumVisible(group.members.map((m) => m.volumeThisWeekKg));
  const longestStreak = group.members.reduce(
    (best, m) => (m.longestStreak !== null && m.longestStreak > best ? m.longestStreak : best),
    0,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton fallbackHref="/groups" />

      <div className="flex items-start justify-between gap-3 fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            <p className="text-sm text-muted-foreground">
              {group.members.length} miembro{group.members.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {isOwner && <InviteFriendDialog groupId={group.id} candidates={candidates} />}
      </div>

      {group.description && (
        <p className="text-sm text-muted-foreground fade-up [animation-delay:40ms]">
          {group.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2.5 fade-up [animation-delay:60ms]">
        <StatTile
          icon={Weight}
          label="Entrenamientos"
          value={workoutsThisWeek ?? "—"}
        />
        <StatTile icon={Trophy} label="PRs esta semana" value={prsThisWeek ?? "—"} />
        <StatTile icon={Flame} label="Racha más larga" value={`${longestStreak} d`} />
        <StatTile
          icon={Weight}
          label="Volumen total"
          value={volumeThisWeekKg !== null ? `${Math.round(volumeThisWeekKg).toLocaleString("es-ES")} kg` : "—"}
        />
      </div>

      <Card className="fade-up [animation-delay:100ms]">
        <CardHeader>
          <CardTitle className="text-base">Clasificación</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupRanking members={group.members} />
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:110ms]">
        <CardHeader>
          <CardTitle className="text-base">Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupActivityFeed entries={activity} />
        </CardContent>
      </Card>

      <div className="space-y-3 fade-up [animation-delay:120ms]">
        <div className="flex items-center justify-between">
          <h2 className="stat-label">Retos del grupo</h2>
          {isOwner && <CreateGroupChallengeDialog groupId={group.id} exercises={exerciseOptions} />}
        </div>
        {challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? "Todavía no hay ningún reto en este grupo."
              : "El admin del grupo todavía no ha creado ningún reto."}
          </p>
        ) : (
          <div className="space-y-2">
            {challenges.map((c) => (
              <GroupChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}
      </div>

      <div className="fade-up [animation-delay:140ms]">
        <SharingSettingsForm groupId={group.id} sharing={me.sharing} />
      </div>

      <Card className="fade-up [animation-delay:180ms] py-0">
        <CardHeader className="pt-5">
          <CardTitle className="text-base">Miembros</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {group.members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-10 w-10">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
                <AvatarFallback>{member.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {member.displayName}
                  {member.isMe && <span className="ml-1 text-xs text-primary">(tú)</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.role === "owner" ? "Admin" : "Miembro"}
                </p>
              </div>
              {isOwner && !member.isMe && (
                <form action={removeMemberAction.bind(null, group.id, member.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`¿Quitar a ${member.displayName} del grupo?`}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </ConfirmSubmitButton>
                </form>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!isOwner && (
        <form action={leaveGroupAction.bind(null, group.id)}>
          <ConfirmSubmitButton
            confirmMessage="¿Salir de este grupo?"
            variant="outline"
            className="w-full text-destructive"
          >
            Salir del grupo
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
