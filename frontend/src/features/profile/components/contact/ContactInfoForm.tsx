'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Instagram, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

// Minimal schema matching our new requirement
const formSchema = z.object({
  instagram: z.string().min(1, "Instagram handle is required so your matches can connect with you after Stage 2.").max(50, "Instagram handle too long"),
  verifiedPlatforms: z.array(z.string()).default([]),
})

type FormData = z.infer<typeof formSchema>

interface ContactInfoFormProps {
  initialData?: Partial<FormData>
  onSubmit: (data: FormData) => Promise<void>
  className?: string
}

export const ContactInfoForm = ({ initialData, onSubmit, className }: ContactInfoFormProps) => {
  const t = useTranslations('profile.contact')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      instagram: initialData?.instagram || '',
      verifiedPlatforms: initialData?.verifiedPlatforms || [],
    },
  })

  const verifiedPlatforms = watch('verifiedPlatforms') || []
  const isVerified = verifiedPlatforms.includes('instagram')

  return (
    <form onSubmit={handleSubmit(async (data) => {
      setIsSubmitting(true)
      try { await onSubmit(data) } finally { setIsSubmitting(false) }
    })} className={cn('space-y-6', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Instagram className="w-5 h-5 text-instagram" />
          {t('labels.instagram')} <span className="text-destructive">*</span>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('instagramDesc')}
        </p>
      </div>

      <div className="bg-card/50 border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <input
              {...register('instagram')}
              disabled={isVerified}
              className={cn(
                "w-full bg-background/50 border rounded-lg py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 transition-all",
                errors.instagram ? "border-destructive focus:ring-destructive/20" : "border-input focus:ring-brand/20"
              )}
              placeholder="username"
            />
          </div>
        </div>
        {errors.instagram && <p className="mt-1 text-xs text-destructive">{errors.instagram.message}</p>}

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {t('instagramNote')}
          </p>
          {isVerified && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-500">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>

      <div className="pt-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isSubmitting || !isDirty}
          className={cn(
            'w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
            isDirty ? 'bg-brand hover:bg-brand/90 text-brand-foreground shadow-lg shadow-brand/20' : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />{t('saving')}</> : <><Save className="w-5 h-5" />{t('saveButton')}</>}
        </motion.button>
      </div>
    </form>
  )
}
