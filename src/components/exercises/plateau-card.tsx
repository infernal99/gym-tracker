import Link from "next/link";
import { AlertTriangle, ArrowDownRight, Minus, TrendingUp } from "lucide-react";
import type { PlateauAnalysis } from "@/lib/calculations/strength";
import { roundToHalf } from "@/lib/calculations/strength";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Concrete next steps rather than "sigue así": when a lift stops moving the
// useful advice is a deload percentage and a rep target, not encouragement.
function adviceFor(analysis: PlateauAnalysis, deloadKg: number | null): string[] {
  switch (analysis.status) {
    case "improving":
      return [
        "Sigue con la progresión que llevas: sube el peso cuando llegues al tope de repeticiones.",
      ];
    case "steady":
      return [
        "Intenta añadir una repetición más por serie antes de subir kilos.",
        "Revisa que descansas lo suficiente entre series.",
      ];
    case "plateau":
      return [
        deloadKg
          ? `Haz una semana de descarga: baja a ~${deloadKg} kg (70%) y céntrate en la técnica.`
          : "Haz una semana de descarga bajando el peso alrededor de un 30%.",
        "Sube repeticiones antes que kilos: si haces 8, apunta a 10 con el mismo peso.",
        "Comprueba lo básico: sueño, comida y descansos largos en las series pesadas.",
        "Cambia a un ejercicio parecido durante 3-4 semanas y vuelve después.",
      ];
    case "regressing":
      return [
        deloadKg
          ? `Descarga ya: una o dos semanas a ~${deloadKg} kg antes de volver a subir.`
          : "Descarga una o dos semanas antes de volver a subir el peso.",
        "Suele ser fatiga acumulada, no pérdida de fuerza real.",
        "Si arrastras molestias, prioriza recuperarte antes que la carga.",
      ];
    default:
      return [];
  }
}

const STATUS_META = {
  improving: { icon: TrendingUp, label: "En progreso", tone: "text-success" },
  steady: { icon: Minus, label: "Estable", tone: "text-muted-foreground" },
  plateau: { icon: AlertTriangle, label: "Estancado", tone: "text-primary" },
  regressing: { icon: ArrowDownRight, label: "Bajando", tone: "text-destructive" },
} as const;

export function PlateauCard({
  analysis,
  alternatives,
}: {
  analysis: PlateauAnalysis;
  alternatives: { id: string; name: string; slug: string }[];
}) {
  if (analysis.status === "insufficient") return null;

  const meta = STATUS_META[analysis.status];
  const Icon = meta.icon;
  const deloadKg = analysis.bestE1rm ? roundToHalf(analysis.bestE1rm * 0.7) : null;
  const advice = adviceFor(analysis, deloadKg);
  const showAlternatives =
    alternatives.length > 0 && (analysis.status === "plateau" || analysis.status === "regressing");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-4 w-4 ${meta.tone}`} />
          {meta.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          {analysis.sessionsSinceBest === 0
            ? "Tu última sesión igualó o superó tu mejor marca."
            : `${analysis.sessionsSinceBest} sesiones desde tu mejor marca.`}
          {analysis.recentChangePct !== null && (
            <>
              {" "}
              Las últimas 3 sesiones van un{" "}
              <span
                className={`font-medium ${analysis.recentChangePct >= 0 ? "text-success" : "text-destructive"}`}
              >
                {analysis.recentChangePct >= 0 ? "+" : ""}
                {analysis.recentChangePct.toFixed(1)}%
              </span>{" "}
              respecto a las 3 anteriores.
            </>
          )}
        </p>

        <ul className="list-disc space-y-1 pl-4">
          {advice.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {showAlternatives && (
          <div>
            <p className="stat-label mb-1.5">Prueba con</p>
            <div className="flex flex-wrap gap-2">
              {alternatives.slice(0, 4).map((alt) => (
                <Link
                  key={alt.id}
                  href={`/exercises/${alt.slug}`}
                  className="card-interactive rounded-full border bg-card px-3 py-1.5 text-xs"
                >
                  {alt.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
