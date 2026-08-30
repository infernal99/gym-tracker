"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/profile";
import { primaryGoalLabels, primaryGoalValues } from "@/lib/validation/auth";
import type { ActionResult } from "@/lib/actions/auth";
import type { Profile } from "@/lib/services/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ActionResult = { error: null };

const visibilityLabels: Record<string, string> = {
  public: "Público",
  friends: "Solo amigos",
  private: "Privado",
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">Nombre</Label>
          <Input id="displayName" name="displayName" defaultValue={profile.display_name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heightCm">Altura (cm)</Label>
          <Input
            id="heightCm"
            name="heightCm"
            type="number"
            step="0.1"
            defaultValue={profile.height_cm ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biografía</Label>
        <Textarea id="bio" name="bio" rows={3} defaultValue={profile.bio ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryGoal">Objetivo principal</Label>
        <Select name="primaryGoal" defaultValue={profile.primary_goal}>
          <SelectTrigger id="primaryGoal" className="w-full sm:w-72">
            <SelectValue>
              {(value: (typeof primaryGoalValues)[number]) => primaryGoalLabels[value]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {primaryGoalValues.map((goal) => (
              <SelectItem key={goal} value={goal}>
                {primaryGoalLabels[goal]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Privacidad</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Perfil</Label>
            <Select name="profileVisibility" defaultValue={profile.profile_visibility}>
              <SelectTrigger id="profileVisibility" className="w-full">
                <SelectValue>{(value: string) => visibilityLabels[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(["public", "friends", "private"] as const).map((v) => (
                  <SelectItem key={v} value={v}>
                    {visibilityLabels[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workoutsVisibility">Entrenamientos</Label>
            <Select name="workoutsVisibility" defaultValue={profile.workouts_visibility}>
              <SelectTrigger id="workoutsVisibility" className="w-full">
                <SelectValue>{(value: string) => visibilityLabels[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(["friends", "private"] as const).map((v) => (
                  <SelectItem key={v} value={v}>
                    {visibilityLabels[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weightVisibility">Peso</Label>
            <Select name="weightVisibility" defaultValue={profile.weight_visibility}>
              <SelectTrigger id="weightVisibility" className="w-full">
                <SelectValue>{(value: string) => visibilityLabels[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(["friends", "private"] as const).map((v) => (
                  <SelectItem key={v} value={v}>
                    {visibilityLabels[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prsVisibility">Récords (PRs)</Label>
            <Select name="prsVisibility" defaultValue={profile.prs_visibility}>
              <SelectTrigger id="prsVisibility" className="w-full">
                <SelectValue>{(value: string) => visibilityLabels[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(["friends", "private"] as const).map((v) => (
                  <SelectItem key={v} value={v}>
                    {visibilityLabels[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
