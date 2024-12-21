import Head from 'next/head';

const SocialMetaTags = ({
  title = 'JNX Tennis Store - High-Quality Tennis Rackets',
  description = ' JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs.',
  image = 'https://scontent.fhan17-1.fna.fbcdn.net/v/t39.30808-6/471300448_986822023488080_7111729637380421990_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=P4npL3jSWGQQ7kNvgEvlUfJ&_nc_oc=AdgQECd9WWURtcIipQfoK1uNQr1RylKPiqpNUFwxSsIwcNtLZBLEqhRHF0hZeAtyFBA&_nc_zt=23&_nc_ht=scontent.fhan17-1.fna&_nc_gid=AQO-Zwp16Nzr_U2Y8hanAM5&oh=00_AYD94Csm4v8fS7VhgErsYdglt1oMKFda45uG7bQ-8NnMWA&oe=676C2FC9',
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

