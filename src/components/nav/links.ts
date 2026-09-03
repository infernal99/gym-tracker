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
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Full nav shown on the desktop sidebar.
// More links (Calendario, Social, Estadísticas) land as their phases ship.
export const navLinks: NavLink[] = [
  { href: "/dashboard", label: "Hoy", icon: LayoutDashboard },
  { href: "/my-routine", label: "Mi rutina", icon: Star },
  { href: "/routines", label: "Rutinas", icon: ListChecks },
  { href: "/train/history", label: "Historial", icon: History },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/body", label: "Peso", icon: Scale },
  { href: "/achievements", label: "Logros", icon: Trophy },
  { href: "/profile", label: "Perfil", icon: User },
];

// Curated subset for the mobile bottom bar — keeps it to 5 tabs so it stays
// usable on narrow screens; the rest stay reachable from the sidebar/profile.
export const mobileNavLinks: NavLink[] = [
  { href: "/dashboard", label: "Hoy", icon: LayoutDashboard },
  { href: "/routines", label: "Rutinas", icon: ListChecks },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/profile", label: "Perfil", icon: User },
];
