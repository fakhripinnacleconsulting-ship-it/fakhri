import BlogContent from '@/components/blog/BlogContent';


import { SEO_CONFIG } from '@/lib/seo-config';

export const metadata = {
    title: SEO_CONFIG.blog.title,
    description: SEO_CONFIG.blog.description,
    keywords: SEO_CONFIG.blog.keywords,
    openGraph: {
        title: SEO_CONFIG.blog.title,
        description: SEO_CONFIG.blog.description,
        url: 'https://fakhriitservices.com/blog',
        siteName: 'Fakhri IT Services',
        locale: 'en_US',
        type: 'website',
    },
};

export default function BlogPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Fakhri IT Services Blog',
        description: 'Insights and strategies for Amazon sellers.',
        url: 'https://fakhriitservices.com/blog',
        publisher: {
            '@type': 'Organization',
            name: 'Fakhri IT Services',
            logo: {
                '@type': 'ImageObject',
                url: 'https://fakhriitservices.com/logo.png'
            }
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogContent />
        </>
    );
}
