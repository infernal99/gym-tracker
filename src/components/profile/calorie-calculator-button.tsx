"use client";

import { HarrisBenedictCalculator } from "@/components/calculator/harris-benedict-calculator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Profile } from "@/lib/services/profile";
import { CalculatorIcon } from "lucide-react";

export function CalorieCalculatorButton({ profile }: { profile: Profile }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <CalculatorIcon />
        Calculadora de calorías
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calculadora Harris-Benedict</DialogTitle>
          <DialogDescription>
            Estima tu metabolismo basal y tus calorías diarias según tu actividad.
          </DialogDescription>
        </DialogHeader>
        <HarrisBenedictCalculator
          defaultSex={profile.sex === "female" ? "female" : "male"}
          defaultWeightKg={profile.initial_weight_kg}
          defaultHeightCm={profile.height_cm}
          defaultDateOfBirth={profile.date_of_birth}
          defaultActivityLevel={profile.activity_level}
        />
      </DialogContent>
    </Dialog>
  );
}
