'use client'

import { Tabs } from '@/components/ui/tabs'
import FindMatch from '@/features/home/components/FindMatch'
import MatchingPref from '@/features/home/components/MatchingPref'
import SubscriptionRedirect from '@/features/home/components/SubscriptionRedirect'
import { useTranslations } from 'next-intl'

/**
 * Home page with tabbed navigation for matching features.
 */
const HomePage = () => {
  const t = useTranslations('HomePage')

  const tabs = [
    {
      title: t('tabs.findMatch'),
      value: 'Find Match',
      content: <FindMatch />
    },
    {
      title: t('tabs.matchingPreferences'),
      value: 'Matching Preferences',
      content: <MatchingPref />
    },
    {
      title: t('tabs.subscription'),
      value: 'Subscription',
      content: <SubscriptionRedirect />
    }
  ]

  return (
    <div className="px-4 py-8 sm:p-10 flex justify-center items-start min-h-[calc(100dvh-5rem)]">
      <div className="flex flex-col max-w-5xl justify-center items-center w-full">
        <Tabs tabs={tabs} />
      </div>
    </div>
  )
}

export default HomePage
