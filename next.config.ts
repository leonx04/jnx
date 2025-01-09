const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'qsports.vn' },
      { protocol: 'https', hostname: 'sporthouse.vn' },
      { protocol: 'https', hostname: 'product.hstatic.net' },
      { protocol: 'https', hostname: 'shopvnb.com' },
      { protocol: 'https', hostname: 'hncmua.com' },
      { protocol: 'https', hostname: 'www.tennisnuts.com' },
      { protocol: 'https', hostname: 'tennishub.in' },
      { protocol: 'https', hostname: 'vtlsport.vn' },
      { protocol: 'https', hostname: 'www.gusport.com.vn' },
      { protocol: 'https', hostname: 'scontent.fhan17-1.fna.fbcdn.net' },
      { protocol: 'https', hostname: 'placehold.jp' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'cloudinary.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'asset.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'dfi8tvwsf.cloudinary.com' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval'
                https://apis.google.com
                https://*.firebaseio.com
                https://*.firebaseapp.com
                https://www.gstatic.com
                https://accounts.google.com
                https://www.googletagmanager.com
                https://va.vercel-scripts.com
                https://embed.tawk.to
                https://www.google-analytics.com
                https://*.tawk.to
                https://cdn.jsdelivr.net
                https://vercel.live
                https://*.vercel.live;
              script-src-elem 'self' 'unsafe-inline'
                https://apis.google.com
                https://*.firebaseio.com
                https://*.firebaseapp.com
                https://www.gstatic.com
                https://accounts.google.com
                https://www.googletagmanager.com
                https://va.vercel-scripts.com
                https://embed.tawk.to
                https://www.google-analytics.com
                https://*.tawk.to
                https://cdn.jsdelivr.net
                https://vercel.live
                https://*.vercel.live;
              frame-src 'self'
                https://accounts.google.com
                https://*.firebaseapp.com
                https://jnx-store.firebaseapp.com
                https://tawk.to
                https://*.tawk.to;
              connect-src 'self'
                https://*.googleapis.com
                https://*.firebaseio.com
                https://jnx-store-default-rtdb.firebaseio.com
                https://*.firebaseapp.com
                wss://*.firebaseio.com
                https://identitytoolkit.googleapis.com
                https://*.google-analytics.com
                https://*.analytics.google.com
                https://va.vercel-scripts.com
                https://*.tawk.to
                wss://*.tawk.to
                https://vercel.live
                https://*.vercel.live;
              img-src 'self' data: https: blob:
                https://lh3.googleusercontent.com
                https://dfi8tvwsf.cloudinary.com
                https://*.tawk.to;
              style-src 'self' 'unsafe-inline'
                https://fonts.googleapis.com
                https://*.tawk.to
                https://cdn.jsdelivr.net;
              font-src 'self'
                https://fonts.gstatic.com
                https://*.tawk.to;
              media-src 'self' https://*.tawk.to;
              worker-src 'self' blob:;
              form-action 'self';
              base-uri 'self';
              upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim(),
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ];
  },
};

module.exports = nextConfig;