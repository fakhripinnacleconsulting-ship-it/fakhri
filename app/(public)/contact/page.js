import { getCompanyData } from '@/lib/actions/content';
import ContactContent from '@/components/contact/ContactContent';

import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata = {
    title: SEO_CONFIG.contact.title,
    description: SEO_CONFIG.contact.description,
    keywords: SEO_CONFIG.contact.keywords,
};

export default async function ContactPage() {
    const company = await getCompanyData();
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Fakhri IT Services',
        description: 'Get in touch for Amazon seller services.',
        url: 'https://fakhriitservices.com/contact',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ContactContent company={company} />
        </>
    );
}
