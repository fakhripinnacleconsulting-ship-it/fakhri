import BlogContent from '@/components/blog/BlogContent';


export const metadata = {
    title: "Blog | Fakhri IT Services - Amazon Seller Insights & Tips",
    description: "Expert insights, tips, and strategies for Amazon sellers. Stay updated with the latest marketplace trends and growth tactics.",
    keywords: ["Amazon seller blog", "e-commerce tips", "Amazon strategies", "FBA guides", "PPC tips"],
    openGraph: {
        title: "Blog | Fakhri IT Services",
        description: "Expert insights for Amazon sellers.",
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
