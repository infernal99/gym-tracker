"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Minus,
  Plus,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  activateRoutineAction,
  applyRoutineChangeAction,
  createGoalFromProposalAction,
  createRoutineFromProposalAction,
} from "@/lib/actions/ai-write";
import { countProposalStats, type AIProposal } from "@/lib/ai/proposals";

export function ProposalCard({ proposal }: { proposal: AIProposal }) {
  if (proposal.kind === "routine") return <RoutineCard proposal={proposal} />;
  if (proposal.kind === "goal") return <GoalCard proposal={proposal} />;
  return <RoutineChangeCard proposal={proposal} />;
}

function CardShell({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fade-up ml-9 space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="stat-label">{eyebrow}</p>
          <p className="truncate font-semibold leading-tight">{title}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="space-y-1 rounded-xl bg-muted/60 p-2.5">
      {warnings.map((w) => (
        <p key={w} className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {w}
        </p>
      ))}
    </div>
  );
}

function Done({ message, href }: { message: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="flex items-center gap-1.5 text-sm font-medium text-success">
        <Check className="h-4 w-4" />
        {message}
      </p>
      {href && (
        <Button size="sm" variant="outline" render={<Link href={href} />}>
          Ver
        </Button>
      )}
    </div>
  );
}

function RoutineCard({ proposal }: { proposal: Extract<AIProposal, { kind: "routine" }> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [activated, setActivated] = useState(proposal.setActive);
  const stats = countProposalStats(proposal);

  async function create(activate: boolean) {
    setPending(true);
    const result = await createRoutineFromProposalAction(proposal, activate);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCreatedId(result.templateId ?? null);
    setActivated(activate);
    toast.success(activate ? "Rutina creada y activada" : "Rutina añadida");
    router.refresh();
  }

  async function activate() {
    if (!createdId) return;
    setPending(true);
    const result = await activateRoutineAction(createdId);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setActivated(true);
    toast.success("Es tu rutina principal");
    router.refresh();
  }

  return (
    <CardShell icon={<Sparkles className="h-4 w-4" />} eyebrow="Rutina generada" title={proposal.name}>
      <div className="flex gap-2 text-center">
        {[
          { label: "Días", value: stats.days },
          { label: "Ejercicios", value: stats.exercises },
          { label: "Series", value: stats.sets },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-xl bg-muted/60 py-2">
            <p className="text-lg font-bold tabular-nums leading-none">{s.value}</p>
            <p className="stat-label mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {proposal.days.map((day) => (
          <div key={day.name} className="rounded-xl border p-2.5">
            <p className="mb-1 text-sm font-semibold">{day.name}</p>
            <ul className="space-y-0.5">
              {day.exercises.map((e) => (
                <li
                  key={`${day.name}-${e.exerciseId}`}
                  className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground"
                >
                  <span className="truncate">{e.exerciseName}</span>
                  <span className="shrink-0 tabular-nums">
                    {e.targetSets} ×{" "}
                    {e.targetRepsMin && e.targetRepsMax
                      ? e.targetRepsMin === e.targetRepsMax
                        ? e.targetRepsMin
                        : `${e.targetRepsMin}-${e.targetRepsMax}`
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Warnings warnings={proposal.warnings} />

      {createdId ? (
        <div className="space-y-2">
          <Done
            message={activated ? "Creada y activada" : "Añadida a tus rutinas"}
            href={`/routines/${createdId}`}
          />
          {!activated && (
            <Button size="sm" variant="outline" className="w-full" disabled={pending} onClick={activate}>
              <Star className="h-4 w-4" />
              Activar como principal
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Button className="flex-1" disabled={pending} onClick={() => create(proposal.setActive)}>
            {pending
              ? "Creando..."
              : proposal.setActive
                ? "Añadir y activar"
                : "Añadir a mis rutinas"}
          </Button>
          {!proposal.setActive && (
            <Button variant="outline" disabled={pending} onClick={() => create(true)}>
              <Star className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </CardShell>
  );
}

function GoalCard({ proposal }: { proposal: Extract<AIProposal, { kind: "goal" }> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const remaining =
    proposal.currentValue != null ? proposal.targetValue - proposal.currentValue : null;

  async function create() {
    setPending(true);
    const result = await createGoalFromProposalAction(proposal);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCreated(true);
    toast.success("Objetivo creado");
    router.refresh();
  }

  return (
    <CardShell icon={<Target className="h-4 w-4" />} eyebrow="Nuevo objetivo" title={proposal.title}>
      <div className="flex gap-2 text-center">
        <div className="flex-1 rounded-xl bg-muted/60 py-2">
          <p className="text-lg font-bold tabular-nums leading-none">
            {proposal.currentValue ?? "—"}
          </p>
          <p className="stat-label mt-1">Actual</p>
        </div>
        <div className="flex-1 rounded-xl bg-primary/10 py-2">
          <p className="text-lg font-bold tabular-nums leading-none text-primary">
            {proposal.targetValue}
          </p>
          <p className="stat-label mt-1">Objetivo</p>
        </div>
        {remaining != null && remaining > 0 && (
          <div className="flex-1 rounded-xl bg-muted/60 py-2">
            <p className="text-lg font-bold tabular-nums leading-none">{Math.round(remaining * 10) / 10}</p>
            <p className="stat-label mt-1">Faltan</p>
          </div>
        )}
      </div>

      {created ? (
        <Done message="Objetivo creado" href="/goals" />
      ) : (
        <Button className="w-full" disabled={pending} onClick={create}>
          {pending ? "Creando..." : "Crear objetivo"}
        </Button>
      )}
    </CardShell>
  );
}

function RoutineChangeCard({
  proposal,
}: {
  proposal: Extract<AIProposal, { kind: "routine_change" }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [applied, setApplied] = useState(false);

  async function apply() {
    setPending(true);
    const result = await applyRoutineChangeAction(proposal);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setApplied(true);
    toast.success("Rutina actualizada");
    router.refresh();
  }

  return (
    <CardShell
      icon={<Sparkles className="h-4 w-4" />}
      eyebrow={`${proposal.templateName} · ${proposal.dayName}`}
      title="Cambio propuesto"
    >
      <ul className="space-y-1">
        {proposal.add.map((e) => (
          <li key={`add-${e.exerciseId}`} className="flex items-center gap-2 text-sm text-success">
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{e.exerciseName}</span>
            <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
              {e.targetSets} ×{" "}
              {e.targetRepsMin && e.targetRepsMax
                ? `${e.targetRepsMin}-${e.targetRepsMax}`
                : "—"}
            </span>
          </li>
        ))}
        {proposal.remove.map((r) => (
          <li key={`rm-${r.rowId}`} className="flex items-center gap-2 text-sm text-destructive">
            <Minus className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{r.exerciseName}</span>
          </li>
        ))}
      </ul>

      {applied ? (
        <Done message="Cambio aplicado" href={`/routines/${proposal.templateId}`} />
      ) : (
        <Button className="w-full" disabled={pending} onClick={apply}>
          {pending ? "Aplicando..." : "Aplicar cambio"}
        </Button>
      )}
    </CardShell>
  );
}
