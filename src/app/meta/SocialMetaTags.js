import Head from 'next/head';

const SocialMetaTags = ({
  title = 'JNX Tennis Store - High-Quality Tennis Rackets',
  description = ' JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs.',
  image = 'https://jnx-store.netlify.app/_next/image?url=https%3A%2F%2Fscontent.fhan17-1.fna.fbcdn.net%2Fv%2Ft39.30808-6%2F471300448_986822023488080_7111729637380421990_n.jpg%3F_nc_cat%3D108%26ccb%3D1-7%26_nc_sid%3D6ee11a%26_nc_ohc%3DP4npL3jSWGQQ7kNvgEvlUfJ%26_nc_oc%3DAdgQECd9WWURtcIipQfoK1uNQr1RylKPiqpNUFwxSsIwcNtLZBLEqhRHF0hZeAtyFBA%26_nc_zt%3D23%26_nc_ht%3Dscontent.fhan17-1.fna%26_nc_gid%3DAQO-Zwp16Nzr_U2Y8hanAM5%26oh%3D00_AYD94Csm4v8fS7VhgErsYdglt1oMKFda45uG7bQ-8NnMWA%26oe%3D676C2FC9&w=1920&q=75',
  url = 'https://jnx-store.netlify.app',
  type = 'JNX Tennis Store'
}) => {
  return (
    <Head>
      {/* Open Graph tags for Facebook, LinkedIn, etc. */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional meta tags for SEO */}
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Optional: Add more specific tennis-related meta tags */}
      <meta name="keywords" content="tennis rackets, tennis equipment, professional rackets, beginner rackets" />
      <meta name="author" content="JNX Tennis Store" />
    </Head>
  );
};

export default SocialMetaTags;

