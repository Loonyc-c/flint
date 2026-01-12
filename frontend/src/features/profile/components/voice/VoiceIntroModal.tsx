'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import QuestionVoiceRecorder from '../questions/QuestionVoiceRecorder'
import { useTranslations } from 'next-intl'

interface VoiceIntroModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (audioFile: Blob | string | undefined) => void
  initialAudio?: Blob | string
}

export const VoiceIntroModal = ({
  isOpen,
  onClose,
  onSave,
  initialAudio,
}: VoiceIntroModalProps) => {
  const t = useTranslations('profile.voice.modal')

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-md p-6 shadow-2xl bg-card rounded-3xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  {t('title')}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center transition-colors rounded-full w-9 h-9 hover:bg-accent shrink-0"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <QuestionVoiceRecorder
              initialAudioFile={initialAudio}
              onSave={(audioFile) => {
                onSave(audioFile)
                onClose()
              }}
              onCancel={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
