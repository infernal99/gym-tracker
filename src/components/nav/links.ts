import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Dumbbell,
  ListChecks,
  Star,
  History,
  User,
  Scale,
  Target,
  Trophy,
  Users,
  Swords,
  BarChart3,
  UsersRound,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Full nav — source list for the bottom tab bar and the header's "Más"
// overflow menu, both resolved per-user from this master list.
export const navLinks: NavLink[] = [
  { href: "/dashboard", label: "Hoy", icon: LayoutDashboard },
  { href: "/my-routine", label: "Mi rutina", icon: Star },
  { href: "/routines", label: "Rutinas", icon: ListChecks },
  { href: "/train/history", label: "Historial", icon: History },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/body", label: "Peso", icon: Scale },
  { href: "/achievements", label: "Logros", icon: Trophy },
  { href: "/friends", label: "Amigos", icon: Users },
  { href: "/challenges", label: "Retos", icon: Swords },
  { href: "/groups", label: "Grupos", icon: UsersRound },
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
