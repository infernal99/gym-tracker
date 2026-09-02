import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Dumbbell, ListChecks, Star, History, User } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// More links (Progreso, Peso, Objetivos, Calendario, Social, Estadísticas)
// land as their phases ship — see the app's phased roadmap.
export const navLinks: NavLink[] = [
  { href: "/dashboard", label: "Hoy", icon: LayoutDashboard },
  { href: "/my-routine", label: "Mi rutina", icon: Star },
  { href: "/routines", label: "Rutinas", icon: ListChecks },
  { href: "/train/history", label: "Historial", icon: History },
  { href: "/exercises", label: "Ejercicios", icon: Dumbbell },
  { href: "/profile", label: "Perfil", icon: User },
];
