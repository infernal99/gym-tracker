import { AppLogo } from "@/components/app-logo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <AppLogo size={36} />
        <span className="text-lg font-bold tracking-tight">Gym Tracker</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
