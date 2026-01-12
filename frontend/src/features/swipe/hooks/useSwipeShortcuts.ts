'use client'

import { useEffect } from 'react'
import { type SwipeAction } from '../types'
import { type User } from '@shared/types'

interface UseSwipeShortcutsProps {
  currentCandidate: User | undefined
  showMatchModal: boolean
  handleUndo: () => void
  onSwipeAction: (type: SwipeAction) => void
}

export const useSwipeShortcuts = ({
  currentCandidate,
  showMatchModal,
  handleUndo,
  onSwipeAction,
}: UseSwipeShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (showMatchModal || !currentCandidate) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          void onSwipeAction('pass')
          break
        case 'ArrowRight':
          e.preventDefault()
          void onSwipeAction('smash')
          break
        case 'ArrowUp':
          e.preventDefault()
          void onSwipeAction('super')
          break
        case 'z':
        case 'Z':
          e.preventDefault()
          handleUndo()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCandidate, showMatchModal, handleUndo, onSwipeAction])
}
