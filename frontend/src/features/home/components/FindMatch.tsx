'use client'

import { useRouter } from 'next/navigation'
import { Phone, Users, Sparkles, Smile, Brain, Coffee, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// =============================================================================
// Sub-Components
// =============================================================================

const LiveCallCard = () => (
  <button
    disabled
    className="bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 hover:border-[#B33A2E] dark:hover:border-[#B33A2E] rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="rounded-full bg-[#B33A2E] group-hover:bg-[#8B2E24] w-16 h-16 text-white flex justify-center items-center transition-colors">
      <Phone className="h-8 w-8" />
    </div>
    <div className="text-center">
      <h4 className="font-semibold text-lg mb-2 dark:text-white">Live Call</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">Connect instantly via voice call</p>
    </div>
    <div className="w-full px-5 py-2.5 rounded-2xl bg-[#B33A2E] group-hover:bg-[#8B2E24] font-medium text-white text-center text-sm transition-colors">
      Start Call
    </div>
  </button>
)

interface SwipeCardProps {
  onNavigate: () => void
}

const SwipeCard = ({ onNavigate }: SwipeCardProps) => (
  <div
    className="cursor-pointer bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 hover:border-[#2E2E2E] dark:hover:border-[#2E2E2E] rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:shadow-lg group"
    onClick={onNavigate}
  >
    <div className="rounded-full bg-[#2E2E2E] group-hover:bg-[#272727] w-16 h-16 text-white flex justify-center items-center transition-colors">
      <Users className="h-8 w-8" />
    </div>
    <div className="text-center">
      <h4 className="font-semibold text-lg mb-2 dark:text-white">Swipe</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">Discover profiles at your own pace</p>
    </div>
    <div className="w-full px-5 py-2.5 rounded-2xl bg-[#2E2E2E] group-hover:bg-[#272727] font-medium text-white text-center text-sm transition-colors">
      Start Swiping
    </div>
  </div>
)

const AIWingmanCard = () => {
  const hasSubscription = false // Mocked for UI

  return (
    <Card className="w-full sm:w-11/12 lg:w-3/4 overflow-hidden relative border-0 shadow-lg bg-linear-to-br from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-900">
      <div className="w-full px-5 sm:px-7 py-5 sm:py-6 flex flex-col items-center gap-4 text-center relative z-0">
        {!hasSubscription && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-none flex flex-col items-center justify-center gap-3 z-10">
            <Lock className="w-12 h-12 text-white" />
            <p className="text-white font-semibold text-lg">Premium Feature</p>
            <p className="text-white/80 text-sm max-w-xs">
              Upgrade to access AI Wingman and get personalized conversation help
            </p>
            <Button className="bg-brand hover:bg-brand/90 text-white rounded-lg transition-colors">
              View Plans
            </Button>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#B33A2E]/90 text-white flex items-center justify-center">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold">AI Wingman Ready</h3>
        </div>

        <p className="text-[#2c2c2c] dark:text-gray-300 text-sm leading-relaxed max-w-184">
          Get real-time suggestions and icebreakers tailored to your matches.
        </p>

        <div className="w-full grid grid-cols-3 gap-3 sm:gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <div className="rounded-full bg-[#EE36A9] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center">
              <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[11px] sm:text-xs text-[#2c2c2c] dark:text-gray-400">
              Playful
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="rounded-full bg-[#4379FF] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[11px] sm:text-xs text-[#2c2c2c] dark:text-gray-400">
              Thoughtful
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="rounded-full bg-[#00C85F] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[11px] sm:text-xs text-[#2c2c2c] dark:text-gray-400">Chill</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Find Match page section with matching style options and AI wingman feature.
 */
const FindMatch = () => {
  const router = useRouter()

  return (
    <div className="w-full flex justify-center">
      <section className="w-full max-w-[1200px] px-4 md:px-6 lg:px-8 flex flex-col items-center gap-6 sm:gap-8">
        {/* Header Block */}
        <div className="w-full flex flex-col items-center gap-2 text-center">
          <div className="text-2xl font-bold text-brand">Find Your Match</div>
          <h2 className="text-neutral-700 dark:text-neutral-300 font-light text-xs sm:text-sm md:text-base leading-relaxed max-w-200">
            Start your journey to find meaningful connections.
          </h2>
        </div>

        {/* Start Matching Section */}
        <div className="w-full sm:w-4/5 md:w-3/4 lg:w-2/3 flex flex-col items-center gap-4">
          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Choose Matching Style
          </h3>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiveCallCard />
            <SwipeCard onNavigate={() => router.push('/swipe')} />
          </div>
        </div>

        {/* AI Wingman Card */}
        <div className="w-full flex justify-center">
          <AIWingmanCard />
        </div>
      </section>
    </div>
  )
}

export default FindMatch
