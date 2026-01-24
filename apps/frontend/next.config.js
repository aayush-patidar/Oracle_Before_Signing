/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rewrite API calls to backend server
  async rewrites() {
    // Use 127.0.0.1 instead of localhost to avoid IPv6 issues on Windows
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
  
  // Enable React strict mode for better debugging
  reactStrictMode: true,
  
  // Optimize images
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;