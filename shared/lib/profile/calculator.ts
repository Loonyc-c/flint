import { ProfileUpdateRequest } from '../../types/user'

/**
 * Calculates the profile completeness score based on filled fields.
 *
 * Base Requirements (Must exist to be valid profile): 60 points
 * - Nickname, Age, Gender
 * - 1 Photo
 * - Voice Intro
 *
 * Bonus Points (To reach 80% threshold):
 * - Questions (max 3): +5 each (Total 15)
 * - Bio: +10
 * - Interests: +10
 * - Preferences (Implicitly checked): +5
 *
 * @param profile The user profile data
 * @returns Score from 0 to 100
 */
export const calculateProfileCompleteness = (profile: ProfileUpdateRequest): number => {
  let score = 0

  // 1. Base Requirements
  const hasBase =
    profile.nickName &&
    profile.age &&
    profile.gender &&
    profile.photo &&
    profile.voiceIntro

  if (hasBase) {
    score += 60
  } else {
    return 0 // Fundamental missing
  }

  // 2. Questions (Max 15)
  if (profile.questions && Array.isArray(profile.questions)) {
    const answeredCount = profile.questions.length
    score += Math.min(answeredCount, 3) * 5
  }

  // 3. Bio (Max 10)
  if (profile.bio && profile.bio.trim().length > 0) {
    score += 10
  }

  // 4. Interests (Max 10)
  if (profile.interests && profile.interests.length > 0) {
    score += 10
  }

  // 5. Preferences
  score += 5

  return Math.min(score, 100)
}