'use client';

import { motion } from 'framer-motion';
import { Check, X, ChevronDown } from 'lucide-react';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import Link from 'next/link';
import { ContactDialog } from '@/components/dialogs/ContactDialog';

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { formatINR, cn } from "@/lib/utils";

export const PricingCard = ({ plan, index }) => {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const handleCardClick = (e) => {
        // Don't trigger if clicking the button
        if (e.target.closest('button') || e.target.closest('a')) return;

        // Skip scroll if we're in a dashboard
        if (pathname.startsWith('/client') || pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) return;

        // Scroll to compare plans section
        const comparePlansSection = document.getElementById('compare-plans');
        if (comparePlansSection) {
            comparePlansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const planId = plan.planId || plan._id || plan.id;

    const handlePurchase = (e) => {
        e.stopPropagation(); // Prevent card click event
        const url = !session
            ? `/login?role=client&callbackUrl=/checkout?plan=${planId}`
            : `/checkout?plan=${planId}`;

        if (pathname.startsWith('/client') || pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            if (session && session.user.role !== 'client') {
                toast.error("Administrators cannot purchase plans. Please use a client account.");
                return;
            }
            router.push(url);
        }
    };

    // Filter out features with empty text and show only first 10
    const validFeatures = (plan.features || []).filter(f => f.text && f.text.trim().length > 0);
    const displayFeatures = validFeatures.slice(0, 10);
    const hasMoreFeatures = validFeatures.length > 10;

    return (
        <ScrollReveal delay={index * 0.1}>
            <motion.div
                onClick={handleCardClick}
                className={`relative h-full rounded-2xl overflow-hidden cursor-pointer ${plan.highlighted
                    ? 'bg-primary text-primary-foreground shadow-red'
                    : 'bg-card border border-border'
                    }`}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
                {/* Popular Badge */}
                {plan.highlighted && (
                    <div className="absolute top-0 right-0 bg-background text-primary text-xs font-semibold px-4 py-1.5 rounded-bl-lg">
                        Most Popular
                    </div>
                )}

                <div className="p-6">
                    {/* Header */}
                    <div className="mb-4">
                        <h3 className="heading-md mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-poppins font-bold">
                                {plan.prices.monthly?.toString().startsWith('₹') 
                                    ? plan.prices.monthly 
                                    : (plan.prices?.monthly ? `₹${formatINR(plan.prices.monthly)}` : '₹15,000')}
                            </span>
                            {plan.period && (
                                <span className={`text-sm ${plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                    }`}>
                                    {plan.period}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                        {displayFeatures.map((feature, idx) => (
                            <li key={idx} className={cn(
                                "flex items-start gap-3 transition-opacity duration-300",
                                !feature.included && "opacity-50"
                            )}>
                                {feature.included ? (
                                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-primary-foreground' : 'text-primary'
                                        }`} />
                                ) : (
                                    <X className={`w-4 h-4 flex-shrink-0 mt-1 ${plan.highlighted ? 'text-primary-foreground/40' : 'text-muted-foreground/40'
                                        }`} />
                                )}
                                <span className={cn(
                                    "text-sm leading-tight",
                                    !feature.included && "line-through decoration-1"
                                )}>
                                    {feature.text}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {/* See more features hint */}
                    {hasMoreFeatures && (
                        <div className={`flex items-center justify-center gap-1 mb-6 text-xs ${plan.highlighted ? 'text-primary-foreground/60' : 'text-muted-foreground'
                            }`}>
                            <ChevronDown className="w-3 h-3" />
                            <span>Click to see all features</span>
                        </div>
                    )}

                    {/* CTA */}
                    {session?.user?.plan ? (
                        <div className={`w-full py-4 rounded-lg font-poppins font-semibold text-center border-2 ${session.user.plan === planId
                            ? (plan.highlighted ? 'bg-transparent text-primary-foreground border-primary-foreground/30' : 'bg-green-50 text-green-600 border-green-200')
                            : 'bg-muted text-muted-foreground border-border opacity-60'
                            }`}>
                            Already Purchased
                        </div>
                    ) : (
                        <motion.button
                            suppressHydrationWarning
                            className={`w-full py-4 rounded-lg font-poppins font-semibold transition-all duration-300 ${plan.highlighted
                                ? 'bg-background text-primary hover:bg-background/90'
                                : 'bg-primary text-primary-foreground hover:shadow-red'
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePurchase}
                        >
                            {plan.cta || "Get Started"}
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </ScrollReveal>
    );
};

