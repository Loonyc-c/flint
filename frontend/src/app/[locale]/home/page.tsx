'use client'

import { Tabs } from '@/components/ui/tabs'
import FindMatch from '@/features/home/components/FindMatch'
import MatchingPref from '@/features/home/components/MatchingPref'
import SubscriptionRedirect from '@/features/home/components/SubscriptionRedirect'

/**
 * Home page with tabbed navigation for matching features.
 */
const HomePage = () => {
  const tabs = [
    {
      title: 'Find Match',
      value: 'Find Match',
      content: <FindMatch />
    },
    {
      title: 'Matching Preferences',
      value: 'Matching Preferences',
      content: <MatchingPref />
    },
    {
      title: 'Subscription',
      value: 'Subscription',
      content: <SubscriptionRedirect />
    }
  ]

  return (
    <div className="px-4 py-8 sm:p-10 flex justify-center items-center min-h-[calc(100dvh-5rem)]">
      <div className="perspective-[1000px] relative flex flex-col max-w-5xl justify-center items-center w-full">
        <Tabs tabs={tabs} />
      </div>
    </div>
  )
}

export default HomePage
