'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Instagram, MessageCircle, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useUser } from '@/features/auth/context/UserContext'
import { getInstagramConnectUrl } from '../../api/profile'
import { ContactField } from './ContactField'

const formSchema = z.object({
  phone: z.string().max(20, "Phone number too long").optional(),
  instagram: z.string().max(50, "Instagram handle too long").optional(),
  telegram: z.string().max(50, "Telegram handle too long").optional(),
  snapchat: z.string().max(50, "Snapchat handle too long").optional(),
  whatsapp: z.string().max(20, "WhatsApp number too long").optional(),
  wechat: z.string().max(50, "WeChat ID too long").optional(),
  facebook: z.string().max(100, "Facebook URL too long").optional(),
  twitter: z.string().max(50, "Twitter handle too long").optional(),
  linkedin: z.string().max(100, "LinkedIn URL too long").optional(),
  other: z.string().max(200, "Other contact info too long").optional(),
  verifiedPlatforms: z.array(z.string()).optional(),
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
  const { user } = useUser()

  const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: initialData?.phone || '',
      instagram: initialData?.instagram || '',
      telegram: initialData?.telegram || '',
      snapchat: initialData?.snapchat || '',
      whatsapp: initialData?.whatsapp || '',
      wechat: initialData?.wechat || '',
      other: initialData?.other || '',
      verifiedPlatforms: initialData?.verifiedPlatforms || [],
    },
  })

  const verifiedPlatforms = watch('verifiedPlatforms') || []

  const handleConnectInstagram = () => {
    if (user?.id) window.open(getInstagramConnectUrl(user.id), '_blank')
  }

  const contactFields = [
    { name: 'phone', label: t('labels.phone'), placeholder: t('placeholders.phone'), icon: Phone },
    { name: 'instagram', label: t('labels.instagram'), placeholder: t('placeholders.instagram'), icon: Instagram, verifiable: true },
    { name: 'telegram', label: t('labels.telegram'), placeholder: t('placeholders.telegram'), icon: MessageCircle },
    { name: 'snapchat', label: t('labels.snapchat'), placeholder: t('placeholders.snapchat'), icon: MessageCircle },
    { name: 'whatsapp', label: t('labels.whatsapp'), placeholder: t('placeholders.whatsapp'), icon: Phone },
    { name: 'wechat', label: t('labels.wechat'), placeholder: t('placeholders.wechat'), icon: MessageCircle },
    { name: 'other', label: t('labels.other'), placeholder: t('placeholders.other'), icon: MessageCircle },
  ] as const

  return (
    <form onSubmit={handleSubmit(async (data) => {
      setIsSubmitting(true)
      try { await onSubmit(data) } finally { setIsSubmitting(false) }
    })} className={cn('space-y-4', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">{t('title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4">
        {contactFields.map((field) => (
          <ContactField
            key={field.name}
            {...field}
            isVerified={verifiedPlatforms.includes(field.name)}
            register={register}
            error={errors[field.name as keyof FormData]?.message}
            onConnect={field.name === 'instagram' ? handleConnectInstagram : undefined}
          />
        ))}
      </div>

      <div className="pt-4">
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
      <p className="text-xs text-center text-muted-foreground">{t('footerNote')}</p>
    </form>
  )
}