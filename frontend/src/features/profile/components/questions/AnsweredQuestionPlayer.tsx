'use client'

import { useState, useEffect } from 'react'
import { QUESTION_POOL } from '@/shared-types/types'
import { CustomAudioPlayer } from '@/components/ui/custom-audio-player'
import { type QuestionAnswerFormState } from './QuestionsSection'

interface AnsweredQuestionPlayerProps {
  qa: QuestionAnswerFormState
}

export const AnsweredQuestionPlayer = ({ qa }: AnsweredQuestionPlayerProps) => {
  const [url, setUrl] = useState<string | undefined>(
    typeof qa.audioFile === 'string' ? qa.audioFile : qa.audioUrl
  )

  const questionText = QUESTION_POOL.find(q => q.id === qa.questionId)?.text

  useEffect(() => {
    let newUrl: string | undefined

    if (qa.audioFile && typeof qa.audioFile !== 'string') {
      newUrl = URL.createObjectURL(qa.audioFile)
      setUrl(newUrl)
    } else if (typeof qa.audioFile === 'string') {
      setUrl(qa.audioFile)
    } else {
      setUrl(qa.audioUrl)
    }

    return () => {
      if (newUrl) {
        URL.revokeObjectURL(newUrl)
      }
    }
  }, [qa.audioFile, qa.audioUrl])

  if (!url) return null

  return (
    <CustomAudioPlayer
      audioUrl={url}
      question={questionText}
      showQuestion={true}
      size="medium"
    />
  )
}