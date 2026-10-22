// Shown the moment you tap a tab, while the server renders the page. Without
// it the previous screen just sat there for the length of every database
// round trip, which read as the app not reacting to the tap at all.
export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-2xl bg-card" />
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-20 animate-pulse rounded-xl bg-card" />
        <div className="h-20 animate-pulse rounded-xl bg-card" />
      </div>
      <div className="h-28 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
