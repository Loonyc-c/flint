'use client'

import { motion } from 'framer-motion'
import { Phone, Instagram, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserContactInfo } from '@shared/types'
import { useTranslations } from 'next-intl'

// =============================================================================
// Types
// =============================================================================

interface ContactCardProps {
  contactInfo: UserContactInfo | null
  userName?: string
  showVerification?: boolean
  className?: string
  compact?: boolean
}

// =============================================================================
// Component
// =============================================================================

export const ContactCard = ({
  contactInfo,
  userName,
  showVerification = false,
  className,
  compact = false,
}: ContactCardProps) => {
  const t = useTranslations('profile.contact')

  const contactConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    phone: { icon: Phone, label: t('labels.phone'), color: 'text-green-500' },
    instagram: { icon: Instagram, label: t('labels.instagram'), color: 'text-pink-500' },
    telegram: { icon: MessageCircle, label: t('labels.telegram'), color: 'text-blue-500' },
    snapchat: { icon: MessageCircle, label: t('labels.snapchat'), color: 'text-yellow-500' },
    whatsapp: { icon: Phone, label: t('labels.whatsapp'), color: 'text-green-500' },
    wechat: { icon: MessageCircle, label: t('labels.wechat'), color: 'text-green-600' },
    facebook: { icon: MessageCircle, label: t('labels.facebook'), color: 'text-blue-600' },
    twitter: { icon: MessageCircle, label: t('labels.twitter'), color: 'text-sky-500' },
    linkedin: { icon: MessageCircle, label: t('labels.linkedin'), color: 'text-blue-700' },
    other: { icon: MessageCircle, label: t('labels.other'), color: 'text-neutral-500' },
  }

  if (!contactInfo) {
    return (
      <div className={cn('p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center', className)}>
        <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      </div>
    )
  }

  // Filter valid contacts
  const validContacts = Object.entries(contactInfo).filter(
    ([key, value]) => value && key !== 'verifiedPlatforms' && contactConfig[key]
  )

  if (validContacts.length === 0) {
    return (
      <div className={cn('p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center', className)}>
        <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400">{t('noDetails')}</p>
      </div>
    )
  }

  const isAnyVerified = (contactInfo.verifiedPlatforms?.length || 0) > 0

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
                isAnyVerified
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              )}>
                {isAnyVerified ? (
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

      {/* Contact List */}
      <div className={cn('p-4', compact ? 'space-y-2' : 'space-y-3')}>
        {validContacts.map(([key, value], index) => {
          const config = contactConfig[key]
          if (!config) return null
          const Icon = config.icon

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
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
                <Icon className={cn('w-4 h-4', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-400 dark:text-neutral-500">{config.label}</p>
                <p className={cn(
                  'font-medium text-neutral-900 dark:text-white truncate',
                  compact && 'text-sm'
                )}>
                  {value as string}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
