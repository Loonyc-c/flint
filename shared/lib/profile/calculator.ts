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
  profile: Partial<ProfileUpdateRequest> = {},
  contactInfo?: Partial<UserContactInfo>
): ProfileCompletenessResult => {
  let score = 0
  const missingFields: MissingField[] = []

  // 1. Basic Info (20% total: 10% Age, 10% Gender)
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

  // 2. Profile Image (15%)
  if (profile.photo) {
    score += 15
  } else {
    missingFields.push({ key: 'photo', label: 'Profile Photo', weight: 15 })
  }

  // 3. Verified Instagram (20%)
  const isInstagramVerified = contactInfo?.verifiedPlatforms?.includes('instagram')
  if (isInstagramVerified) {
    score += 20
  } else {
    missingFields.push({ key: 'instagram', label: 'Verify Instagram', weight: 20 })
  }

  // 4. Bio/Introduction (15%)
  if (profile.bio && profile.bio.trim().length >= 10) {
    score += 15
  } else {
    missingFields.push({ key: 'bio', label: 'Bio (min 10 chars)', weight: 15 })
  }

  // 5. Interests (15% - at least 3)
  const interestsCount = profile.interests?.length || 0
  if (interestsCount >= 3) {
    score += 15
  } else {
    missingFields.push({ key: 'interests', label: 'Add 3+ Interests', weight: 15 })
  }

  // 6. Questions/Audio Answers (15% - 5% each)
  const answeredQuestions = profile.questions?.filter(q => q.questionId && q.audioUrl).length || 0
  score += Math.min(answeredQuestions, 3) * 5
  
  if (answeredQuestions < 3) {
    missingFields.push({ 
      key: 'questions', 
      label: `Voice Questions (${answeredQuestions}/3)`, 
      weight: (3 - answeredQuestions) * 5 
    })
  }

  return {
    score: Math.min(score, 100),
    missingFields
  }
}
