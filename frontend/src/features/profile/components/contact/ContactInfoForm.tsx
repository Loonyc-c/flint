'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Instagram, MessageCircle, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'

// =============================================================================
// Local Schema (without default to avoid type issues with react-hook-form)
// =============================================================================

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
  isContactVerified: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

// =============================================================================
// Types
// =============================================================================

interface ContactInfoFormProps {
  initialData?: Partial<FormData>
  onSubmit: (data: FormData) => Promise<void>
  className?: string
}

// =============================================================================
// Field Config
// =============================================================================

const contactFields = [
  { name: 'phone', label: 'Phone Number', placeholder: '+1 234 567 8900', icon: Phone },
  { name: 'instagram', label: 'Instagram', placeholder: '@yourusername', icon: Instagram },
  { name: 'telegram', label: 'Telegram', placeholder: '@yourusername', icon: MessageCircle },
  { name: 'snapchat', label: 'Snapchat', placeholder: 'yourusername', icon: MessageCircle },
  { name: 'whatsapp', label: 'WhatsApp', placeholder: '+1 234 567 8900', icon: Phone },
  { name: 'wechat', label: 'WeChat', placeholder: 'yourwechatid', icon: MessageCircle },
  { name: 'other', label: 'Other', placeholder: 'Any other contact info', icon: MessageCircle },
] as const

// =============================================================================
// Component
// =============================================================================

export const ContactInfoForm = ({ initialData, onSubmit, className }: ContactInfoFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: initialData?.phone || '',
      instagram: initialData?.instagram || '',
      telegram: initialData?.telegram || '',
      snapchat: initialData?.snapchat || '',
      whatsapp: initialData?.whatsapp || '',
      wechat: initialData?.wechat || '',
      other: initialData?.other || '',
      isContactVerified: initialData?.isContactVerified || false,
    },
  })

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-4', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Contact Information</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Add your contact details to share with matches after completing Stage 3
        </p>
      </div>

      <div className="grid gap-4">
        {contactFields.map(({ name, label, placeholder, icon: Icon }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {label}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <Icon className="w-5 h-5" />
              </div>
              <input
                {...register(name as keyof FormData)}
                type="text"
                placeholder={placeholder}
                className={cn(
                  'w-full pl-11 pr-4 py-3 rounded-xl border bg-white dark:bg-neutral-800',
                  'text-neutral-900 dark:text-white placeholder:text-neutral-400',
                  'focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all',
                  errors[name as keyof FormData]
                    ? 'border-red-500'
                    : 'border-neutral-200 dark:border-neutral-700'
                )}
              />
            </div>
            {errors[name as keyof FormData] && (
              <p className="text-red-500 text-xs mt-1">
                {errors[name as keyof FormData]?.message}
              </p>
            )}
          </div>
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
            isDirty
              ? 'bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Contact Info
            </>
          )}
        </motion.button>
      </div>

      <p className="text-xs text-neutral-400 text-center">
        Your contact info will only be shared with matches who complete Stage 3 with you
      </p>
    </form>
  )
}
