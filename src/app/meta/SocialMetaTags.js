import Head from 'next/head';

const SocialMetaTags = ({
  title = 'JNX Tennis Store - High-Quality Tennis Rackets',
  description = ' JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs.',
  image = 'https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico',
  url = 'https://jnxstore.id.vn',
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

