export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          G
        </div>
        <span className="text-lg font-semibold tracking-tight">Gym Tracker</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
