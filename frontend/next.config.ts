import type { NextConfig } from 'next'

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
        hostname: 'example.com' // For your current mock placeholders
      }
    ]
  },
  // Rewrite /v1/* API requests to the serverless function
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: '/api/v1/:path*'
      }
    ]
  },
  // Mark backend dependencies as external to avoid bundling issues
  serverExternalPackages: [
    'express',
    'mongodb',
    'bcrypt',
    'jsonwebtoken',
    'nodemailer',
    'google-auth-library'
  ],
  // Include backend-dist files in the serverless function bundle
  outputFileTracingIncludes: {
    '/api/v1/[...path]': ['./backend-dist/**/*']
  }
}

export default nextConfig
