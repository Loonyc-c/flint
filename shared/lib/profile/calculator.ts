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
 * 
 * Score Distribution (100% Total):
 * - Basic Info (20%): Age (10%), Gender (10%)
 * - Photo (15%): Main profile photo
 * - Bio (15%): At least 10 characters
 * - Interests (15%): At least 3 interests
 * - Questions (15%): 5% per answered question (max 3)
 * - Contact Info (20%): Instagram connected
 */
export const calculateProfileCompleteness = (
  profile: Partial<ProfileUpdateRequest> = {},
  contactInfo: Partial<UserContactInfo> = {}
): ProfileCompletenessResult => {
  let score = 0
  const missingFields: MissingField[] = []

  // 1. Basic Info (20%)
  if (profile.age) {
    score += 10
  } else {
    missingFields.push({ key: 'age', label: 'Age', weight: 10 })
  }

  if (profile.gender) {
    score += 10
  } else {
    missingFields.push({ key: 'gender', label: 'Gender', weight: 10 })
  }

  // 2. Photo (15%)
  if (profile.photo) {
    score += 15
  } else {
    missingFields.push({ key: 'photo', label: 'Profile Photo', weight: 15 })
  }

  // 3. Contact Info (20%) - Instagram
  // Check if instagram field is present
  if (contactInfo.instagram) {
    score += 20
  } else {
    missingFields.push({ key: 'instagram', label: 'Instagram', weight: 20 })
  }

  // 4. Bio (15%)
  if (profile.bio && profile.bio.trim().length >= 10) {
    score += 15
  } else {
    missingFields.push({ key: 'bio', label: 'Bio (min 10 chars)', weight: 15 })
  }

  // 5. Interests (15%)
  if (profile.interests && profile.interests.length >= 3) {
    score += 15
  } else {
    missingFields.push({ key: 'interests', label: 'Interests (min 3)', weight: 15 })
  }

  // 6. Questions (15%)
  const answeredCount = profile.questions?.filter(q => q.questionId && q.audioUrl).length || 0
  const questionScore = Math.min(answeredCount, 3) * 5
  score += questionScore
  
  if (answeredCount < 3) {
    missingFields.push({ 
      key: 'questions', 
      label: `Voice Answers (${3 - answeredCount} more needed)`, 
      weight: 15 - questionScore 
    })
  }

  return {
    score: Math.min(score, 100),
    missingFields
  }
}