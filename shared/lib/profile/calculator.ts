import type {
  ProfileUpdateRequest,
  QuestionAnswerWithFile
} from '../../types/user'

export interface MissingField {
  key: string
  label: string
  weight: number
}

export interface ProfileCompletenessResult {
  score: number
  isFeatureUnlocked: boolean
  missingFields: MissingField[]
}

/**
 * Calculates the profile completeness score based on weighted fields.
 * Now implements a "Quality Gate" with strict requirements.
 *
 * Score Distribution (100% Total):
 * - Identity (25%): firstName (5%), lastName (5%), nickName (5%), age (5%), gender (5%)
 * - Photo (10%): Main profile photo
 * - Bio (10%): At least 10 characters
 * - Interests (10%): At least 3 interests
 * - Questions (10%): 3.33% per answered question (max 3)
 * - Voice Intro (15%): Voice introduction recorded
 * - Contact Info (20%): Instagram connected
 *
 * THE 80% RULE (Cap System):
 * It is mathematically impossible to reach 80% (isFeatureUnlocked) without ALL of:
 * - Full Identity (First, Last, Nick, Age, Gender)
 * - Photo & Bio
 * - Voice Intro
 * - 3 Questions
 * - Instagram
 *
 * If ANY critical field is missing, the score is capped at 75%.
 */
export const calculateProfileCompleteness = (
  profile: Partial<ProfileUpdateRequest & { questions?: QuestionAnswerWithFile[] }> = {}
): ProfileCompletenessResult => {
  let score = 0
  const missingFields: MissingField[] = []

  // 1. Identity (25%)
  if (profile.firstName) {
    score += 5
  } else {
    missingFields.push({ key: 'firstName', label: 'First Name', weight: 5 })
  }

  if (profile.lastName) {
    score += 5
  } else {
    missingFields.push({ key: 'lastName', label: 'Last Name', weight: 5 })
  }

  if (profile.nickName) {
    score += 5
  } else {
    missingFields.push({ key: 'nickName', label: 'Nickname', weight: 5 })
  }

  if (profile.age) {
    score += 5
  } else {
    missingFields.push({ key: 'age', label: 'Age', weight: 5 })
  }

  if (profile.gender) {
    score += 5
  } else {
    missingFields.push({ key: 'gender', label: 'Gender', weight: 5 })
  }

  // 2. Photo (10%)
  if (profile.photo) {
    score += 10
  } else {
    missingFields.push({ key: 'photo', label: 'Profile Photo', weight: 10 })
  }

  // 3. Bio (10%)
  if (profile.bio && profile.bio.trim().length >= 10) {
    score += 10
  } else {
    missingFields.push({ key: 'bio', label: 'Bio (min 10 chars)', weight: 10 })
  }

  // 4. Voice Intro (15%)
  if (profile.voiceIntro && profile.voiceIntro.trim().length > 0) {
    score += 15
  } else {
    missingFields.push({ key: 'voiceIntro', label: 'Voice Introduction', weight: 15 })
  }

  // 5. Interests (10%)
  if (profile.interests && profile.interests.length >= 3) {
    score += 10
  } else {
    missingFields.push({ key: 'interests', label: 'Interests (min 3)', weight: 10 })
  }

  // 6. Questions (10%)
  // Check for either uploaded audio (audioUrl) OR local recording (audioFile)
  const answeredCount =
    profile.questions?.filter(q => {
      const hasQuestionId = !!q.questionId
      const hasAudioUrl = !!q.audioUrl
      const hasAudioFile = !!(q as QuestionAnswerWithFile).audioFile
      return hasQuestionId && (hasAudioUrl || hasAudioFile)
    }).length || 0

  // 3.33 points per question, max 10 points
  const questionScore = Math.min(answeredCount, 3) * (10 / 3)
  score += questionScore

  if (answeredCount < 3) {
    missingFields.push({
      key: 'questions',
      label: `Voice Answers (${3 - answeredCount} more needed)`,
      weight: 10 - questionScore,
    })
  }

  // 7. Contact Info (20%) - Instagram
  const instagram = profile.contactInfo?.instagram?.userName
  if (instagram) {
    score += 20
  } else {
    missingFields.push({ key: 'instagram', label: 'Instagram', weight: 20 })
  }

  // HARD PENALTY CAP SYSTEM
  // If critical fields are missing, cap score at 75%
  // This guarantees 80% is only reachable if ALL criticals are present
  const hasCriticalIdentity =
    profile.firstName &&
    profile.lastName &&
    profile.nickName &&
    profile.age &&
    profile.gender

  const hasCriticalContent =
    profile.photo &&
    profile.bio &&
    profile.bio.trim().length >= 10 &&
    profile.voiceIntro &&
    profile.voiceIntro.trim().length > 0

  const hasCriticalEngagement = answeredCount >= 3 && profile.interests && profile.interests.length >= 3

  const hasCriticalContact = !!instagram

  // If ANY of these "Gate Components" are missing, the user CANNOT pass 80%
  const isGateOpen = hasCriticalIdentity && hasCriticalContent && hasCriticalEngagement && hasCriticalContact

  const maxScore = isGateOpen ? 100 : 75

  const finalScore = Math.min(Math.round(score), maxScore)

  return {
    score: finalScore,
    isFeatureUnlocked: finalScore >= 80,
    missingFields,
  }
}
