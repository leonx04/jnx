import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      }
      ,
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
      }
    ],
  },
};

export default nextConfig;
