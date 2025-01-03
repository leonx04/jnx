const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'qsports.vn',
      },
      {
        protocol: 'https',
        hostname: 'sporthouse.vn',
      },
      {
        protocol: 'https',
        hostname: 'product.hstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'shopvnb.com',
      },
      {
        protocol: 'https',
        hostname: 'hncmua.com',
      },
      {
        protocol: 'https',
        hostname: 'www.tennisnuts.com',
      },
      {
        protocol: 'https',
        hostname: 'tennishub.in',
      },
      {
        protocol: 'https',
        hostname: 'vtlsport.vn',
      },
      {
        protocol: 'https',
        hostname: 'www.gusport.com.vn',
      },
      {
        protocol: 'https',
        hostname: 'scontent.fhan17-1.fna.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'placehold.jp',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'asset.cloudinary.com',
      }
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // Tắt kiểm tra ESLint khi chạy build
  },
};

module.exports = nextConfig;
