'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  useAnimation,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion'
import { type User } from '@shared/types'
import { type SwipeAction } from '../types'

const SWIPE_THRESHOLD = 100
const ROTATION_RANGE = 15

interface UseSwipeCardProps {
  candidate: User
  onSwipe?: (type: SwipeAction) => Promise<void>
}

export const useSwipeCard = ({ candidate, onSwipe }: UseSwipeCardProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [stampType, setStampType] = useState<'SMASH' | 'PASS' | 'SUPER' | null>(null)
  const [showStamp, setShowStamp] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const controls = useAnimation()
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotate = useTransform(x, [-300, 0, 300], [-ROTATION_RANGE, 0, ROTATION_RANGE])
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  const superOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0])
  const cardOpacity = useMotionValue(1)

  const photos = useMemo(() => {
    const photoList = []
    if (candidate.profile?.photo) photoList.push(candidate.profile.photo)
    if (candidate.profile?.photos) photoList.push(...candidate.profile.photos)
    return photoList.filter(Boolean) as string[]
  }, [candidate.profile?.photo, candidate.profile?.photos])

  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [voiceAudio, setVoiceAudio] = useState<HTMLAudioElement | null>(null)

  const handleToggleVoice = useCallback(() => {
    if (!candidate.profile?.voiceIntro) return

    if (isPlayingVoice && voiceAudio) {
      voiceAudio.pause()
      setIsPlayingVoice(false)
    } else {
      if (!voiceAudio) {
        const audio = new Audio(candidate.profile.voiceIntro)
        audio.onended = () => setIsPlayingVoice(false)
        setVoiceAudio(audio)
        audio.play()
      } else {
        voiceAudio.play()
      }
      setIsPlayingVoice(true)
    }
  }, [candidate.profile?.voiceIntro, isPlayingVoice, voiceAudio])

  useEffect(() => {
    return () => {
      if (voiceAudio) {
        voiceAudio.pause()
        voiceAudio.src = ''
      }
    }
  }, [voiceAudio])

  const nextPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
    }
  }, [photos.length])

  const prevPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }
  }, [photos.length])

  const triggerSwipe = useCallback(
    async (type: SwipeAction) => {
      let stamp: 'SMASH' | 'PASS' | 'SUPER' = 'SMASH'
      let exitX = 0
      let exitY = 0

      if (type === 'pass') {
        stamp = 'PASS'
        exitX = -400
      } else if (type === 'super') {
        stamp = 'SUPER'
        exitY = -400
      } else {
        exitX = 400
      }

      setStampType(stamp)
      setShowStamp(true)
      await new Promise((resolve) => setTimeout(resolve, 400))
      setShowStamp(false)

      await controls.start({
        x: exitX,
        y: exitY,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      })
    },
    [controls]
  )

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      setIsDragging(false)
      const swipeX = info.offset.x
      const swipeY = info.offset.y
      const velocityX = info.velocity.x
      const velocityY = info.velocity.y

      const isSwipeRight = swipeX > SWIPE_THRESHOLD || velocityX > 500
      const isSwipeLeft = swipeX < -SWIPE_THRESHOLD || velocityX < -500
      const isSwipeUp = swipeY < -SWIPE_THRESHOLD || velocityY < -500

      if (isSwipeUp && Math.abs(swipeY) > Math.abs(swipeX)) {
        await triggerSwipe('super')
        onSwipe?.('super')
      } else if (isSwipeRight) {
        await triggerSwipe('smash')
        onSwipe?.('smash')
      } else if (isSwipeLeft) {
        await triggerSwipe('pass')
        onSwipe?.('pass')
      } else {
        await controls.start({
          x: 0,
          y: 0,
          transition: { type: 'spring', stiffness: 500, damping: 30 },
        })
        x.set(0)
        y.set(0)
      }
    },
    [controls, onSwipe, x, y, triggerSwipe]
  )

  return {
    currentPhotoIndex,
    setCurrentPhotoIndex,
    photos,
    nextPhoto,
    prevPhoto,
    isPlayingVoice,
    handleToggleVoice,
    stampType,
    showStamp,
    isDragging,
    setIsDragging,
    handleDragEnd,
    triggerSwipe,
    motionValues: { x, y, rotate, likeOpacity, passOpacity, superOpacity, cardOpacity, controls },
  }
}
