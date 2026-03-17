import Hero from '@/components/home/Hero';
import Partners from '@/components/home/Partners';
import TrustBadges from '@/components/home/TrustBadges';
import ServicesPreview from '@/components/home/ServicesPreview';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import dynamic from 'next/dynamic';

const CTA = dynamic(() => import('@/components/home/CTA'), { ssr: true });
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), { ssr: true });
const FaQ = dynamic(() => import('@/components/home/FaQ'), { ssr: true });
import { getServices, getTestimonials, getFAQs, getCompanyData } from '@/lib/actions/content';


import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata = {
  title: SEO_CONFIG.home.title,
  description: SEO_CONFIG.home.description,
  keywords: SEO_CONFIG.home.keywords,
  openGraph: {
    title: SEO_CONFIG.home.title,
    description: SEO_CONFIG.home.description,
    url: 'https://fakhriitservices.com',
    siteName: 'Fakhri IT Services',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://fakhriitservices.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fakhri IT Services - #1 Amazon Partner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.home.title,
    description: SEO_CONFIG.home.description,
    images: ['https://fakhriitservices.com/twitter-image.png'],
  }
};

export default async function Home() {
  const [services, testimonials, faqs, company] = await Promise.all([
    getServices(),
    getTestimonials(),
    getFAQs(),
    getCompanyData()
  ]);

  const homeFAQs = faqs.filter(f => f.categories && f.categories.home);


  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Fakhri IT Services',
    url: 'https://fakhriitservices.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://fakhriitservices.com/blog?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const faqJsonLd = homeFAQs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFAQs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Hero company={company} />
      <TrustBadges company={company} />
      <Partners company={company} />
      <ServicesPreview services={services} />
      <WhyChooseUs company={company} />
      <CTA company={company} />
      <Testimonials testimonials={testimonials} />
      <FaQ data={homeFAQs} />
    </>
  );
}
