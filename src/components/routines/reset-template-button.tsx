"use client";

import { RotateCcw } from "lucide-react";
import { resetTemplateToOriginalAction } from "@/lib/actions/routines";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export function ResetTemplateButton({ templateId }: { templateId: string }) {
  return (
    <form action={resetTemplateToOriginalAction.bind(null, templateId)}>
      <ConfirmSubmitButton
        confirmMessage="¿Volver a la versión original de esta rutina? Perderás todos tus cambios personalizados. No se puede deshacer."
        variant="ghost"
        size="icon-sm"
        title="Volver al original"
      >
        <RotateCcw className="h-4 w-4" />
      </ConfirmSubmitButton>
    </form>
  );
}
