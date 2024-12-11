import Head from 'next/head';

const SocialMetaTags = ({
  title = 'Premium Tennis Rackets | Your Tennis Store',
  description = 'Discover our wide range of high-quality tennis rackets from top brands. Find the perfect racket to elevate your game.',
  image = 'https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico',
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

