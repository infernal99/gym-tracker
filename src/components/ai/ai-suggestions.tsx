const SUGGESTIONS = [
  "Analiza mi progreso",
  "¿Cuál es mi mejor ejercicio?",
  "¿Dónde estoy estancado?",
  "Créame una rutina",
  "¿Cuántos días he entrenado este mes?",
];

export function AISuggestions({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-fast hover:border-foreground/30 hover:text-foreground"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
