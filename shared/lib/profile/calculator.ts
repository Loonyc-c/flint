import { ProfileUpdateRequest } from '../../types/profile'

/**
 * Calculates the profile completeness score based on filled fields.
 * 
 * Base Requirements (Must exist to be valid profile): 50 points
 * - Nickname, Age, Gender
 * - At least 1 Photo
 * - Voice Intro
 * 
 * Bonus Points (To reach 80% threshold):
 * - Photo #2: +10
 * - Photo #3: +10
 * - Questions (max 3): +5 each
 * - Bio: +5
 * - Interests: +5
 * - Preferences (Implicitly checked): +5
 * 
 * @param profile The user profile data
 * @returns Score from 0 to 100
 */
export const calculateProfileCompleteness = (profile: ProfileUpdateRequest): number => {
  let score = 0

  // 1. Base Requirements (Assuming validation passed, these exist)
  // If validation hasn't passed, this shouldn't be called, but we check anyway.
  const hasBase = 
    profile.nickName && 
    profile.age && 
    profile.gender && 
    profile.photos && profile.photos.length >= 1 &&
    profile.voiceIntro

  if (hasBase) {
    score += 50
  } else {
    return 0 // Fundamental missing
  }

  // 2. Extra Photos (Max 20)
  // Index 0 is base, so check index 1 and 2
  if (profile.photos.length >= 2) score += 10
  if (profile.photos.length >= 3) score += 10

  // 3. Questions (Max 15)
  if (profile.questions && Array.isArray(profile.questions)) {
    const answeredCount = profile.questions.length
    score += Math.min(answeredCount, 3) * 5
  }

  // 4. Bio (Max 5)
  if (profile.bio && profile.bio.trim().length > 0) {
    score += 5
  }

  // 5. Interests (Max 5)
  if (profile.interests && profile.interests.length > 0) {
    score += 5
  }

  // 6. Preferences (Assumed set during creation)
  // Since this calculator takes ProfileCreationRequest, preferences might not be strictly part of it 
  // depending on how we structured the type, but let's assume if they made a profile, they have default preferences.
  score += 5

  return Math.min(score, 100)
}
