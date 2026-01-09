import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// =============================================================================
// Plugin Configuration
// =============================================================================

const withNextIntl = createNextIntlPlugin()

// =============================================================================
// Next.js Configuration
// =============================================================================

/**
 * Next.js configuration for the Flint frontend.
 *
 * Features:
 * - React Strict Mode for development warnings
 * - Remote image patterns for Cloudinary and placeholders
 * - Next-intl integration for internationalization
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: 'example.com'
      }
    ]
  }
}

export default withNextIntl(nextConfig)
