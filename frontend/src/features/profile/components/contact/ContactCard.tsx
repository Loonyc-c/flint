'use client'

import { motion } from 'framer-motion'
import { Instagram, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserContactInfo } from '@shared/types'
import { useTranslations } from 'next-intl'

interface ContactCardProps {
  contactInfo: UserContactInfo | null
  userName?: string
  showVerification?: boolean
  className?: string
  compact?: boolean
}

export const ContactCard = ({
  contactInfo,
  userName,
  showVerification = false,
  className,
  compact = false,
}: ContactCardProps) => {
  const t = useTranslations('profile.contact')

  if (!contactInfo?.instagram) {
    return (
      <div className={cn('p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center', className)}>
        <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400">{t('empty') || "No contact info shared."}</p>
      </div>
    )
  }

  const isVerified = contactInfo.verifiedPlatforms?.includes('instagram')

  return (
    <div className={cn('rounded-2xl bg-white dark:bg-neutral-800 shadow-lg overflow-hidden', className)}>
      {/* Header */}
      {userName && (
        <div className="px-5 py-4 bg-gradient-to-r from-brand/10 to-brand/5 border-b border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-neutral-900 dark:text-white">{t('partnerContact', { name: userName })}</h4>
            {showVerification && (
              <div className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                isVerified
                  ? 'bg-success/20 text-success'
                  : 'bg-warning/20 text-warning'
              )}>
                {isVerified ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('verified')}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    {t('unverified')}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact List - Just Instagram now */}
      <div className={cn('p-4', compact ? 'space-y-2' : 'space-y-3')}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50',
            compact && 'p-2'
          )}
        >
          <div className={cn(
            'rounded-full flex items-center justify-center',
            compact ? 'w-8 h-8' : 'w-10 h-10',
            'bg-white dark:bg-neutral-700 shadow-sm'
          )}>
            <Instagram className="w-4 h-4 text-instagram" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{t('labels.instagram') || "Instagram"}</p>
            <p className={cn(
              'font-medium text-neutral-900 dark:text-white truncate',
              compact && 'text-sm'
            )}>
              {contactInfo.instagram}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}