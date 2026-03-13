'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const Partners = ({ company }) => {
    if (!company?.partners || company.partners.length === 0) return null;

    const partners = company.partners;
    // Duplicating for infinite effect
    const duplicatedPartners = [...partners, ...partners, ...partners, ...partners];

    return (
        <section className="py-20 overflow-hidden bg-background relative border-y border-border/50">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="container-custom mb-12 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="text-primary font-bold tracking-[0.2em] text-[10px] md:text-xs uppercase mb-3 block">Global Network</span>
                    <h3 className="text-2xl md:text-3xl font-poppins font-bold bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent italic">
                        Trusted by <span className="text-primary not-italic">500+</span> Leading Brands
                    </h3>
                    <div className="w-20 h-1 bg-primary/20 mx-auto mt-4 rounded-full" />
                </motion.div>
            </div>

            <div className="relative flex overflow-hidden w-full py-8">
                {/* Fade Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 md:w-64 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                <div className="flex w-max animate-marquee-smooth hover:pause whitespace-nowrap gap-12 md:gap-24 items-center">
                    {duplicatedPartners.map((partner, i) => (
                        <div
                            key={`${partner.name}-${i}`}
                            className="flex flex-col items-center justify-center min-w-[140px] md:min-w-[180px] group transition-all duration-500"
                        >
                            {partner.logo ? (
                                <div className="relative h-10 md:h-14 w-36 md:w-44 filter grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 hover:scale-110">
                                    <Image
                                        src={partner.logo}
                                        alt={`${partner.name} logo`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 140px, 200px"
                                    />
                                </div>
                            ) : (
                                <span className="text-xl md:text-3xl font-poppins font-black text-foreground/30 group-hover:text-primary group-hover:scale-110 transition-all duration-500 cursor-default select-none tracking-tighter">
                                    {partner.name}
                                </span>
                            )}
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

