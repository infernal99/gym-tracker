"use client"

import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"

// A submit button that asks for confirmation before letting the form
// actually submit — for any destructive action (delete/remove/cancel) so a
// stray tap can't silently destroy data with no way back.
export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ComponentProps<typeof Button> & { confirmMessage: string }) {
  return (
    <Button
      {...props}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
    />
  )
}
