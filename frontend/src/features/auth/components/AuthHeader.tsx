'use client'

import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import MainLogo from '@/components/ui/logo'

const AuthHeader = () => {
  return (
    <header
      className="
        sticky top-0 z-50 w-full
        bg-background/90 backdrop-blur
        border-b border-border
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
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <Link href="/home">
              <Button className="bg-brand hover:bg-brand-400 text-white">Get Started</Button>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default AuthHeader
