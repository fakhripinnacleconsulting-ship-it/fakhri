import { getJobs } from '@/lib/actions/content';
import CareerContent from '@/components/career/CareerContent';

import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata = {
    title: SEO_CONFIG.career.title,
    description: SEO_CONFIG.career.description,
    keywords: SEO_CONFIG.career.keywords,
};

export default async function CareerPage() {
    const jobs = await getJobs();
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Careers at Fakhri IT Services',
        description: 'Job openings and career opportunities.',
        url: 'https://fakhriitservices.com/career',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <CareerContent jobs={jobs} />
        </>
    );
}
