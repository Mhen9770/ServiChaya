/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8080/api',
  },
}

module.exports = nextConfig
