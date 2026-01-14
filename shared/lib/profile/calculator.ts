import type { ProfileUpdateRequest } from '../../types/user'

interface ProfileForCalculation extends Partial<ProfileUpdateRequest> {
  audioFile?: unknown
}

interface QuestionForCalculation {
  questionId?: string
  audioUrl?: string
  audioFile?: unknown
}

/**

 * Calculates the profile completeness score based on filled fields.

 */

export const calculateProfileCompleteness = (profile: ProfileForCalculation): number => {

  let score = 0



  // 1. Base Requirements (Leniency added)

  if (profile.nickName) score += 15

  if (profile.age) score += 15

  if (profile.gender) score += 10

  if (profile.photo) score += 20



  // 1.1 Voice Intro (Optional but adds score)

  if (profile.voiceIntro) {

    score += 10

  }



  // 2. Questions (Max 15)

  if (profile.questions && Array.isArray(profile.questions)) {

    const answeredCount = profile.questions.filter((q: QuestionForCalculation) => q.questionId && (q.audioUrl || q.audioFile)).length

    score += Math.min(answeredCount, 3) * 5

  }



  // 3. Bio (Max 10)

  if (profile.bio && profile.bio.trim().length > 0) {

    score += 10

  }



  // 4. Interests (Max 10)

  if (profile.interests && profile.interests.length > 0) {

    score += 5

  }



  return Math.min(score, 100)

}
