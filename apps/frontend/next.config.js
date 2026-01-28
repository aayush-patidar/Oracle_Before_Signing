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
        destination: 'http://127.0.0.1:3001/api/:path*',
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