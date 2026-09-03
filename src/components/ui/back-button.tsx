"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

// Browser/OS back gestures aren't always available inside the app's phone
// frame, so drill-down pages (reached by tapping into something, not from
// a bottom-tab) get an explicit back control. Falls back to a fixed href
// when there's no in-app history to pop (e.g. a page opened directly).
export function BackButton({
  label = "Atrás",
  fallbackHref,
}: {
  label?: string
  fallbackHref: string
}) {
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
      onClick={() => {
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push(fallbackHref)
        }
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
