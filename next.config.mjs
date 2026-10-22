/** @type {import('next').NextConfig} */
const nextConfig = {
  // dev server: let the ngrok tunnel (phone testing) load /_next assets and HMR, which Next blocks from other origins by default
  allowedDevOrigins: ['doorpost-smashing-regime.ngrok-free.dev', '*.ngrok-free.dev', '*.ngrok-free.app', '*.ngrok.app'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
