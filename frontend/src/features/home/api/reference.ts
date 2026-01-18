import { apiRequest } from "@/lib/api-client";
import {
  type UserPreferences,
  type ReferenceUpdateRequest,
} from "@shared/types";

// =============================================================================
// API Functions
// =============================================================================

/**
 * Updates a user's reference preferences (matching criteria).
 *
 * @param userId - The user's ID
 * @param data - Reference data to update (ageRange, lookingFor)
 * @param options - Optional fetch options (e.g., keepalive)
 */
export const updateReference = async (
  userId: string,
  data: ReferenceUpdateRequest,
  options: RequestInit = {},
): Promise<UserPreferences> =>
  apiRequest<UserPreferences>(`/reference/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });

/**
 * Retrieves a user's reference preferences.
 *
 * @param userId - The user's ID
 */
export const getReference = async (userId: string): Promise<UserPreferences> =>
  apiRequest<UserPreferences>(`/reference/${userId}`, {
    method: "GET",
  });
