// A template, unlike the layout, remounts on every navigation — which is
// exactly what lets each screen play its entrance when you land on it.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
