'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
    const pathname = usePathname();
    if (pathname === '/') return null;

    const pathSegments = pathname.split('/').filter((segment) => segment !== '');

    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
        return { label, href };
    });

    const allBreadcrumbs = [{ label: 'Home', href: '/' }, ...breadcrumbs];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: allBreadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.label,
            item: `https://fakhriitservices.com${crumb.href}`,
        })),
    };

    return (
        <div className="container-custom py-4">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                {allBreadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                        {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/50" />}
                        {index === allBreadcrumbs.length - 1 ? (
                            <span className="font-medium text-foreground">{crumb.label}</span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="hover:text-primary transition-colors flex items-center"
                            >
                                {index === 0 && <Home className="w-3.5 h-3.5 mr-1" />}
                                {crumb.label}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>
        </div>
    );
}
