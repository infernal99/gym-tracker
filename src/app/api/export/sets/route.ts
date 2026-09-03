import { createClient } from "@/lib/supabase/server";
import { listExportRows } from "@/lib/services/stats";

const HEADERS = [
  "fecha",
  "entrenamiento",
  "ejercicio",
  "serie",
  "lado",
  "peso_kg",
  "repeticiones",
  "rir",
  "rpe",
  "volumen_kg",
];

const SIDE_LABELS: Record<string, string> = {
  both: "",
  left: "izquierdo",
  right: "derecho",
};

// Excel decides a field is a formula when it starts with one of these, so a
// value like "-Press" would be evaluated instead of shown. Prefixing with a
// single quote is the standard way to keep it as text.
function escapeCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const rows = await listExportRows(user.id);

  const lines = [
    HEADERS.join(","),
    ...rows.map((r) =>
      [
        new Date(r.date).toLocaleString("sv-SE"),
        r.session,
        r.exercise,
        r.setNumber,
        SIDE_LABELS[r.side] ?? r.side,
        r.weightKg,
        r.reps,
        r.rir,
        r.rpe,
        Math.round(r.volumeKg * 100) / 100,
      ]
        .map(escapeCell)
        .join(","),
    ),
  ];

  const filename = `gym-tracker-${new Date().toLocaleDateString("sv-SE")}.csv`;

  // The BOM is what makes Excel open a UTF-8 CSV without mangling accents.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
