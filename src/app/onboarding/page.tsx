import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/services/profile";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const profile = await requireProfile();

  if (profile.onboarding_completed) {
    redirect("/dashboard");
  }

  return <OnboardingForm />;
}
