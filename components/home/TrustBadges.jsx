'use client';

import { StaggerContainer, StaggerItem } from '@/components/animations/ScrollReveal';

export default function TrustBadges({ company }) {
    const badges = company?.badges || [];

    return (
        <section className="py-10 bg-[#f3f3f3]">
            <div className="max-w-5xl mx-auto">
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 text-center gap-6">

                    {badges.map((badge, index) => (
                        <StaggerItem key={index}>
                            <div className="flex flex-col items-center">

                                {/* Title */}
                                <h3 className="text-2xl md:text-3xl font-bold text-[#7a0000]">
                                    {badge.title}
                                </h3>

                                {/* Subtitle */}
                                <p className="text-sm text-gray-600 mt-1">
                                    {badge.subtitle}
                                </p>

                            </div>
                        </StaggerItem>
                    ))}

                </StaggerContainer>
            </div>
        </section>
    );
}