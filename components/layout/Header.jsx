'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import CartDropdown from '@/components/client/CartDropdown';
import { useSession } from 'next-auth/react';


const navigationItems = [
    { label: "Home", href: "/" },
    {
        label: "Company",
        href: "#",
        children: [
            { label: "About Us", href: "/about" },
            { label: "Career", href: "/career" },
            // { label: "Testimonials", href: "/#testimonials" }
        ]
    },
    {
        label: "Services",
        href: "#",
        children: [
            { label: "Amazon Services", href: "/services" },
            { label: "Website Development", href: "/services/website-development" }
        ]
    },
    { label: "Within 2 Hours", href: "/within-2-hours" },
    { label: "Pricing", href: "/pricing" },
    {
        label: "Resources",
        href: "#",
        children: [
            { label: "Blog", href: "/blog" },
            // { label: "FAQs", href: "/pricing#faq" }
        ]
    },
    { label: "Contact", href: "/contact" },
];

import { Button } from "@/components/ui/button";

export default function Header({ company }) {
    const { data: session } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeDesktopDropdown, setActiveDesktopDropdown] = useState(null);
    const [mobileExpanded, setMobileExpanded] = useState({});
    const pathname = usePathname();

    const getDashboardUrl = (role) => {
        switch (role) {
            case 'super-admin': return '/super-admin/dashboard';
            case 'admin': return '/admin/dashboard';
            default: return '/client/dashboard';
        }
    };



    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setActiveDesktopDropdown(null);
        setMobileExpanded({});
    }, [pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.overflowX = 'hidden'; // Ensure horizontal scroll is always hidden
        };
    }, [isMobileMenuOpen]);

    const toggleMobileDropdown = (label) => {
        setMobileExpanded(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-background/95 backdrop-blur-lg shadow-md'
                    : 'bg-background/80 backdrop-blur-sm'
                    }`}
            >
                <div className="container-custom">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group z-50 transition-transform active:scale-95" aria-label="Fakhri IT Services Home">
                            <Image
                                src="/Logo.png"
                                alt={company?.name || "Fakhri IT Services"}
                                width={180}
                                height={40}
                                priority
                                className="h-7 md:h-8 w-auto object-contain"
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navigationItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => item.children && setActiveDesktopDropdown(item.label)}
                                    onMouseLeave={() => item.children && setActiveDesktopDropdown(null)}
                                >
                                    {item.children ? (
                                        <button
                                            aria-label={`Open ${item.label} menu`}
                                            className={`flex items-center gap-1 px-4 py-2 font-medium text-sm transition-colors duration-200 ${item.children.some(child => child.href === pathname)
                                                ? 'text-primary'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {item.label}
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDesktopDropdown === item.label ? 'rotate-180' : ''}`} />
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            aria-label={item.label}
                                            className={`relative px-4 py-2 font-medium text-sm transition-colors duration-200 ${pathname === item.href
                                                ? 'text-primary'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {item.label}
                                            {pathname === item.href && (
                                                <motion.div
                                                    layoutId="activeNav"
                                                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary"
                                                    transition={{ duration: 0.3 }}
                                                />
                                            )}
                                        </Link>
                                    )}

                                    {/* Desktop Dropdown Menu */}
                                    <AnimatePresence>
                                        {item.children && activeDesktopDropdown === item.label && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute top-full left-0 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1"
                                            >
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        aria-label={child.label}
                                                        className={`block px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 ${pathname === child.href
                                                            ? 'text-primary font-medium bg-primary/5'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </nav>

                        {/* CTA Button & Cart */}
                        <div className="hidden lg:flex items-center gap-4">
                            {/* Cart Dropdown */}
                            <CartDropdown variant="public" />

                            {session ? (
                                <Link
                                    href={getDashboardUrl(session.user.role)}
                                    aria-label="Go to Dashboard"
                                    className="btn-primary text-sm py-3 px-6 shadow-md hover:shadow-lg active:scale-95 transition-all"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    aria-label="Get Started"
                                    className="btn-primary text-sm py-3 px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all"
                                >
                                    Get Started
                                </Link>
                            )}
                        </div>


                        {/* Mobile Menu Button - Simplified */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 text-foreground z-50 relative flex items-center justify-center transition-transform active:scale-95"
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>
            </header >

            {/* Mobile Menu Content - Optimized for performance */}
            <div
                className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Content */}
                <div
                    className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-background border-l border-border overflow-y-auto transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <nav className="px-6 py-24 space-y-2">
                        {navigationItems.map((item, index) => (
                            <div key={item.label}>
                                {item.children ? (
                                    <div className="rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleMobileDropdown(item.label)}
                                            className={`flex items-center justify-between w-full px-4 py-3 font-medium transition-colors ${item.children.some(child => child.href === pathname)
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                        >
                                            {item.label}
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded[item.label] ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        <div
                                            className={`overflow-hidden transition-all duration-200 ease-in-out ${mobileExpanded[item.label] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                            <div className="bg-muted/30">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        className={`block pl-8 pr-4 py-2.5 text-sm transition-colors ${pathname === child.href
                                                            ? 'text-primary font-medium'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`block px-4 py-3 rounded-lg font-medium transition-colors ${pathname === item.href
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                        <div className="pt-4">
                            {session ? (
                                <Link
                                    href={getDashboardUrl(session.user.role)}
                                    aria-label="Go to Dashboard"
                                    className="btn-primary w-full text-center py-3"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    aria-label="Get Started"
                                    className="btn-primary w-full text-center py-3"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );
}
