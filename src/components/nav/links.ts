import type { Icon } from "@phosphor-icons/react";
// The SSR build: no React context needed, so the same icons render from
// server and client components alike. Phosphor rather than Lucide here
// because it ships a filled weight of every glyph — the selected tab gets
// the solid version, the way iOS tab bars do.
import {
  Barbell,
  ChartBar,
  ClockCounterClockwise,
  House,
  ListChecks,
  Scales,
  Sparkle,
  Star,
  Sword,
  Target,
  Trophy,
  User,
  Users,
  UsersThree,
} from "@phosphor-icons/react/ssr";

export type NavLink = {
  href: string;
  label: string;
  icon: Icon;
};

// Full nav — source list for the bottom tab bar and the header's "Más"
// overflow menu, both resolved per-user from this master list.
export const navLinks: NavLink[] = [
  { href: "/dashboard", label: "Hoy", icon: House },
  { href: "/ai", label: "Gym Tracker AI", icon: Sparkle },
  { href: "/my-routine", label: "Mi rutina", icon: Star },
  { href: "/routines", label: "Rutinas", icon: ListChecks },
  { href: "/train/history", label: "Historial", icon: ClockCounterClockwise },
  { href: "/stats", label: "Estadísticas", icon: ChartBar },
  { href: "/exercises", label: "Ejercicios", icon: Barbell },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/body", label: "Peso", icon: Scales },
  { href: "/achievements", label: "Logros", icon: Trophy },
  { href: "/friends", label: "Amigos", icon: Users },
  { href: "/challenges", label: "Retos", icon: Sword },
  { href: "/groups", label: "Grupos", icon: UsersThree },
  { href: "/profile", label: "Perfil", icon: User },
];

// Default bottom tab bar — keeps it to 5 tabs so it stays usable on a
// phone-width frame. Users can swap which 5 show (Ajustes → personalizar
// barra inferior); this is only the fallback for accounts that haven't
// customized it (profiles.bottom_nav_links defaults to these same hrefs).
export const DEFAULT_BOTTOM_NAV_HREFS = [
  "/dashboard",
  "/routines",
  "/exercises",
  "/goals",
  "/profile",
];

export const BOTTOM_NAV_SLOT_COUNT = DEFAULT_BOTTOM_NAV_HREFS.length;

// Turns a user's chosen hrefs into the actual link objects, in the master
// navLinks order. Falls back to the default set if anything is missing or
// malformed (e.g. an href that no longer exists).
export function resolveBottomNavLinks(hrefs: string[]): NavLink[] {
  const set = new Set(hrefs);
  const resolved = navLinks.filter((link) => set.has(link.href));
  return resolved.length === BOTTOM_NAV_SLOT_COUNT
    ? resolved
    : navLinks.filter((link) => DEFAULT_BOTTOM_NAV_HREFS.includes(link.href));
}
