import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'W3Swap - Secure Token Migration Platform',
    template: '%s | W3Swap',
  },
  description: 'A secure token migration platform on Solana with liquidity protection and instant trading capabilities.',
  keywords: [
    'Solana',
    'Token Migration',
    'DeFi',
    'Liquidity Pool',
    'Meteora',
    'SPL Token',
    'Token-2022',
    'Crypto',
  ],
  authors: [{ name: 'W3Swap Team' }],
  creator: 'W3Swap',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'W3Swap - Secure Token Migration Platform',
    description: 'A secure token migration platform on Solana with liquidity protection and instant trading capabilities.',
    siteName: 'W3Swap',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'W3Swap - Secure Token Migration Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'W3Swap - Secure Token Migration Platform',
    description: 'A secure token migration platform on Solana with liquidity protection and instant trading capabilities.',
    images: ['/og-image.png'],
    creator: '@w3swap',
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
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#00D4FF' },
    ],
  },
  verification: {
    // Add verification codes when available
    // google: 'verification-code',
    // yandex: 'verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#00D4FF" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`
        min-h-screen 
        bg-background 
        font-sans 
        text-foreground 
        antialiased
        selection:bg-primary-500/20
        selection:text-primary-300
      `}>
        <div className="fixed inset-0 bg-cyber-grid bg-grid opacity-30 pointer-events-none" />
        <Providers>
          <div className="relative min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}