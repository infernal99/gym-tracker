import { Scale } from "lucide-react";
import type { SideBalance } from "@/lib/services/training";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IMBALANCE_THRESHOLD = 10;

// Left/right comparison for unilateral exercises — a gap here is one of
// the few things a bilateral lift (where the stronger side quietly
// compensates) can't reveal, so it's worth calling out on its own card.
export function SideBalanceCard({ balance }: { balance: SideBalance }) {
  const isImbalanced = balance.diffPct >= IMBALANCE_THRESHOLD;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4 text-muted-foreground" />
          Balance izquierda / derecha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-lg border p-3 text-center ${
              balance.strongerSide === "left" ? "border-primary/40 bg-primary/5" : ""
            }`}
          >
            <p className="stat-label">Izquierda</p>
            <p className="text-xl font-bold tabular-nums">{balance.leftE1rm} kg</p>
          </div>
          <div
            className={`rounded-lg border p-3 text-center ${
              balance.strongerSide === "right" ? "border-primary/40 bg-primary/5" : ""
            }`}
          >
            <p className="stat-label">Derecha</p>
            <p className="text-xl font-bold tabular-nums">{balance.rightE1rm} kg</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {isImbalanced ? (
            <>
              Tu lado {balance.strongerSide === "left" ? "izquierdo" : "derecho"} está un{" "}
              <span className="font-medium text-foreground">{balance.diffPct.toFixed(0)}%</span> por
              delante. Prueba a empezar cada serie por el lado más débil, o a igualar repeticiones antes
              de subir peso.
            </>
          ) : (
            <>Diferencia de solo un {balance.diffPct.toFixed(0)}%, dentro de lo normal.</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
