import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // PWA installability depends on the browser (and its background service
    // worker context, which doesn't carry the page's session the same way)
    // being able to fetch manifest.webmanifest and sw.js unauthenticated —
    // gating them behind login made Chrome's install check silently fail
    // (it got redirected to the login HTML instead of the real manifest),
    // so beforeinstallprompt never fired for anyone.
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
