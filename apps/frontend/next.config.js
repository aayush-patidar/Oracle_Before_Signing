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
  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // Optimize images
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;