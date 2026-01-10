'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Heart, ArrowLeft, Sparkles, Lock } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ChatThread } from '@/features/chat/components/ChatThread'
import { SwipeFeature } from '@/features/swipe/components/SwipeFeature'
import { MatchesList } from './MatchesList'
import { useMatches } from '@/features/swipe/hooks/useMatches'
import { useLikes } from '@/features/swipe/hooks/useLikes'
import { useVideoCall } from '@/features/realtime'
import { VideoCallModal, IncomingCallModal } from '@/features/video'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { toast } from 'react-toastify'

// =============================================================================
// Component
// =============================================================================

/**
 * Discovery Hub: A unified layout for swiping and chatting.
 * Features a persistent sidebar and a dynamic main content area.
 */
export const DiscoveryHub = () => {
  const t = useTranslations('chat')
  
  const { matches, isLoading: isLoadingMatches, refreshMatches } = useMatches()
  const { likeCount, isLoading: isLoadingLikes, refreshLikes } = useLikes()
  const [activeView, setActiveView] = useState<'swipe' | 'chat' | 'matches' | 'likes' | 'messages'>('swipe')
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)
  
  // Video call state
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)
  const [videoCallChannel, setVideoCallChannel] = useState<string | null>(null)
  const [videoCallMatchId, setVideoCallMatchId] = useState<string | null>(null)

  // Video call hook for signaling
  const {
    incomingCall,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
  } = useVideoCall({
    onCallAccepted: (data) => {
      setVideoCallChannel(data.channelName)
      setVideoCallMatchId(data.matchId)
      setIsVideoCallOpen(true)
    },
    onCallDeclined: () => {
      toast.info('Call declined')
      setVideoCallChannel(null)
      setVideoCallMatchId(null)
    },
    onCallEnded: () => {
      setIsVideoCallOpen(false)
      setVideoCallChannel(null)
      setVideoCallMatchId(null)
    },
    onCallTimeout: () => {
      toast.info('Call not answered')
      setVideoCallChannel(null)
      setVideoCallMatchId(null)
    },
  })

  const handleSelectMatch = (matchId: string) => {
    setActiveMatchId(matchId)
    setActiveView('chat')
  }

  const handleCloseView = () => {
    setActiveMatchId(null)
    setActiveView('swipe')
    refreshMatches()
    refreshLikes()
  }

  // Must be declared before callbacks that use it
  const activeConversation = matches.find(m => m.matchId === activeMatchId)

  // Handle video call from chat
  const handleVideoCall = useCallback(() => {
    if (!activeConversation) return
    
    const matchId = activeConversation.matchId
    const calleeId = activeConversation.otherUser.id
    
    initiateCall(matchId, calleeId)
  }, [activeConversation, initiateCall])

  // Handle accepting incoming call
  const handleAcceptCall = useCallback(() => {
    if (!incomingCall) return
    
    acceptCall(incomingCall.matchId)
    setVideoCallChannel(incomingCall.channelName)
    setVideoCallMatchId(incomingCall.matchId)
    setIsVideoCallOpen(true)
  }, [incomingCall, acceptCall])

  // Handle declining incoming call
  const handleDeclineCall = useCallback(() => {
    if (!incomingCall) return
    declineCall(incomingCall.matchId)
  }, [incomingCall, declineCall])

  // Handle ending video call
  const handleEndVideoCall = useCallback(() => {
    if (videoCallMatchId) {
      endCall(videoCallMatchId)
    }
    setIsVideoCallOpen(false)
    setVideoCallChannel(null)
    setVideoCallMatchId(null)
  }, [videoCallMatchId, endCall])
  
  // Find caller info for incoming call
  const incomingCallMatch = incomingCall 
    ? matches.find(m => m.matchId === incomingCall.matchId)
    : null

  const matchCount = matches.length
  const hiddenCount = 0

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  return (
    <div className="w-full flex justify-center min-h-screen lg:min-h-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-[1200px] px-0 sm:px-4 md:px-6 lg:px-8 py-0 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          
          {/* Sidebar - Desktop only */}
          <aside className={cn(
            "w-full lg:sticky lg:top-4 lg:self-start h-[calc(100vh-2rem)] sm:h-[800px]",
            "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
            "sm:rounded-3xl overflow-hidden",
            "shadow-xl shadow-neutral-200/50 dark:shadow-neutral-950/50",
            "hidden lg:block"
          )}>
            <Sidebar 
              conversations={matches} 
              activeMatchId={activeMatchId}
              matchCount={matchCount}
              likeCount={likeCount}
              hiddenCount={hiddenCount}
              onPick={handleSelectMatch}
              onOpenMatches={() => setActiveView('matches')}
              onOpenLikes={() => setActiveView('likes')}
              isLoading={isLoadingMatches || isLoadingLikes}
            />
          </aside>

          {/* Main Content */}
          <main className="min-w-0 w-full flex flex-col h-[calc(100dvh-1rem)] sm:h-[800px] relative">
            
            {/* Mobile Navigation Bar */}
            <AnimatePresence mode="wait">
              {activeView === 'swipe' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand" />
                    <h1 className="text-xl font-black text-transparent bg-gradient-to-r from-brand to-brand-300 bg-clip-text">
                      Flint
                    </h1>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveView('matches')}
                      className="relative p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Heart className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                      {matchCount > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-brand to-brand-300 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-brand/30"
                        >
                          {matchCount}
                        </motion.span>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveView('messages')}
                      className="relative p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <MessageSquare className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                      {matches.filter(m => m.unreadCount > 0).length > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-red-500/30"
                        >
                          {matches.filter(m => m.unreadCount > 0).length}
                        </motion.span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Views */}
            <AnimatePresence mode="wait">
              {/* Swipe View */}
              {activeView === 'swipe' && (
                <motion.div
                  key="swipe"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-h-0 w-full overflow-hidden bg-white/50 dark:bg-neutral-900/50 sm:rounded-3xl sm:shadow-xl sm:shadow-neutral-200/30 dark:sm:shadow-neutral-950/30"
                >
                  <SwipeFeature />
                </motion.div>
              )}

              {/* Chat View */}
              {activeView === 'chat' && activeConversation && (
                <motion.div
                  key="chat"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="h-full w-full overflow-hidden sm:rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl shadow-neutral-200/50 dark:shadow-neutral-950/50"
                >
                  <ChatThread 
                    conversation={activeConversation} 
                    onClose={handleCloseView}
                    onVideoCall={handleVideoCall}
                  />
                </motion.div>
              )}

              {/* Matches Grid View */}
              {activeView === 'matches' && (
                <motion.div
                  key="matches"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="h-full w-full flex flex-col sm:rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl shadow-neutral-200/30 dark:shadow-neutral-950/30 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-white/90 to-white/70 dark:from-neutral-900/90 dark:to-neutral-900/70 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCloseView}
                        className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                      </motion.button>
                      <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{t('matches')}</h2>
                        <p className="text-xs text-neutral-500">{matchCount} people</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <MatchesList matches={matches} onSelect={handleSelectMatch} />
                  </div>
                </motion.div>
              )}

              {/* Likes Grid View - Coming Soon */}
              {activeView === 'likes' && (
                <motion.div
                  key="likes"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="h-full w-full flex flex-col sm:rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl shadow-neutral-200/30 dark:shadow-neutral-950/30 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-white/90 to-white/70 dark:from-neutral-900/90 dark:to-neutral-900/70 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCloseView}
                        className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                      </motion.button>
                      <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{t('likes')}</h2>
                        <p className="text-xs text-neutral-500">Coming soon</p>
                      </div>
                    </div>
                  </div>
                  {/* Coming Soon State */}
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6"
                    >
                      <Lock className="w-10 h-10 text-amber-500" />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl font-bold text-neutral-900 dark:text-white mb-2"
                    >
                      Coming Soon
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-neutral-500 dark:text-neutral-400 text-center max-w-xs"
                    >
                      See who likes you! This feature is coming soon. Stay tuned for updates.
                    </motion.p>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCloseView}
                      className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/30"
                    >
                      Back to Discover
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Mobile Messages View */}
              {activeView === 'messages' && (
                <motion.div
                  key="messages"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="h-full w-full flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl overflow-hidden lg:hidden"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-b from-white/90 to-white/70 dark:from-neutral-900/90 dark:to-neutral-900/70 backdrop-blur-xl shrink-0">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCloseView}
                      className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                    </motion.button>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{t('messages')}</h2>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Sidebar 
                      conversations={matches} 
                      activeMatchId={activeMatchId}
                      matchCount={matchCount}
                      likeCount={likeCount}
                      hiddenCount={hiddenCount}
                      onPick={handleSelectMatch}
                      onOpenMatches={() => setActiveView('matches')}
                      onOpenLikes={() => setActiveView('likes')}
                      isLoading={isLoadingMatches || isLoadingLikes}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>

      {/* Incoming Call Modal */}
      <IncomingCallModal
        isOpen={!!incomingCall}
        callerName={incomingCall?.callerName || incomingCallMatch?.otherUser.name || 'Someone'}
        callerAvatar={incomingCallMatch?.otherUser.avatar}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      {/* Video Call Modal */}
      {videoCallChannel && videoCallMatchId && (
        <VideoCallModal
          isOpen={isVideoCallOpen}
          channelName={videoCallChannel}
          localUserName="You"
          remoteUserName={activeConversation?.otherUser.name || 'Partner'}
          onClose={handleEndVideoCall}
          onCallEnded={handleEndVideoCall}
        />
      )}
    </div>
  )
}
