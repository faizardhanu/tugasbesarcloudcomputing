/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      // Ganti dengan IP atau domain GCP Anda:
      // { protocol: 'http', hostname: 'IP_GCP_ANDA', pathname: '/**' },
      // { protocol: 'https', hostname: 'yourdomain.com', pathname: '/**' },
    ],
  },
}

module.exports = nextConfig
