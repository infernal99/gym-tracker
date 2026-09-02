import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/services/profile";
import { HarrisBenedictCalculator } from "@/components/calculator/harris-benedict-calculator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OnboardingResultsPage() {
  const profile = await requireProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus calorías diarias</CardTitle>
        <CardDescription>
          Calculadas con la fórmula de Harris-Benedict a partir de tus datos. Puedes ajustarlas
          y volver a verlas cuando quieras desde tu perfil.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <HarrisBenedictCalculator
          defaultSex={profile.sex === "female" ? "female" : "male"}
          defaultWeightKg={profile.initial_weight_kg}
          defaultHeightCm={profile.height_cm}
          defaultDateOfBirth={profile.date_of_birth}
          defaultActivityLevel={profile.activity_level}
        />
        <Button render={<Link href="/dashboard" />} className="w-full">
          Ir al dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
