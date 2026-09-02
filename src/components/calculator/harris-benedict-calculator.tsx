"use client";

import { useMemo, useState } from "react";
import {
  activityLevelLabels,
  activityLevelValues,
  ageFromDateOfBirth,
  calculateHarrisBenedict,
  type ActivityLevel,
} from "@/lib/calculations/harris-benedict";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const calcSexValues = ["male", "female"] as const;
type CalcSex = (typeof calcSexValues)[number];

const calcSexLabels: Record<CalcSex, string> = {
  male: "Hombre",
  female: "Mujer",
};

export interface HarrisBenedictCalculatorProps {
  defaultSex?: CalcSex;
  defaultWeightKg?: number | null;
  defaultHeightCm?: number | null;
  defaultDateOfBirth?: string | null;
  defaultActivityLevel?: ActivityLevel;
}

export function HarrisBenedictCalculator({
  defaultSex,
  defaultWeightKg,
  defaultHeightCm,
  defaultDateOfBirth,
  defaultActivityLevel,
}: HarrisBenedictCalculatorProps) {
  const [sex, setSex] = useState<CalcSex>(defaultSex ?? "male");
  const [weightKg, setWeightKg] = useState(defaultWeightKg ? String(defaultWeightKg) : "");
  const [heightCm, setHeightCm] = useState(defaultHeightCm ? String(defaultHeightCm) : "");
  const [age, setAge] = useState(() => {
    const derived = defaultDateOfBirth ? ageFromDateOfBirth(defaultDateOfBirth) : null;
    return derived ? String(derived) : "";
  });
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    defaultActivityLevel ?? "moderate",
  );

  const result = useMemo(() => {
    const w = Number(weightKg);
    const h = Number(heightCm);
    const a = Number(age);
    if (!w || !h || !a) return null;

    return calculateHarrisBenedict({ sex, weightKg: w, heightCm: h, age: a, activityLevel });
  }, [sex, weightKg, heightCm, age, activityLevel]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="calc-sex">Sexo</Label>
          <Select value={sex} onValueChange={(v) => setSex(v as CalcSex)}>
            <SelectTrigger id="calc-sex" className="w-full">
              <SelectValue>{(v: CalcSex) => calcSexLabels[v]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {calcSexValues.map((v) => (
                <SelectItem key={v} value={v}>
                  {calcSexLabels[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="calc-age">Edad</Label>
          <Input
            id="calc-age"
            type="number"
            min="0"
            step="1"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calc-weight">Peso (kg)</Label>
          <Input
            id="calc-weight"
            type="number"
            min="0"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="70"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calc-height">Altura (cm)</Label>
          <Input
            id="calc-height"
            type="number"
            min="0"
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="175"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calc-activity">Nivel de actividad</Label>
        <Select value={activityLevel} onValueChange={(v) => setActivityLevel(v as ActivityLevel)}>
          <SelectTrigger id="calc-activity" className="w-full">
            <SelectValue>{(v: ActivityLevel) => activityLevelLabels[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activityLevelValues.map((level) => (
              <SelectItem key={level} value={level}>
                {activityLevelLabels[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {result ? (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Metabolismo basal (BMR)</span>
            <span className="text-lg font-semibold">{result.bmr} kcal/día</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Gasto total (TDEE)</span>
            <span className="text-lg font-semibold">{result.tdee} kcal/día</span>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Perder grasa</p>
              <p className="font-semibold">{result.calorieTargets.lose}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mantener</p>
              <p className="font-semibold text-primary">{result.calorieTargets.maintain}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ganar músculo</p>
              <p className="font-semibold">{result.calorieTargets.gain}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Completa peso, altura y edad para calcular tus calorías.
        </p>
      )}
    </div>
  );
}
