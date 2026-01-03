// app/layout.tsx
// Paaniyo.com - Root Layout

import type { Metadata, Viewport } from 'next';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Paaniyo - Premium Hydration Marketplace',
    template: '%s | Paaniyo',
  },
  description:
    "Bangladesh's premier destination for premium bottled water, sparkling beverages, and filtration systems. Discover luxury hydration from world-renowned brands.",
  keywords: [
    'premium water',
    'bottled water Bangladesh',
    'mineral water Dhaka',
    'sparkling water',
    'water filtration',
    'পানি',
    'বোতলজাত পানি',
    'প্রিমিয়াম পানি',
  ],
  authors: [{ name: 'Paaniyo' }],
  creator: 'Paaniyo',
  publisher: 'Paaniyo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://paaniyo.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-BD': '/en',
      'bn-BD': '/bn',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    alternateLocale: 'bn_BD',
    url: 'https://paaniyo.com',
    siteName: 'Paaniyo',
    title: 'Paaniyo - Premium Hydration Marketplace',
    description:
      "Bangladesh's premier destination for premium bottled water, sparkling beverages, and filtration systems.",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Paaniyo - Premium Hydration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paaniyo - Premium Hydration Marketplace',
    description:
      "Bangladesh's premier destination for premium bottled water and beverages.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0091cd' },
    { media: '(prefers-color-scheme: dark)', color: '#001d29' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('SW registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/20 antialiased">
        <SessionProvider session={session}>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
