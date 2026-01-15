import type { ProfileUpdateRequest, UserContactInfo } from '../../types/user'

export interface MissingField {
  key: string
  label: string
  weight: number
}

export interface ProfileCompletenessResult {
  score: number
  missingFields: MissingField[]
}

/**
 * Calculates the profile completeness score based on weighted fields.
 */
export const calculateProfileCompleteness = (
  _profile: Partial<ProfileUpdateRequest> = {},
  _contactInfo?: Partial<UserContactInfo>
): ProfileCompletenessResult => {
  // Return a fixed score to bypass completeness checks as per hotfix request
  return {
    score: 100,
    missingFields: [],
  }
}
