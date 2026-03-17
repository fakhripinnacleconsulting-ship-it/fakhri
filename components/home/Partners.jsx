'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const Partners = ({ company }) => {
    if (!company?.partners || company.partners.length === 0) return null;

    const partners = company.partners;
    // Duplicating for infinite effect
    const duplicatedPartners = [...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners];

    return (
        <section className=" overflow-hidden bg-background relative border-y border-border/50">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative flex overflow-hidden w-full py-8">
                {/* Fade Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                <div className="flex w-max animate-marquee-smooth hover:pause whitespace-nowrap gap-8 md:gap-16 items-center px-4">
                    {duplicatedPartners.map((partner, i) => (
                        <div
                            key={`${partner.name}-${i}`}
                            className="flex flex-col items-center justify-center min-w-[160px] md:min-w-[220px] group transition-all duration-500 p-6 rounded-3xl hover:bg-white dark:hover:bg-muted/30 border border-transparent hover:border-primary/5 hover:shadow-2xl hover:shadow-primary/5"
                        >
                            <div className="relative h-12 w-20   transition-all duration-500 scale-110 mb-5">
                                {partner.logo ? (
                                    <Image
                                        src={partner.logo}
                                        alt={`${partner.name} logo`}
                                        fill
                                        className="object-contain filter grayscale opacity-40 grayscale-0 opacity-100 transition-all duration-500"
                                        sizes="(max-width: 768px) 160px, 240px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
                                        <span className="text-xs font-black text-primary/30 uppercase tracking-tighter">No Logo</span>
                                    </div>
                                )}
                            </div>
                            <div className="relative overflow-hidden pt-1">
                                <span className="block text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 text-primary transition-all duration-500 transform translate-y-0 :-translate-y-1">
                                    {partner.name}
                                </span>
                                {/* <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-primary scale-x-0 scale-x-100 transition-transform duration-500 origin-center" /> */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-marquee-smooth {
                    animation: marquee-smooth 40s linear infinite;
                    display: flex;
                    width: max-content;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
                @keyframes marquee-smooth {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}} />
        </section>
    );
};

export default Partners;

