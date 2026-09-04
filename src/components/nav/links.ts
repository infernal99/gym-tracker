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

// Full nav — source list for the bottom tab bar (mobileNavLinks) and the
// header's "Más" overflow menu (moreNavLinks).
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

// Curated subset for the bottom tab bar — keeps it to 5 tabs so it stays
// usable on a phone-width frame; the rest live in the header's "Más" menu.
export const mobileNavLinks: NavLink[] = [
  { href: "/dashboard", label: "Hoy", icon: LayoutDashboard },
  { href: "/routines", label: "Rutinas", icon: ListChecks },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/profile", label: "Perfil", icon: User },
];

// Everything not already in the bottom bar, surfaced via the header's "Más" menu.
export const moreNavLinks: NavLink[] = navLinks.filter(
  (link) => !mobileNavLinks.some((tab) => tab.href === link.href),
);
