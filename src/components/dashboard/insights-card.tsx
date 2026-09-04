import { AlertTriangle, Calendar, Flame, Sparkles, TrendingUp } from "lucide-react";
import type { Insight, InsightIcon } from "@/lib/services/insights";
import { Card, CardContent } from "@/components/ui/card";

const ICONS: Record<InsightIcon, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  "trending-up": TrendingUp,
  calendar: Calendar,
  sparkles: Sparkles,
  alert: AlertTriangle,
};

// Auto-generated observations from the user's own history — a streak
// record, a spike in weekly volume, "hace 2 meses hacías X con Y kg". Not
// every signal fires every visit, so this renders nothing when the service
// found nothing worth saying, rather than an empty card.
export function InsightsCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardContent className="divide-y divide-border/60 pt-6">
        {insights.map((insight) => {
          const Icon = ICONS[insight.icon];
          return (
            <div key={insight.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  insight.icon === "alert" ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.body}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
