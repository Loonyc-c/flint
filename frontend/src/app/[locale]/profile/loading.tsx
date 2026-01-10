import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Full-page loading indicator for the profile route.
 * Shown automatically by Next.js during route transitions.
 */
const ProfileLoading = () => {
  return <LoadingSpinner text="Loading profile..." />
}

export default ProfileLoading
