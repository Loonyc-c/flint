'use client'

import Image from 'next/image'
import { LogOut, Sun, Moon, Languages } from 'lucide-react'
import { useRouter, Link, usePathname, useParams } from '@/i18n/routing'
import { useUser } from '@/features/auth/context/UserContext'
import { useTranslations } from 'next-intl'
import { UserAvatar } from './ui/UserAvatar'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MainLogo } from './ui'
/**
 * ThemeToggle sub-component handles switching between light and dark modes.
 * Uses next-themes and framer-motion for a premium feel.
 */
const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('common.theme')

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-9 w-9" />

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-md hover:bg-accent transition-colors cursor-pointer group"
      aria-label={isDark ? t('light') : t('dark')}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 90 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
        )}
      </motion.div>
    </button>
  )
}

/**
 * LanguageToggle sub-component handles switching between supported locales.
 * Uses next-intl routing utilities.
 */
const LanguageToggle = () => {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const { locale } = params as { locale: string }

  const nextLocale = locale === 'en' ? 'mn' : 'en'

  const toggleLanguage = () => {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer group"
      aria-label={`Switch to ${nextLocale.toUpperCase()}`}
    >
      <Languages className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
      <span className="text-xs font-black uppercase tracking-wider">{locale}</span>
    </button>
  )
}

/**
 * Main header component displayed on authenticated pages.
 * Provides navigation, profile access, and system toggles.
 */
const MainHeader = () => {
  const t = useTranslations('auth.header')
  const { user, logout } = useUser()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  return (
    <header className="sticky top-0 z-50 w-full h-[80px] bg-background/90 backdrop-blur-md border-b border-border px-4 sm:px-8 flex items-center justify-between transition-all duration-300">
      <Link className="flex items-center gap-2 sm:gap-3 group shrink-0" href="/home">
        <MainLogo />
        <Image
          src="/text-logo.svg"
          alt="Flint Logo"
          width={100}
          height={60}
          className="h-15 w-auto"
        />
      </Link>

      <nav>
        <ul className="flex items-center gap-1.5 sm:gap-4">
          <li className="flex items-center border-r border-border pr-1.5 sm:pr-4">
            <LanguageToggle />
            <ThemeToggle />
          </li>

          <li>
            <Link
              href="/profile"
              className="flex items-center hover:opacity-80 transition-opacity active:scale-95 transition-transform"
            >
              <UserAvatar
                src={user?.profile?.photo}
                name={user?.profile?.nickName || user?.name || 'User'}
                size="md"
                border
              />
            </Link>
          </li>

          <li>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 sm:px-4 sm:py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 transition-all cursor-pointer group"
              title={t('signOut')}
            >
              <LogOut className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline text-sm font-semibold">{t('signOut')}</span>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default MainHeader
