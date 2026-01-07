import React from 'react'
import Image from 'next/image'
import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/features/auth/context/UserContext'
import MainLogo from './ui/logo'
import Link from 'next/link'

const MainHeader = () => {
  const { user, logout } = useUser()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  return (
    <header
      className="
        sticky top-0 z-50 w-full
        bg-white/90 dark:bg-neutral-900/90 backdrop-blur
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
        <ul className="flex items-center gap-4">
          <li>
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {user?.profile?.photos?.[1] ? (
                <Image
                  src={user.profile.photos[1]}
                  alt={user.name || 'User Profile'}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover border-2 border-brand hover:border-brand/70 transition-colors"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center hover:bg-brand/20 transition-colors">
                  <User className="h-6 w-6 text-brand" />
                </div>
              )}
            </Link>
          </li>

          <li>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default MainHeader
