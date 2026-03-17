import { getPricingPlans, getFAQs, getCatalogServices } from '@/lib/actions/content';
import PricingContent from '@/components/pricing/PricingContent';

export const dynamic = "force-dynamic";


import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata = {
    title: SEO_CONFIG.pricing.title,
    description: SEO_CONFIG.pricing.description,
    keywords: SEO_CONFIG.pricing.keywords,
    openGraph: {
        title: SEO_CONFIG.pricing.title,
        description: SEO_CONFIG.pricing.description,
        url: 'https://fakhriitservices.com/pricing',
        siteName: 'Fakhri IT Services',
        locale: 'en_US',
        type: 'website',
    },
};

export default async function PricingPage() {
    const [plans, faqs, servicesRaw] = await Promise.all([
        getPricingPlans(),
        getFAQs('pricing'),
        getCatalogServices()
    ]);

    // Format services for the add-ons list based on Standard Price
    const services = servicesRaw
        .filter(srv => srv.pricing && srv.pricing.standard && srv.pricing.standard.price > 0)
        .map(srv => ({
            id: srv._id,
            name: srv.name,
            category: srv.category,
            price: srv.pricing.standard.price
        }));

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'PriceSpecification',
        name: 'Amazon Seller Service Plans',
        description: 'Comprehensive plans for Amazon sellers including Account Management, PPC, and FBA.',
        priceCurrency: 'INR',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PricingContent plans={plans} faqs={faqs} services={services} />
        </>
    );
}
