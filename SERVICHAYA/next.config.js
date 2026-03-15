/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    // API URL must be set via environment variable
    // In Linux: export NEXT_PUBLIC_API_URL=http://localhost:8080/api
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    // For local development, we will still fallback inside lib/api.ts
    BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
