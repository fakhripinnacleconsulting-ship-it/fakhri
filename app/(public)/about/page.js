import { getCompanyData, getTeamMembers } from '@/lib/actions/content';
import AboutContent from '@/components/about/AboutContent';

import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata = {
    title: SEO_CONFIG.about.title,
    description: SEO_CONFIG.about.description,
    keywords: SEO_CONFIG.about.keywords,
};

export default async function AboutPage() {
    const [company, team] = await Promise.all([
        getCompanyData(),
        getTeamMembers()
    ]);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Fakhri IT Services',
        description: 'Your trusted Amazon seller services partner since 2016.',
        mainEntity: {
            '@type': 'Organization',
            name: 'Fakhri IT Services',
            foundingDate: '2016',
            url: 'https://fakhriitservices.com',
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <AboutContent company={company} team={team} />
        </>
    );
}
