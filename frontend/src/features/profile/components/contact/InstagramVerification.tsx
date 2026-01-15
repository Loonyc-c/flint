'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Instagram, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'react-toastify'
import { getContactInfo, updateContactInfo, getInstagramConnectUrl } from '../../api/profile'
import { useUser } from '@/features/auth/context/UserContext'
import { cn } from '@/lib/utils'
import { type UserContactInfo } from '@shared/types'

export const InstagramVerification = () => {
  const { user } = useUser()
  const [handle, setHandle] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchContactInfo = async () => {
      if (!user?.id) return
      try {
        const { contactInfo } = await getContactInfo(user.id)
        if (contactInfo) {
          setHandle(contactInfo.instagram || '')
          setIsVerified(contactInfo.verifiedPlatforms?.includes('instagram') || false)
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContactInfo()
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      const { contactInfo } = await getContactInfo(user.id)
      const updatedInfo: UserContactInfo = {
        ...(contactInfo || { verifiedPlatforms: [] }),
        instagram: handle,
        verifiedPlatforms: contactInfo?.verifiedPlatforms || [],
      }
      await updateContactInfo(user.id, updatedInfo)
      toast.success('Instagram handle saved!')
    } catch (_) {
      toast.error('Failed to save handle')
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerify = () => {
    if (!user?.id) return
    window.location.href = getInstagramConnectUrl(user.id)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/20">
          <Instagram className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Instagram Verification</h3>
          <p className="text-sm text-muted-foreground">Verify your account to build trust</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@yourusername"
            disabled={isVerified}
            className={cn(
              "w-full pl-4 pr-12 py-4 rounded-2xl border bg-neutral-50 dark:bg-black/50 transition-all outline-none text-lg font-medium",
              isVerified 
                ? "border-green-500/30 text-green-600 dark:text-green-400" 
                : "border-neutral-200 dark:border-neutral-800 focus:border-brand focus:ring-4 focus:ring-brand/10"
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isVerified ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : handle ? (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="text-brand hover:text-brand-600 transition-colors"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
              </button>
            ) : null}
          </div>
        </div>

        {isVerified ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Your Instagram is verified and will be shared in Stage 3.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Verify your account to get the blue badge and show your real profile.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleVerify}
              className="w-full bg-gradient-to-r from-brand to-brand-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/20 flex items-center justify-center gap-2"
            >
              <Instagram className="w-5 h-5" />
              Verify via Instagram
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
