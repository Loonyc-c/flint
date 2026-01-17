'use client'

import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LiveCallStateEndedProps {
    hasLiked: boolean
    hasPassed: boolean
    onClose: () => void
}

export const LiveCallStateEnded = ({ hasLiked, hasPassed, onClose }: LiveCallStateEndedProps) => {
    const t = useTranslations('home.findMatch.liveCall')

    return (
        <div className="p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <X className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{t('callEnded')}</h3>
            {hasLiked && !hasPassed && (
                <p className="text-brand font-medium mb-8 bg-brand/10 px-4 py-2 rounded-full text-sm">
                    {t('matchPending')}
                </p>
            )}
            <Button
                onClick={onClose}
                className="w-full h-12 rounded-2xl font-bold bg-brand hover:bg-brand-300 text-brand-foreground shadow-lg shadow-brand/20"
            >
                {t('backToHome')}
            </Button>
        </div>
    )
}
