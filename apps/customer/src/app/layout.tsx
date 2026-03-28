import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Savory - Restaurant Ordering',
    template: '%s | Savory',
  },
  description: 'Order your favorite food online with fast delivery',
  keywords: ['restaurant', 'food delivery', 'online ordering', 'restaurant menu'],
  authors: [{ name: 'Savory' }],
  creator: 'Savory',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://savory.example.com',
    siteName: 'Savory',
    title: 'Savory - Restaurant Ordering',
    description: 'Order your favorite food online with fast delivery',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Savory Restaurant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Savory - Restaurant Ordering',
    description: 'Order your favorite food online with fast delivery',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
