/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Playwright build goes to its own folder so it can run next to `next dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: 'standalone',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
