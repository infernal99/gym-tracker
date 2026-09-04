"use client";

import { ANATOMY_GROUPS, ANATOMY_GROUP_LABELS, ANATOMY_GROUP_ZONE, type AnatomyGroup } from "@/lib/anatomy-groups";
import { muscleZoneColor } from "@/lib/muscle-colors";

export function MuscleLegend({
  active,
  onSelect,
}: {
  active: AnatomyGroup | null;
  onSelect: (group: AnatomyGroup) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ANATOMY_GROUPS.map((group) => {
        const color = muscleZoneColor(ANATOMY_GROUP_ZONE[group]);
        const isActive = active === group;
        return (
          <button
            key={group}
            type="button"
            onClick={() => onSelect(group)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ${
              isActive ? "text-white" : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            style={isActive ? { backgroundColor: color } : undefined}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {ANATOMY_GROUP_LABELS[group]}
          </button>
        );
      })}
    </div>
  );
}
