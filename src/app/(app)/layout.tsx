import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/services/profile";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";
import { UserMenu } from "@/components/nav/user-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <div className="md:hidden flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              G
            </div>
            <span className="font-semibold tracking-tight">Gym Tracker</span>
          </div>
          <div className="hidden md:block" />
          <UserMenu
            displayName={profile.display_name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            level={profile.level}
          />
        </header>
        <main className="flex-1 px-4 pb-20 pt-6 md:px-6 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
