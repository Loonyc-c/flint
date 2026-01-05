'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import MainLogo from '@/components/ui/Logo'
const AuthHeader = () => {
  return (
    <header
      className="
        sticky top-0 z-50 w-full
        bg-white/90 dark:bg-neutral-900/90 backdrop-blur supports-backdrop-filter:bg-white/70 dark:supports-backdrop-filter:bg-neutral-900/70
        border-b border-neutral-200 dark:border-neutral-700
        px-5 py-4 flex items-center justify-between
        pt-[env(safe-area-inset-top)]
      "
    >
      <Link className="flex items-center gap-4" href="/">
        <MainLogo />
        <Image
          src="/text-logo.svg"
          alt="Flint Logo"
          width={100}
          height={60}
          className="h-15 w-auto"
        />
      </Link>

      <nav className="text-sm">
        <ul className="flex space-x-8 items-center">
          <li>
            <Link
              href="/"
              className="text-neutral-700 dark:text-neutral-300 hover:text-brand transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <Link href="/main">
              <Button className="bg-brand hover:bg-brand-400 text-white">Get Started</Button>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default AuthHeader
