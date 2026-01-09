'use client'

export const ProfileHeader = () => {
  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 p-4 pt-[env(safe-area-inset-top)]">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Profile</h1>
          <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">
            Personalize your identity
          </p>
        </div>
      </div>
    </div>
  )
}
