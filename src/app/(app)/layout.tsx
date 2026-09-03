import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/services/profile";
import { listUnreadMilestones } from "@/lib/services/notifications";
import { MobileNav } from "@/components/nav/mobile-nav";
import { UserMenu } from "@/components/nav/user-menu";
import { MilestoneCelebration } from "@/components/notifications/milestone-celebration";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const milestones = await listUnreadMilestones(profile.id);

  return (
    <div className="min-h-svh md:flex md:min-h-svh md:items-center md:justify-center md:bg-surface md:p-6">
      <div className="flex min-h-svh w-full flex-col bg-background md:h-[880px] md:max-h-[92svh] md:min-h-0 md:w-[430px] md:overflow-hidden md:rounded-[2.5rem] md:border md:shadow-2xl">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              G
            </div>
            <span className="font-bold tracking-tight">Gym Tracker</span>
          </div>
          <UserMenu
            displayName={profile.display_name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            level={profile.level}
          />
        </header>
        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-6">{children}</main>
        <MobileNav />
      </div>
      <MilestoneCelebration milestones={milestones} />
    </div>
  );
}
