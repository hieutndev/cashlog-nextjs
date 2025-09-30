/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com"
      }
    ]
  },
  async rewrites() {
    // Only use external proxy in production or when NEXT_PUBLIC_USE_PROXY is set
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_PROXY === 'true') {
      return [
        {
          source: '/api/:path*',
          destination: 'https://cashlog.hieutn.info.vn/api/:path*'
        },
        {
          source: '/api/:path*',
          destination: 'https://cashlog.hieutndev.com/api/:path*'
        }
      ];
    }
    
    // In development, let local API routes handle requests
    return [];
  }
};

module.exports = nextConfig;
