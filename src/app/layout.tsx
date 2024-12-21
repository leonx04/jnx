import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { Metadata } from 'next'
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Footer from "./components/Footer";
import LoadingIndicator from "./components/LoadingIndicator";
import Navbar from "./components/Navbar";
import { AuthProvider } from './context/AuthContext';
import "./globals.css";
import SocialMetaTags from "./meta/SocialMetaTags";
import { GoogleAnalytics } from '@next/third-parties/google'

config.autoAddCss = false

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JNX Tennis Store",
  description: "JNX Tennis Store is a tennis store that sells high-quality tennis equipment and accessories for all levels of play.",
  openGraph: {
    title: 'JNX Tennis Store - High-Quality Tennis Rackets',
    description: 'JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs.',
    images: ['https://jnx-store.netlify.app/_next/image?url=https%3A%2F%2Fscontent.fhan17-1.fna.fbcdn.net%2Fv%2Ft39.30808-6%2F471300448_986822023488080_7111729637380421990_n.jpg%3F_nc_cat%3D108%26ccb%3D1-7%26_nc_sid%3D6ee11a%26_nc_ohc%3DP4npL3jSWGQQ7kNvgEvlUfJ%26_nc_oc%3DAdgQECd9WWURtcIipQfoK1uNQr1RylKPiqpNUFwxSsIwcNtLZBLEqhRHF0hZeAtyFBA%26_nc_zt%3D23%26_nc_ht%3Dscontent.fhan17-1.fna%26_nc_gid%3DAQO-Zwp16Nzr_U2Y8hanAM5%26oh%3D00_AYD94Csm4v8fS7VhgErsYdglt1oMKFda45uG7bQ-8NnMWA%26oe%3D676C2FC9&w=1920&q=75'],
    url: 'https://jnx-store.netlify.app',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JNX Tennis Store - High-Quality Tennis Rackets',
    description: 'JNX Tennis Store is a service that provides high-quality tennis rackets and equipment for all levels of play. We offer a wide range of professional and beginner rackets to suit your needs.',
    images: ['https://jnx-store.netlify.app/_next/image?url=https%3A%2F%2Fscontent.fhan17-1.fna.fbcdn.net%2Fv%2Ft39.30808-6%2F471300448_986822023488080_7111729637380421990_n.jpg%3F_nc_cat%3D108%26ccb%3D1-7%26_nc_sid%3D6ee11a%26_nc_ohc%3DP4npL3jSWGQQ7kNvgEvlUfJ%26_nc_oc%3DAdgQECd9WWURtcIipQfoK1uNQr1RylKPiqpNUFwxSsIwcNtLZBLEqhRHF0hZeAtyFBA%26_nc_zt%3D23%26_nc_ht%3Dscontent.fhan17-1.fna%26_nc_gid%3DAQO-Zwp16Nzr_U2Y8hanAM5%26oh%3D00_AYD94Csm4v8fS7VhgErsYdglt1oMKFda45uG7bQ-8NnMWA%26oe%3D676C2FC9&w=1920&q=75'],
  },
  keywords: ['tennis rackets', 'tennis equipment', 'professional rackets', 'beginner rackets'],
  authors: [{ name: 'JNX Tennis Store' }],
  icons: {
    icon: '/favicon.ico',
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

