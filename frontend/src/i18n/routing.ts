import { createNavigation } from "next-intl/navigation";
import { routing } from "./config";

export * from "./config";

// =============================================================================
// Routing Configuration
// =============================================================================

// Re-exported from ./config

// =============================================================================
// Navigation Exports
// =============================================================================

/**
 * Type-safe navigation utilities from next-intl.
 * Use these instead of next/navigation for locale-aware routing.
 */
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

/**
 * Re-export standard Next.js navigation hooks to maintain a single import source.
 * This ensures strict compliance with the rule: "ALWAYS import from @/i18n/routing".
 */
export { useParams, useSearchParams, notFound } from "next/navigation";
