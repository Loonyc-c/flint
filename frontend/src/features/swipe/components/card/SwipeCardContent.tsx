'use client'

import { type User } from '@shared/types'
import { useTranslations } from 'next-intl'
import { VoiceIntroDisplay } from './VoiceIntroDisplay'
import { InterestsSection } from '@/features/profile/components/interests/InterestsSection'
import { AnsweredQuestionPlayer } from '@/features/profile/components/questions/AnsweredQuestionPlayer'
import { type QuestionAnswerFormState } from '@/features/profile/components/questions/QuestionsSection'
import { MessageSquare, User as UserIcon } from 'lucide-react'

interface SwipeCardContentProps {
  candidate: User
}

/**
 * Scrollable content area displaying profile details:
 * - Voice intro
 * - Bio
 * - Interests
 * - Question answers
 */
export const SwipeCardContent = ({ candidate }: SwipeCardContentProps) => {
  const t = useTranslations('swipe.card')
  const profile = candidate.profile

  // Convert questions to the format expected by AnsweredQuestionPlayer
  const questions: QuestionAnswerFormState[] = (profile?.questions || []).map(q => ({
    questionId: q.questionId,
    audioUrl: q.audioUrl,
    uploadId: q.uploadId,
    audioFile: q.audioUrl,
  }))

  return (
    <div
      className="relative flex-1 w-full z-20 overflow-y-auto custom-scrollbar overscroll-contain touch-pan-y-only bg-linear-to-t from-background via-background to-background/95"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="p-4 sm:p-6 space-y-6 pb-24">
        {/* Voice Intro Section */}
        {profile?.voiceIntro && (
          <VoiceIntroDisplay voiceIntroUrl={profile.voiceIntro} />
        )}

        {/* Bio Section */}
        {profile?.bio && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {t('bio')}
              </h3>
            </div>
            <div className="p-4 bg-card border border-border rounded-2xl">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          </div>
        )}

        {/* Interests Section */}
        {profile?.interests && profile.interests.length > 0 && (
          <InterestsSection
            selectedInterests={profile.interests}
            mode="display"
          />
        )}

        {/* Questions Section */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {t('questions')}
              </h3>
            </div>
            <div className="space-y-4">
              {questions.map((qa, index) => (
                <AnsweredQuestionPlayer key={index} qa={qa} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!profile?.voiceIntro && !profile?.bio && (!profile?.interests || profile.interests.length === 0) && questions.length === 0 && (
          <div className="py-12 text-center">
            <UserIcon className="w-12 h-12 mx-auto mb-3 text-muted" />
            <p className="text-muted-foreground">{t('noProfileInfo')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

