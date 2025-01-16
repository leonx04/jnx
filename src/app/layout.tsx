'use client'

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Footer from "./components/Footer";
import LoadingIndicator from "./components/LoadingIndicator";
import Navbar from "./components/Navbar";
import TawkChat from '@/app/utils/TawkChat';
import VoucherDisplay from "./components/VoucherDisplay";
import { AuthProvider } from './context/AuthContext';
import "./globals.css";
import SocialMetaTags from "./meta/SocialMetaTags";
import { Analytics } from "@vercel/analytics/react"
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect } from 'react';

config.autoAddCss = false

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: 'ease-in-out',
    });
  }, []);

  return (
    <html lang="en" className="h-full">
      <head>
        <SocialMetaTags />
        <title>JNX Tennis Store</title>
        <meta name="description" content="JNX Tennis Store is a tennis store that sells high-quality tennis equipment and accessories for all levels of play." />
        <meta name="keywords" content="tennis rackets, tennis equipment, professional rackets, beginner rackets" />
        <meta name="author" content="JNX Tennis Store" />
        <link rel="icon" href="https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jnxstore.id.vn" />
        <meta property="og:title" content="JNX Tennis Store - High-Quality Tennis Rackets" />
        <meta property="og:description" content="JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs." />
        <meta property="og:image" content="https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://jnxstore.id.vn" />
        <meta property="twitter:title" content="JNX Tennis Store - High-Quality Tennis Rackets" />
        <meta property="twitter:description" content="JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs." />
        <meta property="twitter:image" content="https://raw.githubusercontent.com/leonx04/jnx/refs/heads/master/src/app/favicon.ico" />
      </head>
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
          <Analytics />
          <GoogleAnalytics gaId="G-D7N0HG7J3S" />
          <TawkChat />
        </AuthProvider>
      </body>
    </html>
  );
}