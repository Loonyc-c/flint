'use client'

import { motion } from 'framer-motion'
import { Instagram, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { useTranslations } from 'next-intl'
import type { ContactInfoDisplay } from '@shared/types'

interface ContactRevealCardProps {
  isRevealed: boolean
  hasInstagram: boolean
  contactInfo: ContactInfoDisplay
}

export const ContactRevealCard = ({ isRevealed, hasInstagram, contactInfo }: ContactRevealCardProps) => {
  const t = useTranslations('video.staged.exchange')
  const verifiedPlatforms = contactInfo.verifiedPlatforms || []

  if (!isRevealed) {
    return (
      <div className="flex flex-col items-center py-8">
        <Loader2 className="w-8 h-8 text-brand animate-spin mb-2" />
        <p className="text-neutral-400 text-sm font-medium animate-pulse">{t('revealing')}</p>
      </div>
    )
  }

  if (!hasInstagram) {
    return <p className="text-neutral-400 text-center py-4">{t('empty')}</p>
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20, scale: 0.8 }} 
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
      onClick={() => {
        navigator.clipboard.writeText(contactInfo.instagram || "")
        toast.success(t('copied', { label: 'Instagram' }))
      }}
    >
      <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center relative group-hover:scale-110 transition-transform">
        <Instagram className="w-5 h-5 text-brand" />
        {verifiedPlatforms.includes('instagram') && (
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
            <CheckCircle2 className="w-3 h-3 text-success fill-success/20" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Instagram</p>
          {verifiedPlatforms.includes('instagram') && (
            <span className="text-[8px] font-bold text-success uppercase tracking-tighter">
              {t('verified')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-white font-medium truncate flex-1">{contactInfo.instagram}</p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const handle = (contactInfo.instagram as string).replace('@', '')
              window.open(`https://instagram.com/${handle}`, '_blank')
            }}
            className="p-1 rounded bg-brand/10 hover:bg-brand/20 text-brand transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
