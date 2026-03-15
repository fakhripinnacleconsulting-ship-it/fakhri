import Within2HoursContent from '@/components/within-2-hours/Within2HoursContent';

import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata = {
    title: "Within 2 Hours support | " + SEO_CONFIG.home.title,
    description: "Get urgent Amazon seller support within 2 hours. Priority handling for account issues, listing problems, and critical business needs.",
    keywords: [...SEO_CONFIG.services.keywords, "urgent Amazon support", "priority seller help", "quick Amazon assistance"],
};

export default function Within2HoursPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Within 2 Hours Priority Support',
        description: 'Urgent Amazon seller support service.',
        provider: {
            '@type': 'Organization',
            name: 'Fakhri IT Services',
        },
        serviceType: 'Priority Support',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Within2HoursContent />
        </>
    );
}
