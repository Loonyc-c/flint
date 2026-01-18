import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// =============================================================================
// Class Name Utilities
// =============================================================================

/**
 * Merges Tailwind CSS classes with proper precedence handling.
 * Combines clsx for conditional classes with tailwind-merge for conflict resolution.
 *
 * @example
 * ```ts
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6') // -> 'py-2 px-6 bg-blue-500'
 * ```
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard that checks if a value is null or undefined.
 *
 * @example
 * ```ts
 * const value: string | null = getSomeValue()
 * if (!isNil(value)) {
 *   console.log(value.toUpperCase()) // TypeScript knows value is string
 * }
 * ```
 */
export const isNil = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

/**
 * Type guard that checks if a value is a non-empty string.
 * Trims whitespace before checking.
 *
 * @example
 * ```ts
 * isNonEmptyString('  hello  ') // true
 * isNonEmptyString('   ')       // false
 * isNonEmptyString(null)        // false
 * ```
 */
export const isNonEmptyString = (
  value: string | null | undefined,
): value is string => (value ?? "").trim() !== "";

// =============================================================================
// Value Validators
// =============================================================================

/**
 * Checks if a value is non-empty (not null, undefined, empty string, empty array, or empty object).
 *
 * @example
 * ```ts
 * isNonEmptyValue('')        // false
 * isNonEmptyValue([])        // false
 * isNonEmptyValue({})        // false
 * isNonEmptyValue('hello')   // true
 * isNonEmptyValue([1, 2])    // true
 * isNonEmptyValue({ a: 1 })  // true
 * ```
 */
export const isNonEmptyValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim() !== "";
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object" && value !== null) {
    return Object.keys(value).length > 0;
  }
  return true;
};
