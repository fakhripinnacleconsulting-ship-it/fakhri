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


export const metadata = {
  title: "Fakhri IT Services | No.1 Amazon Seller Services Partner",
  description: "Your trusted Amazon seller services partner since 2016. Expert account management, FBA operations, PPC advertising, and growth strategies for Amazon sellers.",
  keywords: ["Amazon seller services", "Amazon account management", "FBA services", "Amazon PPC", "Amazon consulting", "e-commerce agency"],
  openGraph: {
    title: "Fakhri IT Services | No.1 Amazon Seller Services Partner",
    description: "Your trusted Amazon seller services partner since 2016.",
    url: 'https://fakhriitservices.com',
    siteName: 'Fakhri IT Services',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Fakhri IT Services | No.1 Amazon Seller Services Partner",
    description: "Expert Amazon seller solutions to grow your business.",
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
      <CTA />
      <Testimonials testimonials={testimonials} />
      <FaQ data={homeFAQs} />
    </>
  );
}
