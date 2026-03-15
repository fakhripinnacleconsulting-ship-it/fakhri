import { getWebPage } from '@/lib/actions/content';
import LegalPageContent from '@/components/legal/LegalPageContent';
import { notFound } from 'next/navigation';

import { SEO_CONFIG } from '@/lib/seo-config';

export async function generateMetadata() {
    const page = await getWebPage('privacy-policy');
    return {
        title: page?.title || SEO_CONFIG.policy.title,
        description: page?.description || SEO_CONFIG.policy.description,
        keywords: SEO_CONFIG.policy.keywords,
    };
}

export default async function PrivacyPolicyPage() {
    const page = await getWebPage('privacy-policy');

    if (!page) {
        notFound();
    }

    return <LegalPageContent page={page} />;
}
