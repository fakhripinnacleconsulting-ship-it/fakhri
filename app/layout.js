
import "./globals.css";
import Providers from "@/components/Providers";
import { Suspense } from "react";
import { Inter, Poppins } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import AnalyticsTracker from '@/components/AnalyticsTracker';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

import { BASE_KEYWORDS } from "@/lib/seo-config";

export const metadata = {
  metadataBase: new URL('https://fakhriitservices.com'), // Replace with actual domain if known, or use localhost for dev
  title: {
    default: "Fakhri IT Services | #1 Amazon SPN & Growth Partner India",
    template: "%s | Fakhri IT Services"
  },
  description: "Scale your Amazon business with India's leading SPN partner since 2016. ROI-focused PPC, stunning A+ content, and expert account management.",
  keywords: BASE_KEYWORDS,
  authors: [{ name: "Fakhri IT Services" }],
  creator: "Fakhri IT Services",
  publisher: "Fakhri IT Services",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://fakhriitservices.com',
  },
  openGraph: {
    title: "Fakhri IT Services | No.1 Amazon Seller Services Partner",
    description: "Your trusted Amazon seller services partner since 2016. Expert account management, FBA operations, PPC advertising, and growth strategies.",
    url: 'https://fakhriitservices.com',
    siteName: "Fakhri IT Services",
    images: [
      {
        url: 'https://fakhriitservices.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fakhri IT Services - Amazon Seller Partner',
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Fakhri IT Services | No.1 Amazon Seller Services Partner",
    description: "Expert Amazon seller solutions to grow your business.",
    images: ['https://fakhriitservices.com/twitter-image.png'],
    creator: '@fakhriitservices',
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
  verification: {
    google: 'your-google-verification-code', // User should replace this
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fakhri IT Services',
    alternateName: 'Fakhri IT',
    url: 'https://fakhriitservices.com',
    logo: 'https://fakhriitservices.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-1234567890',
      contactType: 'customer service',
      areaServed: 'Worldwide',
      availableLanguage: ['en', 'hi']
    },
    sameAs: [
      'https://www.facebook.com/fakhriitservices',
      'https://twitter.com/fakhriitservices',
      'https://www.linkedin.com/company/fakhri-it-services',
      'https://www.instagram.com/fakhriitservices'
    ]
  };

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body suppressHydrationWarning={true}>
        <Providers>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          {children}
        </Providers>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />}
      </body>
    </html>
  );
}
