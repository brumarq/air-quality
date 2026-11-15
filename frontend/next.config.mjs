const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: 'standalone',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
