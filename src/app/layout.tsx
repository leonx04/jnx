import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Footer from "./components/Footer";
import LoadingIndicator from "./components/LoadingIndicator";
import Navbar from "./components/Navbar";
import VoucherDisplay from "./components/VoucherDisplay";
import { AuthProvider } from './context/AuthContext';
import "./globals.css";
import SocialMetaTags from "./meta/SocialMetaTags";

config.autoAddCss = false

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JNX Tennis Store",
  description: "JNX Tennis Store is a tennis store that sells high-quality tennis equipment and accessories for all levels of play.",
  openGraph: {
    title: 'JNX Tennis Store - High-Quality Tennis Rackets',
    description: 'JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs.',
    images: ['https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico'],
    url: 'https://jnx-store.netlify.app',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JNX Tennis Store - High-Quality Tennis Rackets',
    description: 'JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs.',
    images: ['https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico'],
  },
  keywords: ['tennis rackets', 'tennis equipment', 'professional rackets', 'beginner rackets'],
  authors: [{ name: 'JNX Tennis Store' }],
  icons: {
    icon: 'https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <SocialMetaTags />
      <body className={`${inter.className} flex flex-col min-h-screen overflow-x-hidden`}>
        <AuthProvider>
          <Navbar />
          <VoucherDisplay />
          <main className="flex-grow max-w-full relative">
            <LoadingIndicator />
            {children}
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'toast-below-navbar',
              duration: 2000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
          <GoogleAnalytics gaId="G-D7N0HG7J3S" />
        </AuthProvider>
      </body>
    </html>
  );
}

