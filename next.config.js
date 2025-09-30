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
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "false",
          },
        ],
      },
    ];
  },
  async rewrites() {
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
    return [];
  }
};

module.exports = nextConfig;
