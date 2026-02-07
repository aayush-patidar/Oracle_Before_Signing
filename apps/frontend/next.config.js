/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirect root to enterprise dashboard
  async redirects() {
    return [
      {
        source: '/',
        destination: '/enterprise',
        permanent: true,
      },
    ];
  },

  // Proxy /api requests to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://127.0.0.1:3001/api/:path*',
      },
    ];
  },

  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // Optimize images
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;