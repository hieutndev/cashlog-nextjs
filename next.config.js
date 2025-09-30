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
};

module.exports = nextConfig;
