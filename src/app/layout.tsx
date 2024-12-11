import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import SocialMetaTags from "./meta/SocialMetaTags";

config.autoAddCss = false

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JNX Tennis Store",
  description: "JNX Tennis Store is a tennis store that sells tennis equipment and accessories.",
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
          <main className="flex-grow max-w-full">{children}</main>
          <Footer />
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}

