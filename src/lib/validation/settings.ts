import { z } from "zod";
import { navLinks, BOTTOM_NAV_SLOT_COUNT } from "@/components/nav/links";

const validHrefs = navLinks.map((link) => link.href) as [string, ...string[]];

export const updateBottomNavSchema = z.object({
  hrefs: z
    .array(z.enum(validHrefs))
    .length(BOTTOM_NAV_SLOT_COUNT)
    .refine((hrefs) => new Set(hrefs).size === hrefs.length, "No puedes repetir una pestaña"),
});
