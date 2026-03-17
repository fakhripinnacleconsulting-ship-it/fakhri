
export default function robots() {
    const baseUrl = 'https://fakhriitservices.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/'],
                disallow: [
                    '/api/',
                    '/client/',
                    '/admin/',
                    '/super-admin/',
                    '/auth/',
                    '/login/',
                    '/signup/',
                    '/forgot-password/',
                    '/reset-password/',
                    '/checkout/',
                    '/*?*', // Prevent indexing of URLs with query parameters
                ],
            },
            {
                userAgent: ['GPTBot', 'ChatGPT-User'],
                disallow: ['/'], // Disallow AI crawlers if privacy is a concern, or keep them if you want
            }
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
